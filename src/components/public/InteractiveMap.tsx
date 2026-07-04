import React, { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useClinicLocations } from '../../hooks/useClinicLocations'
import { ClinicPin } from './ClinicPin'
import { ClinicSearchFilter } from './ClinicSearchFilter'
import { ClinicDetailsPopup } from './ClinicDetailsPopup'
import type { ClinicFilter, ClinicSort } from './ClinicSearchFilter'
import type { ClinicWithAvailability } from '../../types'

// Fix Leaflet default icon paths
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

L.Marker.prototype.options.icon = DefaultIcon

// Helper: Haversine distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Santo Domingo Center as fallback
const DEFAULT_CENTER: [number, number] = [18.4861, -69.9312]

// Component to dynamically pan/zoom map view
const ChangeView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

export const InteractiveMap: React.FC = () => {
  const queryClient = useQueryClient()
  const [, setSearchParams] = useSearchParams()

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<ClinicFilter>('all')
  const [selectedSort, setSelectedSort] = useState<ClinicSort>('name')
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')

  const [isRealtimeConnected, setIsRealtimeConnected] = useState(true)

  // Fetch clinics using custom React Query hook
  const { data: clinics = [], isLoading, isError } = useClinicLocations({
    includeInactive: false,
    includeAvailability: true,
  }) as { data: ClinicWithAvailability[]; isLoading: boolean; isError: boolean }

  // 1. Subscribe to Supabase real-time updates for clinics table
  useEffect(() => {
    const channel = supabase
      .channel('public:clinics-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinics' }, () => {
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['clinics'] })
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true)
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsRealtimeConnected(false)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  // 2. Request user location for distance calculation
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
        },
        (error) => {
          console.warn('Geolocation warning:', error.message)
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    } else {
      console.warn('La geolocalización no está soportada por tu navegador.')
    }
  }, [])

  // Selected clinic object
  const selectedClinic = useMemo(() => {
    return clinics.find((c) => c.id === selectedClinicId) || null
  }, [selectedClinicId, clinics])

  // Calculate day name
  const todayDayName = useMemo(() => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[new Date().getDay()]
  }, [])

  // Filter & sort logic
  const filteredClinics = useMemo(() => {
    let result = [...clinics]

    // A. Apply Search Query (name or address)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q)
      )
    }

    // B. Apply Filter Option
    if (selectedFilter === 'available') {
      result = result.filter((c) => c.has_availability)
    } else if (selectedFilter === 'open_today') {
      result = result.filter((c) => {
        const todayHours = c.operating_hours[todayDayName as keyof typeof c.operating_hours]
        return todayHours && !todayHours.closed
      })
    }

    // C. Apply Sorting
    const sortCenter = userLocation || DEFAULT_CENTER
    if (selectedSort === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name))
    } else if (selectedSort === 'availability') {
      result.sort((a, b) => b.available_slots_7d - a.available_slots_7d)
    } else if (selectedSort === 'distance') {
      result.sort((a, b) => {
        const distA = calculateDistance(sortCenter[0], sortCenter[1], a.latitude, a.longitude)
        const distB = calculateDistance(sortCenter[0], sortCenter[1], b.latitude, b.longitude)
        return distA - distB
      })
    }

    return result
  }, [clinics, searchQuery, selectedFilter, selectedSort, userLocation, todayDayName])

  // Map center coordinates
  const mapCenter = useMemo<[number, number]>(() => {
    if (selectedClinic) {
      return [selectedClinic.latitude, selectedClinic.longitude]
    }
    if (filteredClinics.length > 0) {
      return [filteredClinics[0].latitude, filteredClinics[0].longitude]
    }
    return DEFAULT_CENTER
  }, [selectedClinic, filteredClinics])

  // Handle Book Appointment: Set query params & scroll to booking form
  const handleBookAppointment = (clinicId: string) => {
    setSearchParams({ clinic_id: clinicId })
    setTimeout(() => {
      const formElement = document.getElementById('appointment-form')
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  return (
    <section id="clinics-map-section" className="py-16 bg-cream border-t border-b border-gray-100 font-montserrat">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10">
          <p className="text-gold font-montserrat text-sm tracking-[0.3em] uppercase mb-3">
            Sedes y Ubicación
          </p>
          <h2 className="text-3xl sm:text-4xl font-playfair text-navy">
            Encuentra tu Clínica Más Cercana
          </h2>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
            Explora nuestras sucursales y agenda tu cita en la que mejor se adapte a tu ubicación y horarios.
          </p>
        </div>

        {/* View Mode Toggle (Map vs List) */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-xs text-gray-500 font-medium">
            {filteredClinics.length} sedes encontradas
            {userLocation ? ' (Ubicación GPS activada)' : ''}
          </div>
          <div className="flex bg-white rounded-md border border-gray-200 overflow-hidden p-1 shadow-sm">
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-1.5 rounded text-xs font-semibold font-montserrat transition-all duration-200 ${
                viewMode === 'map'
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Mapa
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-1.5 rounded text-xs font-semibold font-montserrat transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Lista
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <ClinicSearchFilter
            onSearch={setSearchQuery}
            onFilterChange={setSelectedFilter}
            onSortChange={setSelectedSort}
          />
        </div>

        {/* Real-time Status Alert */}
        {!isRealtimeConnected && (
          <div className="mb-6 p-3.5 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-800 flex justify-between items-center font-montserrat shadow-sm">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
              </span>
              Conexión en tiempo real perdida. Mostrando datos locales (pueden estar desactualizados).
            </span>
            <button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['clinics'] })
                setIsRealtimeConnected(true)
              }}
              className="text-gold hover:text-navy font-bold underline transition-colors cursor-pointer"
            >
              Refrescar
            </button>
          </div>
        )}

        {/* Loading and Error States */}
        {isLoading && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
            <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-sm">Cargando ubicaciones y disponibilidad...</p>
          </div>
        )}

        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center text-red-700 shadow-sm">
            <svg className="h-10 w-10 text-red-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="font-semibold text-base mb-1">Error al cargar las clínicas</p>
            <p className="text-sm">Por favor verifica tu conexión y recarga la página.</p>
          </div>
        )}

        {/* Main Content Area */}
        {!isLoading && !isError && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Map / List View Container */}
            <div className="lg:col-span-2 h-[500px] sm:h-[600px] rounded-lg overflow-hidden border border-gray-200 shadow-md relative bg-white">
              {viewMode === 'map' ? (
                <MapContainer
                  center={mapCenter}
                  zoom={12}
                  className="h-full w-full z-0"
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <ChangeView center={mapCenter} zoom={13} />
                  
                  {filteredClinics.map((clinic) => (
                    <ClinicPin
                      key={clinic.id}
                      clinic={clinic}
                      isSelected={clinic.id === selectedClinicId}
                      onClick={() => setSelectedClinicId(clinic.id)}
                    />
                  ))}
                </MapContainer>
              ) : (
                /* Fallback List View */
                <div className="h-full overflow-y-auto p-6 space-y-4 bg-gray-50">
                  {filteredClinics.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 py-12">
                      <svg className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-semibold">No se encontraron sedes</p>
                      <p className="text-xs text-gray-400 mt-1">Prueba con otros criterios de búsqueda o filtros.</p>
                    </div>
                  ) : (
                    filteredClinics.map((clinic) => {
                      const dist = userLocation
                        ? calculateDistance(userLocation[0], userLocation[1], clinic.latitude, clinic.longitude)
                        : null
                      return (
                        <div
                          key={clinic.id}
                          className={`bg-white border rounded-lg p-5 shadow-sm hover:border-gold transition-colors duration-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${
                            clinic.id === selectedClinicId ? 'border-navy ring-1 ring-navy' : 'border-gray-200'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-playfair text-lg font-bold text-navy">{clinic.name}</h3>
                              {dist && (
                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-medium font-montserrat">
                                  a {dist.toFixed(1)} km
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1.5 max-w-md">{clinic.address}</p>
                            <p className="text-xs text-navy font-semibold mt-1">Tel: {clinic.phone}</p>
                            
                            <div className="flex items-center gap-4 mt-3">
                              <span className={`inline-flex items-center gap-1 text-xs font-semibold ${clinic.has_availability ? 'text-green-600' : 'text-red-500'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${clinic.has_availability ? 'bg-green-500' : 'bg-red-500'}`} />
                                {clinic.has_availability ? `${clinic.available_slots_7d} cupos disponibles` : 'Sin cupos'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => {
                                setSelectedClinicId(clinic.id)
                                setViewMode('map')
                              }}
                              className="px-4 py-2 border border-gray-200 rounded text-xs font-bold text-navy hover:border-navy transition-colors"
                            >
                              Ver Mapa
                            </button>
                            <button
                              onClick={() => handleBookAppointment(clinic.id)}
                              disabled={!clinic.has_availability}
                              className={`px-4 py-2 rounded text-xs font-bold transition-colors ${
                                clinic.has_availability
                                  ? 'bg-gold text-white hover:bg-gold/90'
                                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              Agendar
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>

            {/* Sidebar Details Panel */}
            <div className="h-[500px] sm:h-[600px]">
              {selectedClinic ? (
                <ClinicDetailsPopup
                  clinic={selectedClinic}
                  allClinics={clinics}
                  onClose={() => setSelectedClinicId(null)}
                  onSelectClinic={setSelectedClinicId}
                  onBookAppointment={() => handleBookAppointment(selectedClinic.id)}
                />
              ) : (
                /* Select Placeholder Prompt */
                <div className="h-full rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-8 bg-white shadow-sm font-montserrat">
                  <svg className="h-14 w-14 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h3 className="font-playfair text-lg font-bold text-navy mb-2">Selecciona una Clínica</h3>
                  <p className="text-xs text-gray-500 max-w-[240px]">
                    Haz clic en un pin del mapa o busca una sucursal para ver sus detalles, horarios y reservar tu cita.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

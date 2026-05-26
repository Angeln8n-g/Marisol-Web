import React, { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Clinic, ClinicWorkload } from '../../../types'
import { useAppointmentStore } from '../../../store/appointmentStore'

// Fix Leaflet default icon
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

function getMarkerColor(capacityPercentage: number): string {
  if (capacityPercentage <= 50) return '#22c55e'
  if (capacityPercentage <= 80) return '#eab308'
  return '#ef4444'
}

interface ClinicMapProps {
  clinics: Clinic[]
  workloads: ClinicWorkload[]
}

const ChangeView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap()
  map.setView(center, zoom)
  return null
}

export const ClinicMap: React.FC<ClinicMapProps> = ({ clinics, workloads }) => {
  const setClinicFilter = useAppointmentStore((s) => s.setClinicFilter)

  const validClinics = useMemo(
    () => clinics.filter((c) => {
      const valid = typeof c.latitude === 'number' && typeof c.longitude === 'number'
        && c.latitude >= -90 && c.latitude <= 90
        && c.longitude >= -180 && c.longitude <= 180
        && !isNaN(c.latitude) && !isNaN(c.longitude)
      return valid
    }),
    [clinics]
  )

  const hasInvalidCoords = clinics.length !== validClinics.length

  const markers = useMemo(
    () => validClinics.map((clinic) => {
      const workload = workloads.find((w) => w.clinic.id === clinic.id)
      const capacity = workload?.capacity_percentage ?? 0
      const color = getMarkerColor(capacity)

      const coloredIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="width:28px;height:28px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
      })

      return (
        <Marker
          key={clinic.id}
          position={[clinic.latitude, clinic.longitude]}
          icon={coloredIcon}
          eventHandlers={{
            click: () => setClinicFilter(clinic.id),
          }}
        >
          <Popup>
            <div className="font-montserrat" style={{ minWidth: '180px' }}>
              <p className="font-semibold text-navy mb-1">{clinic.name}</p>
              <p className="text-xs text-gray-600 mb-1">{clinic.address}</p>
              <p className="text-xs text-gray-600">{clinic.phone}</p>
              {workload && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-medium">
                      Carga: {workload.capacity_percentage}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {workload.confirmed_appointments} confirmadas · {workload.total_appointments} total
                  </p>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      )
    }),
    [validClinics, workloads, setClinicFilter]
  )

  const defaultCenter: [number, number] = validClinics.length > 0
    ? [validClinics[0].latitude, validClinics[0].longitude]
    : [18.4861, -69.9312]

  return (
    <div className="space-y-2">
      {hasInvalidCoords && (
        <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200 text-sm text-yellow-800 font-montserrat">
          {clinics.length - validClinics.length} clínica(s) tienen coordenadas inválidas y no se muestran en el mapa.
        </div>
      )}

      <div className="h-[400px] rounded-lg overflow-hidden border border-gray-200">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          className="h-full w-full"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ChangeView center={defaultCenter} zoom={13} />
          {markers}
        </MapContainer>
      </div>
    </div>
  )
}

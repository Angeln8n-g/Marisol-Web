import React, { useMemo } from 'react'
import { Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import type { ClinicWithAvailability } from '../../types'

export interface ClinicPinProps {
  clinic: ClinicWithAvailability
  isSelected: boolean
  onClick: () => void
}

/**
 * ClinicPin Component
 * 
 * Renders a custom map marker for a clinic location with:
 * - Color-coded availability indicator (green = available, red = no availability)
 * - Tooltip showing clinic name on hover
 * - Animation effect when selected
 * - Click handler for clinic selection
 * 
 * **Validates: Requirements 2.3, 3.3, 3.4**
 * - Requirement 2.3: Map pins display clinic details
 * - Requirement 3.3: Green indicator for available slots
 * - Requirement 3.4: Red indicator for no available slots
 */
export const ClinicPin: React.FC<ClinicPinProps> = ({
  clinic,
  isSelected,
  onClick,
}) => {
  // Determine marker color based on availability
  const markerColor = useMemo(() => {
    return clinic.has_availability ? '#22c55e' : '#ef4444'
  }, [clinic.has_availability])

  // Create custom marker icon with availability color
  const markerIcon = useMemo(() => {
    const size = isSelected ? 36 : 28
    const borderWidth = isSelected ? 4 : 3
    const shadow = isSelected
      ? '0 4px 12px rgba(0,0,0,0.4)'
      : '0 2px 6px rgba(0,0,0,0.3)'

    return L.divIcon({
      className: 'custom-clinic-marker',
      html: `
        <div 
          style="
            width: ${size}px;
            height: ${size}px;
            background: ${markerColor};
            border: ${borderWidth}px solid white;
            border-radius: 50%;
            box-shadow: ${shadow};
            transition: all 0.3s ease;
            cursor: pointer;
          "
        ></div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -(size / 2)],
    })
  }, [markerColor, isSelected])

  // Validate coordinates before rendering
  const isValidCoordinate = useMemo(() => {
    return (
      typeof clinic.latitude === 'number' &&
      typeof clinic.longitude === 'number' &&
      !isNaN(clinic.latitude) &&
      !isNaN(clinic.longitude) &&
      clinic.latitude >= -90 &&
      clinic.latitude <= 90 &&
      clinic.longitude >= -180 &&
      clinic.longitude <= 180
    )
  }, [clinic.latitude, clinic.longitude])

  // Don't render if coordinates are invalid
  if (!isValidCoordinate) {
    return null
  }

  return (
    <Marker
      position={[clinic.latitude, clinic.longitude]}
      icon={markerIcon}
      eventHandlers={{
        click: onClick,
      }}
    >
      <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
        <div className="font-montserrat text-sm">
          <p className="font-semibold text-navy">{clinic.name}</p>
          <p className="text-xs text-gray-600 mt-1">
            {clinic.has_availability ? 'Disponibilidad' : 'Sin disponibilidad'}
          </p>
        </div>
      </Tooltip>
    </Marker>
  )
}

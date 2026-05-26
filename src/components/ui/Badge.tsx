import React from 'react'
import type { AppointmentStatus } from '../../types'

export interface BadgeProps {
  status: AppointmentStatus
  children?: React.ReactNode
}

const statusConfig: Record<
  AppointmentStatus,
  { label: string; bgColor: string; textColor: string }
> = {
  pending: {
    label: 'Pendiente',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
  },
  confirmed: {
    label: 'Confirmada',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
  },
  in_progress: {
    label: 'En Progreso',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
  },
  completed: {
    label: 'Completada',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
  },
  cancelled: {
    label: 'Cancelada',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
  },
  rescheduled: {
    label: 'Reprogramada',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
  },
}

export const Badge: React.FC<BadgeProps> = ({ status, children }) => {
  const config = statusConfig[status]

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
    >
      {children || config.label}
    </span>
  )
}

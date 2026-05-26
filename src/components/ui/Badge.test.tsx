import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'
import type { AppointmentStatus } from '../../types'

describe('Badge', () => {
  it('should render with pending status', () => {
    render(<Badge status="pending" />)
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('should render with confirmed status', () => {
    render(<Badge status="confirmed" />)
    expect(screen.getByText('Confirmada')).toBeInTheDocument()
  })

  it('should render with in_progress status', () => {
    render(<Badge status="in_progress" />)
    expect(screen.getByText('En Progreso')).toBeInTheDocument()
  })

  it('should render with completed status', () => {
    render(<Badge status="completed" />)
    expect(screen.getByText('Completada')).toBeInTheDocument()
  })

  it('should render with cancelled status', () => {
    render(<Badge status="cancelled" />)
    expect(screen.getByText('Cancelada')).toBeInTheDocument()
  })

  it('should render with rescheduled status', () => {
    render(<Badge status="rescheduled" />)
    expect(screen.getByText('Reprogramada')).toBeInTheDocument()
  })

  it('should render custom children when provided', () => {
    render(<Badge status="pending">Custom Text</Badge>)
    expect(screen.getByText('Custom Text')).toBeInTheDocument()
    expect(screen.queryByText('Pendiente')).not.toBeInTheDocument()
  })

  it('should apply correct color classes for pending status', () => {
    const { container } = render(<Badge status="pending" />)
    const badge = container.querySelector('span')
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800')
  })

  it('should apply correct color classes for confirmed status', () => {
    const { container } = render(<Badge status="confirmed" />)
    const badge = container.querySelector('span')
    expect(badge).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('should apply correct color classes for cancelled status', () => {
    const { container } = render(<Badge status="cancelled" />)
    const badge = container.querySelector('span')
    expect(badge).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('should render all appointment statuses correctly', () => {
    const statuses: AppointmentStatus[] = [
      'pending',
      'confirmed',
      'in_progress',
      'completed',
      'cancelled',
      'rescheduled',
    ]

    statuses.forEach((status) => {
      const { unmount } = render(<Badge status={status} />)
      const badge = screen.getByText(/Pendiente|Confirmada|En Progreso|Completada|Cancelada|Reprogramada/)
      expect(badge).toBeInTheDocument()
      unmount()
    })
  })
})

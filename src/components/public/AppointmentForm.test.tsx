import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { AppointmentForm } from './AppointmentForm'
import { supabase } from '../../lib/supabase'
import type { Clinic } from '../../types'

// Mock Supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

const mockClinics: Clinic[] = [
  {
    id: 'clinic-1',
    name: 'Clínica Centro',
    address: 'Calle Principal 123, Santo Domingo',
    latitude: 18.4861,
    longitude: -69.9312,
    phone: '809-555-1234',
    whatsapp: '809-555-1234',
    operating_hours: {
      monday: { open: '08:00', close: '18:00', closed: false },
      tuesday: { open: '08:00', close: '18:00', closed: false },
      wednesday: { open: '08:00', close: '18:00', closed: false },
      thursday: { open: '08:00', close: '18:00', closed: false },
      friday: { open: '08:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '14:00', closed: false },
      sunday: { open: '00:00', close: '00:00', closed: true },
    },
    special_hours: [],
    is_active: true,
    is_deleted: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'clinic-2',
    name: 'Clínica Norte',
    address: 'Avenida Norte 456, Santiago',
    latitude: 19.4517,
    longitude: -70.6970,
    phone: '809-555-5678',
    whatsapp: '809-555-5678',
    operating_hours: {
      monday: { open: '08:00', close: '18:00', closed: false },
      tuesday: { open: '08:00', close: '18:00', closed: false },
      wednesday: { open: '08:00', close: '18:00', closed: false },
      thursday: { open: '08:00', close: '18:00', closed: false },
      friday: { open: '08:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '14:00', closed: false },
      sunday: { open: '00:00', close: '00:00', closed: true },
    },
    special_hours: [],
    is_active: true,
    is_deleted: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]

describe('AppointmentForm - Clinic Selection', () => {
  const mockSupabaseChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock: return clinics list
    mockSupabaseChain.select.mockReturnThis()
    mockSupabaseChain.eq.mockReturnThis()
    mockSupabaseChain.order.mockResolvedValue({ data: mockClinics, error: null })
    mockSupabaseChain.single.mockResolvedValue({ data: null, error: null })
    
    vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as never)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const renderWithRouter = (initialUrl = '/') => {
    window.history.pushState({}, '', initialUrl)
    return render(
      <BrowserRouter>
        <AppointmentForm />
      </BrowserRouter>
    )
  }

  it('should render the appointment form', async () => {
    renderWithRouter()
    
    await waitFor(() => {
      expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/servicio/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/fecha preferida/i)).toBeInTheDocument()
    })
  })

  it('should load and display clinic options in dropdown', async () => {
    renderWithRouter()
    
    await waitFor(() => {
      const clinicSelect = screen.getByLabelText(/clínica preferida/i)
      expect(clinicSelect).toBeInTheDocument()
    })

    // Check that clinics are loaded
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /clínica centro/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /clínica norte/i })).toBeInTheDocument()
    })
  })

  it('should pre-select clinic when clinic_id is in URL params', async () => {
    // Mock single clinic fetch
    mockSupabaseChain.single.mockResolvedValue({ 
      data: mockClinics[0], 
      error: null 
    })

    renderWithRouter('/?clinic_id=clinic-1')
    
    // Should show loading state first
    expect(screen.getByText(/cargando información/i)).toBeInTheDocument()
    
    // Should display selected clinic info
    await waitFor(() => {
      expect(screen.getByText('Clínica Centro')).toBeInTheDocument()
      expect(screen.getByText(/calle principal 123/i)).toBeInTheDocument()
      expect(screen.getByText(/809-555-1234/i)).toBeInTheDocument()
    })

    // Should not show dropdown when clinic is pre-selected
    expect(screen.queryByRole('combobox', { name: /clínica preferida/i })).not.toBeInTheDocument()
  })

  it('should display clinic information with location icon when pre-selected', async () => {
    mockSupabaseChain.single.mockResolvedValue({ 
      data: mockClinics[0], 
      error: null 
    })

    renderWithRouter('/?clinic_id=clinic-1')
    
    await waitFor(() => {
      expect(screen.getByText('Clínica Centro')).toBeInTheDocument()
    })

    // Check for location icon presence (via SVG path)
    const locationIcon = screen.getByText('Clínica Centro').parentElement?.parentElement?.querySelector('svg')
    expect(locationIcon).toBeInTheDocument()
  })

  it('should mark clinic field as required when pre-selected via URL', async () => {
    mockSupabaseChain.single.mockResolvedValue({ 
      data: mockClinics[0], 
      error: null 
    })

    renderWithRouter('/?clinic_id=clinic-1')
    
    await waitFor(() => {
      const label = screen.getByText(/clínica preferida/i)
      expect(label.textContent).toContain('*')
    })
  })

  it('should allow manual clinic selection from dropdown', async () => {
    const user = userEvent.setup()
    renderWithRouter()
    
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /clínica centro/i })).toBeInTheDocument()
    })

    const clinicSelect = screen.getByLabelText(/clínica preferida/i) as HTMLSelectElement
    await user.selectOptions(clinicSelect, 'clinic-1')

    // Should display selected clinic information
    await waitFor(() => {
      expect(screen.getByText('Clínica Centro')).toBeInTheDocument()
      expect(screen.getByText(/calle principal 123/i)).toBeInTheDocument()
    })
  })

  it('should allow deselecting manually selected clinic', async () => {
    const user = userEvent.setup()
    renderWithRouter()
    
    // Wait for clinics to load
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /clínica centro/i })).toBeInTheDocument()
    })

    // Select a clinic
    const clinicSelect = screen.getByLabelText(/clínica preferida/i) as HTMLSelectElement
    await user.selectOptions(clinicSelect, 'clinic-1')

    await waitFor(() => {
      expect(screen.getByText('Clínica Centro')).toBeInTheDocument()
    })

    // Deselect the clinic using the X button
    const closeButton = screen.getByLabelText(/deseleccionar clínica/i)
    await user.click(closeButton)

    // Dropdown should reappear
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /clínica preferida/i })).toBeInTheDocument()
      expect(screen.queryByText('Clínica Centro')).not.toBeInTheDocument()
    })
  })

  it('should not show deselect button when clinic is pre-selected via URL', async () => {
    mockSupabaseChain.single.mockResolvedValue({ 
      data: mockClinics[0], 
      error: null 
    })

    renderWithRouter('/?clinic_id=clinic-1')
    
    await waitFor(() => {
      expect(screen.getByText('Clínica Centro')).toBeInTheDocument()
    })

    // Should not have deselect button
    expect(screen.queryByLabelText(/deseleccionar clínica/i)).not.toBeInTheDocument()
  })

  it('should handle invalid clinic_id in URL gracefully', async () => {
    // Mock fetch to return no clinic
    mockSupabaseChain.single.mockResolvedValue({ 
      data: null, 
      error: { message: 'Not found' } 
    })

    renderWithRouter('/?clinic_id=invalid-id')
    
    // Should show loading first
    expect(screen.getByText(/cargando información/i)).toBeInTheDocument()

    // Should fall back to showing dropdown
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /clínica preferida/i })).toBeInTheDocument()
    })
  })

  it('should include selected clinic in appointment notes', async () => {
    const user = userEvent.setup()
    
    // Mock insert
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })
    mockSupabaseChain.select = vi.fn().mockReturnThis()
    mockSupabaseChain.eq = vi.fn().mockReturnThis()
    mockSupabaseChain.order = vi.fn().mockResolvedValue({ data: mockClinics, error: null })
    
    // Override the from mock to handle both select and insert
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'appointments') {
        return {
          insert: mockInsert,
        } as never
      }
      return mockSupabaseChain as never
    })

    renderWithRouter()
    
    // Wait for form to be ready
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /clínica centro/i })).toBeInTheDocument()
    })

    // Fill out form
    await user.type(screen.getByLabelText(/nombre completo/i), 'Juan Pérez')
    await user.type(screen.getByLabelText(/teléfono/i), '809-555-9999')
    await user.selectOptions(screen.getByLabelText(/servicio/i), 'periodoncia')
    await user.type(screen.getByLabelText(/fecha preferida/i), '2024-12-20')
    await user.click(screen.getByText('Mañana'))
    
    // Select clinic
    const clinicSelect = screen.getByLabelText(/clínica preferida/i) as HTMLSelectElement
    await user.selectOptions(clinicSelect, 'clinic-1')

    // Wait for clinic to be displayed
    await waitFor(() => {
      expect(screen.getByText('Clínica Centro')).toBeInTheDocument()
    })

    // Submit form
    const submitButton = screen.getByRole('button', { name: /solicitar cita/i })
    await user.click(submitButton)

    // Verify that insert was called with clinic info in notes
    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          clinic_id: 'clinic-1',
          notes: expect.stringContaining('Clínica: Clínica Centro'),
        })
      )
    })
  })

  it('should associate appointment with selected clinic_id', async () => {
    const user = userEvent.setup()
    
    mockSupabaseChain.single.mockResolvedValue({ 
      data: mockClinics[0], 
      error: null 
    })

    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })
    
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'appointments') {
        return {
          insert: mockInsert,
        } as never
      }
      return mockSupabaseChain as never
    })

    renderWithRouter('/?clinic_id=clinic-1')
    
    // Wait for clinic to load
    await waitFor(() => {
      expect(screen.getByText('Clínica Centro')).toBeInTheDocument()
    })

    // Fill out form
    await user.type(screen.getByLabelText(/nombre completo/i), 'María García')
    await user.type(screen.getByLabelText(/teléfono/i), '809-555-8888')
    await user.selectOptions(screen.getByLabelText(/servicio/i), 'implantes')
    await user.type(screen.getByLabelText(/fecha preferida/i), '2024-12-21')
    await user.click(screen.getByText('Tarde'))

    // Submit
    const submitButton = screen.getByRole('button', { name: /solicitar cita/i })
    await user.click(submitButton)

    // Verify appointment is associated with clinic
    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          clinic_id: 'clinic-1',
        })
      )
    })
  })

  it('should reset selected clinic state after successful submission', async () => {
    const user = userEvent.setup()
    
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })
    
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'appointments') {
        return {
          insert: mockInsert,
        } as never
      }
      return mockSupabaseChain as never
    })

    renderWithRouter()
    
    // Wait for form
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /clínica centro/i })).toBeInTheDocument()
    })

    // Select clinic
    const clinicSelect = screen.getByLabelText(/clínica preferida/i) as HTMLSelectElement
    await user.selectOptions(clinicSelect, 'clinic-1')

    await waitFor(() => {
      expect(screen.getByText('Clínica Centro')).toBeInTheDocument()
    })

    // Fill and submit
    await user.type(screen.getByLabelText(/nombre completo/i), 'Test User')
    await user.type(screen.getByLabelText(/teléfono/i), '809-555-7777')
    await user.selectOptions(screen.getByLabelText(/servicio/i), 'general')
    await user.type(screen.getByLabelText(/fecha preferida/i), '2024-12-22')
    await user.click(screen.getByText('Mañana'))
    
    await user.click(screen.getByRole('button', { name: /solicitar cita/i }))

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/solicitud enviada/i)).toBeInTheDocument()
    })

    // Click to send another request
    await user.click(screen.getByRole('button', { name: /enviar otra solicitud/i }))

    // Form should be reset - dropdown should be visible again
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /clínica preferida/i })).toBeInTheDocument()
      expect(screen.queryByText('Clínica Centro')).not.toBeInTheDocument()
    })
  })
})

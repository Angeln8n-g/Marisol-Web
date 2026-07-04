import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ClinicSearchFilter } from './ClinicSearchFilter'

/**
 * Unit tests for ClinicSearchFilter component
 * 
 * **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**
 */
describe('ClinicSearchFilter', () => {
  let mockOnSearch: ReturnType<typeof vi.fn>
  let mockOnFilterChange: ReturnType<typeof vi.fn>
  let mockOnSortChange: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnSearch = vi.fn()
    mockOnFilterChange = vi.fn()
    mockOnSortChange = vi.fn()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Component Rendering', () => {
    it('should render all filter components', () => {
      render(
        <ClinicSearchFilter
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          onSortChange={mockOnSortChange}
        />
      )

      // Search input
      expect(screen.getByPlaceholderText('Buscar por nombre o dirección...')).toBeInTheDocument()

      // Filter buttons
      expect(screen.getByRole('button', { name: 'Todas las Clínicas' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Disponibles Ahora' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Abiertas Hoy' })).toBeInTheDocument()

      // Sort dropdown
      expect(screen.getByLabelText('Ordenar clínicas')).toBeInTheDocument()
    })

    it('should render with default states', () => {
      render(
        <ClinicSearchFilter
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          onSortChange={mockOnSortChange}
        />
      )

      const searchInput = screen.getByPlaceholderText('Buscar por nombre o dirección...')
      expect(searchInput).toHaveValue('')

      const allClinicsButton = screen.getByRole('button', { name: 'Todas las Clínicas' })
      expect(allClinicsButton).toHaveAttribute('aria-pressed', 'true')

      const sortSelect = screen.getByLabelText('Ordenar clínicas') as HTMLSelectElement
      expect(sortSelect.value).toBe('name')
    })

    it('should not show clear filters button by default', () => {
      render(
        <ClinicSearchFilter
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.queryByRole('button', { name: 'Limpiar todos los filtros' })).not.toBeInTheDocument()
    })
  })

  describe('Search Functionality - Requirement 9.1, 9.2', () => {
    it('should debounce search input by 500ms', async () => {
      render(
        <ClinicSearchFilter
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          onSortChange={mockOnSortChange}
        />
      )

      // Run initial timers for mount effect
      act(() => {
        vi.runAllTimers()
      })
      
      // Component calls onSearch with empty string on mount
      expect(mockOnSearch).toHaveBeenCalledWith('')
      mockOnSearch.mockClear()

      const searchInput = screen.getByPlaceholderText('Buscar por nombre o dirección...')
      
      // Type in the search box
      fireEvent.change(searchInput, { target: { value: 'Clínica Centro' } })

      // Should not call onSearch immediately
      expect(mockOnSearch).not.toHaveBeenCalled()

      // Advance timers by 400ms (less than debounce time)
      act(() => {
        vi.advanceTimersByTime(400)
      })
      expect(mockOnSearch).not.toHaveBeenCalled()

      // Advance timers by another 100ms (total 500ms)
      act(() => {
        vi.advanceTimersByTime(100)
      })

      // Now onSearch should be called
      expect(mockOnSearch).toHaveBeenCalledWith('Clínica Centro')
    })

    it('should reset debounce timer on subsequent keystrokes', async () => {
      render(
        <ClinicSearchFilter
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          onSortChange={mockOnSortChange}
        />
      )

      // Run initial timers and clear
      act(() => {
        vi.runAllTimers()
      })
      expect(mockOnSearch).toHaveBeenCalledWith('')
      mockOnSearch.mockClear()

      const searchInput = screen.getByPlaceholderText('Buscar por nombre o dirección...')
      
      // First keystroke
      fireEvent.change(searchInput, { target: { value: 'Clí' } })
      act(() => {
        vi.advanceTimersByTime(300)
      })

      // Second keystroke before 500ms
      fireEvent.change(searchInput, { target: { value: 'Clínica' } })
      act(() => {
        vi.advanceTimersByTime(300)
      })

      // Should not have called onSearch yet
      expect(mockOnSearch).not.toHaveBeenCalled()

      // Complete the debounce
      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(mockOnSearch).toHaveBeenCalledWith('Clínica')
      expect(mockOnSearch).toHaveBeenCalledTimes(1)
    })

    it('should call onSearch with empty string when input is cleared', async () => {
      render(
        <ClinicSearchFilter
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          onSortChange={mockOnSortChange}
        />
      )

      // Run initial timers
      act(() => {
        vi.runAllTimers()
      })
      expect(mockOnSearch).toHaveBeenCalledWith('')

      const searchInput = screen.getByPlaceholderText('Buscar por nombre o dirección...')
      
      fireEvent.change(searchInput, { target: { value: 'Test' } })
      act(() => {
        vi.advanceTimersByTime(500)
      })

      expect(mockOnSearch).toHaveBeenCalledWith('Test')

      fireEvent.change(searchInput, { target: { value: '' } })
      act(() => {
        vi.advanceTimersByTime(500)
      })

      expect(mockOnSearch).toHaveBeenCalledWith('')
      expect(mockOnSearch).toHaveBeenCalledTimes(3) // Initial + 'Test' + ''
    })
  })

  describe('Filter Functionality - Requirement 9.3, 9.4', () => {
    it('should call onFilterChange when "Todas las Clínicas" is clicked', () => {
      render(
        <ClinicSearchFilter
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          onSortChange={mockOnSortChange}
        />
      )

      const allButton = screen.getByRole('button', { name: 'Todas las Clínicas' })
      fireEvent.click(allButton)

      expect(mockOnFilterChange).toHaveBeenCalledWith('all')
      expect(allButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('should call onFilterChange when "Disponibles Ahora" is clicked', () => {
      render(
        <ClinicSearchFilter
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          onSortChange={mockOnSortChange}
        />
      )

      const availableButton = screen.getByRole('button', { name: 'Disponibles Ahora' })
      fireEvent.click(availableButton)

      expect(mockOnFilterChange).toHaveBeenCalledWith('available')
      expect(availableButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('should call onFilterChange when "Abiertas Hoy" is clicked', () => {
      render(
        <ClinicSearchFilter
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          onSortChange={mockOnSortChange}
        />
      )

      const openTodayButton = screen.getByRole('button', { name: 'Abiertas Hoy' })
      fireEvent.click(openTodayButton)

      expect(mockOnFilterChange).toHaveBeenCalledWith('open_today')
      expect(openTodayButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('should update active filter button styling', () => {
      render(
        <ClinicSearchFilter
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          onSortChange={mockOnSortChange}
        />
      )

      const allButton = screen.getByRole('button', { name: 'Todas las Clínicas' })
      const availableButton = screen.getByRole('button', { name: 'Disponibles Ahora' })

      // Initially, "All" is selected
      expect(allButton).toHaveAttribute('aria-pressed', 'true')
      expect(availableButton).toHaveAttribute('aria-pressed', 'false')

      // Click "Available"
      fireEvent.click(availableButton)

      // Now "Available" should be selected
      expect(allButton).toHaveAttribute('aria-pressed', 'false')
      expect(availableButton).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('Sort Functionality - Requirement 9.5', () => {
    it('should call onSortChange when sort option changes to "distance"', () => {
      render(
        <ClinicSearchFilter
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          onSortChange={mockOnSortChange}
        />
      )

      const sortSelect = screen.getByLabelText('Ordenar clínicas')
      fireEvent.change(sortSelect, { target: { value: 'distance' } })

      expect(mockOnSortChange).toHaveBeenCalledWith('distance')
    })

    it('should call onSortChange when sort option changes to "availability"', () => {
      render(
        <ClinicSearchFilter
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          onSortChange={mockOnSortChange}
        />
      )

      const sortSelect = screen.getByLabelText('Ordenar clínicas')
      fireEvent.change(sortSelect, { target: { value: 'availability' } })

      expect(mockOnSortChange).toHaveBeenCalledWith('availability')
    })

    it('should update select value when sort changes', () => {
      render(
        <ClinicSearchFilter
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          onSortChange={mockOnSortChange}
        />
      )

      const sortSelect = screen.getByLabelText('Ordenar clínicas') as HTMLSelectElement
      
      expect(sortSelect.value).toBe('name')
      
      fireEvent.change(sortSelect, { target: { value: 'distance' } })
      expect(sortSelect.value).toBe('distance')
      
      fireEvent.change(sortSelect, { target: { value: 'availability' } })
      expect(sortSelect.value).toBe('availability')
    })

    it('should have all three sort options available', () => {
      render(
        <ClinicSearchFilter
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          onSortChange={mockOnSortChange}
        />
      )

      const sortSelect = screen.getByLabelText('Ordenar clínicas')
      const options = sortSelect.querySelectorAll('option')

      expect(options).toHaveLength(3)
      expect(options[0]).toHaveValue('name')
      expect(options[1]).toHaveValue('distance')
      expect(options[2]).toHaveValue('availability')
    })
  })

  describe('Clear Filters Functionality', () => {
    it('should show clear filters button when search has value', async () => {
      render(
        <ClinicSearchFilter
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          onSortChange={mockOnSortChange}
        />
      )

      const searchInput = screen.getByPlaceholderText('Buscar por nombre o dirección...')
      fireEvent.change(searchInput, { target: { value: 'Test' } })

      // Clear button should appear immediately when typing
      expect(screen.getByRole('button', { name: 'Limpiar todos los filtros' })).toBeInTheDocument()
    })

    it('should show clear filters button when filter is not "all"', () => {
      render(
        <ClinicSearchFilter
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          onSortChange={mockOnSortChange}
        />
      )

      const availableButton = screen.getByRole('button', { name: 'Disponibles Ahora' })
      fireEvent.click(availableButton)

      expect(screen.getByRole('button', { name: 'Limpiar todos los filtros' })).toBeInTheDocument()
    })

    it('should show clear filters button when sort is not "name"', () => {
      render(
        <ClinicSearchFilter
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          onSortChange={mockOnSortChange}
        />
      )

      const sortSelect = screen.getByLabelText('Ordenar clínicas')
      fireEvent.change(sortSelect, { target: { value: 'distance' } })

      expect(screen.getByRole('button', { name: 'Limpiar todos los filtros' })).toBeInTheDocument()
    })

    it('should reset all filters when clear button is clicked', async () => {
      render(
        <ClinicSearchFilter
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          onSortChange={mockOnSortChange}
        />
      )

      // Set search value
      const searchInput = screen.getByPlaceholderText('Buscar por nombre o dirección...')
      fireEvent.change(searchInput, { target: { value: 'Test Clinic' } })

      // Set filter
      const availableButton = screen.getByRole('button', { name: 'Disponibles Ahora' })
      fireEvent.click(availableButton)

      // Set sort
      const sortSelect = screen.getByLabelText('Ordenar clínicas') as HTMLSelectElement
      fireEvent.change(sortSelect, { target: { value: 'distance' } })

      // Clear filters
      const clearButton = screen.getByRole('button', { name: 'Limpiar todos los filtros' })
      fireEvent.click(clearButton)

      // Check that all states are reset
      expect(searchInput).toHaveValue('')
      expect(sortSelect.value).toBe('name')
      
      const allButton = screen.getByRole('button', { name: 'Todas las Clínicas' })
      expect(allButton).toHaveAttribute('aria-pressed', 'true')

      // Check that callbacks were called with default values
      expect(mockOnSearch).toHaveBeenCalledWith('')
      expect(mockOnFilterChange).toHaveBeenCalledWith('all')
      expect(mockOnSortChange).toHaveBeenCalledWith('name')

      // Clear button should disappear
      expect(screen.queryByRole('button', { name: 'Limpiar todos los filtros' })).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels on all interactive elements', () => {
      render(
        <ClinicSearchFilter
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          onSortChange={mockOnSortChange}
        />
      )

      expect(screen.getByLabelText('Buscar clínicas')).toBeInTheDocument()
      expect(screen.getByLabelText('Ordenar clínicas')).toBeInTheDocument()
    })

    it('should have proper aria-pressed states on filter buttons', () => {
      render(
        <ClinicSearchFilter
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          onSortChange={mockOnSortChange}
        />
      )

      const allButton = screen.getByRole('button', { name: 'Todas las Clínicas' })
      const availableButton = screen.getByRole('button', { name: 'Disponibles Ahora' })
      const openTodayButton = screen.getByRole('button', { name: 'Abiertas Hoy' })

      expect(allButton).toHaveAttribute('aria-pressed', 'true')
      expect(availableButton).toHaveAttribute('aria-pressed', 'false')
      expect(openTodayButton).toHaveAttribute('aria-pressed', 'false')
    })

    it('should maintain keyboard accessibility for all controls', () => {
      render(
        <ClinicSearchFilter
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          onSortChange={mockOnSortChange}
        />
      )

      const searchInput = screen.getByLabelText('Buscar clínicas')
      const sortSelect = screen.getByLabelText('Ordenar clínicas')

      // These elements should be focusable
      expect(searchInput).not.toHaveAttribute('tabindex', '-1')
      expect(sortSelect).not.toHaveAttribute('tabindex', '-1')
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid filter changes', () => {
      render(
        <ClinicSearchFilter
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          onSortChange={mockOnSortChange}
        />
      )

      const allButton = screen.getByRole('button', { name: 'Todas las Clínicas' })
      const availableButton = screen.getByRole('button', { name: 'Disponibles Ahora' })
      const openTodayButton = screen.getByRole('button', { name: 'Abiertas Hoy' })

      fireEvent.click(availableButton)
      fireEvent.click(openTodayButton)
      fireEvent.click(allButton)

      expect(mockOnFilterChange).toHaveBeenCalledTimes(3)
      expect(mockOnFilterChange).toHaveBeenLastCalledWith('all')
    })

    it('should handle rapid sort changes', () => {
      render(
        <ClinicSearchFilter
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          onSortChange={mockOnSortChange}
        />
      )

      const sortSelect = screen.getByLabelText('Ordenar clínicas')

      fireEvent.change(sortSelect, { target: { value: 'distance' } })
      fireEvent.change(sortSelect, { target: { value: 'availability' } })
      fireEvent.change(sortSelect, { target: { value: 'name' } })

      expect(mockOnSortChange).toHaveBeenCalledTimes(3)
      expect(mockOnSortChange).toHaveBeenLastCalledWith('name')
    })

    it('should handle special characters in search input', async () => {
      render(
        <ClinicSearchFilter
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          onSortChange={mockOnSortChange}
        />
      )

      // Run initial timers and clear
      act(() => {
        vi.runAllTimers()
      })
      expect(mockOnSearch).toHaveBeenCalledWith('')
      mockOnSearch.mockClear()

      const searchInput = screen.getByPlaceholderText('Buscar por nombre o dirección...')
      const specialText = 'Clínica #1 @ 123-A (Centro)'

      fireEvent.change(searchInput, { target: { value: specialText } })
      act(() => {
        vi.advanceTimersByTime(500)
      })

      expect(mockOnSearch).toHaveBeenCalledWith(specialText)
    })

    it('should handle very long search queries', async () => {
      render(
        <ClinicSearchFilter
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          onSortChange={mockOnSortChange}
        />
      )

      // Run initial timers and clear
      act(() => {
        vi.runAllTimers()
      })
      expect(mockOnSearch).toHaveBeenCalledWith('')
      mockOnSearch.mockClear()

      const searchInput = screen.getByPlaceholderText('Buscar por nombre o dirección...')
      const longText = 'A'.repeat(500)

      fireEvent.change(searchInput, { target: { value: longText } })
      act(() => {
        vi.advanceTimersByTime(500)
      })

      expect(mockOnSearch).toHaveBeenCalledWith(longText)
    })
  })

  describe('Component Integration', () => {
    it('should handle all three controls being used together', async () => {
      render(
        <ClinicSearchFilter
          onSearch={mockOnSearch}
          onFilterChange={mockOnFilterChange}
          onSortChange={mockOnSortChange}
        />
      )

      // Run initial timers and clear
      act(() => {
        vi.runAllTimers()
      })
      expect(mockOnSearch).toHaveBeenCalledWith('')
      mockOnSearch.mockClear()

      // Set search
      const searchInput = screen.getByPlaceholderText('Buscar por nombre o dirección...')
      fireEvent.change(searchInput, { target: { value: 'Centro' } })
      act(() => {
        vi.advanceTimersByTime(500)
      })

      // Set filter
      const availableButton = screen.getByRole('button', { name: 'Disponibles Ahora' })
      fireEvent.click(availableButton)

      // Set sort
      const sortSelect = screen.getByLabelText('Ordenar clínicas')
      fireEvent.change(sortSelect, { target: { value: 'distance' } })

      expect(mockOnSearch).toHaveBeenCalledWith('Centro')
      expect(mockOnFilterChange).toHaveBeenCalledWith('available')
      expect(mockOnSortChange).toHaveBeenCalledWith('distance')

      // Clear button should be visible
      expect(screen.getByRole('button', { name: 'Limpiar todos los filtros' })).toBeInTheDocument()
    })
  })
})

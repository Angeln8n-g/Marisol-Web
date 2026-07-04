import React, { useState, useEffect, useCallback } from 'react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

export type ClinicFilter = 'all' | 'available' | 'open_today'
export type ClinicSort = 'name' | 'distance' | 'availability'

export interface ClinicSearchFilterProps {
  onSearch: (query: string) => void
  onFilterChange: (filter: ClinicFilter) => void
  onSortChange: (sort: ClinicSort) => void
}

/**
 * ClinicSearchFilter Component
 * 
 * Provides search, filter, and sort functionality for clinic locations:
 * - Search input with 500ms debouncing
 * - Filter buttons: "All Clinics", "Available Now", "Open Today"
 * - Sort dropdown: by name, distance, availability
 * - Clear filters button to reset all filters
 * 
 * **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**
 * - Requirement 9.1: Search input filters clinics by name or address
 * - Requirement 9.2: Search updates within 500ms (debounced)
 * - Requirement 9.3: Filter options for availability and operating status
 * - Requirement 9.4: Map updates when filters are applied
 * - Requirement 9.5: Sort clinics by distance, name, or availability
 */
export const ClinicSearchFilter: React.FC<ClinicSearchFilterProps> = ({
  onSearch,
  onFilterChange,
  onSortChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<ClinicFilter>('all')
  const [selectedSort, setSelectedSort] = useState<ClinicSort>('name')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce search input (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Call onSearch when debounced query changes
  useEffect(() => {
    onSearch(debouncedQuery)
  }, [debouncedQuery, onSearch])

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Handle filter button click
  const handleFilterClick = (filter: ClinicFilter) => {
    setSelectedFilter(filter)
    onFilterChange(filter)
  }

  // Handle sort dropdown change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sort = e.target.value as ClinicSort
    setSelectedSort(sort)
    onSortChange(sort)
  }

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery('')
    setDebouncedQuery('')
    setSelectedFilter('all')
    setSelectedSort('name')
    onSearch('')
    onFilterChange('all')
    onSortChange('name')
  }, [onSearch, onFilterChange, onSortChange])

  // Check if any filters are active (not default state)
  const hasActiveFilters = searchQuery !== '' || selectedFilter !== 'all' || selectedSort !== 'name'

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6 space-y-4">
      {/* Search Input */}
      <div className="w-full">
        <Input
          type="text"
          placeholder="Buscar por nombre o dirección..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full"
          aria-label="Buscar clínicas"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex flex-wrap gap-2 flex-1">
          <Button
            variant={selectedFilter === 'all' ? 'primary' : 'ghost'}
            onClick={() => handleFilterClick('all')}
            className="flex-1 sm:flex-none"
            aria-pressed={selectedFilter === 'all'}
          >
            Todas las Clínicas
          </Button>
          <Button
            variant={selectedFilter === 'available' ? 'primary' : 'ghost'}
            onClick={() => handleFilterClick('available')}
            className="flex-1 sm:flex-none"
            aria-pressed={selectedFilter === 'available'}
          >
            Disponibles Ahora
          </Button>
          <Button
            variant={selectedFilter === 'open_today' ? 'primary' : 'ghost'}
            onClick={() => handleFilterClick('open_today')}
            className="flex-1 sm:flex-none"
            aria-pressed={selectedFilter === 'open_today'}
          >
            Abiertas Hoy
          </Button>
        </div>
      </div>

      {/* Sort Dropdown and Clear Button */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="w-full sm:w-auto flex-1">
          <label htmlFor="sort-select" className="block text-sm font-medium text-navy mb-1">
            Ordenar por:
          </label>
          <select
            id="sort-select"
            value={selectedSort}
            onChange={handleSortChange}
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-colors duration-200 bg-white"
            aria-label="Ordenar clínicas"
          >
            <option value="name">Nombre</option>
            <option value="distance">Distancia</option>
            <option value="availability">Disponibilidad</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="w-full sm:w-auto">
            <Button
              variant="ghost"
              onClick={handleClearFilters}
              className="w-full sm:w-auto mt-6"
              aria-label="Limpiar todos los filtros"
            >
              Limpiar Filtros
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

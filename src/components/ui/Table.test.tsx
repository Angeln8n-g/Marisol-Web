import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Table } from './Table'
import type { Column } from './Table'

interface TestData {
  id: string
  name: string
  email: string
  age: number
}

const mockData: TestData[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', age: 30 },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', age: 25 },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', age: 35 },
]

const mockColumns: Column<TestData>[] = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'age', header: 'Age' },
]

describe('Table', () => {
  it('should render table with data', () => {
    render(
      <Table
        columns={mockColumns}
        data={mockData}
        keyExtractor={(item) => item.id}
      />
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByText('35')).toBeInTheDocument()
  })

  it('should render column headers', () => {
    render(
      <Table
        columns={mockColumns}
        data={mockData}
        keyExtractor={(item) => item.id}
      />
    )

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Age')).toBeInTheDocument()
  })

  it('should render loading state', () => {
    render(
      <Table
        columns={mockColumns}
        data={[]}
        keyExtractor={(item) => item.id}
        isLoading={true}
      />
    )

    expect(screen.getByText('Cargando datos...')).toBeInTheDocument()
  })

  it('should render empty state when no data', () => {
    render(
      <Table
        columns={mockColumns}
        data={[]}
        keyExtractor={(item) => item.id}
        emptyMessage="No hay registros"
      />
    )

    expect(screen.getByText('No hay registros')).toBeInTheDocument()
  })

  it('should call onRowClick when row is clicked', () => {
    const onRowClick = vi.fn()
    render(
      <Table
        columns={mockColumns}
        data={mockData}
        keyExtractor={(item) => item.id}
        onRowClick={onRowClick}
      />
    )

    const firstRow = screen.getByText('John Doe').closest('tr')
    if (firstRow) {
      fireEvent.click(firstRow)
      expect(onRowClick).toHaveBeenCalledWith(mockData[0])
    }
  })

  it('should render custom cell content with render function', () => {
    const customColumns: Column<TestData>[] = [
      {
        key: 'name',
        header: 'Name',
        render: (item) => <strong>{item.name.toUpperCase()}</strong>,
      },
    ]

    render(
      <Table
        columns={customColumns}
        data={mockData}
        keyExtractor={(item) => item.id}
      />
    )

    expect(screen.getByText('JOHN DOE')).toBeInTheDocument()
  })

  it('should render pagination controls when pagination prop is provided', () => {
    const pagination = {
      hasNextPage: true,
      hasPreviousPage: false,
      onNextPage: vi.fn(),
      onPreviousPage: vi.fn(),
    }

    render(
      <Table
        columns={mockColumns}
        data={mockData}
        keyExtractor={(item) => item.id}
        pagination={pagination}
      />
    )

    expect(screen.getByText('Anterior')).toBeInTheDocument()
    expect(screen.getByText('Siguiente')).toBeInTheDocument()
  })

  it('should call pagination callbacks when buttons are clicked', () => {
    const onNextPage = vi.fn()
    const onPreviousPage = vi.fn()

    const pagination = {
      hasNextPage: true,
      hasPreviousPage: true,
      onNextPage,
      onPreviousPage,
    }

    render(
      <Table
        columns={mockColumns}
        data={mockData}
        keyExtractor={(item) => item.id}
        pagination={pagination}
      />
    )

    fireEvent.click(screen.getByText('Siguiente'))
    expect(onNextPage).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByText('Anterior'))
    expect(onPreviousPage).toHaveBeenCalledTimes(1)
  })

  it('should disable previous button when hasPreviousPage is false', () => {
    const pagination = {
      hasNextPage: true,
      hasPreviousPage: false,
      onNextPage: vi.fn(),
      onPreviousPage: vi.fn(),
    }

    render(
      <Table
        columns={mockColumns}
        data={mockData}
        keyExtractor={(item) => item.id}
        pagination={pagination}
      />
    )

    const previousButton = screen.getByText('Anterior').closest('button')
    expect(previousButton).toBeDisabled()
  })

  it('should disable next button when hasNextPage is false', () => {
    const pagination = {
      hasNextPage: false,
      hasPreviousPage: true,
      onNextPage: vi.fn(),
      onPreviousPage: vi.fn(),
    }

    render(
      <Table
        columns={mockColumns}
        data={mockData}
        keyExtractor={(item) => item.id}
        pagination={pagination}
      />
    )

    const nextButton = screen.getByText('Siguiente').closest('button')
    expect(nextButton).toBeDisabled()
  })

  it('should display page information when provided', () => {
    const pagination = {
      hasNextPage: true,
      hasPreviousPage: true,
      onNextPage: vi.fn(),
      onPreviousPage: vi.fn(),
      currentPage: 2,
      totalPages: 5,
    }

    render(
      <Table
        columns={mockColumns}
        data={mockData}
        keyExtractor={(item) => item.id}
        pagination={pagination}
      />
    )

    expect(screen.getByText('Página 2 de 5')).toBeInTheDocument()
  })
})

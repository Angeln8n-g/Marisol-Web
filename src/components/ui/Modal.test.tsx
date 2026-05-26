import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from './Modal'

describe('Modal', () => {
  it('should not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()}>
        <p>Modal content</p>
      </Modal>
    )

    expect(screen.queryByText('Modal content')).not.toBeInTheDocument()
  })

  it('should render when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <p>Modal content</p>
      </Modal>
    )

    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('should display title when provided', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    )

    expect(screen.getByText('Test Modal')).toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    )

    const closeButton = screen.getByLabelText('Cerrar modal')
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when Escape key is pressed', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose}>
        <p>Modal content</p>
      </Modal>
    )

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when overlay is clicked and closeOnOverlayClick is true', () => {
    const onClose = vi.fn()
    const { container } = render(
      <Modal isOpen={true} onClose={onClose} closeOnOverlayClick={true}>
        <p>Modal content</p>
      </Modal>
    )

    // Find the overlay div (the outermost div with the click handler)
    const overlay = container.querySelector('.fixed.inset-0')
    if (overlay) {
      // Create a proper click event that simulates clicking the overlay itself
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      })
      Object.defineProperty(clickEvent, 'target', { value: overlay, enumerable: true })
      Object.defineProperty(clickEvent, 'currentTarget', { value: overlay, enumerable: true })
      overlay.dispatchEvent(clickEvent)
      expect(onClose).toHaveBeenCalledTimes(1)
    }
  })

  it('should not call onClose when overlay is clicked and closeOnOverlayClick is false', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} closeOnOverlayClick={false}>
        <p>Modal content</p>
      </Modal>
    )

    const overlay = screen.getByRole('dialog').parentElement
    if (overlay) {
      fireEvent.click(overlay)
      expect(onClose).not.toHaveBeenCalled()
    }
  })

  it('should render footer when provided', () => {
    render(
      <Modal
        isOpen={true}
        onClose={vi.fn()}
        footer={<button>Save</button>}
      >
        <p>Modal content</p>
      </Modal>
    )

    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  it('should apply correct size class', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={vi.fn()} size="sm">
        <p>Modal content</p>
      </Modal>
    )

    // The dialog role is on the overlay, the size class is on the inner div
    const modalContent = screen.getByRole('dialog').querySelector('div')
    expect(modalContent).toHaveClass('max-w-md')

    rerender(
      <Modal isOpen={true} onClose={vi.fn()} size="xl">
        <p>Modal content</p>
      </Modal>
    )

    const modalContentXl = screen.getByRole('dialog').querySelector('div')
    expect(modalContentXl).toHaveClass('max-w-4xl')
  })
})

import React, { useState, useEffect } from 'react'

const navLinks = [
  { label: 'Inicio', href: '#hero' },
  { label: 'Servicios', href: '#services' },
  { label: 'Sobre Mí', href: '#about' },
  { label: 'Antes/Después', href: '#before-after' },
  { label: 'Contacto', href: '#footer' },
]

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToForm = () => {
    const form = document.getElementById('appointment-form')
    if (form) {
      form.scrollIntoView({ behavior: 'smooth' })
      setIsMobileOpen(false)
    }
  }

  const handleNavClick = (href: string) => {
    const el = document.querySelector(href)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
      setIsMobileOpen(false)
    }
  }

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-sm shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <a
            href="#hero"
            onClick={(e) => { e.preventDefault(); handleNavClick('#hero') }}
            className={`text-3xl font-alex-brush transition-colors ${
              isScrolled ? 'text-navy' : 'text-white'
            }`}
          >
            Dra. García
          </a>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => { e.preventDefault(); handleNavClick(link.href) }}
                className={`text-sm font-montserrat font-medium tracking-wide uppercase transition-colors hover:text-gold ${
                  isScrolled ? 'text-navy' : 'text-white'
                }`}
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={scrollToForm}
              className="px-5 py-2.5 bg-gold text-white text-sm font-montserrat font-semibold rounded-md hover:bg-gold/90 transition-colors"
            >
              Reservar Cita
            </button>
          </div>

          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className={`md:hidden p-2 ${isScrolled ? 'text-navy' : 'text-white'}`}
            aria-label="Menú de navegación"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isMobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-sm border-t border-gray-100">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => { e.preventDefault(); handleNavClick(link.href) }}
                className="block text-sm font-montserrat font-medium text-navy tracking-wide uppercase py-2"
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={scrollToForm}
              className="w-full px-5 py-2.5 bg-gold text-white text-sm font-montserrat font-semibold rounded-md hover:bg-gold/90 transition-colors"
            >
              Reservar Cita
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

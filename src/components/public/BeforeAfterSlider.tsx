import React, { useRef, useState, useCallback, useEffect } from 'react'

const cases = [
  {
    title: 'Caso 1',
    description: 'Restauración completa con implantes dentales',
    beforeColor: 'from-navy to-navy-light',
    afterColor: 'from-gold/20 to-gold/10',
    label: 'Implantes Dentales',
  },
  {
    title: 'Caso 2',
    description: 'Tratamiento de periodontitis avanzada',
    beforeColor: 'from-navy to-navy-light',
    afterColor: 'from-gold/20 to-gold/10',
    label: 'Periodoncia',
  },
  {
    title: 'Caso 3',
    description: 'Diseño de sonrisa con carillas',
    beforeColor: 'from-navy to-navy-light',
    afterColor: 'from-gold/20 to-gold/10',
    label: 'Estética Dental',
  },
]

const Slider: React.FC<{
  beforeColor: string
  afterColor: string
  label: string
}> = ({ beforeColor, afterColor, label }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width)
    setSliderPosition((x / rect.width) * 100)
  }, [])

  const handleMouseDown = () => setIsDragging(true)
  const handleTouchStart = () => setIsDragging(true)

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => updatePosition(e.clientX)
    const handleTouchMove = (e: TouchEvent) => updatePosition(e.touches[0].clientX)
    const handleEnd = () => setIsDragging(false)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('mouseup', handleEnd)
    window.addEventListener('touchend', handleEnd)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [isDragging, updatePosition])

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] rounded-xl overflow-hidden cursor-ew-resize select-none bg-gray-200"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${afterColor} flex items-center justify-center`}>
        <span className="text-navy/40 font-montserrat text-sm font-medium">Después</span>
      </div>

      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${beforeColor} flex items-center justify-center`}>
          <span className="text-white/40 font-montserrat text-sm font-medium">Antes</span>
        </div>
      </div>

      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l-4 4 4 4m8-8l4 4-4 4" />
          </svg>
        </div>
      </div>

      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/50 text-white text-xs font-montserrat">
        {label}
      </div>
    </div>
  )
}

export const BeforeAfterSlider: React.FC = () => {
  return (
    <section id="before-after" className="py-24 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-gold font-montserrat text-sm tracking-[0.3em] uppercase mb-4">
            Resultados Reales
          </p>
          <h2 className="text-3xl sm:text-4xl font-playfair text-navy">
            Antes y Después
          </h2>
          <p className="mt-4 text-gray-600 font-montserrat max-w-xl mx-auto">
            Desliza para ver la transformación de nuestros pacientes con
            tratamientos reales realizados en nuestra clínica.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {cases.map((c) => (
            <div key={c.title} className="space-y-4">
              <Slider beforeColor={c.beforeColor} afterColor={c.afterColor} label={c.label} />
              <div>
                <h3 className="font-playfair font-semibold text-navy">{c.title}</h3>
                <p className="text-sm text-gray-600 font-montserrat">{c.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

import React from 'react'

export const HeroSection: React.FC = () => {
  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-light to-navy" />

      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-gold blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-gold blur-3xl translate-y-1/3 -translate-x-1/4" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div>
              <p className="text-gold font-montserrat text-sm tracking-[0.3em] uppercase mb-4">
                Periodoncia e Implantes
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-playfair text-white leading-tight">
                Tu sonrisa,{' '}
                <span className="text-gold">nuestra prioridad</span>
              </h1>
            </div>

            <p className="text-gray-300 font-montserrat text-lg leading-relaxed max-w-lg">
              Más de 15 años devolviendo sonrisas con excelencia, calidez y
              compromiso en cada tratamiento.
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href="#appointment-form"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('appointment-form')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="px-8 py-3.5 bg-gold text-white font-montserrat font-semibold rounded-md hover:bg-gold/90 transition-colors"
              >
                Solicitar Cita
              </a>
              <a
                href="#services"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="px-8 py-3.5 border border-white/30 text-white font-montserrat font-semibold rounded-md hover:bg-white/10 transition-colors"
              >
                Ver Servicios
              </a>
            </div>

            <div className="flex items-center gap-8 pt-4">
              <div>
                <p className="text-2xl font-playfair font-bold text-white">15+</p>
                <p className="text-xs text-gray-400 font-montserrat">Años de experiencia</p>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div>
                <p className="text-2xl font-playfair font-bold text-white">5K+</p>
                <p className="text-xs text-gray-400 font-montserrat">Pacientes atendidos</p>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div>
                <p className="text-2xl font-playfair font-bold text-white">98%</p>
                <p className="text-xs text-gray-400 font-montserrat">Satisfacción</p>
              </div>
            </div>
          </div>

          <div className="hidden md:flex justify-center">
            <div className="relative w-80 h-96">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 blur-2xl" />
              <div className="relative w-full h-full rounded-full border-2 border-gold/30 overflow-hidden bg-navy-light/50">
                <img src="/Marisol_picture.jpeg" alt="Dra. Marisol García" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cream to-transparent" />
    </section>
  )
}

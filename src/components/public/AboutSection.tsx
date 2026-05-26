import React from 'react'

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-24 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden">
              <img src="/Marisol_picture.jpeg" alt="Dra. Marisol García" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gold/10 rounded-full blur-xl" />
          </div>

          <div className="space-y-6">
            <p className="text-gold font-montserrat text-sm tracking-[0.3em] uppercase">
              Sobre Mí
            </p>
            <h2 className="text-3xl sm:text-4xl font-playfair text-navy leading-tight">
              Dra. Marisol García
            </h2>

            <div className="space-y-4 text-gray-600 font-montserrat leading-relaxed">
              <p>
                Con más de 5 años de experiencia en periodoncia e implantes dentales,
                mi filosofía se basa en la excelencia clínica y el trato humano.
                Cada paciente es único y merece un plan de tratamiento personalizado.
              </p>
              <p>
                Graduada con honores de la Universidad Autónoma de Santo Domingo,
                con especialización en Periodoncia por la Universidad 
                y múltiples certificaciones internacionales en implantes dentales.
              </p>
              <p>
                Creo firmemente en la educación del paciente como base para una
                salud dental duradera. Mi objetivo no es solo tratar, sino enseñar
                y empoderar a cada persona para que cuide su sonrisa.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-navy font-montserrat">Periodoncia</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-navy font-montserrat">Implantes</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-navy font-montserrat">Estética Dental</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-navy font-montserrat">Ortodoncia</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

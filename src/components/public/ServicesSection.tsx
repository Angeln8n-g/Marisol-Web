import React from 'react'

const services = [
  {
    title: 'Periodoncia',
    description: 'Tratamiento de enfermedades de las encías, desde gingivitis hasta periodontitis avanzada, con técnicas mínimamente invasivas.',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    title: 'Implantes Dentales',
    description: 'Restauración de dientes perdidos con implantes de titanio de última generación para una sonrisa natural y funcional.',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
  },
  {
    title: 'Estética Dental',
    description: 'Diseño de sonrisa, carillas de porcelana, blanqueamiento dental y armonización facial para una sonrisa perfecta.',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Ortodoncia',
    description: 'Alineación dental con brackets tradicionales o aligners invisibles para una sonrisa recta y saludable.',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
      </svg>
    ),
  },
  {
    title: 'Endodoncia',
    description: 'Tratamiento de conductos para salvar dientes dañados, aliviando el dolor y preservando tu dentadura natural.',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  {
    title: 'Odontología General',
    description: 'Limpiezas, sellantes, obturación de caries y revisiones periódicas para mantener tu salud dental óptima.',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
]

export const ServicesSection: React.FC = () => {
  return (
    <section id="services" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-gold font-montserrat text-sm tracking-[0.3em] uppercase mb-4">
            Especialidades
          </p>
          <h2 className="text-3xl sm:text-4xl font-playfair text-navy">
            Nuestros Servicios
          </h2>
          <p className="mt-4 text-gray-600 font-montserrat max-w-xl mx-auto">
            Ofrecemos un cuidado dental integral con tecnología de punta y un enfoque
            personalizado para cada paciente.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div
              key={service.title}
              className="group p-8 rounded-2xl border border-gray-100 bg-white hover:bg-cream hover:border-gold/30 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-gold/10 text-gold flex items-center justify-center mb-5 group-hover:bg-gold group-hover:text-white transition-all duration-300">
                {service.icon}
              </div>
              <h3 className="text-lg font-playfair font-semibold text-navy mb-3">
                {service.title}
              </h3>
              <p className="text-sm text-gray-600 font-montserrat leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

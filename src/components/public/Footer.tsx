import React from 'react'

export const Footer: React.FC = () => {
  return (
    <footer id="footer" className="bg-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-12">
          <div className="space-y-4">
            <h3 className="text-3xl font-alex-brush text-gold">
              Dra. García
            </h3>
            <p className="text-sm text-gray-400 font-montserrat leading-relaxed">
              Periodoncia e Implantes Dentales con más de 15 años de experiencia
              devolviendo sonrisas con excelencia y calidez.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-montserrat font-semibold tracking-wider uppercase text-gold">
              Contacto
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="text-sm font-montserrat">Calle Principal 123</p>
                  <p className="text-sm text-gray-400 font-montserrat">Santo Domingo, R.D.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <p className="text-sm font-montserrat">(809) 555-1234</p>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-montserrat">info@dragarcia.com.do</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-montserrat font-semibold tracking-wider uppercase text-gold">
              Horarios
            </h4>
            <div className="space-y-2 text-sm font-montserrat">
              <div className="flex justify-between">
                <span className="text-gray-400">Lun - Vie</span>
                <span>9:00 - 18:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Sábados</span>
                <span>9:00 - 14:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Domingos</span>
                <span className="text-gold">Cerrado</span>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-gold transition-colors flex items-center justify-center"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" strokeWidth={1.5} />
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" strokeWidth={1.5} />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth={1.5} />
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-gold transition-colors flex items-center justify-center"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3V2z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-gold transition-colors flex items-center justify-center"
                aria-label="WhatsApp"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21l1.65-3.8a9 9 0 113.15 3.15L3 21z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="py-6 border-t border-white/10 text-center">
          <p className="text-xs text-gray-500 font-montserrat">
            &copy; {new Date().getFullYear()} Dra. Marisol García. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}

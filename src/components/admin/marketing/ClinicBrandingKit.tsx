import React, { useState } from 'react'

interface ColorToken {
  name: string
  hex: string
  rgb: string
  usage: string
  bgClass: string
  textLight?: boolean
}

const BRAND_COLORS: ColorToken[] = [
  {
    name: 'Azul Marino Real',
    hex: '#1B2A4A',
    rgb: 'rgb(27, 42, 74)',
    usage: 'Color primario de la clínica, fondos oscuros, textos de encabezados principales.',
    bgClass: 'bg-[#1B2A4A]',
    textLight: true,
  },
  {
    name: 'Dorado Premium',
    hex: '#D4AF37',
    rgb: 'rgb(212, 175, 55)',
    usage: 'Acentos de lujo, botones destacados, sellos de calidad, insignias y bordes VIP.',
    bgClass: 'bg-[#D4AF37]',
    textLight: true,
  },
  {
    name: 'Arena Suave / Nude',
    hex: '#F4F0EA',
    rgb: 'rgb(244, 240, 234)',
    usage: 'Fondos secundarios cálidos, tarjetas de contenido, contrastes relajantes.',
    bgClass: 'bg-[#F4F0EA]',
    textLight: false,
  },
  {
    name: 'Blanco Puro',
    hex: '#FFFFFF',
    rgb: 'rgb(255, 255, 255)',
    usage: 'Fondo de tarjetas, espacios limpios, sensación de asepsia y confort clínico.',
    bgClass: 'bg-white border border-gray-200',
    textLight: false,
  },
  {
    name: 'Verde Éxito / Esmeralda',
    hex: '#10B981',
    rgb: 'rgb(16, 185, 129)',
    usage: 'Confirmaciones, salud, citas aprobadas y beneficios activos en vouchers.',
    bgClass: 'bg-emerald-500',
    textLight: true,
  },
  {
    name: 'Rosa Cálido Acento',
    hex: '#E07A5F',
    rgb: 'rgb(224, 122, 95)',
    usage: 'Avisos de urgencia estética, promociones de temporada y fechas especiales.',
    bgClass: 'bg-[#E07A5F]',
    textLight: true,
  },
]

export const ClinicBrandingKit: React.FC = () => {
  const [copiedColor, setCopiedColor] = useState<string | null>(null)
  const [copiedBio, setCopiedBio] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string, type: 'color' | 'bio') => {
    navigator.clipboard.writeText(text)
    if (type === 'color') {
      setCopiedColor(id)
      setTimeout(() => setCopiedColor(null), 2000)
    } else {
      setCopiedBio(id)
      setTimeout(() => setCopiedBio(null), 2000)
    }
  }

  const bioInstagram = `✨ Dra. Marisol García | Odontología Especializada
💎 Estética Dental • Ortodoncia • Implantes
📍 Santo Domingo / Santiago, Rep. Dominicana
📅 Agenda tu valoración directa 👇
📲 WhatsApp: (829) 555-0199`

  const bioWhatsApp = `Dra. Marisol García - Odontología Especializada
Atención odontológica integral de alta gama en República Dominicana.
Horario: Lunes a Viernes 8:30 AM - 6:00 PM | Sábados 9:00 AM - 1:00 PM`

  return (
    <div className="space-y-8 font-montserrat">
      {/* Intro Header */}
      <div className="bg-gradient-to-r from-navy via-navy to-navy/95 text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-gold/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="max-w-3xl space-y-2 relative z-10">
          <span className="text-xs uppercase tracking-widest text-gold font-bold bg-gold/20 px-3 py-1 rounded-full border border-gold/30">
            Brand Identity System
          </span>
          <h2 className="text-2xl sm:text-3xl font-playfair font-bold text-white tracking-wide">
            Kit de Identidad y Marca Oficial
          </h2>
          <p className="text-sm text-gray-200 leading-relaxed font-light">
            Guía oficial de comunicación, paleta cromática, tipografías y tono de voz de la clínica Dra. Marisol García. 
            Utiliza estos activos para garantizar coherencia en redes sociales, papelería y promociones.
          </p>
        </div>
      </div>

      {/* Color Palette Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-100 pb-3">
          <div>
            <h3 className="font-playfair text-lg font-bold text-navy">Paleta de Colores Oficial</h3>
            <p className="text-xs text-gray-500">Haz clic en cualquier código para copiar el valor HEX al portapapeles</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-sand/60 text-navy rounded-md self-start sm:self-auto">
            6 Colores Primarios y Secundarios
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BRAND_COLORS.map((color) => (
            <div
              key={color.hex}
              className="group border border-gray-100 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between bg-white"
            >
              <div
                className={`h-24 w-full ${color.bgClass} flex items-end justify-between p-3 relative`}
              >
                <button
                  type="button"
                  onClick={() => copyToClipboard(color.hex, color.hex, 'color')}
                  className="px-2 py-1 rounded bg-black/40 hover:bg-black/60 backdrop-blur-xs text-white text-[11px] font-mono font-bold flex items-center gap-1 transition-all"
                >
                  {copiedColor === color.hex ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      ¡Copiado!
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {color.hex}
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 space-y-1.5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-navy">{color.name}</h4>
                  <p className="text-xs text-gray-500 font-mono">{color.rgb}</p>
                  <p className="text-xs text-gray-600 mt-2 leading-snug">{color.usage}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Typography Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Playfair Display */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gold">Tipografía de Títulos</span>
              <h3 className="font-playfair text-xl font-bold text-navy">Playfair Display</h3>
            </div>
            <span className="px-2 py-0.5 rounded bg-sand text-navy text-[11px] font-medium">Serif Elegante</span>
          </div>
          <div className="p-4 bg-sand/30 rounded-xl space-y-2 border border-sand">
            <p className="font-playfair text-2xl font-bold text-navy leading-tight">
              &quot;La excelencia en cada sonrisa comienza con precisión médica.&quot;
            </p>
            <p className="font-playfair text-base italic text-gray-600">
              Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj 0 1 2 3 4 5 6 7 8 9
            </p>
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>Uso recomendado:</strong> Encabezados principales (H1, H2), títulos de vouchers promocionales, cotizaciones de lujo y firmas de branding.</p>
          </div>
        </div>

        {/* Montserrat */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-navy">Tipografía de Contenido</span>
              <h3 className="font-montserrat text-xl font-bold text-navy">Montserrat</h3>
            </div>
            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[11px] font-medium">Sans-Serif Moderna</span>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl space-y-2 border border-gray-200">
            <p className="font-montserrat text-sm text-navy leading-relaxed">
              Atención personalizada, equipamiento dental digital de vanguardia y especialistas certificados en República Dominicana.
            </p>
            <p className="font-montserrat text-xs text-gray-500 font-mono">
              Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj 0 1 2 3 4 5 6 7 8 9
            </p>
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>Uso recomendado:</strong> Párrafos de lectura, botones de acción, etiquetas de precios, formularios y términos y condiciones.</p>
          </div>
        </div>
      </div>

      {/* Brand Voice & Principles */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-3">
          <h3 className="font-playfair text-lg font-bold text-navy">Tono de Voz y Pilares de Comunicación</h3>
          <p className="text-xs text-gray-500">Pautas para redactar contenido en redes sociales, llamadas y mensajes de WhatsApp</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-sand/30 border border-sand space-y-2">
            <div className="w-8 h-8 rounded-lg bg-gold/20 text-gold flex items-center justify-center font-bold">1</div>
            <h4 className="text-sm font-bold text-navy">Empatía y Cercanía</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Muchos pacientes sienten miedo o inseguridad dental. Comunicar calidez, tranquilidad y comprensión sin juzgar.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-navy/5 border border-navy/10 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-navy/20 text-navy flex items-center justify-center font-bold">2</div>
            <h4 className="text-sm font-bold text-navy">Rigor y Calidad Médica</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Transmitir confianza clínica respaldada por tecnología de última generación, biomateriales certificados y asepsia absoluta.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold">3</div>
            <h4 className="text-sm font-bold text-emerald-900">Transformación Positiva</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Enfocar el valor en el cambio de vida del paciente: recuperar su seguridad al hablar, sonreír y comer sin dolor.
            </p>
          </div>
        </div>

        {/* Dos and Don'ts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-green-50/70 border border-green-200 space-y-2">
            <h4 className="text-xs font-bold text-green-900 uppercase tracking-wider flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Palabras y Enfoques Recomendados
            </h4>
            <ul className="text-xs text-green-950 space-y-1 pl-5 list-disc">
              <li>&quot;Salud bucal integral&quot;, &quot;Armonía facial&quot;, &quot;Sonrisa natural&quot;</li>
              <li>&quot;Tu bienestar es nuestra prioridad&quot;</li>
              <li>&quot;Tecnología guiada e indolora&quot;</li>
              <li>&quot;Plan de tratamiento a tu medida&quot;</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 space-y-2">
            <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider flex items-center gap-1.5">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Términos a Evitar
            </h4>
            <ul className="text-xs text-red-950 space-y-1 pl-5 list-disc">
              <li>Evitar términos alarmistas o de dolor como &quot;taladro&quot;, &quot;sacar diente&quot; o &quot;inyección&quot;.</li>
              <li>Evitar lenguaje excesivamente barato o comercial agresivo (&quot;¡Baratísimo!&quot;).</li>
              <li>No prometer resultados milagrosos en casos complejos sin previa evaluación.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Social Media Bios & Contact Quick-Copy */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="font-playfair text-lg font-bold text-navy">Biografías y Perfiles Oficiales</h3>
            <p className="text-xs text-gray-500">Plantillas estandarizadas para perfiles de redes sociales de la clínica</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Instagram / TikTok Bio */}
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-pink-500" />
                  Bio Instagram / TikTok
                </span>
                <span className="text-[10px] text-gray-400">142 caracteres</span>
              </div>
              <pre className="text-xs font-sans text-gray-700 bg-white p-3 rounded-lg border border-gray-200 whitespace-pre-line leading-relaxed">
                {bioInstagram}
              </pre>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(bioInstagram, 'insta', 'bio')}
              className="w-full py-2 bg-navy text-white hover:bg-navy/90 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              {copiedBio === 'insta' ? '✓ ¡Copiado al portapapeles!' : 'Copiar Bio de Instagram'}
            </button>
          </div>

          {/* WhatsApp Business Bio */}
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Bio WhatsApp Business
                </span>
                <span className="text-[10px] text-gray-400">Descripción oficial</span>
              </div>
              <pre className="text-xs font-sans text-gray-700 bg-white p-3 rounded-lg border border-gray-200 whitespace-pre-line leading-relaxed">
                {bioWhatsApp}
              </pre>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(bioWhatsApp, 'wa', 'bio')}
              className="w-full py-2 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              {copiedBio === 'wa' ? '✓ ¡Copiado al portapapeles!' : 'Copiar Bio de WhatsApp'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

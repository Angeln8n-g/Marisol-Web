import React, { useState } from 'react'

export interface SocialCopyTemplate {
  id: string
  title: string
  category: 'voucher_promo' | 'tips' | 'before_after' | 'faq' | 'lifestyle'
  categoryLabel: string
  suggestedPlatforms: string[]
  copyText: string
  hashtags: string[]
}

const TEMPLATES: SocialCopyTemplate[] = [
  {
    id: 'voucher-gift-1',
    title: 'Bono de Regalo Sonrisa Perfecta (Voucher VIP)',
    category: 'voucher_promo',
    categoryLabel: 'Vouchers y Promociones',
    suggestedPlatforms: ['instagram', 'facebook', 'whatsapp'],
    copyText: `🎁 ¡El mejor regalo para alguien especial es el poder de sonreír con total confianza!

En la clínica de la Dra. Marisol García ponemos a tu disposición nuestros *Vouchers Exclusivos de Regalo* de RD$ 2,000 para tratamientos de estética dental, profilaxis profunda y diseño de sonrisa.

✨ Beneficio aplicable de inmediato
📅 Validez de 45 días
📲 Presenta tu código digital en recepción al agendar tu cita

Escríbenos por WhatsApp o DM con la palabra "VOUCHER" para reservar el tuyo. Cupos limitados por temporada.`,
    hashtags: ['#OdontologiaRD', '#RegalaUnaSonrisa', '#VoucherDental', '#EsteticaDentalRD', '#DraMarisolGarcia'],
  },
  {
    id: 'voucher-welcome-2',
    title: 'Bono de Bienvenida Nuevos Pacientes',
    category: 'voucher_promo',
    categoryLabel: 'Vouchers y Promociones',
    suggestedPlatforms: ['instagram', 'facebook'],
    copyText: `¿Aún no has venido a visitarnos? Tu salud bucal merece atención de primer nivel. 💙

Tenemos un regalo especial para ti: *Voucher de Descuento de Bienvenida* para tu primera evaluación integral con escaneo digital y profilaxis ultrasónica.

📍 Ubicados en zona céntrica, con parqueo y confort garantizado.
✨ Equipamiento de vanguardia y especialistas que te acompañan paso a paso.

Escribe "BIENVENIDA" en los comentarios o envíanos un WhatsApp para generar tu código personal.`,
    hashtags: ['#SaludBucalRD', '#PrimeraCitaDental', '#ClinicaDental', '#OdontologiaEspecializada', '#SonrisasRD'],
  },
  {
    id: 'before-after-1',
    title: 'Caso de Éxito: Diseño de Sonrisa y Resinas de Alta Estética',
    category: 'before_after',
    categoryLabel: 'Antes y Después',
    suggestedPlatforms: ['instagram', 'facebook', 'tiktok'],
    copyText: `La armonía de una sonrisa puede transformar por completo tu seguridad personal. ✨🦷

En este caso, nuestra paciente buscaba corregir micro-desgastes y tonalidad irregular sin desgastar agresivamente sus dientes naturales.

Resultado:
✅ Armonía estética respetando la anatomía natural
✅ Resinas estratificadas de alta translucidez
✅ Mínima intervención y confort total

¿Te gustaría evaluar qué opción es la ideal para tus dientes? Agenda tu consulta diagnóstica en el enlace de la bio.`,
    hashtags: ['#AntesYDespuesDental', '#DisenoDeSonrisaRD', '#ResinasEstratificadas', '#SonrisaNatural', '#DentistaSantoDomingo'],
  },
  {
    id: 'tips-whitening-1',
    title: '3 Alimentos que manchan tus dientes (y cómo prevenirlo)',
    category: 'tips',
    categoryLabel: 'Tips de Salud',
    suggestedPlatforms: ['instagram', 'tiktok'],
    copyText: `¿Sabías que el café no es el único culpable del oscurecimiento de tu esmalte? ☕🦷

Guarda este post para proteger la blancura de tu sonrisa:
1️⃣ *Café y Té negro:* Ricos en taninos que se fijan a la placa bacteriana.
2️⃣ *Salsa de soja y vinagre balsámico:* Su acidez y alta pigmentación penetran micro-poros.
3️⃣ *Vino tinto:* Una combinación de cromógenos y acidez que opacan el esmalte.

💡 *Tip de la Dra. Marisol:* Bebe un vaso de agua inmediatamente después de consumirlos y espera 30 minutos antes de cepillarte para no frotar los ácidos contra el esmalte.

¿Cuándo fue tu última limpieza profesional?`,
    hashtags: ['#TipsDentales', '#BlanqueamientoDental', '#CuidadoBucal', '#HabitosSaludables', '#DraMarisolGarcia'],
  },
  {
    id: 'tips-sensitivity-2',
    title: '¿Sientes un corrientazo al tomar algo frío? No lo ignores',
    category: 'tips',
    categoryLabel: 'Tips de Salud',
    suggestedPlatforms: ['instagram', 'facebook'],
    copyText: `Ese dolor punzante y breve al tomar agua fría o helado tiene un nombre: *Hipersensibilidad Dentinaria*. ⚡❄️

Puede ser síntoma de:
🔍 Esmalte desgastado por cepillado muy fuerte
🔍 Retracción gingival (encías que se han subido)
🔍 Bruxismo nocturno (apretar los dientes involuntariamente)
🔍 Caries incipientes entre los dientes

Lo importante: Tiene solución rápida y preventiva si lo tratamos a tiempo. Agenda tu cita de valoración preventiva. 📲`,
    hashtags: ['#SensibilidadDental', '#OdontologiaPreventiva', '#SaludOral', '#CepilladoCorrecto', '#ConsultaDental'],
  },
  {
    id: 'faq-implants-1',
    title: '¿Duele ponerse un implante dental? Desmitificando dudas',
    category: 'faq',
    categoryLabel: 'Preguntas Frecuentes',
    suggestedPlatforms: ['instagram', 'tiktok', 'facebook'],
    copyText: `Es la pregunta número 1 que recibimos en consulta: "¿Dra., ponerme un implante me va a doler?" 🤔

La respuesta categórica es: *¡NO!* 

Gracias a las técnicas de anestesia guiada y cirugía mínimamente invasiva:
1. Durante el procedimiento no sientes ninguna molestia.
2. La recuperación es tan rápida que la mayoría de pacientes retoman sus labores al día siguiente.
3. Recuperas tu capacidad de masticar con la misma firmeza que un diente biológico.

¿Tienes dudas sobre implantes? Déjanos tu pregunta aquí abajo y te respondemos directamente. 👇`,
    hashtags: ['#ImplantesDentalesRD', '#CirugiaDental', '#SinDolor', '#OdontologiaDigital', '#RecuperaTuSonrisa'],
  },
  {
    id: 'lifestyle-confidence-1',
    title: 'Sonreír sin miedo: Tu mejor carta de presentación',
    category: 'lifestyle',
    categoryLabel: 'Estilo de Vida',
    suggestedPlatforms: ['instagram', 'facebook'],
    copyText: `Una sonrisa no solo ilumina tu rostro; cambia la manera en que el mundo te percibe y cómo te sientes contigo mismo/a. 🌟

En la clínica Dra. Marisol García creemos que la odontología moderna es salud, arte y bienestar emocional. Cada detalle de tu tratamiento está pensado para devolverte la tranquilidad de sonreír en cualquier foto o reunión.

Te invitamos a vivir una experiencia odontológica sin estrés, en un ambiente relajado y con el trato humano que mereces. ✨

📍 Agenda tu cita hoy mismo al (829) 555-0199.`,
    hashtags: ['#BienestarIntegral', '#Confianza', '#Autoestima', '#AmorPropio', '#SonrisaRadiante'],
  },
]

interface SocialCopyAssistantProps {
  onUseTemplate?: (template: { title: string; copy: string; platforms: string[] }) => void
}

export const SocialCopyAssistant: React.FC<SocialCopyAssistantProps> = ({ onUseTemplate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')

  const categories = [
    { id: 'all', label: 'Todos los Formatos' },
    { id: 'voucher_promo', label: '🎟 Vouchers y Promos' },
    { id: 'before_after', label: '✨ Antes y Después' },
    { id: 'tips', label: '💡 Tips y Prevención' },
    { id: 'faq', label: '❓ Preguntas Frecuentes' },
    { id: 'lifestyle', label: '🌿 Confianza y Salud' },
  ]

  const filteredTemplates = TEMPLATES.filter((tpl) => {
    const matchesCategory = selectedCategory === 'all' || tpl.category === selectedCategory
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      tpl.title.toLowerCase().includes(q) ||
      tpl.copyText.toLowerCase().includes(q) ||
      tpl.hashtags.some((h) => h.toLowerCase().includes(q))
    return matchesCategory && matchesSearch
  })

  const handleCopy = (tpl: SocialCopyTemplate) => {
    const fullText = `${tpl.copyText}\n\n${tpl.hashtags.join(' ')}`
    navigator.clipboard.writeText(fullText)
    setCopiedId(tpl.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleUse = (tpl: SocialCopyTemplate) => {
    if (onUseTemplate) {
      const fullText = `${tpl.copyText}\n\n${tpl.hashtags.join(' ')}`
      onUseTemplate({
        title: tpl.title,
        copy: fullText,
        platforms: tpl.suggestedPlatforms,
      })
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6 font-montserrat">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gold">Biblioteca de Contenido</span>
          <h3 className="font-playfair text-xl font-bold text-navy">Asistente de Copys para Redes Sociales</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Plantillas optimizadas para captación de pacientes, promociones y posicionamiento médico
          </p>
        </div>

        {/* Search */}
        <div className="w-full sm:w-64">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar plantilla o hashtag..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            />
            <svg
              className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-navy text-gold shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.id}
            className="border border-gray-200 rounded-xl p-5 hover:border-gold transition-all flex flex-col justify-between bg-sand/10 space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30">
                  {tpl.categoryLabel}
                </span>
                <div className="flex gap-1">
                  {tpl.suggestedPlatforms.map((p) => (
                    <span
                      key={p}
                      className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-navy/10 text-navy"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <h4 className="font-playfair font-bold text-sm text-navy">{tpl.title}</h4>

              <div className="p-3 bg-white rounded-lg border border-gray-200 text-xs text-gray-700 whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto font-sans">
                {tpl.copyText}
                <div className="mt-3 text-blue-600 font-medium text-[11px]">
                  {tpl.hashtags.join(' ')}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200/60">
              <button
                type="button"
                onClick={() => handleCopy(tpl)}
                className="px-3 py-1.5 border border-gray-300 hover:bg-white text-gray-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                {copiedId === tpl.id ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Copiar
                  </>
                )}
              </button>

              {onUseTemplate && (
                <button
                  type="button"
                  onClick={() => handleUse(tpl)}
                  className="px-3 py-1.5 bg-navy hover:bg-navy/90 text-gold text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                >
                  <svg className="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Insertar en Publicación
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

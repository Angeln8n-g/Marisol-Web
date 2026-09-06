import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Appointment, WhatsAppMessageTemplate } from '../types'

export interface WhatsAppTemplateContext {
  patientName: string
  procedureName: string
  doctorName?: string
  formattedDate?: string
  formattedTime?: string
  clinicName?: string
  clinicAddress?: string
  quoteAmount?: string
  customInstructions?: string
}

/**
 * Sanitiza números telefónicos para enlaces universales de WhatsApp (wa.me).
 * Especializado en República Dominicana (809, 829, 849).
 */
export function formatDominicanPhoneForWhatsApp(phone: string): string {
  if (!phone) return ''

  // Remover todo carácter no numérico
  let cleaned = phone.replace(/\D/g, '')

  // Si tiene 10 dígitos (ej. 8095551234), agregar código país +1 (RD pertenece al NANP)
  if (cleaned.length === 10) {
    cleaned = `1${cleaned}`
  }

  return cleaned
}

/**
 * Reemplaza tokens dinámicos en una plantilla de mensaje WhatsApp odontológico
 */
export function renderWhatsAppTemplate(templateText: string, context: WhatsAppTemplateContext): string {
  let rendered = templateText

  const tokens: Record<string, string> = {
    '{paciente}': context.patientName || 'Paciente',
    '{procedimiento}': context.procedureName || 'Procedimiento Dental',
    '{doctor}': context.doctorName || 'Dra. Marisol',
    '{fecha}': context.formattedDate || 'Fecha coordinada',
    '{hora}': context.formattedTime || 'Hora coordinada',
    '{clinica}': context.clinicName || 'Dra. Marisol - Odontología Especializada',
    '{direccion_clinica}': context.clinicAddress || 'Santo Domingo, R.D.',
    '{monto}': context.quoteAmount || '0.00',
    '{indicaciones}': context.customInstructions || '',
  }

  for (const [token, value] of Object.entries(tokens)) {
    // Reemplazar todas las ocurrencias del token
    rendered = rendered.split(token).join(value)
  }

  return rendered
}

/**
 * Genera la URL oficial de WhatsApp con el mensaje codificado
 */
export function createWhatsAppUrl(phone: string, message: string): string {
  const sanitizedPhone = formatDominicanPhoneForWhatsApp(phone)
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${sanitizedPhone}?text=${encodedMessage}`
}

/**
 * Plantillas odontológicas por defecto si la base de datos está offline o vacía
 */
export const DEFAULT_WHATSAPP_TEMPLATES: WhatsAppMessageTemplate[] = [
  {
    id: 'tpl-reminder',
    title: 'Recordatorio de Cita Dental',
    category: 'appointment_reminder',
    procedure_category: 'all',
    body: `🦷 *Dra. Marisol - Odontología Especializada*
¡Hola *{paciente}*! 👋

Te recordamos tu próxima cita odontológica:
📅 *Fecha:* {fecha}
⏰ *Hora:* {hora}
🩺 *Procedimiento:* {procedimiento}
👨‍⚕️ *Especialista:* {doctor}
📍 *Sede:* {clinica} ({direccion_clinica})

⚠️ *Recomendaciones previas:*
• Favor llegar 10 minutos antes para su recepción.
• No olvides tu documento de identidad.

Por favor, confirma tu asistencia respondiendo a este mensaje:
👉 *1* para Confirmar
👉 *2* para Reagendar

¡Estamos listos para cuidar de tu sonrisa!`,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tpl-postop-surgery',
    title: 'Indicaciones Post-Operatorias (Cirugías & Extracciones)',
    category: 'post_op',
    procedure_category: 'Cirugía Oral',
    body: `🩹 *Cuidados Post-Operatorios - Dra. Marisol*
Estimado/a *{paciente}*, esperando que te encuentres descansando tras tu procedimiento de *{procedimiento}*.

Por favor ten presentes estas indicaciones clave para tu pronta recuperación:
1️⃣ *Gasa:* Mantén la gasa mordida con presión suave durante 30 a 45 minutos.
2️⃣ *Frío local:* Aplica compresas frías en la zona externa por intervalos de 15 minutos durante las primeras 24 horas.
3️⃣ *Alimentación:* Dieta blanda y fresca (helado, gelatina, purés). Evita comidas calientes o irritantes.
4️⃣ *Prohibido:* NO enjuagarse con fuerza, NO escupir, NO fumar ni ingerir alcohol, y NO utilizar sorbetes o pajillas.
5️⃣ *Medicación:* Toma tus medicamentos según la prescripción del doctor.

🚨 En caso de dolor agudo persistente o sangrado abundante, comunícate inmediatamente a nuestro número de urgencias: +1 (809) 555-0199.`,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tpl-postop-checkin',
    title: 'Seguimiento Post-Operatorio (Check-in 24 Horas)',
    category: 'post_op_checkin',
    procedure_category: 'all',
    body: `👋 *Seguimiento de Bienestar - Dra. Marisol*
¡Hola *{paciente}*! ¿Cómo amaneciste el día de hoy?

Nos comunicamos del equipo clínico para conocer cómo te has sentido tras tu cita de *{procedimiento}* de ayer con el/la {doctor}.

¿Presentas alguna molestia, dolor o inflamación? Déjanos saber respondiendo a este mensaje para darte acompañamiento continuo. ¡Tu bienestar es nuestra prioridad!`,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tpl-quote',
    title: 'Envío de Presupuesto y Plan de Tratamiento',
    category: 'treatment_quote',
    procedure_category: 'all',
    body: `📋 *Tu Plan de Tratamiento Odontológico - Dra. Marisol*
Hola *{paciente}*, un placer saludarte.

Te compartimos el detalle de tu plan de tratamiento propuesto para *{procedimiento}* por un monto total de *RD$ {monto}*.

Contamos con cómodas facilidades de pago en cuotas y financiamiento directo.

¿Cuándo te gustaría agendar tu primera sesión para iniciar? ¡Escríbenos para reservar tu turno!`,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export function useWhatsAppAutomation() {
  const queryClient = useQueryClient()

  // 1. Obtener plantillas activas de la base de datos
  const { data: templates = DEFAULT_WHATSAPP_TEMPLATES, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_message_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (error || !data || data.length === 0) {
        return DEFAULT_WHATSAPP_TEMPLATES
      }
      return data as WhatsAppMessageTemplate[]
    },
    staleTime: 10 * 60 * 1000,
  })

  // 2. Registrar envío de recordatorio y actualizar contador en appointment
  const recordSentReminder = useMutation({
    mutationFn: async ({
      appointment,
      messageContent,
    }: {
      appointment: Appointment
      messageContent: string
    }) => {
      const now = new Date().toISOString()

      // A. Insertar en appointment_reminders
      await supabase.from('appointment_reminders').insert({
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
        reminder_type: 'whatsapp',
        status: 'sent',
        scheduled_time: appointment.scheduled_at,
        sent_at: now,
        message_content: messageContent,
      } as never)

      // B. Incrementar contador en appointments
      const currentCount = appointment.reminder_count || 0
      await supabase
        .from('appointments')
        .update({
          last_reminder_sent_at: now,
          reminder_count: currentCount + 1,
        } as never)
        .eq('id', appointment.id)

      return { success: true, sentAt: now }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['appointment-reminders'] })
    },
  })

  return {
    templates,
    isLoadingTemplates,
    recordSentReminder: recordSentReminder.mutateAsync,
    isRecording: recordSentReminder.isPending,
  }
}

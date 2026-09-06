-- ==============================================================================
-- Migración 025: Automatización de Recordatorios WhatsApp en 1 Clic
-- ==============================================================================

-- 1. Tabla de plantillas de mensajes WhatsApp odontológicos
CREATE TABLE IF NOT EXISTS whatsapp_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('appointment_reminder', 'post_op', 'post_op_checkin', 'treatment_quote', 'custom')),
  body TEXT NOT NULL,
  procedure_category TEXT DEFAULT 'all',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE whatsapp_message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_templates_read" ON whatsapp_message_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "whatsapp_templates_all" ON whatsapp_message_templates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Columnas de control de recordatorios en appointments
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_count INTEGER NOT NULL DEFAULT 0;

-- 3. Semilla de plantillas odontológicas dinámicas
INSERT INTO whatsapp_message_templates (title, category, body, procedure_category) VALUES
(
  'Recordatorio de Cita Dental',
  'appointment_reminder',
  '🦷 *Dra. Marisol - Odontología Especializada*
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

¡Estamos listos para cuidar de tu sonrisa!',
  'all'
),
(
  'Indicaciones Post-Operatorias (Cirugías & Extracciones)',
  'post_op',
  '🩹 *Cuidados Post-Operatorios - Dra. Marisol*
Estimado/a *{paciente}*, esperando que te encuentres descansando tras tu procedimiento de *{procedimiento}*.

Por favor ten presentes estas indicaciones clave para tu pronta recuperación:
1️⃣ *Gasa:* Mantén la gasa mordida con presión suave durante 30 a 45 minutos.
2️⃣ *Frío local:* Aplica compresas frías en la zona externa por intervalos de 15 minutos durante las primeras 24 horas.
3️⃣ *Alimentación:* Dieta blanda y fresca (helado, gelatina, purés). Evita comidas calientes o irritantes.
4️⃣ *Prohibido:* NO enjuagarse con fuerza, NO escupir, NO fumar ni ingerir alcohol, y NO utilizar sorbetes o pajillas.
5️⃣ *Medicación:* Toma tus medicamentos según la prescripción del doctor.

🚨 En caso de dolor agudo persistente o sangrado abundante, comunícate inmediatamente a nuestro número de urgencias: +1 (809) 555-0199.',
  'Cirugía Oral'
),
(
  'Indicaciones Post-Operatorias (Endodoncia & Restauraciones)',
  'post_op',
  '✨ *Indicaciones tras tu Tratamiento - Dra. Marisol*
Hola *{paciente}*, hoy realizamos con éxito tu sesión de *{procedimiento}*.

Te compartimos recomendaciones para las próximas horas:
🦷 Evita masticar alimentos duros o pegajosos del lado tratado hasta que pase el efecto anestésico.
🦷 Es normal percibir una ligera sensibilidad al masticar durante 48 a 72 horas; puedes tomar tu analgésico recetado.
🦷 Continúa tu higiene y cepillado dental habitual con suavidad.

¡Cualquier consulta estamos a tu entera disposición!',
  'Endodoncia'
),
(
  'Seguimiento Post-Operatorio (Check-in 24 Horas)',
  'post_op_checkin',
  '👋 *Seguimiento de Bienestar - Dra. Marisol*
¡Hola *{paciente}*! ¿Cómo amaneciste el día de hoy?

Nos comunicamos del equipo clínico para conocer cómo te has sentido tras tu cita de *{procedimiento}* de ayer con el/la {doctor}.

¿Presentas alguna molestia, dolor o inflamación? Déjanos saber respondiendo a este mensaje para darte acompañamiento continuo. ¡Tu bienestar es nuestra prioridad!',
  'all'
),
(
  'Envío de Presupuesto y Plan de Tratamiento',
  'treatment_quote',
  '📋 *Tu Plan de Tratamiento Odontológico - Dra. Marisol*
Hola *{paciente}*, un placer saludarte.

Te compartimos el detalle de tu plan de tratamiento propuesto para *{procedimiento}* por un monto total de *RD$ {monto}*.

Contamos con cómodas facilidades de pago en cuotas y financiamiento directo.

¿Cuándo te gustaría agendar tu primera sesión para iniciar? ¡Escríbenos para reservar tu turno!',
  'all'
);

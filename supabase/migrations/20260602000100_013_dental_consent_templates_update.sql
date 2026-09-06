-- ==============================================================================
-- MIGRACIÓN 013: ACTUALIZACIÓN INTEGRAL DE PLANTILLAS DE CONSENTIMIENTO INFORMADO
-- Dra. Marisol García – Estomatóloga | Periodoncia e Implantes Dentales
-- ==============================================================================

-- 1. Ampliar tabla consent_templates con categoría, código identificador y campos requeridos
ALTER TABLE consent_templates 
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS required_fields TEXT[] DEFAULT '{}';

-- 2. Ampliar tabla signed_consents con exequátur, datos de tutor/representante y metadatos
ALTER TABLE signed_consents
  ADD COLUMN IF NOT EXISTS doctor_exequatur TEXT DEFAULT '4521-18',
  ADD COLUMN IF NOT EXISTS doctor_signature_url TEXT,
  ADD COLUMN IF NOT EXISTS signer_role TEXT DEFAULT 'patient',
  ADD COLUMN IF NOT EXISTS signer_name TEXT,
  ADD COLUMN IF NOT EXISTS signer_id_doc TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 3. Desactivar las plantillas genéricas anteriores para priorizar el catálogo oficial
UPDATE consent_templates 
SET is_active = false 
WHERE code IS NULL;

-- 4. Sembrar / Actualizar las 10 plantillas oficiales de la Dra. Marisol García
INSERT INTO consent_templates (code, title, category, required_fields, description, template_content, is_active)
VALUES
-- GRUPO 1: INGRESO & ADMISIÓN
(
  'INGRESO_GENERAL',
  'Consentimiento Informado para Ingreso y Atención Odontológica',
  'ingreso_general',
  '{}',
  'Consentimiento voluntario general para ingreso, veracidad de historia médica y atención en la clínica dental.',
  'Yo, {{patient_name}}, portador(a) de la cédula No. {{patient_id}}, autorizo voluntariamente mi ingreso y atención en esta clínica dental ({{clinic_name}}).

Declaro que he proporcionado información veraz y completa sobre mis antecedentes médicos, enfermedades, alergias, medicamentos y cualquier condición de salud relevante para mi atención.

Autorizo al profesional odontólogo a realizar la evaluación clínica, diagnóstico, estudios complementarios y procedimientos odontológicos que sean necesarios, previa explicación de los mismos y de sus posibles riesgos y alternativas.

Comprendo que algunos tratamientos podrán requerir consentimientos informados específicos antes de su realización.

Me comprometo a seguir las indicaciones del profesional, asistir a mis citas de control e informar cualquier cambio en mi estado de salud.

Declaro que he tenido la oportunidad de realizar preguntas y que mis dudas han sido aclaradas satisfactoriamente.',
  true
),

-- GRUPO 2: PERIODONCIA E IMPLANTES
(
  'IMPLANTES_DENTALES',
  'Consentimiento Informado para Colocación de Implantes Dentales',
  'periodoncia_implantes',
  '{treatment_zone}',
  'Consentimiento para colocación de implantes oseointegrados, cirugía y procedimientos complementarios.',
  'Yo, {{patient_name}}, portador(a) de la cédula No. {{patient_id}}, declaro que he sido informado(a) sobre el procedimiento de colocación de implante(s) dental(es) en la zona {{treatment_zone}}.

Se me ha explicado el objetivo del tratamiento, las etapas necesarias y las alternativas disponibles. Comprendo que el procedimiento puede requerir anestesia local, cirugía, estudios radiográficos o tomográficos y, cuando esté indicado, procedimientos complementarios como regeneración ósea, injertos o elevación de seno maxilar.

Entiendo que pueden presentarse molestias, inflamación, sangrado, infección, alteraciones de sensibilidad, pérdida del implante, pérdida ósea u otras complicaciones. Comprendo además que el éxito y duración del implante dependen de factores biológicos, higiene oral, hábitos, condiciones generales de salud y cumplimiento de los controles indicados.

He tenido la oportunidad de realizar preguntas y mis dudas han sido aclaradas. Acepto voluntariamente la realización del tratamiento.',
  true
),
(
  'DIAGNOSTICO_PERIODONTAL',
  'Consentimiento Informado para Diagnóstico Periodontal',
  'periodoncia_implantes',
  '{}',
  'Autorización para evaluación periodontal clínica, sondaje, fotos y estudios de soporte óseo y gingival.',
  'Yo, {{patient_name}}, portador(a) de la cédula No. {{patient_id}}, autorizo la realización de la evaluación y diagnóstico periodontal necesarios para determinar el estado de salud de mis encías y tejidos de soporte dental.

Comprendo que la evaluación puede incluir sondaje periodontal, medición de profundidad de bolsas, evaluación del sangrado, movilidad dental, recesiones, nivel de inserción clínica, fotografías y estudios radiográficos o tomográficos, cuando sean necesarios.

Entiendo que estos procedimientos son necesarios para establecer un diagnóstico y determinar las opciones de tratamiento más adecuadas para mi condición.

Declaro que he recibido una explicación sobre el procedimiento y he podido realizar las preguntas que considero necesarias.

Acepto voluntariamente la realización de la evaluación periodontal.',
  true
),
(
  'CIRUGIA_PERIODONTAL',
  'Consentimiento Informado para Cirugía Periodontal',
  'periodoncia_implantes',
  '{treatment_zone}',
  'Consentimiento para cirugía de acceso, regeneración periodontal, injertos gingivales o cirugía mucogingival.',
  'Yo, {{patient_name}}, portador(a) de la cédula No. {{patient_id}}, declaro que he sido informado(a) sobre la realización de cirugía periodontal en la zona {{treatment_zone}}, indicada como parte de mi tratamiento.

Se me ha explicado el objetivo del procedimiento y las alternativas disponibles. Comprendo que la cirugía puede incluir procedimientos como cirugía de acceso, tratamiento de defectos periodontales, regeneración periodontal, injertos de encía, cirugía mucogingival u otros procedimientos relacionados, según mi diagnóstico.

Entiendo que pueden presentarse dolor, inflamación, sangrado, sensibilidad dental, recesión gingival, cambios estéticos, infección, cicatrización desfavorable u otras complicaciones. Comprendo que el resultado depende, entre otros factores, de mi respuesta biológica, higiene oral, hábitos y cumplimiento de las indicaciones y controles posteriores.

He tenido la oportunidad de realizar preguntas y mis dudas han sido aclaradas. Acepto voluntariamente la realización del procedimiento.',
  true
),
(
  'RASPADO_ALISADO_RADICULAR',
  'Consentimiento Informado para Raspado y Alisado Radicular',
  'periodoncia_implantes',
  '{treatment_zone}',
  'Autorización para raspado y alisado radicular periodontal en zonas específicas para remoción subgingival de cálculo.',
  'Yo, {{patient_name}}, portador(a) de la cédula No. {{patient_id}}, autorizo la realización de raspado y alisado radicular en las zonas {{treatment_zone}}, como parte del tratamiento indicado para controlar la enfermedad periodontal.

Comprendo que el procedimiento busca eliminar cálculo y depósitos bacterianos de las superficies dentales y radiculares.

Se me ha informado que pueden presentarse sensibilidad dental, sangrado, molestias, inflamación y cambios en la apariencia de las encías, incluyendo la evidencia de recesiones que pudieran estar previamente ocultas por la inflamación.

Comprendo que pueden ser necesarios varios controles y que el resultado depende también de mi higiene oral y cumplimiento del mantenimiento periodontal.

Declaro que mis dudas han sido aclaradas y acepto voluntariamente el tratamiento.',
  true
),

-- GRUPO 3: ESTÉTICA & ORTODONCIA
(
  'ORTODONCIA',
  'Consentimiento Informado para Tratamiento de Ortodoncia',
  'estetica_ortodoncia',
  '{}',
  'Consentimiento para colocación de aparatología ortodóncica, brackets, alineadores y controles periódicos.',
  'Yo, {{patient_name}}, portador(a) de la cédula No. {{patient_id}}, acepto iniciar tratamiento de ortodoncia, luego de haber recibido información sobre su objetivo, duración aproximada, alternativas y cuidados necesarios.

Comprendo que el tratamiento puede incluir colocación de brackets, tubos, arcos, elásticos u otros dispositivos, y que el resultado depende también de mi colaboración, higiene oral y asistencia a los controles.

Entiendo que pueden presentarse molestias, sensibilidad, inflamación gingival, caries, manchas en los dientes, reabsorción radicular, alteraciones periodontales o cambios en el resultado esperado.

Declaro que mis dudas han sido aclaradas y acepto voluntariamente el tratamiento de ortodoncia.',
  true
),
(
  'BLANQUEAMIENTO_DENTAL',
  'Consentimiento Informado para Blanqueamiento Dental',
  'estetica_ortodoncia',
  '{}',
  'Autorización para blanqueamiento dental profesional, indicaciones sobre sensibilidad y estabilidad de restauraciones.',
  'Yo, {{patient_name}}, portador(a) de la cédula No. {{patient_id}}, autorizo la realización de blanqueamiento dental, habiendo recibido información sobre el procedimiento, sus beneficios, limitaciones y cuidados posteriores.

Comprendo que pueden presentarse sensibilidad dental, irritación gingival o molestias temporales, y que el grado de aclaramiento puede variar según las características de cada paciente.

Entiendo que restauraciones, coronas, carillas u otros materiales dentales no cambian de color con el blanqueamiento, por lo que podrían requerir reemplazo si se busca uniformidad de color.

Declaro que mis dudas han sido aclaradas y acepto voluntariamente el procedimiento.',
  true
),
(
  'ESTETICA_DENTAL',
  'Consentimiento Informado para Tratamiento de Estética Dental',
  'estetica_ortodoncia',
  '{}',
  'Tratamiento restaurador o estético de forma, color, armonía dental, carillas y resinas de diseño.',
  'Yo, {{patient_name}}, portador(a) de la cédula No. {{patient_id}}, autorizo la realización del tratamiento de estética dental previamente explicado, destinado a mejorar la apariencia, forma, color, posición o armonía de mis dientes.

Comprendo que el tratamiento puede incluir procedimientos restauradores o estéticos según mi diagnóstico y plan de tratamiento.

Se me han explicado las alternativas disponibles y entiendo que el resultado final puede variar según las características de mis dientes, tejidos, mordida y respuesta individual.

Comprendo que algunos procedimientos pueden requerir mantenimiento, retoques o reemplazo con el tiempo.

Declaro que mis dudas han sido aclaradas y acepto voluntariamente el tratamiento propuesto.',
  true
),

-- GRUPO 4: ENDODONCIA & PREVENCIÓN
(
  'ENDODONCIA',
  'Consentimiento Informado para Tratamiento de Endodoncia',
  'endodoncia_prevencion',
  '{tooth_number}',
  'Tratamiento de conductos radiculares para preservación del órgano dental en pieza específica.',
  'Yo, {{patient_name}}, portador(a) de la cédula No. {{patient_id}}, autorizo la realización del tratamiento de endodoncia en el diente No. {{tooth_number}}, luego de haber recibido información sobre el procedimiento y su finalidad.

Comprendo que el tratamiento tiene como objetivo eliminar el tejido pulpar afectado y conservar el diente cuando sea posible.

Entiendo que pueden presentarse dolor, sensibilidad, inflamación, infección, fractura del diente, persistencia de la lesión o necesidad de retratamiento u otro procedimiento.

Comprendo que, después de la endodoncia, el diente puede requerir una restauración definitiva para protegerlo.

Declaro que mis dudas han sido aclaradas y acepto voluntariamente el tratamiento.',
  true
),
(
  'PROFILAXIS_LIMPIEZA',
  'Consentimiento Informado para Profilaxis y Limpieza Dental',
  'endodoncia_prevencion',
  '{}',
  'Profilaxis y limpieza profesional para remoción de placa y manchas, diferenciado de terapia periodontal.',
  'Yo, {{patient_name}}, portador(a) de la cédula No. {{patient_id}}, autorizo la realización de profilaxis y limpieza dental profesional, con el objetivo de eliminar placa bacteriana, manchas y depósitos superficiales, contribuyendo al mantenimiento de la salud oral.

Comprendo que durante el procedimiento puedo presentar sensibilidad dental, ligero sangrado o molestias temporales, especialmente si existe inflamación de las encías.

Entiendo que este procedimiento no sustituye el tratamiento periodontal cuando existe enfermedad periodontal.

Declaro que he recibido la información necesaria y acepto voluntariamente el procedimiento.',
  true
)
ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  required_fields = EXCLUDED.required_fields,
  description = EXCLUDED.description,
  template_content = EXCLUDED.template_content,
  is_active = true,
  updated_at = now();

# Requirements Document

## Introduction

Este documento define los requisitos funcionales y no funcionales del Sistema de Gestión de Práctica Dental para la Dra. Garcia (Periodoncia e Implantes). El sistema migra el sitio web estático existente a una arquitectura full-stack moderna (React + Vite + Supabase) e incorpora un panel administrativo completo para la gestión de citas, historiales médicos, procedimientos, precios y operaciones multi-clínica.

El sistema sirve a tres tipos de usuarios: pacientes (acceso público al sitio web), y personal clínico con roles diferenciados (admin, doctor, recepcionista) que acceden al panel administrativo.

---

## Glossary

- **Sistema**: La aplicación web completa (sitio público + panel administrativo).
- **Sitio_Público**: La parte del sistema accesible sin autenticación, que incluye la presentación de la práctica y el formulario de reserva.
- **Panel_Admin**: La parte del sistema protegida por autenticación para gestión clínica interna.
- **Auth_Service**: El servicio de autenticación y autorización basado en Supabase Auth con JWT.
- **DB**: La base de datos PostgreSQL gestionada por Supabase con políticas RLS activas.
- **Storage**: El servicio de almacenamiento de archivos de Supabase para documentos e imágenes.
- **Edge_Functions**: Las funciones serverless de Supabase que ejecutan lógica de negocio como el envío de notificaciones.
- **Appointment_Module**: El módulo del Panel_Admin para gestión de citas con calendario.
- **Patient_Module**: El módulo del Panel_Admin para gestión de pacientes.
- **MedicalRecord_Module**: El módulo del Panel_Admin para gestión de historiales médicos.
- **Procedure_Module**: El módulo del Panel_Admin para el catálogo de procedimientos.
- **Pricing_Module**: El módulo del Panel_Admin para gestión de precios con historial.
- **Clinic_Module**: El módulo del Panel_Admin para gestión de sedes con mapa interactivo.
- **Analytics_Module**: El módulo del Panel_Admin para métricas y dashboard.
- **Notification_Service**: El servicio de envío de notificaciones vía WhatsApp y correo electrónico.
- **Availability_Checker**: La función que verifica la disponibilidad de slots de tiempo en una clínica.
- **Workload_Calculator**: La función que calcula la carga de trabajo por clínica para una fecha dada.
- **Followup_Alert_Generator**: La función que identifica procedimientos con seguimiento vencido o próximo.
- **RLS**: Row-Level Security — políticas de seguridad a nivel de fila en PostgreSQL.
- **Admin**: Usuario con rol de administrador; tiene acceso completo a todos los módulos y clínicas.
- **Doctor**: Usuario con rol de médico; accede a datos de su clínica asignada.
- **Recepcionista**: Usuario con rol de recepcionista; accede a datos de su clínica asignada.
- **Paciente**: Persona que solicita o recibe atención dental; puede interactuar con el Sitio_Público.

---

## Requirements

### Requirement 1: Sitio Público — Presentación y Navegación

**User Story:** Como paciente, quiero navegar por el sitio web de la Dra. Garcia, para conocer sus servicios, especialidades y datos de contacto antes de solicitar una cita.

#### Acceptance Criteria

1. THE Sitio_Público SHALL renderizar las secciones: Navbar, HeroSection, AboutSection, ServicesSection, BeforeAfterSlider, AppointmentForm y Footer en una única página de inicio.
2. THE Navbar SHALL permanecer visible (sticky) durante el desplazamiento vertical de la página.
3. THE Navbar SHALL incluir un botón "Reservar Cita" que desplace la vista al AppointmentForm.
4. THE Sitio_Público SHALL preservar la identidad visual existente utilizando la paleta de colores cream/gold/navy y las tipografías Alex Brush, Montserrat y Playfair Display.
5. THE ServicesSection SHALL mostrar exactamente 6 tarjetas de especialización.
6. THE BeforeAfterSlider SHALL permitir al usuario deslizar interactivamente entre la imagen "antes" y la imagen "después".
7. THE WhatsAppButton SHALL mostrarse como un botón flotante en todas las páginas del Sitio_Público y SHALL abrir una conversación de WhatsApp al ser pulsado.

---

### Requirement 2: Formulario de Reserva Pública

**User Story:** Como paciente, quiero solicitar una cita desde el sitio web sin necesidad de crear una cuenta, para agendar una consulta de forma rápida y sencilla.

#### Acceptance Criteria

1. THE AppointmentForm SHALL recopilar los campos: nombre completo, teléfono, servicio de interés, fecha preferida, franja horaria preferida (mañana/tarde) y clínica preferida (opcional).
2. WHEN un paciente envía el AppointmentForm con todos los campos requeridos válidos, THE Sistema SHALL crear un registro de cita en la DB con estado `pending`.
3. WHEN un paciente envía el AppointmentForm, THE Sistema SHALL retornar una confirmación visual al paciente indicando que su solicitud fue recibida.
4. IF un paciente intenta enviar el AppointmentForm con campos requeridos vacíos o inválidos, THEN THE AppointmentForm SHALL mostrar mensajes de error descriptivos por campo y SHALL prevenir el envío.
5. WHEN se crea una cita con estado `pending` desde el AppointmentForm, THE Notification_Service SHALL enviar una notificación al administrador vía WhatsApp y correo electrónico.
6. THE AppointmentForm SHALL utilizar la clave anónima de Supabase y SHALL estar restringido por RLS a solo permitir operaciones INSERT en la tabla de citas con estado `pending`.

---

### Requirement 3: Autenticación y Control de Acceso

**User Story:** Como miembro del personal clínico, quiero iniciar sesión de forma segura en el panel administrativo, para acceder a las funciones de gestión según mi rol.

#### Acceptance Criteria

1. THE Auth_Service SHALL autenticar usuarios mediante correo electrónico y contraseña utilizando JWT.
2. WHEN un usuario proporciona credenciales válidas, THE Auth_Service SHALL emitir un token de acceso con expiración de 1 hora y un refresh token con expiración de 7 días.
3. IF un usuario proporciona credenciales inválidas, THEN THE Auth_Service SHALL rechazar el acceso y SHALL mostrar un mensaje de error sin revelar si el correo o la contraseña son incorrectos.
4. WHILE un usuario tiene una sesión activa en el Panel_Admin, THE Auth_Service SHALL renovar automáticamente el token de acceso antes de su expiración utilizando el refresh token.
5. WHEN el token JWT de un usuario expira durante una sesión activa, THE Panel_Admin SHALL redirigir al usuario a la página de inicio de sesión y SHALL restaurar la última ruta visitada tras el re-login exitoso.
6. WHEN un usuario cierra sesión, THE Auth_Service SHALL invalidar el token de acceso y el refresh token.
7. THE DB SHALL aplicar políticas RLS en todas las tablas para que los usuarios con rol `doctor` o `recepcionista` solo puedan leer y modificar datos de su clínica asignada.
8. THE DB SHALL aplicar políticas RLS para que los usuarios con rol `admin` tengan acceso completo a todos los datos de todas las clínicas.
9. THE Panel_Admin SHALL proteger todas sus rutas mediante un guard de autenticación que redirige al login si no hay sesión activa.

---

### Requirement 4: Gestión de Citas (Panel Admin)

**User Story:** Como recepcionista o administrador, quiero gestionar las citas del consultorio desde un calendario interactivo, para confirmar, reprogramar o cancelar citas de manera eficiente.

#### Acceptance Criteria

1. THE Appointment_Module SHALL mostrar las citas en un calendario con vistas de mes, semana, día y agenda.
2. THE Appointment_Module SHALL colorear cada evento del calendario según el estado de la cita (`pending`, `confirmed`, `in_progress`, `completed`, `cancelled`, `rescheduled`).
3. WHEN un usuario hace clic en un slot vacío del calendario, THE Appointment_Module SHALL abrir un formulario para crear una nueva cita.
4. WHEN un usuario hace clic en un evento del calendario, THE Appointment_Module SHALL mostrar los detalles de la cita y opciones para confirmar, reprogramar o cancelar.
5. WHEN un usuario confirma una cita con estado `pending`, THE Sistema SHALL actualizar el estado a `confirmed` en la DB y SHALL notificar al paciente vía WhatsApp y correo electrónico.
6. WHEN un usuario reprograma una cita, THE Sistema SHALL actualizar el estado a `rescheduled`, SHALL registrar la nueva fecha/hora y SHALL notificar al paciente.
7. WHEN un usuario cancela una cita, THE Sistema SHALL actualizar el estado a `cancelled` y SHALL notificar al paciente.
8. WHEN se intenta crear una cita en un slot de tiempo ya ocupado en la misma clínica, THE Availability_Checker SHALL detectar el conflicto y THE Sistema SHALL retornar un error HTTP 409 con el horario disponible más próximo.
9. THE Appointment_Module SHALL permitir filtrar las citas por clínica, estado y rango de fechas.
10. WHEN se crea o actualiza una cita, THE Notification_Service SHALL enviar la notificación correspondiente al paciente.

---

### Requirement 5: Verificación de Disponibilidad de Slots

**User Story:** Como sistema, quiero verificar la disponibilidad de horarios antes de confirmar una cita, para evitar conflictos de agenda en cada clínica.

#### Acceptance Criteria

1. WHEN se invoca el Availability_Checker con un `clinicId`, `scheduledAt` y `durationMinutes` válidos, THE Availability_Checker SHALL retornar `true` si y solo si no existe ninguna cita con estado `confirmed` o `in_progress` en esa clínica que se solape con el intervalo `[scheduledAt, scheduledAt + durationMinutes]`.
2. THE Availability_Checker SHALL considerar solapamiento cuando el inicio de una cita existente es anterior al fin de la nueva cita Y el fin de la cita existente es posterior al inicio de la nueva cita.
3. THE Availability_Checker SHALL retornar `false` cuando dos citas comparten exactamente el mismo horario de inicio.
4. THE Availability_Checker SHALL ignorar citas con estado `cancelled` o `rescheduled` al calcular disponibilidad.
5. IF `scheduledAt` es una fecha en el pasado, THEN THE Availability_Checker SHALL rechazar la solicitud con un error de validación.
6. IF `durationMinutes` es menor o igual a cero, THEN THE Availability_Checker SHALL rechazar la solicitud con un error de validación.

---

### Requirement 6: Gestión de Pacientes

**User Story:** Como recepcionista o administrador, quiero gestionar el registro de pacientes, para mantener un directorio actualizado con su información de contacto y alertas médicas.

#### Acceptance Criteria

1. THE Patient_Module SHALL permitir crear, leer, actualizar y eliminar registros de pacientes.
2. WHEN se crea un paciente, THE Sistema SHALL requerir al menos: nombre completo y teléfono.
3. THE Patient_Module SHALL permitir buscar pacientes por nombre, teléfono o correo electrónico.
4. WHEN se busca un paciente, THE Patient_Module SHALL retornar todos los pacientes cuyo nombre, teléfono o correo contengan el término de búsqueda (búsqueda parcial, insensible a mayúsculas).
5. THE Patient_Module SHALL mostrar en el perfil de cada paciente: sus citas, historial médico y seguimiento de procedimientos activos.
6. IF se intenta registrar un paciente con un correo electrónico ya existente en la DB, THEN THE Sistema SHALL rechazar la operación con un mensaje de error indicando que el correo ya está registrado.
7. WHILE un usuario tiene rol `doctor` o `recepcionista`, THE DB SHALL aplicar RLS para que solo pueda acceder a pacientes con citas en su clínica asignada.

---

### Requirement 7: Gestión de Historiales Médicos

**User Story:** Como doctor o administrador, quiero registrar y consultar el historial médico de cada paciente, para documentar diagnósticos, planes de tratamiento y adjuntar documentos clínicos.

#### Acceptance Criteria

1. THE MedicalRecord_Module SHALL permitir crear registros médicos con los campos: motivo de consulta (requerido), diagnóstico, plan de tratamiento, notas y fecha del registro.
2. WHEN se crea un historial médico, THE Sistema SHALL asociarlo al paciente correspondiente y opcionalmente a una cita existente.
3. THE MedicalRecord_Module SHALL mostrar los registros de un paciente en orden cronológico descendente.
4. THE MedicalRecord_Module SHALL permitir adjuntar documentos (imágenes, PDFs, radiografías) a cada registro médico.
5. WHEN un usuario sube un documento, THE Sistema SHALL validar que el archivo no supere 50 MB y que sea de un tipo permitido antes de intentar el upload al Storage.
6. IF un archivo supera el límite de tamaño o tiene un tipo no permitido, THEN THE Sistema SHALL mostrar un mensaje de error con los tipos y tamaños permitidos y SHALL guardar el registro médico sin el documento.
7. WHEN un documento es subido exitosamente al Storage, THE Sistema SHALL almacenar la URL firmada con expiración de 1 hora para su descarga.
8. WHEN un usuario solicita descargar un documento, THE Storage SHALL generar una URL firmada válida para ese documento.
9. THE Storage SHALL utilizar buckets privados para todos los documentos médicos, de modo que solo usuarios autenticados puedan acceder a ellos.
10. THE MedicalRecord_Module SHALL permitir eliminar documentos adjuntos de un registro médico.

---

### Requirement 8: Gestión de Procedimientos

**User Story:** Como administrador, quiero mantener un catálogo de procedimientos dentales, para estandarizar los servicios ofrecidos y facilitar su asignación a citas y seguimientos.

#### Acceptance Criteria

1. THE Procedure_Module SHALL permitir crear, leer, actualizar y desactivar procedimientos del catálogo.
2. WHEN se crea un procedimiento, THE Sistema SHALL requerir: nombre, categoría y duración en minutos.
3. THE Procedure_Module SHALL permitir activar y desactivar procedimientos sin eliminarlos de la DB.
4. WHILE un procedimiento está desactivado, THE Sistema SHALL excluirlo de los selectores de procedimientos en el formulario de citas y en el formulario de reserva pública.
5. THE Procedure_Module SHALL mostrar el precio vigente de cada procedimiento junto a su información.
6. THE Procedure_Module SHALL permitir registrar el seguimiento de procedimientos multi-sesión por paciente, incluyendo: estado, fecha de inicio, fecha esperada de fin, notas de progreso y fecha del próximo seguimiento.

---

### Requirement 9: Gestión de Precios

**User Story:** Como administrador, quiero gestionar los precios de los procedimientos con un historial de cambios, para mantener transparencia en las actualizaciones de tarifas.

#### Acceptance Criteria

1. THE Pricing_Module SHALL mostrar una tabla con el precio vigente de cada procedimiento activo.
2. WHEN un administrador actualiza el precio de un procedimiento, THE Sistema SHALL crear un nuevo registro en `procedure_prices` con la fecha de vigencia, el precio anterior queda registrado con su `effective_to` actualizado.
3. THE Pricing_Module SHALL mostrar el historial completo de cambios de precio para cada procedimiento, incluyendo: precio, moneda, fecha de vigencia, usuario que realizó el cambio y motivo del cambio.
4. IF se intenta registrar un precio con un rango de fechas que se solapa con un precio existente para el mismo procedimiento, THEN THE DB SHALL rechazar la operación mediante la constraint `no_overlapping_prices`.
5. WHEN se actualiza un precio, THE Sistema SHALL requerir un motivo de cambio.
6. THE Pricing_Module SHALL soportar múltiples monedas, con DOP como moneda predeterminada.

---

### Requirement 10: Gestión de Clínicas y Mapa Interactivo

**User Story:** Como administrador, quiero gestionar las sedes clínicas y visualizarlas en un mapa interactivo, para monitorear la distribución geográfica y la carga de trabajo de cada sede.

#### Acceptance Criteria

1. THE Clinic_Module SHALL mostrar todas las sedes activas en un mapa interactivo renderizado con Leaflet.js.
2. THE Clinic_Module SHALL mostrar un marcador por cada sede activa en el mapa, posicionado según sus coordenadas de latitud y longitud.
3. THE Clinic_Module SHALL colorear cada marcador según la carga de trabajo de la sede: verde para 0–50%, amarillo para 51–80% y rojo para 81–100%.
4. WHEN un usuario hace clic en un marcador del mapa, THE Clinic_Module SHALL mostrar el nombre de la clínica, su dirección, teléfono y carga de trabajo actual.
5. THE Clinic_Module SHALL permitir filtrar las citas del Appointment_Module por la clínica seleccionada en el mapa.
6. THE Clinic_Module SHALL permitir reasignar una cita de una sede a otra.
7. IF una clínica tiene coordenadas nulas o fuera de rango válido, THEN THE Clinic_Module SHALL omitir su marcador del mapa y SHALL mostrar un banner indicando que la clínica necesita actualizar su ubicación.
8. THE Clinic_Module SHALL permitir crear, actualizar y desactivar sedes clínicas.
9. WHILE una sede está desactivada, THE Sistema SHALL excluirla del mapa y de los selectores de clínica en formularios.

---

### Requirement 11: Cálculo de Carga de Trabajo por Clínica

**User Story:** Como administrador, quiero ver la carga de trabajo de cada clínica para una fecha dada, para tomar decisiones informadas sobre la distribución de citas.

#### Acceptance Criteria

1. WHEN se invoca el Workload_Calculator con una fecha válida, THE Workload_Calculator SHALL retornar un `ClinicWorkload` por cada clínica activa con: total de citas, citas pendientes, citas confirmadas/en progreso y porcentaje de capacidad.
2. THE Workload_Calculator SHALL calcular `capacity_percentage` como `(citas_confirmadas + citas_en_progreso) / capacidad_diaria * 100`, redondeado al entero más cercano.
3. THE Workload_Calculator SHALL limitar `capacity_percentage` al rango `[0, 100]` (clamped), nunca retornando un valor negativo ni superior a 100.
4. THE Workload_Calculator SHALL contar únicamente las citas cuyo `scheduled_at` esté dentro del día completo de la fecha proporcionada (00:00:00 a 23:59:59 UTC).

---

### Requirement 12: Seguimiento de Procedimientos y Alertas

**User Story:** Como doctor o administrador, quiero recibir alertas sobre procedimientos con seguimiento próximo o vencido, para garantizar la continuidad del tratamiento de los pacientes.

#### Acceptance Criteria

1. THE Followup_Alert_Generator SHALL identificar todos los registros de `procedure_tracking` donde `next_followup_date` sea menor o igual a `(hoy + N días)`, el estado no sea `completed` ni `cancelled`, y `alert_sent` sea `false`.
2. WHEN el Followup_Alert_Generator identifica registros de seguimiento pendientes, THE Sistema SHALL marcar `alert_sent = true` en esos registros para evitar alertas duplicadas.
3. THE Analytics_Module SHALL mostrar en el dashboard los procedimientos con seguimiento vencido (resaltados en rojo) y los que vencen en los próximos 3 días (resaltados en amarillo).
4. WHEN un procedimiento tiene `next_followup_date` vencida, THE Notification_Service SHALL enviar una alerta al doctor o administrador responsable.
5. THE Procedure_Module SHALL mostrar una línea de tiempo visual del progreso de cada procedimiento en seguimiento.

---

### Requirement 13: Dashboard y Analíticas

**User Story:** Como administrador, quiero ver un dashboard con métricas clave de la práctica, para tener una visión general del estado operativo del consultorio.

#### Acceptance Criteria

1. THE Analytics_Module SHALL mostrar en el dashboard las siguientes métricas del día actual: total de citas, citas pendientes de confirmación, procedimientos activos y seguimientos próximos.
2. THE Analytics_Module SHALL mostrar la carga de trabajo por clínica en el dashboard, incluyendo el porcentaje de capacidad de cada sede.
3. THE Analytics_Module SHALL mostrar un gráfico de citas por período (día, semana, mes).
4. THE Analytics_Module SHALL mostrar un panel de alertas con los procedimientos que requieren seguimiento inmediato.
5. WHEN un administrador accede al Panel_Admin, THE Sistema SHALL mostrar el dashboard como página de inicio.

---

### Requirement 14: Notificaciones

**User Story:** Como administrador o paciente, quiero recibir notificaciones automáticas sobre el estado de las citas, para estar informado sin necesidad de consultar el sistema manualmente.

#### Acceptance Criteria

1. WHEN se crea una cita con estado `pending` desde el formulario público, THE Notification_Service SHALL enviar una notificación al administrador vía WhatsApp y correo electrónico con los datos de la solicitud.
2. WHEN una cita es confirmada por el personal clínico, THE Notification_Service SHALL enviar una notificación de confirmación al paciente vía WhatsApp y correo electrónico.
3. WHEN una cita es reprogramada, THE Notification_Service SHALL enviar una notificación al paciente con la nueva fecha y hora.
4. WHEN una cita es cancelada, THE Notification_Service SHALL enviar una notificación al paciente indicando la cancelación.
5. THE Notification_Service SHALL ser implementado como Edge_Functions de Supabase.
6. IF el envío de una notificación falla, THEN THE Sistema SHALL registrar el error en los logs y SHALL continuar la operación principal sin interrumpirla.

---

### Requirement 15: Validación de Datos y Manejo de Errores

**User Story:** Como usuario del sistema, quiero que el sistema valide los datos de entrada y maneje los errores de forma clara, para evitar datos incorrectos y entender qué salió mal cuando ocurre un problema.

#### Acceptance Criteria

1. THE Sistema SHALL validar todos los datos de entrada en el cliente utilizando esquemas Zod antes de enviarlos a la DB.
2. THE DB SHALL aplicar constraints de integridad referencial y de dominio en todas las tablas para garantizar la consistencia de los datos.
3. IF se intenta crear una cita en un slot ya ocupado, THEN THE Sistema SHALL retornar HTTP 409 con un mensaje descriptivo indicando el horario disponible más próximo y SHALL mostrar un selector de horarios alternativos en el frontend.
4. IF una operación de escritura en la DB falla por violación de RLS, THEN THE Sistema SHALL retornar HTTP 403 al cliente.
5. THE Panel_Admin SHALL interceptar errores HTTP 401 de Supabase y SHALL redirigir al usuario al login preservando la ruta actual.
6. THE Sistema SHALL mostrar mensajes de error descriptivos al usuario para todos los errores de validación, sin exponer detalles internos de la base de datos o del servidor.

---

### Requirement 16: Rendimiento y Paginación

**User Story:** Como usuario del panel administrativo, quiero que las listas de datos carguen rápidamente incluso con grandes volúmenes de información, para trabajar de forma fluida sin esperas.

#### Acceptance Criteria

1. THE Panel_Admin SHALL implementar paginación cursor-based en todas las listas (pacientes, citas, historiales, procedimientos) utilizando el método `.range()` de Supabase.
2. THE Sistema SHALL utilizar TanStack Query para cachear los datos del servidor con un `staleTime` de 5 minutos para listas de procedimientos y clínicas.
3. THE Clinic_Module SHALL renderizar los marcadores del mapa con `useMemo` para evitar re-renders innecesarios al filtrar citas.
4. THE Storage SHALL generar URLs firmadas para documentos con una expiración de 1 hora.
5. THE DB SHALL mantener índices en las columnas: `appointments.scheduled_at`, `appointments.clinic_id`, `appointments.status` y `procedure_tracking.next_followup_date` para optimizar las consultas más frecuentes.

---

### Requirement 17: Seguridad de Datos Médicos

**User Story:** Como administrador del sistema, quiero que los datos médicos de los pacientes estén protegidos con controles de acceso estrictos, para cumplir con los estándares de privacidad y confidencialidad médica.

#### Acceptance Criteria

1. THE DB SHALL habilitar RLS en todas las tablas que contienen datos clínicos: `patients`, `appointments`, `medical_records`, `record_documents`, `procedures`, `procedure_prices` y `procedure_tracking`.
2. THE Storage SHALL utilizar buckets privados para todos los documentos médicos, de modo que no sean accesibles mediante URLs públicas.
3. WHILE un usuario no está autenticado, THE DB SHALL denegar el acceso a los historiales médicos y documentos de pacientes.
4. THE Sistema SHALL configurar CORS en Supabase para permitir solicitudes únicamente desde el dominio de producción autorizado.
5. THE Auth_Service SHALL utilizar tokens de acceso JWT con expiración de 1 hora para minimizar el riesgo de tokens comprometidos.
6. THE Sistema SHALL validar el tipo y tamaño de los archivos antes de subirlos al Storage para prevenir la carga de archivos maliciosos.

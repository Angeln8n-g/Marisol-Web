# Implementation Plan: Sistema de Gestión de Práctica Dental (Dra. Garcia)

## Overview

Implementación full-stack del sistema de gestión de práctica dental migrando el sitio estático a React + Vite + TypeScript + TailwindCSS en el frontend y Supabase (PostgreSQL + Auth + Storage + Edge Functions + RLS) en el backend. El plan cubre el sitio público, el panel administrativo completo, los módulos de citas, pacientes, historiales médicos, procedimientos, precios, clínicas con mapa Leaflet, analíticas, notificaciones y tests de propiedades con fast-check.

---

## Tasks

- [ ] 1. Configuración del proyecto y estructura base
  - [x] 1.1 Inicializar proyecto Vite + React + TypeScript con TailwindCSS y dependencias principales
    - Crear proyecto con `npm create vite@latest` usando template `react-ts`
    - Instalar y configurar TailwindCSS v3 con `tailwind.config.ts`
    - Instalar dependencias: `@supabase/supabase-js`, `react-router-dom`, `@tanstack/react-query`, `zustand`, `zod`, `react-hook-form`, `@hookform/resolvers`, `date-fns`, `react-big-calendar`, `leaflet`, `react-leaflet`, `vitest`, `fast-check`, `@testing-library/react`
    - Crear `vite.config.ts` con alias de rutas (`@/` → `src/`)
    - Crear `tsconfig.json` con `strict: true` y path aliases
    - Crear `.env.local` con variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
    - Crear estructura de carpetas: `src/components/public`, `src/components/admin`, `src/components/ui`, `src/hooks`, `src/lib`, `src/pages`, `src/routes`, `src/store`, `src/types`, `supabase/migrations`, `supabase/functions`
    - _Requirements: 1.1, 16.2_

  - [ ] 1.2 Crear tipos TypeScript globales y cliente Supabase
    - Crear `src/types/index.ts` con todas las interfaces y tipos del diseño: `Clinic`, `Patient`, `Procedure`, `ProcedurePrice`, `Appointment`, `MedicalRecord`, `RecordDocument`, `ProcedureTracking`, `User`, DTOs y tipos de UI (`ClinicWorkload`, `DashboardStats`, `CalendarEvent`)
    - Crear `src/lib/supabase.ts` con el cliente tipado `createClient<Database>`
    - Crear `src/lib/utils.ts` con utilidades generales (formateo de fechas, colores por estado de cita, etc.)
    - _Requirements: 1.4, 15.1_

  - [ ] 1.3 Configurar enrutamiento principal y stores de Zustand
    - Crear `src/store/authStore.ts` con estado de sesión y usuario
    - Crear `src/store/appointmentStore.ts` con filtros activos de citas
    - Crear `src/store/clinicStore.ts` con clínica seleccionada en mapa
    - Crear `src/routes/ProtectedRoute.tsx` que redirige al login si no hay sesión JWT válida
    - Crear `src/routes/PublicRoutes.tsx` y `src/routes/AdminRoutes.tsx`
    - Crear `src/App.tsx` con `QueryClientProvider`, `BrowserRouter` y configuración de rutas
    - _Requirements: 3.9, 5.5_

- [ ] 2. Migraciones de base de datos y políticas RLS
  - [x] 2.1 Crear migraciones SQL para todas las tablas
    - Crear `supabase/migrations/001_create_clinics.sql`
    - Crear `supabase/migrations/002_create_patients.sql`
    - Crear `supabase/migrations/003_create_procedures.sql` (incluye `procedure_prices` con constraint `no_overlapping_prices` usando `btree_gist`)
    - Crear `supabase/migrations/004_create_appointments.sql` con índices en `scheduled_at`, `patient_id`, `clinic_id`, `status`
    - Crear `supabase/migrations/005_create_medical_records.sql` (incluye `record_documents`)
    - Crear `supabase/migrations/006_create_procedure_tracking.sql` con índice en `next_followup_date`
    - _Requirements: 2.2, 9.4, 16.5_

  - [ ] 2.2 Crear políticas RLS y funciones auxiliares de seguridad
    - Crear `supabase/migrations/007_rls_policies.sql`
    - Habilitar RLS en todas las tablas clínicas
    - Crear funciones `get_user_role()` y `get_user_clinic_id()` con `SECURITY DEFINER`
    - Implementar políticas: lectura pública para `clinics` y `procedures`, acceso autenticado para `patients` y `medical_records`, acceso por clínica para `doctor`/`receptionist`, acceso total para `admin`
    - _Requirements: 3.7, 3.8, 6.7, 17.1, 17.2, 17.3_

- [ ] 3. Componentes UI reutilizables
  - [ ] 3.1 Implementar componentes UI base
    - Crear `src/components/ui/Button.tsx` con variantes (primary, secondary, danger, ghost) y estados (loading, disabled)
    - Crear `src/components/ui/Input.tsx` con soporte para mensajes de error y labels
    - Crear `src/components/ui/Modal.tsx` con overlay, cierre por Escape y trap de foco
    - Crear `src/components/ui/Badge.tsx` con variantes de color por estado de cita
    - Crear `src/components/ui/Table.tsx` con soporte para paginación cursor-based
    - _Requirements: 1.4, 15.6_

- [ ] 4. Sitio público — Migración del HTML existente
  - [ ] 4.1 Implementar Navbar y estructura de página pública
    - Crear `src/components/public/Navbar.tsx` sticky con logo firma (Alex Brush), links de navegación y botón "Reservar Cita" que hace scroll al AppointmentForm
    - Crear `src/pages/public/HomePage.tsx` que compone todas las secciones
    - Aplicar paleta cream/gold/navy y tipografías Alex Brush, Montserrat, Playfair Display en `src/index.css` y `tailwind.config.ts`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 4.2 Implementar HeroSection, AboutSection y ServicesSection
    - Crear `src/components/public/HeroSection.tsx` con arco clínico y foto de la doctora
    - Crear `src/components/public/AboutSection.tsx` con filosofía de la Dra. Garcia
    - Crear `src/components/public/ServicesSection.tsx` con exactamente 6 tarjetas de especialización
    - _Requirements: 1.1, 1.5_

  - [ ] 4.3 Implementar BeforeAfterSlider, Footer y WhatsAppButton
    - Crear `src/components/public/BeforeAfterSlider.tsx` con deslizador interactivo drag-to-reveal
    - Crear `src/components/public/Footer.tsx` con datos de contacto y redes sociales
    - Crear `src/components/public/WhatsAppButton.tsx` como botón flotante fijo que abre conversación de WhatsApp
    - _Requirements: 1.1, 1.6, 1.7_

  - [ ] 4.4 Implementar AppointmentForm público con validación Zod y conexión a Supabase
    - Crear `src/components/public/AppointmentForm.tsx` con campos: nombre completo, teléfono, servicio, fecha preferida, franja horaria (mañana/tarde), clínica preferida (opcional)
    - Integrar `react-hook-form` + `zod` para validación de campos requeridos con mensajes de error por campo
    - Conectar con Supabase usando clave `anon` para INSERT en `appointments` con `status: 'pending'`
    - Mostrar confirmación visual tras envío exitoso
    - Filtrar solo procedimientos con `is_active = true` en el selector de servicios
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 8.4_

  - [ ] 4.5 Escribir property test para validación del formulario público
    - **Property 1: Formulario público rechaza entradas inválidas**
    - **Validates: Requirements 2.4**
    - **Property 2: Creación de cita pública genera estado pending**
    - **Validates: Requirements 2.2**

- [ ] 5. Autenticación y guard de rutas
  - [ ] 5.1 Implementar LoginPage y hook useAuth
    - Crear `src/pages/admin/LoginPage.tsx` con formulario email/contraseña, validación Zod y manejo de errores sin revelar si email o contraseña son incorrectos
    - Crear `src/hooks/useAuth.ts` con `signIn`, `signOut`, gestión de sesión JWT, renovación automática de token y redirección post-login preservando la ruta original
    - Actualizar `src/store/authStore.ts` para persistir sesión y usuario
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ] 5.2 Escribir property test para autenticación
    - **Property 3: Credenciales inválidas son rechazadas**
    - **Validates: Requirements 3.3**
    - **Property 5: Rutas del panel admin requieren autenticación**
    - **Validates: Requirements 3.9**

- [ ] 6. Layout del panel administrativo
  - [ ] 6.1 Implementar AdminLayout, Sidebar y TopBar
    - Crear `src/components/admin/layout/Sidebar.tsx` con links a todos los módulos del panel, indicador de módulo activo y colapso en mobile
    - Crear `src/components/admin/layout/TopBar.tsx` con nombre del usuario, rol, clínica asignada y botón de cierre de sesión
    - Crear `src/components/admin/layout/AdminLayout.tsx` que compone Sidebar + TopBar + área de contenido principal
    - Crear `src/pages/admin/DashboardPage.tsx` como página de inicio del panel
    - _Requirements: 13.5_

- [ ] 7. Checkpoint — Verificar estructura base y autenticación
  - Asegurarse de que todos los tests pasen, preguntar al usuario si hay dudas antes de continuar.

- [ ] 8. Módulo de Citas
  - [ ] 8.1 Implementar hook useAppointments y lógica de disponibilidad
    - Crear `src/hooks/useAppointments.ts` con TanStack Query para CRUD de citas, filtros por clínica/estado/fechas y paginación cursor-based con `.range()`
    - Implementar `checkSlotAvailability(clinicId, scheduledAt, durationMinutes)` en `src/lib/utils.ts` con la lógica de solapamiento de intervalos del diseño
    - Implementar manejo de HTTP 409 con sugerencia del horario disponible más próximo
    - _Requirements: 4.8, 4.9, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 16.1_

  - [ ] 8.2 Escribir property tests para Availability_Checker
    - **Property 9: Verificación de disponibilidad de slots sin solapamiento**
    - **Validates: Requirements 5.1, 5.2, 5.3**
    - **Property 10: Citas canceladas/reprogramadas no bloquean disponibilidad**
    - **Validates: Requirements 5.4**

  - [ ] 8.3 Implementar AppointmentCalendar con react-big-calendar
    - Crear `src/components/admin/appointments/AppointmentCalendar.tsx` con vistas mes/semana/día/agenda
    - Colorear eventos según estado de cita usando `Badge` y colores consistentes
    - Manejar click en slot vacío para abrir formulario de nueva cita
    - Manejar click en evento para mostrar detalles con opciones confirmar/reprogramar/cancelar
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 8.4 Escribir property tests para coloreado y filtrado de citas
    - **Property 6: Coloreado de eventos del calendario según estado**
    - **Validates: Requirements 4.2**
    - **Property 7: Transiciones de estado de citas son consistentes**
    - **Validates: Requirements 4.5, 4.6, 4.7**
    - **Property 8: Filtrado de citas por clínica, estado y fechas**
    - **Validates: Requirements 4.9**

  - [ ] 8.5 Implementar AppointmentForm, AppointmentCard y AppointmentFilters del admin
    - Crear `src/components/admin/appointments/AppointmentForm.tsx` con validación Zod, selector de paciente, clínica, procedimiento activo, fecha/hora y verificación de disponibilidad en tiempo real
    - Crear `src/components/admin/appointments/AppointmentCard.tsx` con acciones confirmar/reprogramar/cancelar y disparo de notificaciones
    - Crear `src/components/admin/appointments/AppointmentFilters.tsx` con filtros por clínica, estado y rango de fechas
    - Crear `src/pages/admin/AppointmentsPage.tsx` componiendo calendario, filtros y formulario
    - _Requirements: 4.3, 4.4, 4.5, 4.6, 4.7, 4.9, 4.10_

- [ ] 9. Módulo de Pacientes
  - [ ] 9.1 Implementar hook usePatients y búsqueda
    - Crear `src/hooks/usePatients.ts` con TanStack Query para CRUD de pacientes, búsqueda parcial insensible a mayúsculas por nombre/teléfono/email, y paginación cursor-based
    - Implementar validación Zod para creación de paciente (nombre completo y teléfono requeridos)
    - Manejar error de correo duplicado con mensaje descriptivo
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 16.1_

  - [ ] 9.2 Escribir property tests para gestión de pacientes
    - **Property 11: Validación de campos requeridos en creación de paciente**
    - **Validates: Requirements 6.2**
    - **Property 12: Búsqueda de pacientes retorna coincidencias parciales insensibles a mayúsculas**
    - **Validates: Requirements 6.3, 6.4**
    - **Property 13: Correos duplicados son rechazados**
    - **Validates: Requirements 6.6**

  - [ ] 9.3 Implementar componentes de UI del módulo de pacientes
    - Crear `src/components/admin/patients/PatientList.tsx` con tabla paginada, barra de búsqueda y botón de nuevo paciente
    - Crear `src/components/admin/patients/PatientForm.tsx` con validación Zod para crear/editar paciente
    - Crear `src/components/admin/patients/PatientCard.tsx` con perfil del paciente mostrando citas, historial médico y seguimientos activos
    - Crear `src/pages/admin/PatientsPage.tsx`
    - _Requirements: 6.1, 6.5_

- [ ] 10. Módulo de Historiales Médicos
  - [ ] 10.1 Implementar hook useMedicalRecords con upload/download de documentos
    - Crear `src/hooks/useMedicalRecords.ts` con TanStack Query para CRUD de registros médicos ordenados cronológicamente descendente
    - Implementar `uploadDocument(recordId, file)` con validación de tipo MIME y tamaño (≤ 50 MB) antes del upload al Storage
    - Implementar `deleteDocument(documentId)` que elimina del Storage y de la DB
    - Generar URLs firmadas con expiración de 1 hora para descarga
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 17.2_

  - [ ] 10.2 Escribir property tests para historiales médicos
    - **Property 14: Historial médico se muestra en orden cronológico descendente**
    - **Validates: Requirements 7.3**
    - **Property 15: Validación de archivos antes del upload**
    - **Validates: Requirements 7.5, 7.6, 17.6**
    - **Property 16: Round-trip de documentos médicos (upload → download)**
    - **Validates: Requirements 7.8**

  - [ ] 10.3 Implementar componentes de UI del módulo de historiales médicos
    - Crear `src/components/admin/medical-records/MedicalRecordView.tsx` con lista cronológica descendente, expansión de registros y descarga de documentos
    - Crear `src/components/admin/medical-records/MedicalRecordForm.tsx` con campos: motivo de consulta (requerido), diagnóstico, plan de tratamiento, notas, fecha
    - Crear `src/components/admin/medical-records/DocumentUploader.tsx` con drag-and-drop, validación de tipo/tamaño y barra de progreso
    - Crear `src/pages/admin/MedicalRecordsPage.tsx`
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 11. Módulo de Procedimientos y Seguimiento
  - [ ] 11.1 Implementar hook useProcedures y catálogo de procedimientos
    - Crear `src/hooks/useProcedures.ts` con TanStack Query (`staleTime: 5 minutos`) para CRUD de procedimientos, activar/desactivar sin eliminar, y precio vigente por procedimiento
    - Implementar validación Zod para creación de procedimiento (nombre, categoría, duración requeridos)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 16.2_

  - [ ] 11.2 Escribir property tests para procedimientos
    - **Property 17: Validación de campos requeridos en creación de procedimiento**
    - **Validates: Requirements 8.2**
    - **Property 18: Procedimientos desactivados excluidos de selectores**
    - **Validates: Requirements 8.4**

  - [ ] 11.3 Implementar seguimiento de procedimientos multi-sesión y alertas
    - Crear `src/hooks/useProcedureTracking.ts` con CRUD de `procedure_tracking` y función `generateFollowupAlerts(daysAhead)`
    - Implementar lógica de `generateFollowupAlerts`: filtrar por `next_followup_date <= (hoy + N días)`, `status NOT IN ('completed','cancelled')`, `alert_sent = false`; marcar `alert_sent = true` tras identificar registros
    - _Requirements: 12.1, 12.2, 12.4_

  - [ ] 11.4 Escribir property tests para Followup_Alert_Generator
    - **Property 30: Followup_Alert_Generator identifica correctamente los registros pendientes**
    - **Validates: Requirements 12.1**
    - **Property 31: Followup_Alert_Generator es idempotente (no genera alertas duplicadas)**
    - **Validates: Requirements 12.2**

  - [ ] 11.5 Implementar componentes de UI del módulo de procedimientos
    - Crear `src/components/admin/procedures/ProcedureList.tsx` con tabla paginada y toggle activo/inactivo
    - Crear `src/components/admin/procedures/ProcedureForm.tsx` con validación Zod
    - Crear `src/components/admin/procedures/ProcedureTracking.tsx` con línea de tiempo visual, resaltado rojo (vencido) y amarillo (próximos 3 días)
    - Crear `src/pages/admin/ProceduresPage.tsx`
    - _Requirements: 8.1, 8.3, 8.6, 12.3, 12.5_

- [ ] 12. Módulo de Precios
  - [ ] 12.1 Implementar hook usePricing con historial de cambios
    - Crear `src/hooks/usePricing.ts` con TanStack Query para tabla de precios vigentes, actualización de precio (crea nuevo registro con `effective_from`, cierra el anterior con `effective_to`), historial completo por procedimiento
    - Implementar validación Zod para `UpdatePriceDTO` (motivo de cambio requerido, moneda, precio > 0)
    - Manejar error de constraint `no_overlapping_prices` con mensaje descriptivo
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ] 12.2 Escribir property tests para gestión de precios
    - **Property 19: Actualización de precio preserva historial completo**
    - **Validates: Requirements 9.2, 9.3**
    - **Property 20: Constraint de no solapamiento de precios**
    - **Validates: Requirements 9.4**
    - **Property 21: Actualización de precio requiere motivo**
    - **Validates: Requirements 9.5**

  - [ ] 12.3 Implementar componentes de UI del módulo de precios
    - Crear `src/components/admin/pricing/PricingTable.tsx` con tabla de precios vigentes por procedimiento activo
    - Crear `src/components/admin/pricing/PriceHistoryModal.tsx` con historial completo (precio, moneda, fechas, usuario, motivo)
    - Crear `src/components/admin/pricing/PriceUpdateForm.tsx` con validación Zod y campo de motivo requerido
    - Crear `src/pages/admin/PricingPage.tsx`
    - _Requirements: 9.1, 9.3, 9.5, 9.6_

- [ ] 13. Checkpoint — Verificar módulos de citas, pacientes, historiales, procedimientos y precios
  - Asegurarse de que todos los tests pasen, preguntar al usuario si hay dudas antes de continuar.

- [ ] 14. Módulo de Clínicas con Mapa Leaflet
  - [ ] 14.1 Implementar hook useClinics con cálculo de carga de trabajo
    - Crear `src/hooks/useClinics.ts` con TanStack Query (`staleTime: 5 minutos`) para CRUD de clínicas, `getClinicWorkload(clinicId, date)` y `reassignAppointment(appointmentId, targetClinicId)`
    - Implementar `calculateClinicWorkloads(date, dailyCapacity)`: iterar clínicas activas, contar citas por estado en el día completo (00:00:00–23:59:59 UTC), calcular `capacity_percentage = round(confirmed + in_progress) / dailyCapacity * 100)` con clamp a [0, 100]
    - _Requirements: 10.6, 11.1, 11.2, 11.3, 11.4, 16.2_

  - [ ] 14.2 Escribir property tests para Workload_Calculator
    - **Property 26: Workload_Calculator retorna un resultado por clínica activa**
    - **Validates: Requirements 11.1**
    - **Property 27: Fórmula de capacity_percentage es correcta**
    - **Validates: Requirements 11.2**
    - **Property 28: capacity_percentage siempre está en el rango [0, 100]**
    - **Validates: Requirements 11.3**
    - **Property 29: Workload_Calculator cuenta solo citas del día especificado**
    - **Validates: Requirements 11.4**

  - [ ] 14.3 Implementar ClinicMap con Leaflet.js y marcadores dinámicos
    - Crear `src/components/admin/clinics/ClinicMap.tsx` con `react-leaflet`, marcadores por clínica activa con coordenadas válidas, coloreado verde/amarillo/rojo según `capacity_percentage`, popup con nombre/dirección/teléfono/carga al hacer clic
    - Usar `useMemo` para los marcadores para evitar re-renders al filtrar citas
    - Omitir marcadores de clínicas con coordenadas nulas/inválidas y mostrar banner de advertencia
    - Conectar selección de clínica en mapa con filtro del `appointmentStore`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.7, 16.3_

  - [ ] 14.4 Escribir property tests para mapa de clínicas
    - **Property 22: Marcadores del mapa corresponden a clínicas activas con coordenadas válidas**
    - **Validates: Requirements 10.2**
    - **Property 23: Color de marcadores refleja carga de trabajo**
    - **Validates: Requirements 10.3**
    - **Property 24: Filtrado de citas por clínica seleccionada en mapa**
    - **Validates: Requirements 10.5**
    - **Property 25: Sedes desactivadas excluidas del mapa y selectores**
    - **Validates: Requirements 10.9**

  - [ ] 14.5 Implementar componentes de UI del módulo de clínicas
    - Crear `src/components/admin/clinics/ClinicCard.tsx` con datos de la sede y acciones editar/desactivar
    - Crear `src/components/admin/clinics/ClinicWorkloadChart.tsx` con gráfico de barras de carga por clínica
    - Crear `src/pages/admin/ClinicsPage.tsx` componiendo mapa, tarjetas y formulario de gestión de sedes
    - _Requirements: 10.1, 10.4, 10.6, 10.8, 10.9_

- [ ] 15. Módulo de Analíticas y Dashboard
  - [ ] 15.1 Implementar componentes del dashboard con métricas del día
    - Crear `src/components/admin/dashboard/StatsCards.tsx` con métricas: total de citas hoy, citas pendientes de confirmación, procedimientos activos, seguimientos próximos
    - Crear `src/components/admin/dashboard/AppointmentsChart.tsx` con gráfico de citas por período (día/semana/mes) usando datos de Supabase
    - Crear `src/components/admin/dashboard/AlertsPanel.tsx` con procedimientos vencidos (rojo) y próximos 3 días (amarillo), conectado a `generateFollowupAlerts`
    - Actualizar `src/pages/admin/DashboardPage.tsx` componiendo StatsCards, AppointmentsChart, AlertsPanel y ClinicWorkloadChart
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 16. Edge Functions de Notificaciones
  - [ ] 16.1 Implementar Edge Function de notificaciones de citas
    - Crear `supabase/functions/send-appointment-notification/index.ts` que recibe evento de cita (creada/confirmada/reprogramada/cancelada), envía notificación vía WhatsApp API y SMTP
    - Implementar manejo de errores: registrar fallo en logs sin propagar excepción al cliente ni interrumpir la operación principal
    - Configurar trigger en Supabase para invocar la función en cambios de estado de `appointments`
    - _Requirements: 2.5, 4.5, 4.6, 4.7, 4.10, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

  - [ ] 16.2 Escribir property test para resiliencia de notificaciones
    - **Property 32: Notificaciones no interrumpen la operación principal**
    - **Validates: Requirements 14.6**

- [ ] 17. Validación global, manejo de errores y seguridad
  - [ ] 17.1 Implementar interceptores de errores HTTP y validación Zod global
    - Crear wrapper de Supabase en `src/lib/supabase.ts` que intercepta errores 401 (redirige al login preservando ruta) y 403 (muestra mensaje de acceso denegado)
    - Crear esquemas Zod centralizados en `src/lib/schemas.ts` para todos los DTOs del sistema
    - Implementar función de manejo de errores de DB que traduce errores de constraint a mensajes descriptivos sin exponer detalles internos
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

  - [ ] 17.2 Escribir property tests para validación y seguridad
    - **Property 4: RLS restringe acceso por rol y clínica**
    - **Validates: Requirements 3.7, 3.8, 6.7, 17.3**
    - **Property 33: Validación Zod captura entradas inválidas antes de la DB**
    - **Validates: Requirements 15.1**
    - **Property 34: Acceso no autorizado retorna HTTP 403**
    - **Validates: Requirements 15.4, 17.3**
    - **Property 35: Paginación cursor-based en todas las listas**
    - **Validates: Requirements 16.1**

- [ ] 18. Optimizaciones de rendimiento
  - [ ] 18.1 Implementar paginación cursor-based en todas las listas del panel
    - Actualizar `useAppointments`, `usePatients`, `useMedicalRecords` y `useProcedures` para usar `.range(from, to)` de Supabase con cursor-based pagination
    - Actualizar componentes `Table.tsx`, `PatientList.tsx`, `ProcedureList.tsx` para mostrar controles de paginación y cargar siguiente página
    - _Requirements: 16.1_

  - [ ] 18.2 Configurar caché de TanStack Query y memoización de mapa
    - Configurar `staleTime: 5 * 60 * 1000` (5 minutos) en queries de procedimientos y clínicas en sus respectivos hooks
    - Verificar que `ClinicMap.tsx` usa `useMemo` para el array de marcadores Leaflet
    - Configurar `QueryClient` en `App.tsx` con `defaultOptions` apropiados
    - _Requirements: 16.2, 16.3_

- [ ] 19. Checkpoint final — Verificar sistema completo
  - Asegurarse de que todos los tests pasen (unitarios y de propiedades), preguntar al usuario si hay dudas antes de finalizar.

---

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad completa
- Los checkpoints en las tareas 7, 13 y 19 garantizan validación incremental
- Los property tests usan `fast-check` y validan las 35 propiedades de corrección del diseño
- Los tests unitarios usan `vitest` + `@testing-library/react`
- La implementación usa TypeScript estricto en todo el stack
- Las Edge Functions de Supabase manejan notificaciones de forma asíncrona y resiliente
- El mapa Leaflet usa `useMemo` para evitar re-renders costosos al filtrar citas
- Toda la paginación usa cursor-based con `.range()` de Supabase (no offset-based)
- Los documentos médicos usan buckets privados de Supabase Storage con URLs firmadas de 1 hora

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["1.3", "2.2", "3.1"] },
    { "id": 3, "tasks": ["4.1", "5.1", "6.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "5.2"] },
    { "id": 5, "tasks": ["4.4", "8.1", "9.1", "11.1", "12.1", "14.1"] },
    { "id": 6, "tasks": ["4.5", "8.2", "9.2", "11.2", "12.2", "14.2"] },
    { "id": 7, "tasks": ["8.3", "9.3", "10.1", "11.3", "12.3", "14.3"] },
    { "id": 8, "tasks": ["8.4", "8.5", "10.2", "11.4", "14.4"] },
    { "id": 9, "tasks": ["10.3", "11.5", "14.5"] },
    { "id": 10, "tasks": ["15.1", "16.1", "17.1", "18.1", "18.2"] },
    { "id": 11, "tasks": ["16.2", "17.2"] }
  ]
}
```

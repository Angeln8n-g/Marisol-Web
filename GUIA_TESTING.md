# 🧪 Guía de Testing - Login y Dashboard

## Pruebas Manuales

### 1. Login Básico ✅

#### Caso 1: Login Exitoso
```
1. Ir a /admin/login
2. Ingresar credenciales válidas
3. Click en "Iniciar Sesión"

✓ Debe mostrar spinner "Iniciando sesión..."
✓ Debe completar en < 2 segundos
✓ Debe redirigir a /admin/dashboard
✓ Debe mostrar nombre de usuario en TopBar
```

#### Caso 2: Login Fallido
```
1. Ir a /admin/login
2. Ingresar credenciales inválidas
3. Click en "Iniciar Sesión"

✓ Debe mostrar mensaje "Credenciales inválidas"
✓ No debe redirigir
✓ Formulario debe permanecer editable
```

#### Caso 3: Login con Timeout
```
1. Desconectar internet
2. Intentar login
3. Esperar 10 segundos

✓ Debe mostrar mensaje "La operación tardó demasiado"
✓ No debe quedar colgado indefinidamente
```

---

### 2. Sesión Expirada ✅

#### Caso 1: Detección de Sesión Expirada
```
1. Iniciar sesión normalmente
2. Abrir DevTools > Application > Local Storage
3. Borrar el token de Supabase
4. Intentar navegar en el dashboard

✓ Debe redirigir a /admin/login?expired=true
✓ Debe mostrar banner amarillo "Sesión expirada"
```

#### Caso 2: Renovación Automática
```
1. Iniciar sesión
2. Esperar 55 minutos (o modificar el código para testing)
3. Verificar que la sesión se renueva automáticamente

✓ No debe cerrar sesión
✓ No debe mostrar errores
✓ Usuario puede seguir trabajando
```

---

### 3. Rendimiento del Dashboard ✅

#### Caso 1: Carga Inicial
```
1. Abrir DevTools > Network
2. Ir a /admin/dashboard
3. Observar las peticiones

✓ Solo debe cargar el bundle del dashboard (lazy loading)
✓ No debe hacer fetch duplicado del perfil de usuario
✓ Debe cargar en < 3 segundos
```

#### Caso 2: Re-renders
```
1. Abrir React DevTools > Profiler
2. Grabar interacción
3. Cambiar filtros del dashboard
4. Detener grabación

✓ Solo componentes afectados deben re-renderizar
✓ StatsCards, Charts deben estar memoizados
✓ < 5 re-renders por acción
```

#### Caso 3: Navegación entre Páginas
```
1. Ir a /admin/dashboard
2. Navegar a /admin/appointments
3. Volver a /admin/dashboard

✓ Dashboard debe cargar desde caché
✓ No debe hacer fetch de datos si son frescos (< 5 min)
✓ Transición debe ser instantánea
```

---

### 4. Control de Acceso por Roles ✅

#### Caso 1: Usuario Admin
```
1. Login con usuario admin
2. Intentar acceder a todas las rutas

✓ Debe tener acceso a todas las secciones
✓ No debe ver pantalla "Acceso Denegado"
```

#### Caso 2: Usuario Sin Permisos (si aplica)
```
1. Login con usuario sin rol admin
2. Intentar acceder a rutas protegidas

✓ Debe ver pantalla "Acceso Denegado"
✓ Botón "Volver" debe funcionar
✓ No debe poder acceder al contenido
```

---

## Pruebas de Integración

### Setup
```bash
# Instalar dependencias de testing (si no están)
npm install -D @testing-library/react @testing-library/jest-dom vitest
```

### Ejemplo: Test de Login
```typescript
// src/hooks/__tests__/useAuth.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useAuth } from '../useAuth'

describe('useAuth', () => {
  it('should login successfully', async () => {
    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      await result.current.signIn('test@example.com', 'password')
    })
    
    await waitFor(() => {
      expect(result.current.session).toBeTruthy()
      expect(result.current.isAuthenticated()).toBe(true)
    })
  })

  it('should handle login timeout', async () => {
    const { result } = renderHook(() => useAuth())
    
    // Mock slow network
    jest.setTimeout(15000)
    
    await expect(
      result.current.signIn('test@example.com', 'password')
    ).rejects.toThrow('Operación timeout')
  })
})
```

---

## Pruebas de Rendimiento

### 1. Lighthouse Audit
```bash
# Abrir Chrome DevTools > Lighthouse
# Seleccionar "Performance"
# Generar reporte

Objetivos:
✓ Performance Score: > 90
✓ First Contentful Paint: < 1.5s
✓ Time to Interactive: < 3.5s
✓ Total Blocking Time: < 300ms
```

### 2. Bundle Size Analysis
```bash
# Analizar tamaño del bundle
npm run build
npx vite-bundle-visualizer

Objetivos:
✓ Bundle inicial: < 500KB
✓ Lazy chunks: < 200KB cada uno
✓ No duplicación de dependencias
```

### 3. Memory Profiling
```bash
# Abrir DevTools > Memory
# Tomar heap snapshot inicial
# Usar la aplicación por 5 minutos
# Tomar heap snapshot final
# Comparar

Objetivos:
✓ No memory leaks detectados
✓ Heap size estable (< 50MB crecimiento)
✓ No objetos retenidos innecesariamente
```

---

## Pruebas de Seguridad

### 1. Verificación de Tokens
```bash
# Verificar que los tokens se manejan correctamente
1. Login exitoso
2. Inspeccionar localStorage
3. Verificar que solo se guarda la sesión (no contraseñas)

✓ No debe haber contraseñas en localStorage
✓ Tokens deben estar en formato JWT
✓ Tokens deben expirar correctamente
```

### 2. Protección de Rutas
```bash
# Intentar acceder sin autenticación
1. Borrar localStorage
2. Ir directamente a /admin/dashboard

✓ Debe redirigir a /admin/login
✓ Debe preservar la URL de destino (?redirect=...)
✓ Después del login, debe redirigir al destino original
```

### 3. CSRF Protection
```bash
# Verificar protección contra CSRF
1. Inspeccionar headers de las peticiones
2. Verificar que Supabase incluye tokens CSRF

✓ Todas las peticiones deben incluir auth headers
✓ Tokens deben ser únicos por sesión
```

---

## Checklist de Testing Completo

### Pre-Deploy
- [ ] Todos los tests unitarios pasan
- [ ] Tests de integración pasan
- [ ] No hay errores de TypeScript
- [ ] No hay warnings de ESLint
- [ ] Lighthouse score > 90
- [ ] Bundle size < 500KB
- [ ] No memory leaks detectados

### Funcionalidad
- [ ] Login exitoso funciona
- [ ] Login fallido muestra error
- [ ] Timeout de login funciona
- [ ] Sesión expirada se detecta
- [ ] Renovación automática funciona
- [ ] Logout funciona correctamente
- [ ] Redirección después de login funciona

### Rendimiento
- [ ] Dashboard carga en < 3s
- [ ] Lazy loading funciona
- [ ] No hay fetches duplicados
- [ ] Componentes memoizados no re-renderizan
- [ ] Navegación es fluida

### Seguridad
- [ ] Rutas protegidas funcionan
- [ ] Control de roles funciona
- [ ] Tokens se manejan correctamente
- [ ] No hay datos sensibles en localStorage
- [ ] CSRF protection activo

---

## Herramientas Recomendadas

### Desarrollo
- **React DevTools**: Profiling y debugging
- **Redux DevTools**: State management (si aplica)
- **Network Tab**: Monitorear peticiones
- **Performance Tab**: Analizar rendimiento

### Testing
- **Vitest**: Test runner
- **Testing Library**: Tests de componentes
- **MSW**: Mock Service Worker para APIs
- **Playwright**: Tests E2E

### Monitoreo
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **Google Analytics**: User behavior
- **Vercel Analytics**: Performance metrics

---

## Debugging Tips

### Login Colgado
```typescript
// Agregar logs temporales en useAuth.ts
console.log('🔐 Starting login...')
console.log('🔐 Session obtained:', session)
console.log('🔐 Fetching profile...')
console.log('🔐 Profile fetched:', profile)
```

### Rendimiento Lento
```typescript
// Usar el performance monitor
import { perfMonitor } from '../lib/performanceMonitor'

perfMonitor.start('dashboard-load')
// ... operación
perfMonitor.end('dashboard-load')

// Ver métricas
console.table(perfMonitor.getMetrics())
```

### Memory Leaks
```typescript
// Verificar subscripciones
useEffect(() => {
  const subscription = supabase.auth.onAuthStateChange(...)
  
  return () => {
    subscription.unsubscribe() // ✅ Importante!
  }
}, [])
```

---

## Métricas de Éxito

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| Login Time | < 2s | ⏱️ Medir |
| Dashboard Load | < 3s | ⏱️ Medir |
| Bundle Size | < 500KB | ⏱️ Medir |
| Lighthouse Score | > 90 | ⏱️ Medir |
| Memory Usage | < 50MB | ⏱️ Medir |
| Error Rate | < 1% | ⏱️ Medir |

---

**Última actualización**: 30 de Mayo, 2026

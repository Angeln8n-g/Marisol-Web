# 🐛 Debug - Sesión se Cierra Automáticamente

## Problema Identificado

La sesión se cierra automáticamente al acceder al dashboard.

## Causas Posibles Corregidas

### 1. ✅ AuthListener Demasiado Agresivo
**Problema:** El listener cerraba la sesión en cualquier evento sin sesión
**Solución:** Ahora solo cierra en evento `SIGNED_OUT` explícito

### 2. ✅ useSessionTimeout Verificando Inmediatamente
**Problema:** Verificaba la sesión inmediatamente al montar y cerraba si había error
**Solución:** Ahora espera 30 segundos antes de la primera verificación

### 3. ✅ Logs de Debug Agregados
**Solución:** Agregados console.logs para rastrear el flujo

---

## Cómo Debuggear

### 1. Abrir DevTools Console
```
F12 > Console
```

### 2. Intentar Login
Busca estos mensajes en la consola:

```
✓ Correcto:
🔐 Auth event: SIGNED_IN Session: true
✓ Updating session
✓ Access granted

❌ Problema:
🔐 Auth event: SIGNED_OUT Session: false
🔒 No session, redirecting to login
```

### 3. Verificar localStorage
```javascript
// En la consola del navegador:
localStorage.getItem('auth-storage')
```

Debería mostrar algo como:
```json
{
  "state": {
    "session": { ... }
  },
  "version": 0
}
```

---

## Soluciones Implementadas

### Cambio 1: AuthListener Mejorado
```typescript
// ANTES: Cerraba sesión si no había newSession
if (!newSession) {
  clearAuth()
  return
}

// AHORA: Solo cierra en SIGNED_OUT explícito
if (event === 'SIGNED_OUT') {
  clearAuth()
  return
}

if (!newSession) {
  console.warn('⚠️ No session but event is not SIGNED_OUT, ignoring')
  return
}
```

### Cambio 2: useSessionTimeout Menos Agresivo
```typescript
// ANTES: Verificaba inmediatamente y cerraba sesión
const checkSession = async () => {
  if (error || !currentSession) {
    clearAuth()
    navigate('/admin/login?expired=true')
    return
  }
}
checkSession() // Inmediato

// AHORA: Espera 30 segundos y no cierra sesión
const checkSession = async () => {
  if (error || !currentSession) {
    console.warn('Session check failed:', error?.message)
    return // Solo log, no cierra
  }
}
setTimeout(checkSession, 30000) // Espera 30s
```

### Cambio 3: ProtectedRoute con Logs
```typescript
// Agregados logs para debugging
if (!session) {
  console.log('🔒 No session, redirecting to login')
  return <Navigate to="/admin/login" />
}

console.log('✅ Access granted')
return <>{children}</>
```

---

## Pasos para Verificar la Corrección

### 1. Limpiar Estado
```javascript
// En la consola del navegador:
localStorage.clear()
location.reload()
```

### 2. Intentar Login
1. Ir a `/admin/login`
2. Ingresar credenciales
3. Observar la consola

### 3. Verificar Logs Esperados
```
🔐 Auth event: SIGNED_IN Session: true
✓ Updating session
✅ Access granted
```

### 4. Esperar 30 Segundos
Después de 30 segundos, deberías ver:
```
🔄 Refreshing session (expires in X minutes)
```

---

## Si el Problema Persiste

### Verificar Variables de Entorno
```bash
# .env.local debe tener:
VITE_SUPABASE_URL=tu_url
VITE_SUPABASE_ANON_KEY=tu_key
```

### Verificar Supabase Auth Settings
1. Ir a Supabase Dashboard
2. Authentication > Settings
3. Verificar:
   - JWT expiry: 3600 (1 hora)
   - Refresh token rotation: Enabled
   - Auto-confirm users: Enabled (para testing)

### Verificar Tabla Users
```sql
-- Verificar que el usuario existe en la tabla users
SELECT * FROM users WHERE id = 'tu_user_id';
```

### Verificar RLS Policies
```sql
-- Verificar que hay políticas RLS para la tabla users
SELECT * FROM pg_policies WHERE tablename = 'users';
```

---

## Debugging Avanzado

### Agregar Más Logs Temporalmente

En `src/hooks/useAuth.ts`, agregar:
```typescript
export async function initAuth() {
  console.log('🚀 initAuth started')
  
  const result = await withTimeout(...)
  console.log('📦 Session result:', {
    hasError: !!result.error,
    hasSession: !!result.data.session,
    userId: result.data.session?.user?.id
  })
  
  setSession(result.data.session)
  console.log('✅ Session set in store')
  
  setLoading(false)
  console.log('✅ Loading set to false')
}
```

### Monitorear Zustand Store

Instalar Redux DevTools:
```bash
npm install -D @redux-devtools/extension
```

Modificar `authStore.ts`:
```typescript
import { devtools } from 'zustand/middleware'

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({ ... }),
      { name: 'auth-storage' }
    ),
    { name: 'AuthStore' }
  )
)
```

---

## Checklist de Verificación

- [ ] Console muestra logs de auth events
- [ ] localStorage contiene auth-storage
- [ ] No hay errores en la consola
- [ ] Variables de entorno configuradas
- [ ] Usuario existe en tabla users
- [ ] RLS policies configuradas
- [ ] JWT no está expirado
- [ ] Supabase está accesible

---

## Próximos Pasos

1. **Probar con los cambios actuales**
   - Limpiar localStorage
   - Intentar login
   - Observar consola

2. **Si persiste el problema**
   - Compartir logs de la consola
   - Verificar configuración de Supabase
   - Revisar políticas RLS

3. **Solución temporal**
   - Comentar `useSessionTimeout` en AdminLayout
   - Esto deshabilitará la renovación automática pero permitirá trabajar

---

## Código para Deshabilitar Temporalmente

Si necesitas deshabilitar el timeout temporalmente:

```typescript
// src/components/admin/layout/AdminLayout.tsx
export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // COMENTAR TEMPORALMENTE
  // useSessionTimeout()

  return (
    // ...
  )
}
```

---

**Última actualización:** 30 de Mayo, 2026

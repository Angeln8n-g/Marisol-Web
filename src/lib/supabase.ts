// src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  )
}

/**
 * Cliente Supabase tipado con el esquema de la base de datos.
 * 
 * Este cliente proporciona acceso completo a:
 * - Auth: Autenticación y gestión de sesiones
 * - Database: Consultas tipadas a PostgreSQL con RLS
 * - Storage: Almacenamiento de archivos (documentos médicos)
 * - Realtime: Subscripciones a cambios en tiempo real
 * 
 * @example
 * // Consulta tipada
 * const { data, error } = await supabase
 *   .from('patients')
 *   .select('*')
 *   .eq('id', patientId)
 * 
 * @example
 * // Autenticación
 * const { data, error } = await supabase.auth.signInWithPassword({
 *   email: 'user@example.com',
 *   password: 'password'
 * })
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

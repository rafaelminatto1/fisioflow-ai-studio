import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Server-side client for API routes
export const createServerSupabaseClient = () => {
  const serverUrl = process.env.SUPABASE_URL || ''
  const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!serverUrl || !serverKey) {
    throw new Error('Server Supabase credentials are missing')
  }

  return createClient(serverUrl, serverKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          updated_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          birth_date: string
          gender: string
          address: string
          medical_history: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone: string
          birth_date: string
          gender: string
          address: string
          medical_history?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          birth_date?: string
          gender?: string
          address?: string
          medical_history?: string
          updated_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
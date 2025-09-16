import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createServerSupabaseClient } from '../../src/lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' })
    }

    const supabase = createServerSupabaseClient()

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name }
    })

    if (authError || !authData.user) {
      return res.status(400).json({ error: authError?.message || 'Failed to create user' })
    }

    // Create user profile in custom table
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Continue even if profile creation fails
    }

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
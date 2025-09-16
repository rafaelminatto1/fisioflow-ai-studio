import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createServerSupabaseClient } from '../../src/lib/supabase'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const supabase = createServerSupabaseClient()

    // Get user from Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Get user profile from custom table if exists
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret'
    const token = jwt.sign(
      {
        userId: authData.user.id,
        email: authData.user.email,
        profile: profile || null
      },
      jwtSecret,
      { expiresIn: '7d' }
    )

    res.status(200).json({
      token,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        profile
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
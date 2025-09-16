import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createServerSupabaseClient } from '../../src/lib/supabase'
import jwt from 'jsonwebtoken'

function authenticateRequest(req: VercelRequest) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    throw new Error('No token provided')
  }

  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret'
  return jwt.verify(token, jwtSecret) as any
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = authenticateRequest(req)
    const supabase = createServerSupabaseClient()

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.status(200).json(data)
    }

    if (req.method === 'POST') {
      const {
        name,
        description,
        instructions,
        difficulty_level,
        duration_minutes,
        repetitions,
        sets,
        category,
        equipment_needed
      } = req.body

      if (!name || !instructions) {
        return res.status(400).json({ error: 'Name and instructions are required' })
      }

      const { data, error } = await supabase
        .from('exercises')
        .insert({
          name,
          description,
          instructions,
          difficulty_level,
          duration_minutes,
          repetitions,
          sets,
          category,
          equipment_needed,
          created_by: user.userId
        })
        .select()
        .single()

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.status(201).json(data)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Exercises API error:', error)
    return res.status(401).json({ error: 'Unauthorized' })
  }
}
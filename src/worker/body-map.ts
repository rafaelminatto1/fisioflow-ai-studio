import { Hono } from 'hono'
import { z } from 'zod'

const bodyMapApp = new Hono<{ Bindings: Env; Variables: { user: any } }>()

// Schemas
const PainPointSchema = z.object({
  patientId: z.number(),
  sessionId: z.number().optional(),
  bodyPart: z.string(),
  xCoordinate: z.number(),
  yCoordinate: z.number(),
  painLevel: z.number().min(0).max(10),
  description: z.string().optional(),
  notes: z.string().optional(),
  imageUrl: z.string().optional(),
  sessionDate: z.string()
})

const BodyMapSessionSchema = z.object({
  patientId: z.number(),
  sessionDate: z.string(),
  sessionType: z.string().default('ASSESSMENT'),
  generalNotes: z.string().optional(),
  overallPainLevel: z.number().min(0).max(10).optional()
})

// Get all sessions for a patient
bodyMapApp.get('/patients/:patientId/body-map-sessions', async (c) => {
  const { user } = c.var
  const patientId = parseInt(c.req.param('patientId'))

  if (isNaN(patientId)) {
    return c.json({ error: 'ID do paciente inválido' }, 400)
  }

  try {
    // Verify patient belongs to user's clinic
    const patient = await c.env.DB.prepare(
      'SELECT id, clinic_id FROM patients WHERE id = ? AND clinic_id = ?'
    ).bind(patientId, user.clinic_id).first()

    if (!patient) {
      return c.json({ error: 'Paciente não encontrado' }, 404)
    }

    // Get all sessions with pain points
    const sessions = await c.env.DB.prepare(`
      SELECT 
        bms.*,
        json_group_array(
          CASE WHEN pp.id IS NOT NULL THEN
            json_object(
              'id', pp.id,
              'bodyPart', pp.body_part,
              'xCoordinate', pp.x_coordinate,
              'yCoordinate', pp.y_coordinate,
              'painLevel', pp.pain_level,
              'description', pp.description,
              'notes', pp.notes,
              'imageUrl', pp.image_url,
              'sessionDate', pp.session_date
            )
          END
        ) as pain_points
      FROM body_map_sessions bms
      LEFT JOIN pain_points pp ON bms.id = pp.session_id AND pp.is_active = 1
      WHERE bms.patient_id = ? AND bms.clinic_id = ?
      GROUP BY bms.id
      ORDER BY bms.session_date DESC
    `).bind(patientId, user.clinic_id).all()

    const formattedSessions = (sessions.results as any[]).map((session: any) => ({
      ...session,
      painPoints: JSON.parse(session.pain_points as string).filter((pp: any) => pp !== null)
    }))

    return c.json({ sessions: formattedSessions })
  } catch (error) {
    console.error('Error fetching body map sessions:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

// Get specific session
bodyMapApp.get('/body-map-sessions/:sessionId', async (c) => {
  const { user } = c.var
  const sessionId = parseInt(c.req.param('sessionId'))

  if (isNaN(sessionId)) {
    return c.json({ error: 'ID da sessão inválido' }, 400)
  }

  try {
    // Get session with pain points
    const session = await c.env.DB.prepare(`
      SELECT 
        bms.*,
        json_group_array(
          CASE WHEN pp.id IS NOT NULL THEN
            json_object(
              'id', pp.id,
              'bodyPart', pp.body_part,
              'xCoordinate', pp.x_coordinate,
              'yCoordinate', pp.y_coordinate,
              'painLevel', pp.pain_level,
              'description', pp.description,
              'notes', pp.notes,
              'imageUrl', pp.image_url,
              'sessionDate', pp.session_date
            )
          END
        ) as pain_points
      FROM body_map_sessions bms
      LEFT JOIN pain_points pp ON bms.id = pp.session_id AND pp.is_active = 1
      WHERE bms.id = ? AND bms.clinic_id = ?
      GROUP BY bms.id
    `).bind(sessionId, user.clinic_id).first()

    if (!session) {
      return c.json({ error: 'Sessão não encontrada' }, 404)
    }

    const formattedSession = {
      ...session,
      painPoints: JSON.parse(session.pain_points as string).filter((pp: any) => pp !== null)
    }

    return c.json({ session: formattedSession })
  } catch (error) {
    console.error('Error fetching body map session:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

// Create new session
bodyMapApp.post('/body-map-sessions', async (c) => {
  const { user } = c.var
  
  try {
    const body = await c.req.json()
    const validatedData = BodyMapSessionSchema.parse(body)

    // Verify patient belongs to user's clinic
    const patient = await c.env.DB.prepare(
      'SELECT id FROM patients WHERE id = ? AND clinic_id = ?'
    ).bind(validatedData.patientId, user.clinic_id).first()

    if (!patient) {
      return c.json({ error: 'Paciente não encontrado' }, 404)
    }

    // Check if session already exists for this date
    const existingSession = await c.env.DB.prepare(
      'SELECT id FROM body_map_sessions WHERE patient_id = ? AND session_date = ?'
    ).bind(validatedData.patientId, validatedData.sessionDate).first()

    if (existingSession) {
      return c.json({ error: 'Já existe uma sessão para esta data' }, 400)
    }

    // Create session
    const result = await c.env.DB.prepare(`
      INSERT INTO body_map_sessions (
        patient_id, user_id, clinic_id, session_date, session_type, 
        general_notes, overall_pain_level, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      validatedData.patientId,
      user.id,
      user.clinic_id,
      validatedData.sessionDate,
      validatedData.sessionType,
      validatedData.generalNotes || null,
      validatedData.overallPainLevel || null
    ).run()

    const newSession = await c.env.DB.prepare(
      'SELECT * FROM body_map_sessions WHERE id = ?'
    ).bind(result.meta.last_row_id).first()

    return c.json({ session: { ...newSession, painPoints: [] } }, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Dados inválidos', details: error.errors }, 400)
    }
    console.error('Error creating body map session:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

// Update session
bodyMapApp.put('/body-map-sessions', async (c) => {
  const { user } = c.var
  
  try {
    const body = await c.req.json()
    const sessionId = body.id

    if (!sessionId) {
      return c.json({ error: 'ID da sessão é obrigatório' }, 400)
    }

    // Verify session belongs to user's clinic
    const existingSession = await c.env.DB.prepare(
      'SELECT id FROM body_map_sessions WHERE id = ? AND clinic_id = ?'
    ).bind(sessionId, user.clinic_id).first()

    if (!existingSession) {
      return c.json({ error: 'Sessão não encontrada' }, 404)
    }

    // Update session
    await c.env.DB.prepare(`
      UPDATE body_map_sessions 
      SET general_notes = ?, overall_pain_level = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      body.generalNotes || null,
      body.overallPainLevel || null,
      sessionId
    ).run()

    const updatedSession = await c.env.DB.prepare(
      'SELECT * FROM body_map_sessions WHERE id = ?'
    ).bind(sessionId).first()

    return c.json({ session: updatedSession })
  } catch (error) {
    console.error('Error updating body map session:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

// Create pain point
bodyMapApp.post('/pain-points', async (c) => {
  const { user } = c.var
  
  try {
    const body = await c.req.json()
    const validatedData = PainPointSchema.parse(body)

    // Verify patient belongs to user's clinic
    const patient = await c.env.DB.prepare(
      'SELECT id FROM patients WHERE id = ? AND clinic_id = ?'
    ).bind(validatedData.patientId, user.clinic_id).first()

    if (!patient) {
      return c.json({ error: 'Paciente não encontrado' }, 404)
    }

    // Get or create session for this date
    let sessionId = validatedData.sessionId
    
    if (!sessionId) {
      // Try to find existing session for this date
      const existingSession = await c.env.DB.prepare(
        'SELECT id FROM body_map_sessions WHERE patient_id = ? AND session_date = ?'
      ).bind(validatedData.patientId, validatedData.sessionDate).first()

      if (existingSession) {
        sessionId = existingSession.id as number
      } else {
        // Create new session
        const sessionResult = await c.env.DB.prepare(`
          INSERT INTO body_map_sessions (
            patient_id, user_id, clinic_id, session_date, session_type, created_at, updated_at
          ) VALUES (?, ?, ?, ?, 'ASSESSMENT', datetime('now'), datetime('now'))
        `).bind(
          validatedData.patientId,
          user.id,
          user.clinic_id,
          validatedData.sessionDate
        ).run()
        
        sessionId = sessionResult.meta.last_row_id as number
      }
    }

    // Create pain point
    const result = await c.env.DB.prepare(`
      INSERT INTO pain_points (
        patient_id, user_id, clinic_id, session_id, body_part, 
        x_coordinate, y_coordinate, pain_level, description, notes, 
        image_url, session_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      validatedData.patientId,
      user.id,
      user.clinic_id,
      sessionId,
      validatedData.bodyPart,
      validatedData.xCoordinate,
      validatedData.yCoordinate,
      validatedData.painLevel,
      validatedData.description || null,
      validatedData.notes || null,
      validatedData.imageUrl || null,
      validatedData.sessionDate
    ).run()

    const newPainPoint = await c.env.DB.prepare(
      'SELECT * FROM pain_points WHERE id = ?'
    ).bind(result.meta.last_row_id).first()

    return c.json({ painPoint: newPainPoint }, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Dados inválidos', details: error.errors }, 400)
    }
    console.error('Error creating pain point:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

// Update pain point
bodyMapApp.put('/pain-points', async (c) => {
  const { user } = c.var
  
  try {
    const body = await c.req.json()
    const painPointId = body.id

    if (!painPointId) {
      return c.json({ error: 'ID do ponto de dor é obrigatório' }, 400)
    }

    // Verify pain point belongs to user's clinic
    const existingPainPoint = await c.env.DB.prepare(
      'SELECT id FROM pain_points WHERE id = ? AND clinic_id = ?'
    ).bind(painPointId, user.clinic_id).first()

    if (!existingPainPoint) {
      return c.json({ error: 'Ponto de dor não encontrado' }, 404)
    }

    // Update pain point
    await c.env.DB.prepare(`
      UPDATE pain_points 
      SET pain_level = ?, description = ?, notes = ?, image_url = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      body.painLevel,
      body.description || null,
      body.notes || null,
      body.imageUrl || null,
      painPointId
    ).run()

    const updatedPainPoint = await c.env.DB.prepare(
      'SELECT * FROM pain_points WHERE id = ?'
    ).bind(painPointId).first()

    return c.json({ painPoint: updatedPainPoint })
  } catch (error) {
    console.error('Error updating pain point:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

// Delete pain point
bodyMapApp.delete('/pain-points/:id', async (c) => {
  const { user } = c.var
  const painPointId = parseInt(c.req.param('id'))

  if (isNaN(painPointId)) {
    return c.json({ error: 'ID do ponto de dor inválido' }, 400)
  }

  try {
    // Verify pain point belongs to user's clinic
    const existingPainPoint = await c.env.DB.prepare(
      'SELECT id FROM pain_points WHERE id = ? AND clinic_id = ?'
    ).bind(painPointId, user.clinic_id).first()

    if (!existingPainPoint) {
      return c.json({ error: 'Ponto de dor não encontrado' }, 404)
    }

    // Soft delete (mark as inactive)
    await c.env.DB.prepare(
      'UPDATE pain_points SET is_active = 0, updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(painPointId).run()

    return c.json({ message: 'Ponto de dor removido com sucesso' })
  } catch (error) {
    console.error('Error deleting pain point:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

export { bodyMapApp }

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const consultationRecords = new Hono<{ Bindings: Env }>();

// Schemas
const CreateConsultationRecordSchema = z.object({
  patientId: z.number().min(1, "ID do paciente é obrigatório"),
  appointmentId: z.number().optional(),
  sessionDate: z.string().min(1, "Data da sessão é obrigatória"),
  mainComplaint: z.string().optional(),
  anamnesis: z.string().optional(),
  physicalExam: z.string().optional(),
  diagnosis: z.string().optional(),
  treatmentPlan: z.string().optional(),
  notes: z.string().optional(),
  sessionDuration: z.number().default(60)
});

const UpdateConsultationRecordSchema = z.object({
  mainComplaint: z.string().optional(),
  anamnesis: z.string().optional(),
  physicalExam: z.string().optional(),
  diagnosis: z.string().optional(),
  treatmentPlan: z.string().optional(),
  notes: z.string().optional(),
  sessionDuration: z.number().optional()
});

// GET /api/patients/:patientId/consultation-records - List consultation records for a patient
consultationRecords.get("/patients/:patientId/consultation-records", async (c) => {
  try {
    const patientId = parseInt(c.req.param('patientId'));
    const limit = parseInt(c.req.query('limit') || '10');
    const offset = parseInt(c.req.query('offset') || '0');
    
    if (isNaN(patientId)) {
      return c.json({
        success: false,
        error: 'ID do paciente inválido'
      }, 400);
    }

    const db = c.env.DB;
    
    // Verify patient exists
    const patient = await db.prepare(
      'SELECT id FROM patients WHERE id = ? AND is_active = 1'
    ).bind(patientId).first();

    if (!patient) {
      return c.json({
        success: false,
        error: 'Paciente não encontrado'
      }, 404);
    }

    // Get consultation records with pagination
    const result = await db.prepare(`
      SELECT 
        cr.id,
        cr.patient_id as patientId,
        cr.appointment_id as appointmentId,
        cr.clinic_id as clinicId,
        cr.user_id as userId,
        cr.session_date as sessionDate,
        cr.main_complaint as mainComplaint,
        cr.anamnesis,
        cr.physical_exam as physicalExam,
        cr.diagnosis,
        cr.treatment_plan as treatmentPlan,
        cr.notes,
        cr.session_duration as sessionDuration,
        cr.created_at as createdAt,
        cr.updated_at as updatedAt,
        u.name as therapistName
      FROM consultation_records cr
      LEFT JOIN users u ON cr.user_id = u.id
      WHERE cr.patient_id = ? 
      ORDER BY cr.session_date DESC, cr.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(patientId, limit, offset).all();

    // Get total count for pagination
    const countResult = await db.prepare(
      'SELECT COUNT(*) as total FROM consultation_records WHERE patient_id = ?'
    ).bind(patientId).first();

    return c.json({
      success: true,
      data: result.results || [],
      pagination: {
        total: (countResult as any)?.total || 0,
        limit,
        offset,
        hasMore: ((countResult as any)?.total || 0) > offset + limit
      }
    });
  } catch (error) {
    console.error('Error fetching consultation records:', error);
    return c.json({
      success: false,
      error: 'Falha ao buscar registros de consulta'
    }, 500);
  }
});

// GET /api/consultation-records/:id - Get specific consultation record
consultationRecords.get("/consultation-records/:id", async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'ID do registro inválido'
      }, 400);
    }

    const db = c.env.DB;
    const result = await db.prepare(`
      SELECT 
        cr.*,
        p.name as patientName,
        u.name as therapistName
      FROM consultation_records cr
      LEFT JOIN patients p ON cr.patient_id = p.id
      LEFT JOIN users u ON cr.user_id = u.id
      WHERE cr.id = ?
    `).bind(id).first();

    if (!result) {
      return c.json({
        success: false,
        error: 'Registro de consulta não encontrado'
      }, 404);
    }

    return c.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching consultation record:', error);
    return c.json({
      success: false,
      error: 'Falha ao buscar registro de consulta'
    }, 500);
  }
});

// POST /api/consultation-records - Create new consultation record
consultationRecords.post("/consultation-records", zValidator('json', CreateConsultationRecordSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const db = c.env.DB;
    
    // For now, use hardcoded clinic_id and user_id
    const clinicId = 1;
    const userId = 1;

    // Verify patient exists
    const patient = await db.prepare(
      'SELECT id FROM patients WHERE id = ? AND clinic_id = ? AND is_active = 1'
    ).bind(data.patientId, clinicId).first();

    if (!patient) {
      return c.json({
        success: false,
        error: 'Paciente não encontrado'
      }, 404);
    }

    // If appointmentId is provided, verify it exists and update its status
    if (data.appointmentId) {
      const appointment = await db.prepare(
        'SELECT id, status FROM appointments WHERE id = ? AND patient_id = ?'
      ).bind(data.appointmentId, data.patientId).first();

      if (!appointment) {
        return c.json({
          success: false,
          error: 'Agendamento não encontrado'
        }, 404);
      }

      // Update appointment status to COMPLETED when consultation record is created
      await db.prepare(
        'UPDATE appointments SET status = "COMPLETED", updated_at = datetime("now") WHERE id = ?'
      ).bind(data.appointmentId).run();
    }

    // Create consultation record
    const result = await db.prepare(`
      INSERT INTO consultation_records (
        patient_id, appointment_id, clinic_id, user_id, session_date,
        main_complaint, anamnesis, physical_exam, diagnosis, treatment_plan,
        notes, session_duration, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      data.patientId,
      data.appointmentId || null,
      clinicId,
      userId,
      data.sessionDate,
      data.mainComplaint || null,
      data.anamnesis || null,
      data.physicalExam || null,
      data.diagnosis || null,
      data.treatmentPlan || null,
      data.notes || null,
      data.sessionDuration
    ).run();

    if (!result.success) {
      throw new Error('Falha ao criar registro de consulta');
    }

    const newRecord = {
      id: result.meta.last_row_id,
      ...data,
      clinicId,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return c.json({
      success: true,
      data: newRecord
    }, 201);
  } catch (error) {
    console.error('Error creating consultation record:', error);
    return c.json({
      success: false,
      error: 'Falha ao criar registro de consulta'
    }, 500);
  }
});

// PUT /api/consultation-records/:id - Update consultation record
consultationRecords.put("/consultation-records/:id", zValidator('json', UpdateConsultationRecordSchema), async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const data = c.req.valid('json');
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'ID do registro inválido'
      }, 400);
    }

    const db = c.env.DB;

    // Check if consultation record exists
    const existingRecord = await db.prepare(
      'SELECT id FROM consultation_records WHERE id = ?'
    ).bind(id).first();

    if (!existingRecord) {
      return c.json({
        success: false,
        error: 'Registro de consulta não encontrado'
      }, 404);
    }

    // Update consultation record
    const result = await db.prepare(`
      UPDATE consultation_records SET
        main_complaint = ?, anamnesis = ?, physical_exam = ?, 
        diagnosis = ?, treatment_plan = ?, notes = ?, 
        session_duration = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      data.mainComplaint || null,
      data.anamnesis || null,
      data.physicalExam || null,
      data.diagnosis || null,
      data.treatmentPlan || null,
      data.notes || null,
      data.sessionDuration || 60,
      id
    ).run();

    if (!result.success) {
      throw new Error('Falha ao atualizar registro de consulta');
    }

    return c.json({
      success: true,
      data: { id, ...data }
    });
  } catch (error) {
    console.error('Error updating consultation record:', error);
    return c.json({
      success: false,
      error: 'Falha ao atualizar registro de consulta'
    }, 500);
  }
});

// DELETE /api/consultation-records/:id - Delete consultation record
consultationRecords.delete("/consultation-records/:id", async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'ID do registro inválido'
      }, 400);
    }

    const db = c.env.DB;

    // Check if consultation record exists
    const existingRecord = await db.prepare(
      'SELECT id FROM consultation_records WHERE id = ?'
    ).bind(id).first();

    if (!existingRecord) {
      return c.json({
        success: false,
        error: 'Registro de consulta não encontrado'
      }, 404);
    }

    const result = await db.prepare(
      'DELETE FROM consultation_records WHERE id = ?'
    ).bind(id).run();

    if (!result.success) {
      throw new Error('Falha ao excluir registro de consulta');
    }

    return c.json({
      success: true,
      message: 'Registro de consulta excluído com sucesso'
    });
  } catch (error) {
    console.error('Error deleting consultation record:', error);
    return c.json({
      success: false,
      error: 'Falha ao excluir registro de consulta'
    }, 500);
  }
});

// GET /api/appointments/:appointmentId/consultation-record - Get consultation record for specific appointment
consultationRecords.get("/appointments/:appointmentId/consultation-record", async (c) => {
  try {
    const appointmentId = parseInt(c.req.param('appointmentId'));
    
    if (isNaN(appointmentId)) {
      return c.json({
        success: false,
        error: 'ID do agendamento inválido'
      }, 400);
    }

    const db = c.env.DB;
    const result = await db.prepare(`
      SELECT 
        cr.*,
        p.name as patientName,
        u.name as therapistName
      FROM consultation_records cr
      LEFT JOIN patients p ON cr.patient_id = p.id
      LEFT JOIN users u ON cr.user_id = u.id
      WHERE cr.appointment_id = ?
    `).bind(appointmentId).first();

    return c.json({
      success: true,
      data: result || null
    });
  } catch (error) {
    console.error('Error fetching consultation record by appointment:', error);
    return c.json({
      success: false,
      error: 'Falha ao buscar registro de consulta'
    }, 500);
  }
});

export { consultationRecords };

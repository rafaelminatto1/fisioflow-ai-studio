import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const patientSurgeries = new Hono<{ Bindings: Env }>();

// Schemas
const CreateSurgerySchema = z.object({
  patientId: z.number().min(1, "ID do paciente é obrigatório"),
  surgeryName: z.string().min(1, "Nome da cirurgia é obrigatório"),
  surgeryDate: z.string().min(1, "Data da cirurgia é obrigatória"),
  notes: z.string().optional()
});

const UpdateSurgerySchema = z.object({
  surgeryName: z.string().min(1, "Nome da cirurgia é obrigatório"),
  surgeryDate: z.string().min(1, "Data da cirurgia é obrigatória"),
  notes: z.string().optional()
});

// Helper function to calculate post-op time
function calculatePostOpTime(surgeryDate: string) {
  const surgery = new Date(surgeryDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - surgery.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  
  return {
    days: diffDays,
    weeks: diffWeeks,
    isPostOp: surgery <= now, // true if surgery date is in the past
    displayText: surgery > now 
      ? `Cirurgia em ${diffDays} dia${diffDays !== 1 ? 's' : ''}`
      : `${diffDays} dia${diffDays !== 1 ? 's' : ''} pós-op (${diffWeeks} semana${diffWeeks !== 1 ? 's' : ''})`
  };
}

// GET /api/patients/:patientId/surgeries - List surgeries for a patient
patientSurgeries.get("/patients/:patientId/surgeries", async (c) => {
  try {
    const patientId = parseInt(c.req.param('patientId'));
    
    if (isNaN(patientId)) {
      return c.json({
        success: false,
        error: 'ID do paciente inválido'
      }, 400);
    }

    const db = c.env.DB;
    const result = await db.prepare(`
      SELECT 
        id,
        patient_id as patientId,
        clinic_id as clinicId,
        surgery_name as surgeryName,
        surgery_date as surgeryDate,
        notes,
        created_at as createdAt,
        updated_at as updatedAt
      FROM patient_surgeries 
      WHERE patient_id = ? 
      ORDER BY surgery_date DESC
    `).bind(patientId).all();

    const surgeries = (result.results || []).map((surgery: any) => ({
      ...surgery,
      postOpInfo: calculatePostOpTime(surgery.surgeryDate)
    }));

    return c.json({
      success: true,
      data: surgeries
    });
  } catch (error) {
    console.error('Error fetching patient surgeries:', error);
    return c.json({
      success: false,
      error: 'Falha ao buscar cirurgias do paciente'
    }, 500);
  }
});

// GET /api/surgeries/:id - Get specific surgery
patientSurgeries.get("/surgeries/:id", async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'ID da cirurgia inválido'
      }, 400);
    }

    const db = c.env.DB;
    const result = await db.prepare(`
      SELECT 
        ps.*,
        p.name as patientName
      FROM patient_surgeries ps
      LEFT JOIN patients p ON ps.patient_id = p.id
      WHERE ps.id = ?
    `).bind(id).first();

    if (!result) {
      return c.json({
        success: false,
        error: 'Cirurgia não encontrada'
      }, 404);
    }

    const surgery = {
      ...result,
      postOpInfo: calculatePostOpTime((result as any).surgery_date)
    };

    return c.json({
      success: true,
      data: surgery
    });
  } catch (error) {
    console.error('Error fetching surgery:', error);
    return c.json({
      success: false,
      error: 'Falha ao buscar cirurgia'
    }, 500);
  }
});

// POST /api/surgeries - Create new surgery
patientSurgeries.post("/surgeries", zValidator('json', CreateSurgerySchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const db = c.env.DB;
    
    // For now, use hardcoded clinic_id
    const clinicId = 1;

    // Verify patient exists
    const patient = await db.prepare(
      'SELECT id FROM patients WHERE id = ? AND clinic_id = ?'
    ).bind(data.patientId, clinicId).first();

    if (!patient) {
      return c.json({
        success: false,
        error: 'Paciente não encontrado'
      }, 404);
    }

    const result = await db.prepare(`
      INSERT INTO patient_surgeries (
        patient_id, clinic_id, surgery_name, surgery_date, notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      data.patientId,
      clinicId,
      data.surgeryName,
      data.surgeryDate,
      data.notes || null
    ).run();

    if (!result.success) {
      throw new Error('Falha ao criar registro de cirurgia');
    }

    const newSurgery = {
      id: result.meta.last_row_id,
      ...data,
      postOpInfo: calculatePostOpTime(data.surgeryDate)
    };

    return c.json({
      success: true,
      data: newSurgery
    }, 201);
  } catch (error) {
    console.error('Error creating surgery:', error);
    return c.json({
      success: false,
      error: 'Falha ao criar registro de cirurgia'
    }, 500);
  }
});

// PUT /api/surgeries/:id - Update surgery
patientSurgeries.put("/surgeries/:id", zValidator('json', UpdateSurgerySchema), async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const data = c.req.valid('json');
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'ID da cirurgia inválido'
      }, 400);
    }

    const db = c.env.DB;

    // Check if surgery exists
    const existingSurgery = await db.prepare(
      'SELECT id FROM patient_surgeries WHERE id = ?'
    ).bind(id).first();

    if (!existingSurgery) {
      return c.json({
        success: false,
        error: 'Cirurgia não encontrada'
      }, 404);
    }

    const result = await db.prepare(`
      UPDATE patient_surgeries SET
        surgery_name = ?, surgery_date = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      data.surgeryName,
      data.surgeryDate,
      data.notes || null,
      id
    ).run();

    if (!result.success) {
      throw new Error('Falha ao atualizar cirurgia');
    }

    const updatedSurgery = {
      id,
      ...data,
      postOpInfo: calculatePostOpTime(data.surgeryDate)
    };

    return c.json({
      success: true,
      data: updatedSurgery
    });
  } catch (error) {
    console.error('Error updating surgery:', error);
    return c.json({
      success: false,
      error: 'Falha ao atualizar cirurgia'
    }, 500);
  }
});

// DELETE /api/surgeries/:id - Delete surgery
patientSurgeries.delete("/surgeries/:id", async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'ID da cirurgia inválido'
      }, 400);
    }

    const db = c.env.DB;

    // Check if surgery exists
    const existingSurgery = await db.prepare(
      'SELECT id FROM patient_surgeries WHERE id = ?'
    ).bind(id).first();

    if (!existingSurgery) {
      return c.json({
        success: false,
        error: 'Cirurgia não encontrada'
      }, 404);
    }

    const result = await db.prepare(
      'DELETE FROM patient_surgeries WHERE id = ?'
    ).bind(id).run();

    if (!result.success) {
      throw new Error('Falha ao excluir cirurgia');
    }

    return c.json({
      success: true,
      message: 'Cirurgia excluída com sucesso'
    });
  } catch (error) {
    console.error('Error deleting surgery:', error);
    return c.json({
      success: false,
      error: 'Falha ao excluir cirurgia'
    }, 500);
  }
});

// GET /api/patients/:patientId/surgeries/summary - Get post-op summary for patient
patientSurgeries.get("/patients/:patientId/surgeries/summary", async (c) => {
  try {
    const patientId = parseInt(c.req.param('patientId'));
    
    if (isNaN(patientId)) {
      return c.json({
        success: false,
        error: 'ID do paciente inválido'
      }, 400);
    }

    const db = c.env.DB;
    const result = await db.prepare(`
      SELECT 
        COUNT(*) as totalSurgeries,
        MIN(surgery_date) as oldestSurgery,
        MAX(surgery_date) as recentSurgery
      FROM patient_surgeries 
      WHERE patient_id = ?
    `).bind(patientId).first();

    if (!result) {
      return c.json({
        success: true,
        data: {
          totalSurgeries: 0,
          hasRecentSurgery: false,
          recentPostOpInfo: null
        }
      });
    }

    const summary = result as any;
    const recentPostOpInfo = summary.recentSurgery 
      ? calculatePostOpTime(summary.recentSurgery) 
      : null;

    return c.json({
      success: true,
      data: {
        totalSurgeries: summary.totalSurgeries,
        hasRecentSurgery: summary.totalSurgeries > 0,
        recentPostOpInfo,
        oldestSurgery: summary.oldestSurgery,
        recentSurgery: summary.recentSurgery
      }
    });
  } catch (error) {
    console.error('Error fetching surgery summary:', error);
    return c.json({
      success: false,
      error: 'Falha ao buscar resumo de cirurgias'
    }, 500);
  }
});

export { patientSurgeries };

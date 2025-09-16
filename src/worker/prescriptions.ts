import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const prescriptions = new Hono<{ Bindings: Env }>();

// Prescription exercise schema
const PrescriptionExerciseSchema = z.object({
  exerciseId: z.number().min(1, "Exercício é obrigatório"),
  exerciseName: z.string().min(1, "Nome do exercício é obrigatório"),
  sets: z.number().min(1, "Número de séries deve ser pelo menos 1").default(1),
  reps: z.string().optional(),
  duration: z.number().min(0).default(0),
  frequency: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/prescriptions - List all prescriptions
prescriptions.get("/", async (c) => {
  try {
    const db = c.env.DB;
    const result = await db.prepare(`
      SELECT 
        p.id,
        p.patient_id as patientId,
        p.user_id as userId,
        p.clinic_id as clinicId,
        p.title,
        p.description,
        p.start_date as startDate,
        p.end_date as endDate,
        p.status,
        p.notes,
        p.created_at as createdAt,
        p.updated_at as updatedAt,
        pt.name as patientName
      FROM prescriptions p
      LEFT JOIN patients pt ON p.patient_id = pt.id
      ORDER BY p.created_at DESC
    `).all();

    // Get exercises for each prescription
    const prescriptionsWithExercises = await Promise.all(
      (result.results || []).map(async (prescription: any) => {
        const exercisesResult = await db.prepare(`
          SELECT 
            exercise_id as exerciseId,
            exercise_name as exerciseName,
            sets,
            reps,
            duration,
            frequency,
            notes
          FROM prescription_exercises
          WHERE prescription_id = ?
          ORDER BY id ASC
        `).bind(prescription.id).all();

        return {
          ...prescription,
          exercises: exercisesResult.results || []
        };
      })
    );

    return c.json({
      success: true,
      data: prescriptionsWithExercises
    });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch prescriptions'
    }, 500);
  }
});

// GET /api/prescriptions/:id - Get specific prescription
prescriptions.get("/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;
    
    const result = await db.prepare(`
      SELECT 
        p.id,
        p.patient_id as patientId,
        p.user_id as userId,
        p.clinic_id as clinicId,
        p.title,
        p.description,
        p.start_date as startDate,
        p.end_date as endDate,
        p.status,
        p.notes,
        p.created_at as createdAt,
        p.updated_at as updatedAt,
        pt.name as patientName
      FROM prescriptions p
      LEFT JOIN patients pt ON p.patient_id = pt.id
      WHERE p.id = ?
    `).bind(id).first();

    if (!result) {
      return c.json({
        success: false,
        error: 'Prescription not found'
      }, 404);
    }

    // Get exercises for this prescription
    const exercisesResult = await db.prepare(`
      SELECT 
        exercise_id as exerciseId,
        exercise_name as exerciseName,
        sets,
        reps,
        duration,
        frequency,
        notes
      FROM prescription_exercises
      WHERE prescription_id = ?
      ORDER BY id ASC
    `).bind(id).all();

    const prescription = {
      ...result,
      exercises: exercisesResult.results || []
    };

    return c.json({
      success: true,
      data: prescription
    });
  } catch (error) {
    console.error('Error fetching prescription:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch prescription'
    }, 500);
  }
});

// POST /api/prescriptions - Create new prescription
const CreatePrescriptionSchema = z.object({
  patientId: z.number().min(1, "Paciente é obrigatório"),
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  endDate: z.string().min(1, "Data de fim é obrigatória"),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED', 'PAUSED']).default('ACTIVE'),
  notes: z.string().optional(),
  exercises: z.array(PrescriptionExerciseSchema).min(1, "Pelo menos um exercício é obrigatório"),
});

prescriptions.post("/", zValidator('json', CreatePrescriptionSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const db = c.env.DB;
    
    // For now, use hardcoded clinic_id and user_id
    const clinicId = 1;
    const userId = 1;

    // Create prescription
    const prescriptionResult = await db.prepare(`
      INSERT INTO prescriptions (
        patient_id, user_id, clinic_id, title, description,
        start_date, end_date, status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      data.patientId,
      userId,
      clinicId,
      data.title,
      data.description,
      data.startDate,
      data.endDate,
      data.status,
      data.notes || null
    ).run();

    if (!prescriptionResult.success) {
      throw new Error('Failed to create prescription');
    }

    const prescriptionId = prescriptionResult.meta.last_row_id;

    // Create prescription exercises
    for (const exercise of data.exercises) {
      await db.prepare(`
        INSERT INTO prescription_exercises (
          prescription_id, exercise_id, exercise_name, sets, reps,
          duration, frequency, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        prescriptionId,
        exercise.exerciseId,
        exercise.exerciseName,
        exercise.sets,
        exercise.reps || null,
        exercise.duration,
        exercise.frequency || null,
        exercise.notes || null
      ).run();
    }

    return c.json({
      success: true,
      data: { id: prescriptionId, ...data }
    }, 201);
  } catch (error) {
    console.error('Error creating prescription:', error);
    return c.json({
      success: false,
      error: 'Failed to create prescription'
    }, 500);
  }
});

// PUT /api/prescriptions/:id - Update prescription
prescriptions.put("/:id", zValidator('json', CreatePrescriptionSchema), async (c) => {
  try {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    const db = c.env.DB;

    // Update prescription
    const prescriptionResult = await db.prepare(`
      UPDATE prescriptions SET
        patient_id = ?, title = ?, description = ?, start_date = ?,
        end_date = ?, status = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      data.patientId,
      data.title,
      data.description,
      data.startDate,
      data.endDate,
      data.status,
      data.notes || null,
      id
    ).run();

    if (!prescriptionResult.success) {
      throw new Error('Failed to update prescription');
    }

    // Delete existing exercises and recreate them
    await db.prepare(`
      DELETE FROM prescription_exercises WHERE prescription_id = ?
    `).bind(id).run();

    // Create updated prescription exercises
    for (const exercise of data.exercises) {
      await db.prepare(`
        INSERT INTO prescription_exercises (
          prescription_id, exercise_id, exercise_name, sets, reps,
          duration, frequency, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        id,
        exercise.exerciseId,
        exercise.exerciseName,
        exercise.sets,
        exercise.reps || null,
        exercise.duration,
        exercise.frequency || null,
        exercise.notes || null
      ).run();
    }

    return c.json({
      success: true,
      data: { id: parseInt(id), ...data }
    });
  } catch (error) {
    console.error('Error updating prescription:', error);
    return c.json({
      success: false,
      error: 'Failed to update prescription'
    }, 500);
  }
});

// PATCH /api/prescriptions/:id/status - Update prescription status
const UpdatePrescriptionStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED', 'PAUSED'])
});

prescriptions.patch("/:id/status", zValidator('json', UpdatePrescriptionStatusSchema), async (c) => {
  try {
    const id = c.req.param('id');
    const { status } = c.req.valid('json');
    const db = c.env.DB;

    const result = await db.prepare(`
      UPDATE prescriptions SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(status, id).run();

    if (!result.success) {
      throw new Error('Failed to update prescription status');
    }

    return c.json({
      success: true,
      data: { id: parseInt(id), status }
    });
  } catch (error) {
    console.error('Error updating prescription status:', error);
    return c.json({
      success: false,
      error: 'Failed to update prescription status'
    }, 500);
  }
});

// DELETE /api/prescriptions/:id - Delete prescription
prescriptions.delete("/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;

    // Delete prescription exercises first
    await db.prepare(`
      DELETE FROM prescription_exercises WHERE prescription_id = ?
    `).bind(id).run();

    // Delete prescription
    const result = await db.prepare(`
      DELETE FROM prescriptions WHERE id = ?
    `).bind(id).run();

    if (!result.success) {
      throw new Error('Failed to delete prescription');
    }

    return c.json({
      success: true,
      message: 'Prescription deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting prescription:', error);
    return c.json({
      success: false,
      error: 'Failed to delete prescription'
    }, 500);
  }
});

export { prescriptions };

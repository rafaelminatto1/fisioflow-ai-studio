import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const exercises = new Hono<{ Bindings: Env }>();

// GET /api/exercises - List all exercises
exercises.get("/", async (c) => {
  try {
    const db = c.env.DB;
    const result = await db.prepare(`
      SELECT 
        id,
        name,
        description,
        instructions,
        video_url as videoUrl,
        thumbnail_url as thumbnailUrl,
        duration,
        difficulty,
        equipment,
        body_parts as bodyParts,
        conditions,
        contraindications,
        category,
        specialty,
        is_active as isActive,
        created_at as createdAt,
        updated_at as updatedAt
      FROM exercises 
      WHERE is_active = 1 
      ORDER BY name ASC
    `).all();

    return c.json({
      success: true,
      data: result.results || []
    });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch exercises'
    }, 500);
  }
});

// GET /api/exercises/:id - Get specific exercise
exercises.get("/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;
    
    const result = await db.prepare(`
      SELECT 
        id,
        name,
        description,
        instructions,
        video_url as videoUrl,
        thumbnail_url as thumbnailUrl,
        duration,
        difficulty,
        equipment,
        body_parts as bodyParts,
        conditions,
        contraindications,
        category,
        specialty,
        is_active as isActive,
        created_at as createdAt,
        updated_at as updatedAt
      FROM exercises 
      WHERE id = ? AND is_active = 1
    `).bind(id).first();

    if (!result) {
      return c.json({
        success: false,
        error: 'Exercise not found'
      }, 404);
    }

    return c.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching exercise:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch exercise'
    }, 500);
  }
});

// POST /api/exercises - Create new exercise
const CreateExerciseSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  instructions: z.string().optional(),
  videoUrl: z.string().url("URL inválida").optional(),
  thumbnailUrl: z.string().url("URL inválida").optional(),
  duration: z.number().min(0).optional(),
  difficulty: z.number().min(1).max(5).default(1),
  equipment: z.string().optional(),
  bodyParts: z.string().optional(),
  conditions: z.string().optional(),
  contraindications: z.string().optional(),
  category: z.string().optional(),
  specialty: z.string().optional(),
});

exercises.post("/", zValidator('json', CreateExerciseSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const db = c.env.DB;

    const result = await db.prepare(`
      INSERT INTO exercises (
        name, description, instructions, video_url, thumbnail_url,
        duration, difficulty, equipment, body_parts, conditions,
        contraindications, category, specialty, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      data.name,
      data.description,
      data.instructions || null,
      data.videoUrl || null,
      data.thumbnailUrl || null,
      data.duration || null,
      data.difficulty,
      data.equipment || null,
      data.bodyParts || null,
      data.conditions || null,
      data.contraindications || null,
      data.category || null,
      data.specialty || null
    ).run();

    if (!result.success) {
      throw new Error('Failed to create exercise');
    }

    return c.json({
      success: true,
      data: { id: result.meta.last_row_id, ...data }
    }, 201);
  } catch (error) {
    console.error('Error creating exercise:', error);
    return c.json({
      success: false,
      error: 'Failed to create exercise'
    }, 500);
  }
});

// PUT /api/exercises/:id - Update exercise
exercises.put("/:id", zValidator('json', CreateExerciseSchema), async (c) => {
  try {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    const db = c.env.DB;

    const result = await db.prepare(`
      UPDATE exercises SET
        name = ?, description = ?, instructions = ?, video_url = ?, 
        thumbnail_url = ?, duration = ?, difficulty = ?, equipment = ?,
        body_parts = ?, conditions = ?, contraindications = ?, 
        category = ?, specialty = ?, updated_at = datetime('now')
      WHERE id = ? AND is_active = 1
    `).bind(
      data.name,
      data.description,
      data.instructions || null,
      data.videoUrl || null,
      data.thumbnailUrl || null,
      data.duration || null,
      data.difficulty,
      data.equipment || null,
      data.bodyParts || null,
      data.conditions || null,
      data.contraindications || null,
      data.category || null,
      data.specialty || null,
      id
    ).run();

    if (!result.success) {
      throw new Error('Failed to update exercise');
    }

    return c.json({
      success: true,
      data: { id: parseInt(id), ...data }
    });
  } catch (error) {
    console.error('Error updating exercise:', error);
    return c.json({
      success: false,
      error: 'Failed to update exercise'
    }, 500);
  }
});

// DELETE /api/exercises/:id - Soft delete exercise
exercises.delete("/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;

    const result = await db.prepare(`
      UPDATE exercises SET is_active = 0, updated_at = datetime('now')
      WHERE id = ?
    `).bind(id).run();

    if (!result.success) {
      throw new Error('Failed to delete exercise');
    }

    return c.json({
      success: true,
      message: 'Exercise deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    return c.json({
      success: false,
      error: 'Failed to delete exercise'
    }, 500);
  }
});

export { exercises };

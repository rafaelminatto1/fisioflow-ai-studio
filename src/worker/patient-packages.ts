import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const patientPackages = new Hono<{ Bindings: Env }>();

// Schemas
const CreatePackageSchema = z.object({
  patientId: z.number().min(1, "ID do paciente é obrigatório"),
  packageType: z.string().default("10_SESSIONS"),
  totalSessions: z.number().min(1, "Número de sessões deve ser maior que 0").default(10),
  purchasePrice: z.number().min(0, "Preço deve ser positivo"),
  purchaseDate: z.string().min(1, "Data de compra é obrigatória"),
  expiryDate: z.string().optional()
});

const UpdatePackageSchema = z.object({
  sessionsUsed: z.number().min(0, "Sessões utilizadas não pode ser negativo"),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional()
});

// GET /api/patients/:patientId/packages - List packages for a patient
patientPackages.get("/patients/:patientId/packages", async (c) => {
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
        package_type as packageType,
        total_sessions as totalSessions,
        sessions_used as sessionsUsed,
        purchase_date as purchaseDate,
        purchase_price as purchasePrice,
        expiry_date as expiryDate,
        status,
        created_at as createdAt,
        updated_at as updatedAt
      FROM patient_packages 
      WHERE patient_id = ? 
      ORDER BY purchase_date DESC, created_at DESC
    `).bind(patientId).all();

    const packages = (result.results || []).map((pkg: any) => ({
      ...pkg,
      remainingSessions: pkg.totalSessions - pkg.sessionsUsed,
      isExpired: pkg.expiryDate ? new Date(pkg.expiryDate) < new Date() : false,
      isActive: pkg.status === 'ACTIVE' && (pkg.totalSessions - pkg.sessionsUsed) > 0
    }));

    return c.json({
      success: true,
      data: packages
    });
  } catch (error) {
    console.error('Error fetching patient packages:', error);
    return c.json({
      success: false,
      error: 'Falha ao buscar pacotes do paciente'
    }, 500);
  }
});

// GET /api/packages/:id - Get specific package
patientPackages.get("/packages/:id", async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'ID do pacote inválido'
      }, 400);
    }

    const db = c.env.DB;
    const result = await db.prepare(`
      SELECT 
        pp.*,
        p.name as patientName
      FROM patient_packages pp
      LEFT JOIN patients p ON pp.patient_id = p.id
      WHERE pp.id = ?
    `).bind(id).first();

    if (!result) {
      return c.json({
        success: false,
        error: 'Pacote não encontrado'
      }, 404);
    }

    const pkg = result as any;
    const packageData = {
      ...result,
      remainingSessions: pkg.total_sessions - pkg.sessions_used,
      isExpired: pkg.expiry_date ? new Date(pkg.expiry_date) < new Date() : false,
      isActive: pkg.status === 'ACTIVE' && (pkg.total_sessions - pkg.sessions_used) > 0
    };

    return c.json({
      success: true,
      data: packageData
    });
  } catch (error) {
    console.error('Error fetching package:', error);
    return c.json({
      success: false,
      error: 'Falha ao buscar pacote'
    }, 500);
  }
});

// POST /api/packages - Create new package
patientPackages.post("/packages", zValidator('json', CreatePackageSchema), async (c) => {
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
      INSERT INTO patient_packages (
        patient_id, clinic_id, package_type, total_sessions, 
        purchase_price, purchase_date, expiry_date, sessions_used,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))
    `).bind(
      data.patientId,
      clinicId,
      data.packageType,
      data.totalSessions,
      data.purchasePrice,
      data.purchaseDate,
      data.expiryDate || null
    ).run();

    if (!result.success) {
      throw new Error('Falha ao criar pacote');
    }

    // Create corresponding financial transaction
    await db.prepare(`
      INSERT INTO financial_transactions (
        clinic_id, user_id, patient_id, type, category, description,
        amount, transaction_date, status, payment_method, notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      clinicId,
      1, // hardcoded user_id for now
      data.patientId,
      'INCOME',
      'Pacote de Sessões',
      `${data.packageType} - ${data.totalSessions} sessões`,
      data.purchasePrice,
      data.purchaseDate,
      'PAID',
      null,
      `Pacote ID: ${result.meta.last_row_id}`
    ).run();

    return c.json({
      success: true,
      data: { id: result.meta.last_row_id, ...data }
    }, 201);
  } catch (error) {
    console.error('Error creating package:', error);
    return c.json({
      success: false,
      error: 'Falha ao criar pacote'
    }, 500);
  }
});

// PUT /api/packages/:id - Update package (mainly for using sessions)
patientPackages.put("/packages/:id", zValidator('json', UpdatePackageSchema), async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const data = c.req.valid('json');
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'ID do pacote inválido'
      }, 400);
    }

    const db = c.env.DB;

    // Check if package exists
    const existingPackage = await db.prepare(
      'SELECT * FROM patient_packages WHERE id = ?'
    ).bind(id).first();

    if (!existingPackage) {
      return c.json({
        success: false,
        error: 'Pacote não encontrado'
      }, 404);
    }

    // Update sessions used and potentially status
    let updateQuery = `
      UPDATE patient_packages SET
        sessions_used = ?, updated_at = datetime('now')
    `;
    const params = [data.sessionsUsed];

    // Auto-complete package if all sessions are used
    const newStatus = data.status || 
      (data.sessionsUsed >= (existingPackage as any).total_sessions ? 'COMPLETED' : (existingPackage as any).status);

    updateQuery += `, status = ? WHERE id = ?`;
    params.push(newStatus, id);

    const result = await db.prepare(updateQuery).bind(...params).run();

    if (!result.success) {
      throw new Error('Falha ao atualizar pacote');
    }

    return c.json({
      success: true,
      data: { id, sessionsUsed: data.sessionsUsed, status: newStatus }
    });
  } catch (error) {
    console.error('Error updating package:', error);
    return c.json({
      success: false,
      error: 'Falha ao atualizar pacote'
    }, 500);
  }
});

// POST /api/packages/:id/use-session - Use one session from package
patientPackages.post("/packages/:id/use-session", async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'ID do pacote inválido'
      }, 400);
    }

    const db = c.env.DB;

    // Get current package info
    const packageInfo = await db.prepare(
      'SELECT * FROM patient_packages WHERE id = ? AND status = "ACTIVE"'
    ).bind(id).first();

    if (!packageInfo) {
      return c.json({
        success: false,
        error: 'Pacote não encontrado ou não ativo'
      }, 404);
    }

    const pkg = packageInfo as any;
    const remainingSessions = pkg.total_sessions - pkg.sessions_used;

    if (remainingSessions <= 0) {
      return c.json({
        success: false,
        error: 'Não há sessões restantes neste pacote'
      }, 400);
    }

    // Check if package is expired
    if (pkg.expiry_date && new Date(pkg.expiry_date) < new Date()) {
      return c.json({
        success: false,
        error: 'Pacote expirado'
      }, 400);
    }

    // Use one session
    const newSessionsUsed = pkg.sessions_used + 1;
    const newStatus = newSessionsUsed >= pkg.total_sessions ? 'COMPLETED' : 'ACTIVE';

    const result = await db.prepare(`
      UPDATE patient_packages SET
        sessions_used = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(newSessionsUsed, newStatus, id).run();

    if (!result.success) {
      throw new Error('Falha ao usar sessão do pacote');
    }

    return c.json({
      success: true,
      data: {
        id,
        sessionsUsed: newSessionsUsed,
        remainingSessions: pkg.total_sessions - newSessionsUsed,
        status: newStatus
      }
    });
  } catch (error) {
    console.error('Error using package session:', error);
    return c.json({
      success: false,
      error: 'Falha ao usar sessão do pacote'
    }, 500);
  }
});

// DELETE /api/packages/:id - Cancel package
patientPackages.delete("/packages/:id", async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: 'ID do pacote inválido'
      }, 400);
    }

    const db = c.env.DB;

    const result = await db.prepare(`
      UPDATE patient_packages SET
        status = 'CANCELLED', updated_at = datetime('now')
      WHERE id = ?
    `).bind(id).run();

    if (!result.success) {
      throw new Error('Falha ao cancelar pacote');
    }

    return c.json({
      success: true,
      message: 'Pacote cancelado com sucesso'
    });
  } catch (error) {
    console.error('Error cancelling package:', error);
    return c.json({
      success: false,
      error: 'Falha ao cancelar pacote'
    }, 500);
  }
});

export { patientPackages };

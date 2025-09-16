import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const inventory = new Hono<{ Bindings: Env }>();

// Validation schemas
const CreateInventoryItemSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  category: z.enum(['CONSUMIVEL', 'EQUIPAMENTO', 'MEDICAMENTO', 'ESCRITORIO', 'LIMPEZA', 'OUTROS']).default('CONSUMIVEL'),
  currentQuantity: z.number().min(0, "Quantidade deve ser positiva").default(0),
  minQuantity: z.number().min(0, "Quantidade mínima deve ser positiva").default(10),
  unit: z.string().min(1, "Unidade é obrigatória").default('UN'),
  location: z.string().optional(),
  supplier: z.string().optional(),
  costPerUnit: z.number().min(0).optional(),
  lastPurchaseDate: z.string().optional()
});

const CreateDefectSchema = z.object({
  defectDate: z.string().min(1, "Data do defeito é obrigatória"),
  description: z.string().min(1, "Descrição é obrigatória"),
  defectType: z.enum(['MECANICO', 'ELETRICO', 'SOFTWARE', 'DESGASTE', 'QUEBRA', 'OUTROS']).default('MECANICO'),
  severity: z.enum(['BAIXO', 'MEDIO', 'ALTO', 'CRITICO']).default('MEDIO'),
  repairNotes: z.string().optional(),
  partsNeeded: z.string().optional(),
  estimatedCost: z.number().min(0).optional()
});

const UpdateQuantitySchema = z.object({
  quantity: z.number().min(0, "Quantidade deve ser positiva"),
  operation: z.enum(['SET', 'ADD', 'SUBTRACT']).default('SET')
});

// GET /api/inventory - List all inventory items
inventory.get("/", async (c) => {
  try {
    const db = c.env.DB;
    const user = (c as any).get('user');
    
    if (!user || !user.clinicId) {
      return c.json({
        success: false,
        error: 'Usuário não autenticado'
      }, 401);
    }

    const { category, lowStock, search } = c.req.query();
    
    let query = `
      SELECT 
        i.*,
        (CASE 
          WHEN i.current_quantity <= i.min_quantity THEN 'CRITICAL'
          WHEN i.current_quantity <= (i.min_quantity * 1.2) THEN 'LOW' 
          ELSE 'OK'
        END) as stock_status,
        COUNT(d.id) as defect_count,
        COUNT(CASE WHEN d.is_resolved = 0 THEN 1 END) as open_defects
      FROM inventory_items i
      LEFT JOIN equipment_defects d ON i.id = d.inventory_item_id
      WHERE i.clinic_id = ? AND i.is_active = 1
    `;
    
    const params: any[] = [user.clinicId];
    
    if (category && category !== 'ALL') {
      query += ` AND i.category = ?`;
      params.push(category);
    }
    
    if (lowStock === 'true') {
      query += ` AND i.current_quantity <= i.min_quantity`;
    }
    
    if (search) {
      query += ` AND (i.name LIKE ? OR i.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ` GROUP BY i.id ORDER BY i.name ASC`;
    
    const result = await db.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: result.results || []
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return c.json({
      success: false,
      error: 'Falha ao buscar itens do inventário'
    }, 500);
  }
});

// GET /api/inventory/alerts - Get low stock alerts
inventory.get("/alerts", async (c) => {
  try {
    const db = c.env.DB;
    const user = (c as any).get('user');
    
    if (!user || !user.clinicId) {
      return c.json({
        success: false,
        error: 'Usuário não autenticado'
      }, 401);
    }

    const result = await db.prepare(`
      SELECT 
        i.id, i.name, i.current_quantity, i.min_quantity, i.category,
        (CASE 
          WHEN i.current_quantity = 0 THEN 'OUT_OF_STOCK'
          WHEN i.current_quantity <= i.min_quantity THEN 'CRITICAL'
          WHEN i.current_quantity <= (i.min_quantity * 1.2) THEN 'LOW'
        END) as alert_level
      FROM inventory_items i
      WHERE i.clinic_id = ? AND i.is_active = 1 
        AND i.current_quantity <= (i.min_quantity * 1.2)
      ORDER BY 
        CASE 
          WHEN i.current_quantity = 0 THEN 1
          WHEN i.current_quantity <= i.min_quantity THEN 2
          ELSE 3
        END,
        i.current_quantity ASC
    `).bind(user.clinicId).all();

    return c.json({
      success: true,
      data: result.results || []
    });
  } catch (error) {
    console.error('Error fetching inventory alerts:', error);
    return c.json({
      success: false,
      error: 'Falha ao buscar alertas do inventário'
    }, 500);
  }
});

// POST /api/inventory - Create new inventory item
inventory.post("/", zValidator('json', CreateInventoryItemSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const db = c.env.DB;
    const user = (c as any).get('user');
    
    if (!user || !user.clinicId) {
      return c.json({
        success: false,
        error: 'Usuário não autenticado'
      }, 401);
    }

    const result = await db.prepare(`
      INSERT INTO inventory_items (
        clinic_id, name, description, category, current_quantity, 
        min_quantity, unit, location, supplier, cost_per_unit, 
        last_purchase_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      user.clinicId,
      data.name,
      data.description || null,
      data.category,
      data.currentQuantity,
      data.minQuantity,
      data.unit,
      data.location || null,
      data.supplier || null,
      data.costPerUnit || null,
      data.lastPurchaseDate || null
    ).run();

    if (!result.success) {
      throw new Error('Falha ao criar item do inventário');
    }

    return c.json({
      success: true,
      data: { id: result.meta.last_row_id, ...data }
    }, 201);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return c.json({
      success: false,
      error: 'Falha ao criar item do inventário'
    }, 500);
  }
});

// PUT /api/inventory/:id - Update inventory item
inventory.put("/:id", zValidator('json', CreateInventoryItemSchema), async (c) => {
  try {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    const db = c.env.DB;
    const user = (c as any).get('user');
    
    if (!user || !user.clinicId) {
      return c.json({
        success: false,
        error: 'Usuário não autenticado'
      }, 401);
    }

    const result = await db.prepare(`
      UPDATE inventory_items SET
        name = ?, description = ?, category = ?, current_quantity = ?,
        min_quantity = ?, unit = ?, location = ?, supplier = ?,
        cost_per_unit = ?, last_purchase_date = ?, updated_at = datetime('now')
      WHERE id = ? AND clinic_id = ?
    `).bind(
      data.name,
      data.description || null,
      data.category,
      data.currentQuantity,
      data.minQuantity,
      data.unit,
      data.location || null,
      data.supplier || null,
      data.costPerUnit || null,
      data.lastPurchaseDate || null,
      id,
      user.clinicId
    ).run();

    if (!result.success) {
      throw new Error('Falha ao atualizar item do inventário');
    }

    return c.json({
      success: true,
      data: { id: parseInt(id), ...data }
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return c.json({
      success: false,
      error: 'Falha ao atualizar item do inventário'
    }, 500);
  }
});

// PATCH /api/inventory/:id/quantity - Update item quantity
inventory.patch("/:id/quantity", zValidator('json', UpdateQuantitySchema), async (c) => {
  try {
    const id = c.req.param('id');
    const { quantity, operation } = c.req.valid('json');
    const db = c.env.DB;
    const user = (c as any).get('user');
    
    if (!user || !user.clinicId) {
      return c.json({
        success: false,
        error: 'Usuário não autenticado'
      }, 401);
    }

    // Get current quantity
    const item = await db.prepare(`
      SELECT current_quantity FROM inventory_items 
      WHERE id = ? AND clinic_id = ?
    `).bind(id, user.clinicId).first();

    if (!item) {
      return c.json({
        success: false,
        error: 'Item não encontrado'
      }, 404);
    }

    let newQuantity = quantity;
    if (operation === 'ADD') {
      newQuantity = (item.current_quantity as number) + quantity;
    } else if (operation === 'SUBTRACT') {
      newQuantity = Math.max(0, (item.current_quantity as number) - quantity);
    }

    const result = await db.prepare(`
      UPDATE inventory_items SET
        current_quantity = ?, updated_at = datetime('now')
      WHERE id = ? AND clinic_id = ?
    `).bind(newQuantity, id, user.clinicId).run();

    if (!result.success) {
      throw new Error('Falha ao atualizar quantidade');
    }

    return c.json({
      success: true,
      data: { id: parseInt(id), currentQuantity: newQuantity }
    });
  } catch (error) {
    console.error('Error updating quantity:', error);
    return c.json({
      success: false,
      error: 'Falha ao atualizar quantidade'
    }, 500);
  }
});

// POST /api/inventory/:id/defect - Report equipment defect
inventory.post("/:id/defect", zValidator('json', CreateDefectSchema), async (c) => {
  try {
    const itemId = c.req.param('id');
    const data = c.req.valid('json');
    const db = c.env.DB;
    const user = (c as any).get('user');
    
    if (!user || !user.clinicId) {
      return c.json({
        success: false,
        error: 'Usuário não autenticado'
      }, 401);
    }

    const result = await db.prepare(`
      INSERT INTO equipment_defects (
        inventory_item_id, clinic_id, user_id, defect_date, description,
        defect_type, severity, repair_notes, parts_needed, estimated_cost,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      itemId,
      user.clinicId,
      user.id,
      data.defectDate,
      data.description,
      data.defectType,
      data.severity,
      data.repairNotes || null,
      data.partsNeeded || null,
      data.estimatedCost || null
    ).run();

    if (!result.success) {
      throw new Error('Falha ao registrar defeito');
    }

    return c.json({
      success: true,
      data: { id: result.meta.last_row_id, ...data }
    }, 201);
  } catch (error) {
    console.error('Error creating defect:', error);
    return c.json({
      success: false,
      error: 'Falha ao registrar defeito'
    }, 500);
  }
});

// GET /api/inventory/:id/defects - Get defects for an item
inventory.get("/:id/defects", async (c) => {
  try {
    const itemId = c.req.param('id');
    const db = c.env.DB;
    const user = (c as any).get('user');
    
    if (!user || !user.clinicId) {
      return c.json({
        success: false,
        error: 'Usuário não autenticado'
      }, 401);
    }

    const result = await db.prepare(`
      SELECT 
        d.*,
        u.name as reporter_name,
        ru.name as resolver_name
      FROM equipment_defects d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN users ru ON d.resolved_by = ru.id
      WHERE d.inventory_item_id = ? AND d.clinic_id = ?
      ORDER BY d.defect_date DESC
    `).bind(itemId, user.clinicId).all();

    return c.json({
      success: true,
      data: result.results || []
    });
  } catch (error) {
    console.error('Error fetching defects:', error);
    return c.json({
      success: false,
      error: 'Falha ao buscar defeitos'
    }, 500);
  }
});

// PUT /api/inventory/defects/:id/resolve - Resolve a defect
inventory.put("/defects/:id/resolve", async (c) => {
  try {
    const defectId = c.req.param('id');
    const { resolutionNotes } = await c.req.json();
    const db = c.env.DB;
    const user = (c as any).get('user');
    
    if (!user || !user.clinicId) {
      return c.json({
        success: false,
        error: 'Usuário não autenticado'
      }, 401);
    }

    const result = await db.prepare(`
      UPDATE equipment_defects SET
        is_resolved = 1,
        resolved_date = date('now'),
        resolved_by = ?,
        resolution_notes = ?,
        updated_at = datetime('now')
      WHERE id = ? AND clinic_id = ?
    `).bind(user.id, resolutionNotes || null, defectId, user.clinicId).run();

    if (!result.success) {
      throw new Error('Falha ao resolver defeito');
    }

    return c.json({
      success: true,
      message: 'Defeito resolvido com sucesso'
    });
  } catch (error) {
    console.error('Error resolving defect:', error);
    return c.json({
      success: false,
      error: 'Falha ao resolver defeito'
    }, 500);
  }
});

// DELETE /api/inventory/:id - Soft delete inventory item
inventory.delete("/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;
    const user = (c as any).get('user');
    
    if (!user || !user.clinicId) {
      return c.json({
        success: false,
        error: 'Usuário não autenticado'
      }, 401);
    }

    const result = await db.prepare(`
      UPDATE inventory_items SET is_active = 0, updated_at = datetime('now')
      WHERE id = ? AND clinic_id = ?
    `).bind(id, user.clinicId).run();

    if (!result.success) {
      throw new Error('Falha ao excluir item');
    }

    return c.json({
      success: true,
      message: 'Item excluído com sucesso'
    });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return c.json({
      success: false,
      error: 'Falha ao excluir item'
    }, 500);
  }
});

export { inventory };

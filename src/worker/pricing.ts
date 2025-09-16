import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const pricing = new Hono<{ Bindings: Env }>();

// Schemas
const UpdateDefaultPriceSchema = z.object({
  defaultSessionPrice: z.number().min(0, "Preço deve ser positivo")
});

const CalculatePriceSchema = z.object({
  patientId: z.number().min(1, "ID do paciente é obrigatório"),
  basePrice: z.number().optional()
});

// GET /api/pricing/default - Get clinic's default session price
pricing.get("/pricing/default", async (c) => {
  try {
    const db = c.env.DB;
    
    // For now, use hardcoded clinic_id
    const clinicId = 1;
    
    const result = await db.prepare(
      'SELECT default_session_price as defaultSessionPrice FROM clinics WHERE id = ?'
    ).bind(clinicId).first();

    if (!result) {
      return c.json({
        success: false,
        error: 'Clínica não encontrada'
      }, 404);
    }

    return c.json({
      success: true,
      data: {
        defaultSessionPrice: (result as any).defaultSessionPrice || 0
      }
    });
  } catch (error) {
    console.error('Error fetching default price:', error);
    return c.json({
      success: false,
      error: 'Falha ao buscar preço padrão'
    }, 500);
  }
});

// PUT /api/pricing/default - Update clinic's default session price
pricing.put("/pricing/default", zValidator('json', UpdateDefaultPriceSchema), async (c) => {
  try {
    const { defaultSessionPrice } = c.req.valid('json');
    const db = c.env.DB;
    
    // For now, use hardcoded clinic_id
    const clinicId = 1;

    const result = await db.prepare(`
      UPDATE clinics SET
        default_session_price = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(defaultSessionPrice, clinicId).run();

    if (!result.success) {
      throw new Error('Falha ao atualizar preço padrão');
    }

    return c.json({
      success: true,
      data: { defaultSessionPrice }
    });
  } catch (error) {
    console.error('Error updating default price:', error);
    return c.json({
      success: false,
      error: 'Falha ao atualizar preço padrão'
    }, 500);
  }
});

// POST /api/pricing/calculate - Calculate session price for a patient
pricing.post("/pricing/calculate", zValidator('json', CalculatePriceSchema), async (c) => {
  try {
    const { patientId, basePrice } = c.req.valid('json');
    const db = c.env.DB;
    
    // For now, use hardcoded clinic_id
    const clinicId = 1;

    // Get clinic's default price
    const clinic = await db.prepare(
      'SELECT default_session_price FROM clinics WHERE id = ?'
    ).bind(clinicId).first();

    if (!clinic) {
      return c.json({
        success: false,
        error: 'Clínica não encontrada'
      }, 404);
    }

    // Get patient's custom pricing and partnership info
    const patient = await db.prepare(`
      SELECT 
        custom_session_price,
        partnership_tag,
        discount_percentage,
        name
      FROM patients 
      WHERE id = ? AND clinic_id = ? AND is_active = 1
    `).bind(patientId, clinicId).first();

    if (!patient) {
      return c.json({
        success: false,
        error: 'Paciente não encontrado'
      }, 404);
    }

    const patientData = patient as any;

    // Calculate final price with priority: basePrice > customSessionPrice > defaultSessionPrice
    let finalPrice = basePrice || patientData.custom_session_price || (clinic as any).default_session_price || 0;

    // Apply discount if there's a partnership
    let discountAmount = 0;
    if (patientData.discount_percentage && patientData.discount_percentage > 0) {
      discountAmount = (finalPrice * patientData.discount_percentage) / 100;
      finalPrice = finalPrice - discountAmount;
    }

    // Round to 2 decimal places
    finalPrice = Math.round(finalPrice * 100) / 100;
    discountAmount = Math.round(discountAmount * 100) / 100;

    return c.json({
      success: true,
      data: {
        originalPrice: basePrice || patientData.custom_session_price || (clinic as any).default_session_price || 0,
        finalPrice,
        discountAmount,
        discountPercentage: patientData.discount_percentage || 0,
        partnershipTag: patientData.partnership_tag || null,
        patientName: patientData.name,
        calculation: {
          usedCustomPrice: !!patientData.custom_session_price,
          usedDefaultPrice: !basePrice && !patientData.custom_session_price,
          hasDiscount: !!patientData.discount_percentage
        }
      }
    });
  } catch (error) {
    console.error('Error calculating price:', error);
    return c.json({
      success: false,
      error: 'Falha ao calcular preço'
    }, 500);
  }
});

// GET /api/patients/:patientId/pricing - Get pricing info for specific patient
pricing.get("/patients/:patientId/pricing", async (c) => {
  try {
    const patientId = parseInt(c.req.param('patientId'));
    
    if (isNaN(patientId)) {
      return c.json({
        success: false,
        error: 'ID do paciente inválido'
      }, 400);
    }

    const db = c.env.DB;
    
    // For now, use hardcoded clinic_id
    const clinicId = 1;

    // Get clinic's default price and patient's custom pricing
    const result = await db.prepare(`
      SELECT 
        p.name,
        p.custom_session_price,
        p.partnership_tag,
        p.discount_percentage,
        c.default_session_price
      FROM patients p
      LEFT JOIN clinics c ON p.clinic_id = c.id
      WHERE p.id = ? AND p.clinic_id = ? AND p.is_active = 1
    `).bind(patientId, clinicId).first();

    if (!result) {
      return c.json({
        success: false,
        error: 'Paciente não encontrado'
      }, 404);
    }

    const data = result as any;

    // Calculate effective price
    const basePrice = data.custom_session_price || data.default_session_price || 0;
    let finalPrice = basePrice;
    let discountAmount = 0;

    if (data.discount_percentage && data.discount_percentage > 0) {
      discountAmount = (basePrice * data.discount_percentage) / 100;
      finalPrice = basePrice - discountAmount;
    }

    return c.json({
      success: true,
      data: {
        patientName: data.name,
        defaultSessionPrice: data.default_session_price || 0,
        customSessionPrice: data.custom_session_price || null,
        partnershipTag: data.partnership_tag || null,
        discountPercentage: data.discount_percentage || 0,
        effectivePrice: Math.round(finalPrice * 100) / 100,
        discountAmount: Math.round(discountAmount * 100) / 100,
        hasCustomPrice: !!data.custom_session_price,
        hasPartnership: !!data.partnership_tag,
        hasDiscount: !!data.discount_percentage
      }
    });
  } catch (error) {
    console.error('Error fetching patient pricing:', error);
    return c.json({
      success: false,
      error: 'Falha ao buscar preços do paciente'
    }, 500);
  }
});

export { pricing };

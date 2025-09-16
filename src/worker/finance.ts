import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const finance = new Hono<{ Bindings: Env }>();

// GET /api/finance/transactions - List all transactions
finance.get("/transactions", async (c) => {
  try {
    const db = c.env.DB;
    const { type, status, startDate, endDate, limit = '50' } = c.req.query();
    
    let query = `
      SELECT 
        ft.id,
        ft.clinic_id as clinicId,
        ft.user_id as userId,
        ft.patient_id as patientId,
        ft.type,
        ft.category,
        ft.description,
        ft.amount,
        ft.transaction_date as date,
        ft.status,
        ft.payment_method as paymentMethod,
        ft.notes,
        ft.created_at as createdAt,
        ft.updated_at as updatedAt,
        p.name as patientName
      FROM financial_transactions ft
      LEFT JOIN patients p ON ft.patient_id = p.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (type && type !== 'all') {
      query += ` AND ft.type = ?`;
      params.push(type);
    }
    
    if (status && status !== 'all') {
      query += ` AND ft.status = ?`;
      params.push(status);
    }
    
    if (startDate) {
      query += ` AND ft.transaction_date >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      query += ` AND ft.transaction_date <= ?`;
      params.push(endDate);
    }
    
    query += ` ORDER BY ft.transaction_date DESC, ft.created_at DESC LIMIT ?`;
    params.push(parseInt(limit));

    const result = await db.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: result.results || []
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch transactions'
    }, 500);
  }
});

// GET /api/finance/summary - Get financial summary
finance.get("/summary", async (c) => {
  try {
    const db = c.env.DB;
    const { startDate, endDate } = c.req.query();
    
    let dateFilter = '';
    const params: any[] = [];
    
    if (startDate && endDate) {
      dateFilter = ' WHERE transaction_date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else {
      // Default to current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      dateFilter = ' WHERE transaction_date BETWEEN ? AND ?';
      params.push(startOfMonth, endOfMonth);
    }

    // Get total revenue
    const revenueResult = await db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as totalRevenue
      FROM financial_transactions
      ${dateFilter} AND type = 'INCOME'
    `).bind(...params).first();

    // Get total expenses
    const expensesResult = await db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as totalExpenses
      FROM financial_transactions
      ${dateFilter} AND type = 'EXPENSE'
    `).bind(...params).first();

    // Get pending payments
    const pendingResult = await db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as pendingPayments
      FROM financial_transactions
      ${dateFilter} AND type = 'INCOME' AND status IN ('PENDING', 'OVERDUE')
    `).bind(...params).first();

    // Get previous month data for growth calculation
    const prevParams = [...params];
    if (startDate && endDate) {
      // For custom date range, get same period from previous period
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diff = end.getTime() - start.getTime();
      const prevEnd = new Date(start.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - diff);
      
      prevParams[0] = prevStart.toISOString().split('T')[0];
      prevParams[1] = prevEnd.toISOString().split('T')[0];
    } else {
      // Previous month
      const now = new Date();
      const prevMonth = now.getMonth() - 1;
      const prevYear = prevMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const adjustedMonth = prevMonth < 0 ? 11 : prevMonth;
      
      const prevStartOfMonth = new Date(prevYear, adjustedMonth, 1).toISOString().split('T')[0];
      const prevEndOfMonth = new Date(prevYear, adjustedMonth + 1, 0).toISOString().split('T')[0];
      
      prevParams[0] = prevStartOfMonth;
      prevParams[1] = prevEndOfMonth;
    }

    const prevRevenueResult = await db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as prevRevenue
      FROM financial_transactions
      WHERE transaction_date BETWEEN ? AND ? AND type = 'INCOME'
    `).bind(...prevParams).first();

    const totalRevenue = Number(revenueResult?.totalRevenue) || 0;
    const totalExpenses = Number(expensesResult?.totalExpenses) || 0;
    const pendingPayments = Number(pendingResult?.pendingPayments) || 0;
    const prevRevenue = Number(prevRevenueResult?.prevRevenue) || 0;
    
    const netProfit = totalRevenue - totalExpenses;
    const monthlyGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    return c.json({
      success: true,
      data: {
        totalRevenue,
        totalExpenses,
        netProfit,
        pendingPayments,
        monthlyGrowth: Math.round(monthlyGrowth * 100) / 100
      }
    });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch financial summary'
    }, 500);
  }
});

// GET /api/finance/revenue-chart - Get revenue chart data
finance.get("/revenue-chart", async (c) => {
  try {
    const db = c.env.DB;
    const { months = '6' } = c.req.query();
    
    const monthsCount = parseInt(months);
    const chartData = [];
    
    for (let i = monthsCount - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const result = await db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as revenue
        FROM financial_transactions
        WHERE transaction_date BETWEEN ? AND ? AND type = 'INCOME'
      `).bind(startOfMonth, endOfMonth).first();
      
      chartData.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        revenue: result?.revenue || 0
      });
    }

    return c.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    console.error('Error fetching revenue chart data:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch revenue chart data'
    }, 500);
  }
});

// POST /api/finance/transactions - Create new transaction
const CreateTransactionSchema = z.object({
  patientId: z.number().optional(),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1, "Categoria é obrigatória"),
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.number().positive("Valor deve ser positivo"),
  date: z.string().min(1, "Data é obrigatória"),
  status: z.enum(['PAID', 'PENDING', 'OVERDUE']).default('PAID'),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

finance.post("/transactions", zValidator('json', CreateTransactionSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const db = c.env.DB;
    
    // For now, use hardcoded clinic_id and user_id
    const clinicId = 1;
    const userId = 1;

    const result = await db.prepare(`
      INSERT INTO financial_transactions (
        clinic_id, user_id, patient_id, type, category, description,
        amount, transaction_date, status, payment_method, notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      clinicId,
      userId,
      data.patientId || null,
      data.type,
      data.category,
      data.description,
      data.amount,
      data.date,
      data.status,
      data.paymentMethod || null,
      data.notes || null
    ).run();

    if (!result.success) {
      throw new Error('Failed to create transaction');
    }

    return c.json({
      success: true,
      data: { id: result.meta.last_row_id, ...data }
    }, 201);
  } catch (error) {
    console.error('Error creating transaction:', error);
    return c.json({
      success: false,
      error: 'Failed to create transaction'
    }, 500);
  }
});

// PUT /api/finance/transactions/:id - Update transaction
finance.put("/transactions/:id", zValidator('json', CreateTransactionSchema), async (c) => {
  try {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    const db = c.env.DB;

    const result = await db.prepare(`
      UPDATE financial_transactions SET
        patient_id = ?, type = ?, category = ?, description = ?,
        amount = ?, transaction_date = ?, status = ?, payment_method = ?,
        notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      data.patientId || null,
      data.type,
      data.category,
      data.description,
      data.amount,
      data.date,
      data.status,
      data.paymentMethod || null,
      data.notes || null,
      id
    ).run();

    if (!result.success) {
      throw new Error('Failed to update transaction');
    }

    return c.json({
      success: true,
      data: { id: parseInt(id), ...data }
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return c.json({
      success: false,
      error: 'Failed to update transaction'
    }, 500);
  }
});

// DELETE /api/finance/transactions/:id - Delete transaction
finance.delete("/transactions/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;

    const result = await db.prepare(`
      DELETE FROM financial_transactions WHERE id = ?
    `).bind(id).run();

    if (!result.success) {
      throw new Error('Failed to delete transaction');
    }

    return c.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return c.json({
      success: false,
      error: 'Failed to delete transaction'
    }, 500);
  }
});

export { finance };

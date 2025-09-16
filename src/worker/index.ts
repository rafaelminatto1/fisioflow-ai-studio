import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { exercises } from "./exercises";
import { prescriptions } from "./prescriptions";
import { finance } from "./finance";
import { bodyMapApp } from "./body-map";
import { patientPackages } from "./patient-packages";
import { patientSurgeries } from "./patient-surgeries";
import { consultationRecords } from "./consultation-records";
import { pricing } from "./pricing";
import { seedDatabase } from "./seed-data";
import { auth, authMiddleware } from "./auth";
import { createTestUsers } from "./create-test-users";
import { getTasks, createTask, updateTask, deleteTask, updateTaskProgress } from "./tasks";
import { inventory } from "./inventory";
import { knowledgeBase } from "./knowledge-base";

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for frontend requests
app.use('/*', cors());

// Create test users endpoint (public - no auth required)
app.post("/api/create-test-users", async (c) => {
  try {
    const result = await createTestUsers(c.env.DB);
    return c.json({
      success: true,
      message: 'Test users created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating test users:', error);
    return c.json({
      success: false,
      error: 'Failed to create test users'
    }, 500);
  }
});

// Database seeding endpoint (public for development)
app.post("/api/seed", async (c) => {
  try {
    await seedDatabase(c.env.DB);
    return c.json({
      success: true,
      message: 'Database seeded successfully'
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return c.json({
      success: false,
      error: 'Failed to seed database'
    }, 500);
  }
});

// Health check endpoint
app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Patient API endpoints
const patients = new Hono<{ Bindings: Env }>();

// GET /api/patients - List all patients
patients.get("/", async (c) => {
  try {
    const db = c.env.DB;
    const result = await db.prepare(`
      SELECT 
        id,
        name,
        cpf,
        email,
        phone,
        birth_date as birthDate,
        gender,
        address,
        emergency_contact as emergencyContact,
        medical_history as medicalHistory,
        avatar,
        is_active as isActive,
        clinic_id as clinicId,
        created_by as createdBy,
        custom_session_price as customSessionPrice,
        partnership_tag as partnershipTag,
        discount_percentage as discountPercentage,
        created_at as createdAt,
        updated_at as updatedAt
      FROM patients 
      WHERE is_active = 1 
      ORDER BY name ASC
    `).all();

    return c.json({
      success: true,
      data: result.results || []
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch patients'
    }, 500);
  }
});

// GET /api/patients/:id - Get specific patient
patients.get("/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;
    
    const result = await db.prepare(`
      SELECT 
        id,
        name,
        cpf,
        email,
        phone,
        birth_date as birthDate,
        gender,
        address,
        emergency_contact as emergencyContact,
        medical_history as medicalHistory,
        avatar,
        is_active as isActive,
        clinic_id as clinicId,
        created_by as createdBy,
        created_at as createdAt,
        updated_at as updatedAt
      FROM patients 
      WHERE id = ? AND is_active = 1
    `).bind(id).first();

    if (!result) {
      return c.json({
        success: false,
        error: 'Patient not found'
      }, 404);
    }

    return c.json({
      success: true,
      patient: result
    });
  } catch (error) {
    console.error('Error fetching patient:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch patient'
    }, 500);
  }
});

// POST /api/patients - Create new patient
const CreatePatientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.enum(['MASCULINO', 'FEMININO', 'OUTRO', '']).optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  medicalHistory: z.string().optional(),
  customSessionPrice: z.number().optional(),
  partnershipTag: z.string().optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
});

patients.post("/", zValidator('json', CreatePatientSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const db = c.env.DB;
    
    // For now, use hardcoded clinic_id and created_by
    // In a real app, these would come from authentication
    const clinicId = 1;
    const createdBy = 1;

    const result = await db.prepare(`
      INSERT INTO patients (
        name, cpf, email, phone, birth_date, gender, 
        address, emergency_contact, medical_history,
        custom_session_price, partnership_tag, discount_percentage,
        clinic_id, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      data.name,
      data.cpf || null,
      data.email || null,
      data.phone || null,
      data.birthDate || null,
      data.gender || null,
      data.address || null,
      data.emergencyContact || null,
      data.medicalHistory || null,
      data.customSessionPrice || null,
      data.partnershipTag || null,
      data.discountPercentage || null,
      clinicId,
      createdBy
    ).run();

    if (!result.success) {
      throw new Error('Failed to create patient');
    }

    return c.json({
      success: true,
      data: { id: result.meta.last_row_id, ...data }
    }, 201);
  } catch (error) {
    console.error('Error creating patient:', error);
    return c.json({
      success: false,
      error: 'Failed to create patient'
    }, 500);
  }
});

// PUT /api/patients/:id - Update patient
patients.put("/:id", zValidator('json', CreatePatientSchema), async (c) => {
  try {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    const db = c.env.DB;

    const result = await db.prepare(`
      UPDATE patients SET
        name = ?, cpf = ?, email = ?, phone = ?, birth_date = ?, 
        gender = ?, address = ?, emergency_contact = ?, medical_history = ?,
        custom_session_price = ?, partnership_tag = ?, discount_percentage = ?,
        updated_at = datetime('now')
      WHERE id = ? AND is_active = 1
    `).bind(
      data.name,
      data.cpf || null,
      data.email || null,
      data.phone,
      data.birthDate,
      data.gender,
      data.address || null,
      data.emergencyContact || null,
      data.medicalHistory || null,
      data.customSessionPrice || null,
      data.partnershipTag || null,
      data.discountPercentage || null,
      id
    ).run();

    if (!result.success) {
      throw new Error('Failed to update patient');
    }

    return c.json({
      success: true,
      data: { id: parseInt(id), ...data }
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    return c.json({
      success: false,
      error: 'Failed to update patient'
    }, 500);
  }
});

// DELETE /api/patients/:id - Soft delete patient
patients.delete("/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;

    const result = await db.prepare(`
      UPDATE patients SET is_active = 0, updated_at = datetime('now')
      WHERE id = ?
    `).bind(id).run();

    if (!result.success) {
      throw new Error('Failed to delete patient');
    }

    return c.json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    return c.json({
      success: false,
      error: 'Failed to delete patient'
    }, 500);
  }
});

// Appointment API endpoints
const appointments = new Hono<{ Bindings: Env }>();

// GET /api/appointments - List all appointments
appointments.get("/", async (c) => {
  try {
    const db = c.env.DB;
    const result = await db.prepare(`
      SELECT 
        id,
        patient_id as patientId,
        user_id as userId,
        clinic_id as clinicId,
        appointment_date as appointmentDate,
        duration,
        status,
        type,
        notes,
        service,
        is_recurring as isRecurring,
        recurring_pattern as recurringPattern,
        payment_status as paymentStatus,
        price_charged as priceCharged,
        created_at as createdAt,
        updated_at as updatedAt
      FROM appointments 
      ORDER BY appointment_date ASC
    `).all();

    return c.json({
      success: true,
      data: result.results || []
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch appointments'
    }, 500);
  }
});

// GET /api/appointments/:id - Get specific appointment
appointments.get("/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;
    
    const result = await db.prepare(`
      SELECT 
        id,
        patient_id as patientId,
        user_id as userId,
        clinic_id as clinicId,
        appointment_date as appointmentDate,
        duration,
        status,
        type,
        notes,
        service,
        is_recurring as isRecurring,
        recurring_pattern as recurringPattern,
        payment_status as paymentStatus,
        price_charged as priceCharged,
        created_at as createdAt,
        updated_at as updatedAt
      FROM appointments 
      WHERE id = ?
    `).bind(id).first();

    if (!result) {
      return c.json({
        success: false,
        error: 'Appointment not found'
      }, 404);
    }

    return c.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch appointment'
    }, 500);
  }
});

// POST /api/appointments - Create new appointment
const CreateAppointmentSchema = z.object({
  patientId: z.number().min(1, "Paciente é obrigatório"),
  appointmentDate: z.string().min(1, "Data é obrigatória"),
  duration: z.number().min(15, "Duração deve ser de pelo menos 15 minutos").default(60),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).default('SCHEDULED'),
  type: z.enum(['CONSULTATION', 'TREATMENT', 'ASSESSMENT', 'FOLLOW_UP', 'TELECONSULTATION']).default('CONSULTATION'),
  service: z.string().optional(),
  notes: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.string().optional(),
});

appointments.post("/", zValidator('json', CreateAppointmentSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const db = c.env.DB;
    
    // For now, use hardcoded clinic_id and user_id
    const clinicId = 1;
    const userId = 1;

    const result = await db.prepare(`
      INSERT INTO appointments (
        patient_id, user_id, clinic_id, appointment_date, duration, 
        status, type, notes, service, is_recurring, recurring_pattern,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      data.patientId,
      userId,
      clinicId,
      data.appointmentDate,
      data.duration,
      data.status,
      data.type,
      data.notes || null,
      data.service || null,
      data.isRecurring,
      data.recurringPattern || null
    ).run();

    if (!result.success) {
      throw new Error('Failed to create appointment');
    }

    return c.json({
      success: true,
      data: { id: result.meta.last_row_id, ...data }
    }, 201);
  } catch (error) {
    console.error('Error creating appointment:', error);
    return c.json({
      success: false,
      error: 'Failed to create appointment'
    }, 500);
  }
});

// PUT /api/appointments/:id - Update appointment
appointments.put("/:id", zValidator('json', CreateAppointmentSchema), async (c) => {
  try {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    const db = c.env.DB;

    const result = await db.prepare(`
      UPDATE appointments SET
        patient_id = ?, appointment_date = ?, duration = ?, 
        status = ?, type = ?, notes = ?, service = ?, 
        is_recurring = ?, recurring_pattern = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      data.patientId,
      data.appointmentDate,
      data.duration,
      data.status,
      data.type,
      data.notes || null,
      data.service || null,
      data.isRecurring,
      data.recurringPattern || null,
      id
    ).run();

    if (!result.success) {
      throw new Error('Failed to update appointment');
    }

    return c.json({
      success: true,
      data: { id: parseInt(id), ...data }
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return c.json({
      success: false,
      error: 'Failed to update appointment'
    }, 500);
  }
});

// PATCH /api/appointments/:id/status - Update appointment status
const UpdateStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])
});

appointments.patch("/:id/status", zValidator('json', UpdateStatusSchema), async (c) => {
  try {
    const id = c.req.param('id');
    const { status } = c.req.valid('json');
    const db = c.env.DB;

    const result = await db.prepare(`
      UPDATE appointments SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(status, id).run();

    if (!result.success) {
      throw new Error('Failed to update appointment status');
    }

    return c.json({
      success: true,
      data: { id: parseInt(id), status }
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return c.json({
      success: false,
      error: 'Failed to update appointment status'
    }, 500);
  }
});

// PATCH /api/appointments/:id/payment - Update appointment payment status
const UpdatePaymentSchema = z.object({
  paymentStatus: z.enum(['PENDENTE', 'PAGO', 'PAGA_COM_PACOTE', 'CORTESIA']),
  priceCharged: z.number().optional(),
  paymentMethod: z.string().optional(),
  packageId: z.number().optional()
});

appointments.patch("/:id/payment", zValidator('json', UpdatePaymentSchema), async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const { paymentStatus, priceCharged, paymentMethod, packageId } = c.req.valid('json');
    const db = c.env.DB;

    // Get appointment info
    const appointment = await db.prepare(
      'SELECT * FROM appointments WHERE id = ?'
    ).bind(id).first();

    if (!appointment) {
      return c.json({
        success: false,
        error: 'Agendamento não encontrado'
      }, 404);
    }

    // Handle package payment
    if (paymentStatus === 'PAGA_COM_PACOTE' && packageId) {
      // Use session from package
      const packageResult = await db.prepare(
        'SELECT * FROM patient_packages WHERE id = ? AND patient_id = ? AND status = "ACTIVE"'
      ).bind(packageId, (appointment as any).patient_id).first();

      if (!packageResult) {
        return c.json({
          success: false,
          error: 'Pacote não encontrado ou inativo'
        }, 400);
      }

      const pkg = packageResult as any;
      const remainingSessions = pkg.total_sessions - pkg.sessions_used;

      if (remainingSessions <= 0) {
        return c.json({
          success: false,
          error: 'Não há sessões restantes no pacote'
        }, 400);
      }

      // Use one session from package
      const newSessionsUsed = pkg.sessions_used + 1;
      const newPackageStatus = newSessionsUsed >= pkg.total_sessions ? 'COMPLETED' : 'ACTIVE';

      await db.prepare(`
        UPDATE patient_packages SET
          sessions_used = ?, status = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(newSessionsUsed, newPackageStatus, packageId).run();
    }

    // Create financial transaction for individual payments
    if (paymentStatus === 'PAGO' && priceCharged && priceCharged > 0) {
      await db.prepare(`
        INSERT INTO financial_transactions (
          clinic_id, user_id, patient_id, type, category, description,
          amount, transaction_date, status, payment_method, notes,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        1, // hardcoded clinic_id
        1, // hardcoded user_id
        (appointment as any).patient_id,
        'INCOME',
        'Sessão',
        `Pagamento de sessão - Agendamento #${id}`,
        priceCharged,
        new Date().toISOString().split('T')[0],
        'PAID',
        paymentMethod || null,
        `Agendamento ID: ${id}`
      ).run();
    }

    // Update appointment payment status
    const result = await db.prepare(`
      UPDATE appointments SET 
        payment_status = ?, 
        price_charged = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(paymentStatus, priceCharged || null, id).run();

    if (!result.success) {
      throw new Error('Failed to update appointment payment');
    }

    return c.json({
      success: true,
      data: { id, paymentStatus, priceCharged }
    });
  } catch (error) {
    console.error('Error updating appointment payment:', error);
    return c.json({
      success: false,
      error: 'Failed to update appointment payment'
    }, 500);
  }
});

// DELETE /api/appointments/:id - Delete appointment
appointments.delete("/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;

    const result = await db.prepare(`
      DELETE FROM appointments WHERE id = ?
    `).bind(id).run();

    if (!result.success) {
      throw new Error('Failed to delete appointment');
    }

    return c.json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return c.json({
      success: false,
      error: 'Failed to delete appointment'
    }, 500);
  }
});

// Apply auth middleware to protected routes
const protectedRoutes = new Hono<{ Bindings: Env }>();
protectedRoutes.use('/*', authMiddleware());

// Mount protected routes
protectedRoutes.route("/api/patients", patients);
protectedRoutes.route("/api/appointments", appointments);

// Dashboard endpoint (protected)
protectedRoutes.get("/api/dashboard", async (c) => {
  try {
    const db = c.env.DB;

    // Get basic stats
    const [patientsResult, revenueResult, expensesResult] = await Promise.all([
      db.prepare('SELECT COUNT(*) as count FROM patients WHERE is_active = 1').first(),
      db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM financial_transactions 
                  WHERE type = 'INCOME' AND strftime('%Y-%m', transaction_date) = strftime('%Y-%m', 'now')`).first(),
      db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM financial_transactions 
                  WHERE type = 'EXPENSE' AND strftime('%Y-%m', transaction_date) = strftime('%Y-%m', 'now')`).first()
    ]);

    // Get today's appointments
    const todayAppointments = await db.prepare(`
      SELECT 
        a.id,
        a.appointment_date as appointmentDate,
        a.service,
        a.status,
        p.name as patientName
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      WHERE date(a.appointment_date) = date('now')
      ORDER BY a.appointment_date ASC
    `).all();

    // Get revenue chart data (last 6 months)
    const revenueChart = await db.prepare(`
      SELECT 
        strftime('%m', transaction_date) as month,
        strftime('%Y', transaction_date) as year,
        SUM(amount) as revenue
      FROM financial_transactions 
      WHERE type = 'INCOME' 
        AND transaction_date >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', transaction_date)
      ORDER BY year, month
    `).all();

    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const formattedRevenueChart = (revenueChart.results || []).map((item: any) => ({
      month: monthNames[parseInt(item.month) - 1],
      revenue: item.revenue || 0
    }));

    const monthlyRevenue = Number(revenueResult?.total) || 0;
    const monthlyExpenses = Number(expensesResult?.total) || 0;

    const dashboardData = {
      activePatients: patientsResult?.count || 0,
      monthlyRevenue: monthlyRevenue,
      monthlyExpenses: monthlyExpenses,
      netProfit: monthlyRevenue - monthlyExpenses,
      noShowRate: 8.5, // Mock data
      avgSatisfaction: 4.8, // Mock data
      todayAppointments: (todayAppointments.results || []).length,
      pendingPayments: 0, // Will be calculated from pending transactions
      monthlyGrowth: 12.5, // Mock data
      user: { name: 'Dr. Ana Silva' },
      revenueChart: formattedRevenueChart,
      specialtyDistribution: [
        { name: 'Ortopédica', value: 45 },
        { name: 'Neurológica', value: 25 },
        { name: 'Respiratória', value: 20 },
        { name: 'Pediátrica', value: 10 }
      ],
      todaySchedule: (todayAppointments.results || []).map((apt: any) => {
        const date = new Date(apt.appointmentDate);
        const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        return {
          id: apt.id.toString(),
          time,
          patientName: apt.patientName || 'Paciente não encontrado',
          service: apt.service || apt.type,
          status: apt.status
        };
      }),
      alerts: [
        { type: 'warning', title: 'Pacientes em Atraso', message: '3 pacientes não compareceram hoje' },
        { type: 'info', title: 'Agenda Lotada', message: 'Semana que vem está 95% ocupada' },
        { type: 'error', title: 'Equipamento', message: 'Manutenção do ultrassom agendada' }
      ]
    };

    return c.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch dashboard data'
    }, 500);
  }
});

// Mount route handlers
app.route('/api/auth', auth)
app.route('/api/exercises', exercises)
app.route('/api/prescriptions', prescriptions)
app.route('/api/finance', finance)
app.route('/api', bodyMapApp)
app.route('/api', patientPackages)
app.route('/api', patientSurgeries)
app.route('/api', consultationRecords)
app.route('/api', pricing)

// Tasks routes
app.get('/api/tasks', authMiddleware, getTasks)
app.post('/api/tasks', authMiddleware, createTask)
app.put('/api/tasks/:id', authMiddleware, updateTask)
app.delete('/api/tasks/:id', authMiddleware, deleteTask)
app.patch('/api/tasks/:id/progress', authMiddleware, updateTaskProgress)

// Inventory and Knowledge Base routes (protected)
protectedRoutes.route("/api/inventory", inventory);
protectedRoutes.route("/api/knowledge", knowledgeBase);

// Mount protected routes in main app
app.route("/", protectedRoutes);

export default app;

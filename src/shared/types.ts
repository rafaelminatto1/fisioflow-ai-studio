import z from "zod";

// Patient schemas
export const PatientSchema = z.object({
  id: z.number(),
  name: z.string(),
  cpf: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string(),
  birthDate: z.string(),
  gender: z.enum(['MASCULINO', 'FEMININO', 'OUTRO']),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  medicalHistory: z.string().optional(),
  avatar: z.string().optional(),
  isActive: z.boolean().default(true),
  clinicId: z.number(),
  createdBy: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PatientType = z.infer<typeof PatientSchema>;

// Appointment schemas
export const AppointmentSchema = z.object({
  id: z.number(),
  patientId: z.number(),
  userId: z.number(),
  clinicId: z.number(),
  appointmentDate: z.string(),
  duration: z.number().default(60),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
  type: z.enum(['CONSULTATION', 'TREATMENT', 'ASSESSMENT', 'FOLLOW_UP', 'TELECONSULTATION']),
  notes: z.string().optional(),
  service: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.string().optional(),
  paymentStatus: z.enum(['PENDENTE', 'PAGO', 'PAGA_COM_PACOTE', 'CORTESIA']).optional(),
  priceCharged: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AppointmentType = z.infer<typeof AppointmentSchema>;

// Exercise schemas
export const ExerciseSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  videoUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  duration: z.number().optional(),
  difficulty: z.number().min(1).max(5).default(1),
  equipment: z.string().optional(),
  bodyParts: z.string().optional(),
  conditions: z.string().optional(),
  contraindications: z.string().optional(),
  category: z.string().optional(),
  specialty: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ExerciseType = z.infer<typeof ExerciseSchema>;

// Dashboard data types
export interface DashboardData {
  activePatients: number;
  monthlyRevenue: number;
  noShowRate: number;
  avgSatisfaction: number;
  todayAppointments: number;
  user: {
    name: string;
  };
  revenueChart: Array<{
    month: string;
    revenue: number;
  }>;
  specialtyDistribution: Array<{
    name: string;
    value: number;
  }>;
  todaySchedule: Array<{
    id: string;
    time: string;
    patientName: string;
    service: string;
    status: string;
  }>;
  alerts: Array<{
    type: 'warning' | 'error' | 'info';
    title: string;
    message: string;
  }>;
}

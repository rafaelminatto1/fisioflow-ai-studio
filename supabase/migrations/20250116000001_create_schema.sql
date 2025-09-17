-- ============================================================================
-- FISIOFLOW AI STUDIO - DATABASE SCHEMA
-- Execute este SQL no Supabase SQL Editor
-- ============================================================================

-- 1. CONFIGURAÇÕES INICIAIS
-- ============================================================================
-- Enable RLS por padrão
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- 2. EXTENSÕES NECESSÁRIAS
-- ============================================================================
-- Habilita extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. TABELAS PRINCIPAIS
-- ============================================================================

-- Tabela de usuários (extensão do auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'physiotherapist')),
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- Tabela de pacientes
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    birth_date DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    address TEXT,
    medical_history TEXT,
    emergency_contact TEXT,
    emergency_phone TEXT,
    notes TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    therapist_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    type TEXT DEFAULT 'consultation' CHECK (type IN ('consultation', 'therapy', 'follow_up', 'evaluation')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de consultas
CREATE TABLE IF NOT EXISTS public.consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    therapist_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    chief_complaint TEXT,
    history_present_illness TEXT,
    examination_findings TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    recommendations TEXT,
    next_appointment DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de exercícios
CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    duration_minutes INTEGER,
    repetitions INTEGER,
    sets INTEGER,
    category TEXT,
    equipment_needed TEXT[],
    image_url TEXT,
    video_url TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de prescrições de exercícios
CREATE TABLE IF NOT EXISTS public.patient_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
    prescribed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    prescription_date DATE DEFAULT CURRENT_DATE,
    frequency_per_week INTEGER,
    duration_weeks INTEGER,
    special_instructions TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'discontinued')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de inventário
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    brand TEXT,
    model TEXT,
    serial_number TEXT UNIQUE,
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    condition TEXT DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'needs_repair')),
    location TEXT,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'retired')),
    maintenance_schedule TEXT,
    last_maintenance DATE,
    notes TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de prescrições médicas
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    prescribed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    medication_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration TEXT,
    instructions TEXT,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'discontinued')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela financeira
CREATE TABLE IF NOT EXISTS public.finance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'transfer', 'insurance', 'pix')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    transaction_date DATE DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de base de conhecimento
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    tags TEXT[],
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de tarefas
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    due_date DATE,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. CONFIGURAÇÃO DE SEGURANÇA (RLS)
-- ============================================================================

-- Ativar RLS em todas as tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. POLÍTICAS DE SEGURANÇA
-- ============================================================================

-- Políticas para users
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para patients (usuários autenticados podem ver todos)
CREATE POLICY "Authenticated users can view patients" ON public.patients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage patients" ON public.patients
    FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para appointments
CREATE POLICY "Authenticated users can manage appointments" ON public.appointments
    FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para consultations
CREATE POLICY "Authenticated users can manage consultations" ON public.consultations
    FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para exercises
CREATE POLICY "Authenticated users can view exercises" ON public.exercises
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage exercises" ON public.exercises
    FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para outras tabelas (similar pattern)
CREATE POLICY "Authenticated users can manage patient_exercises" ON public.patient_exercises
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage inventory" ON public.inventory
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage prescriptions" ON public.prescriptions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage finance" ON public.finance
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view knowledge_base" ON public.knowledge_base
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage knowledge_base" ON public.knowledge_base
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage tasks" ON public.tasks
    FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- 6. ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON public.patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_email ON public.patients(email);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_therapist_id ON public.appointments(therapist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON public.consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_appointment_id ON public.consultations(appointment_id);
CREATE INDEX IF NOT EXISTS idx_patient_exercises_patient_id ON public.patient_exercises(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_exercises_exercise_id ON public.patient_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_finance_patient_id ON public.finance(patient_id);
CREATE INDEX IF NOT EXISTS idx_finance_transaction_date ON public.finance(transaction_date);
CREATE INDEX IF NOT EXISTS idx_finance_type ON public.finance(type);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON public.knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_status ON public.knowledge_base(status);

-- ============================================================================
-- 7. TRIGGERS PARA TIMESTAMPS AUTOMÁTICOS
-- ============================================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para todas as tabelas
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON public.consultations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON public.exercises FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_patient_exercises_updated_at BEFORE UPDATE ON public.patient_exercises FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_finance_updated_at BEFORE UPDATE ON public.finance FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON public.knowledge_base FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- SCHEMA CRIADO COM SUCESSO!
-- Próximo passo: Executar o arquivo 02_seed_data.sql (opcional)
-- ============================================================================
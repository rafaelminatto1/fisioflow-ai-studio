
-- Tabela de usuários (fisioterapeutas, recepcionistas, etc.)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password TEXT,
  role TEXT NOT NULL DEFAULT 'FISIOTERAPEUTA',
  clinic_id INTEGER,
  phone TEXT,
  avatar TEXT,
  specialties TEXT, -- JSON array como string
  is_active BOOLEAN DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de clínicas
CREATE TABLE clinics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  address TEXT, -- JSON como string
  settings TEXT, -- JSON como string
  subscription_plan TEXT DEFAULT 'BASIC',
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de pacientes
CREATE TABLE patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  cpf TEXT UNIQUE,
  email TEXT,
  phone TEXT NOT NULL,
  birth_date DATE,
  gender TEXT,
  address TEXT, -- JSON como string
  emergency_contact TEXT, -- JSON como string
  medical_history TEXT, -- JSON como string
  avatar TEXT,
  is_active BOOLEAN DEFAULT 1,
  clinic_id INTEGER NOT NULL,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de agendamentos
CREATE TABLE appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  clinic_id INTEGER NOT NULL,
  appointment_date DATETIME NOT NULL,
  duration INTEGER DEFAULT 60, -- minutos
  status TEXT DEFAULT 'SCHEDULED',
  type TEXT DEFAULT 'CONSULTATION',
  notes TEXT,
  service TEXT,
  is_recurring BOOLEAN DEFAULT 0,
  recurring_pattern TEXT, -- JSON como string
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de exercícios
CREATE TABLE exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER, -- segundos
  difficulty INTEGER DEFAULT 1, -- 1-5
  equipment TEXT, -- JSON array como string
  body_parts TEXT, -- JSON array como string
  conditions TEXT, -- JSON array como string
  contraindications TEXT, -- JSON array como string
  category TEXT,
  specialty TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimização
CREATE INDEX idx_patients_clinic ON patients(clinic_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_user ON appointments(user_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_exercises_specialty ON exercises(specialty);

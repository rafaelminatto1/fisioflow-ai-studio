
-- Adicionar campos de pagamento e preço aos agendamentos
ALTER TABLE appointments ADD COLUMN payment_status TEXT DEFAULT 'PENDENTE';
ALTER TABLE appointments ADD COLUMN price_charged REAL;

-- Adicionar valor padrão da sessão às clínicas
ALTER TABLE clinics ADD COLUMN default_session_price REAL DEFAULT 0;

-- Adicionar campos personalizados aos pacientes
ALTER TABLE patients ADD COLUMN custom_session_price REAL;
ALTER TABLE patients ADD COLUMN partnership_tag TEXT;
ALTER TABLE patients ADD COLUMN discount_percentage REAL;

-- Criar tabela de pacotes de sessões
CREATE TABLE patient_packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  clinic_id INTEGER NOT NULL,
  package_type TEXT NOT NULL DEFAULT '10_SESSIONS',
  total_sessions INTEGER NOT NULL DEFAULT 10,
  sessions_used INTEGER NOT NULL DEFAULT 0,
  purchase_date DATE NOT NULL,
  purchase_price REAL NOT NULL,
  expiry_date DATE,
  status TEXT DEFAULT 'ACTIVE',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de cirurgias dos pacientes
CREATE TABLE patient_surgeries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  clinic_id INTEGER NOT NULL,
  surgery_name TEXT NOT NULL,
  surgery_date DATE NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de registros de consulta/prontuário
CREATE TABLE consultation_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  appointment_id INTEGER,
  clinic_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  session_date DATE NOT NULL,
  main_complaint TEXT,
  anamnesis TEXT,
  physical_exam TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  notes TEXT,
  session_duration INTEGER DEFAULT 60,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

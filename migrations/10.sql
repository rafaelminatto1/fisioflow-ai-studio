
CREATE TABLE pain_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  clinic_id INTEGER NOT NULL,
  session_id INTEGER,
  body_part TEXT NOT NULL,
  x_coordinate REAL NOT NULL,
  y_coordinate REAL NOT NULL,
  pain_level INTEGER NOT NULL CHECK (pain_level >= 0 AND pain_level <= 10),
  description TEXT,
  notes TEXT,
  image_url TEXT,
  session_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE body_map_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  clinic_id INTEGER NOT NULL,
  session_date DATE NOT NULL,
  session_type TEXT DEFAULT 'ASSESSMENT',
  general_notes TEXT,
  overall_pain_level INTEGER CHECK (overall_pain_level >= 0 AND overall_pain_level <= 10),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pain_points_patient_id ON pain_points(patient_id);
CREATE INDEX idx_pain_points_session_date ON pain_points(session_date);
CREATE INDEX idx_body_map_sessions_patient_id ON body_map_sessions(patient_id);
CREATE INDEX idx_body_map_sessions_date ON body_map_sessions(session_date);

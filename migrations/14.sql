
-- Tabela de defeitos de equipamentos
CREATE TABLE equipment_defects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inventory_item_id INTEGER NOT NULL,
  clinic_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  defect_date DATE NOT NULL,
  description TEXT NOT NULL,
  defect_type TEXT NOT NULL DEFAULT 'MECANICO',
  severity TEXT NOT NULL DEFAULT 'MEDIO',
  repair_notes TEXT,
  parts_needed TEXT,
  estimated_cost REAL,
  is_resolved BOOLEAN DEFAULT 0,
  resolved_date DATE,
  resolved_by INTEGER,
  resolution_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_equipment_defects_inventory_item ON equipment_defects(inventory_item_id);
CREATE INDEX idx_equipment_defects_clinic_id ON equipment_defects(clinic_id);
CREATE INDEX idx_equipment_defects_resolved ON equipment_defects(is_resolved);

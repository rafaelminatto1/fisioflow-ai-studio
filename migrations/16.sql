
-- Tabela de logs de pesquisa da IA
CREATE TABLE ai_search_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clinic_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  search_query TEXT NOT NULL,
  search_results TEXT,
  external_ai_suggested BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_search_logs_clinic_id ON ai_search_logs(clinic_id);
CREATE INDEX idx_ai_search_logs_user_id ON ai_search_logs(user_id);


-- Tabela de artigos da base de conhecimento
CREATE TABLE knowledge_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clinic_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_text TEXT,
  file_url TEXT,
  file_type TEXT DEFAULT 'PDF',
  tags TEXT,
  category TEXT NOT NULL DEFAULT 'GERAL',
  view_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_knowledge_articles_clinic_id ON knowledge_articles(clinic_id);
CREATE INDEX idx_knowledge_articles_category ON knowledge_articles(category);
CREATE INDEX idx_knowledge_articles_tags ON knowledge_articles(tags);
CREATE INDEX idx_knowledge_articles_title ON knowledge_articles(title);

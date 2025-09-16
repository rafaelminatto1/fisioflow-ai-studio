
-- Insert sample patients data for testing
INSERT INTO patients (
  name, cpf, email, phone, birth_date, gender, 
  address, emergency_contact, medical_history,
  clinic_id, created_by, created_at, updated_at
) VALUES 
(
  'Maria Silva Santos',
  '123.456.789-01',
  'maria.silva@email.com',
  '(11) 98765-4321',
  '1985-03-15',
  'FEMININO',
  '{"street": "Rua das Flores, 123", "city": "São Paulo", "state": "SP", "zip": "01234-567"}',
  '{"name": "João Silva", "phone": "(11) 98765-4322", "relationship": "Esposo"}',
  '{"conditions": ["Lombalgia", "Tendinite no ombro"], "allergies": [], "medications": []}',
  1,
  1,
  datetime('now'),
  datetime('now')
),
(
  'Carlos Eduardo Lima',
  '987.654.321-09',
  'carlos.lima@email.com',
  '(11) 97654-3210',
  '1972-08-22',
  'MASCULINO',
  '{"street": "Av. Paulista, 456", "city": "São Paulo", "state": "SP", "zip": "01310-100"}',
  '{"name": "Ana Lima", "phone": "(11) 97654-3211", "relationship": "Esposa"}',
  '{"conditions": ["Artrose no joelho", "Hipertensão"], "allergies": ["Dipirona"], "medications": ["Losartana"]}',
  1,
  1,
  datetime('now'),
  datetime('now')
),
(
  'Ana Paula Costa',
  '456.789.123-45',
  'ana.costa@email.com',
  '(11) 96543-2109',
  '1990-12-10',
  'FEMININO',
  '{"street": "Rua da Consolação, 789", "city": "São Paulo", "state": "SP", "zip": "01302-907"}',
  '{"name": "Pedro Costa", "phone": "(11) 96543-2108", "relationship": "Pai"}',
  '{"conditions": ["Lesão no menisco"], "allergies": [], "medications": []}',
  1,
  1,
  datetime('now'),
  datetime('now')
),
(
  'José Roberto Oliveira',
  '789.123.456-78',
  'jose.oliveira@email.com',
  '(11) 95432-1098',
  '1965-05-30',
  'MASCULINO',
  '{"street": "Rua Augusta, 321", "city": "São Paulo", "state": "SP", "zip": "01305-100"}',
  '{"name": "Maria Oliveira", "phone": "(11) 95432-1097", "relationship": "Esposa"}',
  '{"conditions": ["Hérnia de disco", "Diabetes tipo 2"], "allergies": [], "medications": ["Metformina"]}',
  1,
  1,
  datetime('now'),
  datetime('now')
),
(
  'Fernanda Rodrigues',
  '321.654.987-12',
  'fernanda.rodrigues@email.com',
  '(11) 94321-0987',
  '1988-09-18',
  'FEMININO',
  '{"street": "Rua dos Jardins, 654", "city": "São Paulo", "state": "SP", "zip": "01401-200"}',
  '{"name": "Carlos Rodrigues", "phone": "(11) 94321-0986", "relationship": "Irmão"}',
  '{"conditions": ["Fibromialgia"], "allergies": ["Penicilina"], "medications": ["Pregabalina"]}',
  1,
  1,
  datetime('now'),
  datetime('now')
);

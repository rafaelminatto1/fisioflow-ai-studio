
-- Create seed data for exercises
INSERT INTO exercises (
  name, description, instructions, difficulty, equipment, body_parts, 
  conditions, category, specialty, created_at, updated_at
) VALUES
  (
    'Ponte Simples',
    'Exercício de fortalecimento para glúteos e estabilização do core',
    'Deite de costas, flexione os joelhos, contraia os glúteos e eleve o quadril. Mantenha por 5 segundos.',
    2,
    'Colchonete',
    'Glúteos, Core, Coluna lombar',
    'Dor lombar, Fortalecimento do core, Reabilitação pós-parto',
    'Fortalecimento',
    'Fisioterapia Ortopédica',
    datetime('now'),
    datetime('now')
  ),
  (
    'Alongamento de Isquiotibiais',
    'Alongamento para a musculatura posterior da coxa',
    'Em pé ou sentado, estenda uma perna e flexione o tronco suavemente até sentir tensão.',
    1,
    'Nenhum',
    'Isquiotibiais, Panturrilha',
    'Rigidez muscular, Dor lombar, Prevenção de lesões',
    'Alongamento',
    'Fisioterapia Ortopédica',
    datetime('now'),
    datetime('now')
  ),
  (
    'Flexão de Joelho Assistida',
    'Exercício para recuperação da amplitude de movimento do joelho',
    'Sentado, flexione o joelho gradualmente com auxílio das mãos ou terapeuta.',
    1,
    'Cadeira',
    'Joelho, Quadríceps',
    'Pós-cirúrgico de joelho, Artrose, Rigidez articular',
    'Mobilização',
    'Fisioterapia Ortopédica',
    datetime('now'),
    datetime('now')
  ),
  (
    'Exercícios de Respiração Diafragmática',
    'Exercício para fortalecimento do diafragma e melhora da respiração',
    'Deite de costas, uma mão no peito e outra no abdômen. Respire inflando o abdômen.',
    1,
    'Colchonete',
    'Diafragma, Core',
    'Disfunções respiratórias, Dor lombar, Ansiedade',
    'Respiratória',
    'Pilates Clínico',
    datetime('now'),
    datetime('now')
  ),
  (
    'Fortalecimento de Quadríceps com Elástico',
    'Exercício para fortalecimento do músculo quadríceps',
    'Sentado, prenda o elástico no pé e estenda o joelho contra a resistência.',
    3,
    'Elástico terapêutico',
    'Quadríceps, Joelho',
    'Fortalecimento muscular, Reabilitação de joelho',
    'Fortalecimento',
    'Fisioterapia Esportiva',
    datetime('now'),
    datetime('now')
  );

-- Create seed data for users and clinics
INSERT INTO clinics (
  name, email, phone, address, created_at, updated_at
) VALUES (
  'FisioFlow AI Studio',
  'contato@fisioflow.com',
  '(11) 99999-9999',
  'Rua das Clínicas, 123 - São Paulo, SP',
  datetime('now'),
  datetime('now')
);

INSERT INTO users (
  email, name, role, clinic_id, phone, specialties, created_at, updated_at
) VALUES (
  'dra.ana@fisioflow.com',
  'Dra. Ana Silva',
  'FISIOTERAPEUTA',
  1,
  '(11) 98888-8888',
  'Fisioterapia Ortopédica, RPG, Pilates Clínico',
  datetime('now'),
  datetime('now')
);

-- Create some sample patients
INSERT INTO patients (
  name, phone, birth_date, gender, address, clinic_id, created_by, created_at, updated_at
) VALUES
  (
    'Maria Silva',
    '(11) 97777-7777',
    '1985-03-15',
    'FEMININO',
    'Rua das Flores, 456 - São Paulo, SP',
    1,
    1,
    datetime('now'),
    datetime('now')
  ),
  (
    'João Santos',
    '(11) 96666-6666',
    '1978-08-22',
    'MASCULINO',
    'Av. Paulista, 789 - São Paulo, SP',
    1,
    1,
    datetime('now'),
    datetime('now')
  ),
  (
    'Ana Costa',
    '(11) 95555-5555',
    '1992-12-03',
    'FEMININO',
    'Rua Augusta, 321 - São Paulo, SP',
    1,
    1,
    datetime('now'),
    datetime('now')
  );

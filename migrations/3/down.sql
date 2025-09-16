
-- Remove seed data
DELETE FROM patients WHERE clinic_id = 1;
DELETE FROM users WHERE clinic_id = 1;
DELETE FROM clinics WHERE name = 'FisioFlow AI Studio';
DELETE FROM exercises WHERE name IN ('Ponte Simples', 'Alongamento de Isquiotibiais', 'Flexão de Joelho Assistida', 'Exercícios de Respiração Diafragmática', 'Fortalecimento de Quadríceps com Elástico');

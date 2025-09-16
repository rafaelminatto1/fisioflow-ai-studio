
-- Primeiro, vamos limpar os usuários de teste antigos
DELETE FROM users WHERE email IN (
  'admin@fisioflow.com',
  'ana.silva@fisioflow.com', 
  'carlos.santos@fisioflow.com',
  'maria.recep@fisioflow.com',
  'paciente.teste@email.com'
);

-- Agora vamos criar usuários de teste com senhas hashadas corretamente
-- Hash para 'fisioflow123' é: $2a$12$LQv3c1yqBWVHxkd0LhKsAuqQ4YLY9XLB7x9Jz5jZ4H0Y8l8g2K3k6 (exemplo)
-- Mas vamos usar um processo mais simples primeiro

INSERT INTO users (email, name, password_hash, salt, role, clinic_id, phone, specialties, is_email_verified, created_at, updated_at) VALUES
('admin@fisioflow.com', 'Administrador Sistema', '$2a$12$8P5jWlGp8VjVsHzUzHzZCO8.pDCKnlEkqLg0KJa2ypMqLKc4tLqNW', 'admin_salt', 'ADMIN', 1, '(11) 99999-0000', 'Administração', 1, datetime('now'), datetime('now')),
('ana.silva@fisioflow.com', 'Dra. Ana Silva', '$2a$12$8P5jWlGp8VjVsHzUzHzZCO8.pDCKnlEkqLg0KJa2ypMqLKc4tLqNW', 'ana_salt', 'FISIOTERAPEUTA', 1, '(11) 99999-1111', 'Ortopedia, RPG, Pilates Clínico', 1, datetime('now'), datetime('now')),
('carlos.santos@fisioflow.com', 'Dr. Carlos Santos', '$2a$12$8P5jWlGp8VjVsHzUzHzZCO8.pDCKnlEkqLg0KJa2ypMqLKc4tLqNW', 'carlos_salt', 'FISIOTERAPEUTA', 1, '(11) 99999-2222', 'Neurologia, Pediatria', 1, datetime('now'), datetime('now')),
('maria.recep@fisioflow.com', 'Maria Receptionist', '$2a$12$8P5jWlGp8VjVsHzUzHzZCO8.pDCKnlEkqLg0KJa2ypMqLKc4tLqNW', 'maria_salt', 'ASSISTENTE', 1, '(11) 99999-3333', 'Atendimento ao Cliente', 1, datetime('now'), datetime('now')),
('paciente.teste@email.com', 'João Paciente', '$2a$12$8P5jWlGp8VjVsHzUzHzZCO8.pDCKnlEkqLg0KJa2ypMqLKc4tLqNW', 'joao_salt', 'PACIENTE', 1, '(11) 99999-4444', null, 1, datetime('now'), datetime('now'));

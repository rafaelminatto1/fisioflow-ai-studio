
-- Inserir usuários de teste com senhas conhecidas
-- Senha para todos: "fisioflow123"
-- Hash gerado com bcrypt.js para "fisioflow123"

INSERT OR REPLACE INTO users (
  id, email, name, password_hash, salt, role, clinic_id, phone, 
  specialties, is_email_verified, is_active, created_at, updated_at
) VALUES 
-- Admin principal
(1, 'admin@fisioflow.com', 'Administrador Sistema', 
 '$2a$12$LQv3c1yqBw2fyuPiexD.Au4HjhJVxBJx3.bVqbOT4aYCYG0oBy1Ke', 
 'salt123', 'ADMIN', 1, '(11) 99999-0001', 
 'Administração Geral', 1, 1, datetime('now'), datetime('now')),

-- Fisioterapeuta senior
(2, 'ana.silva@fisioflow.com', 'Dra. Ana Silva', 
 '$2a$12$LQv3c1yqBw2fyuPiexD.Au4HjhJVxBJx3.bVqbOT4aYCYG0oBy1Ke', 
 'salt123', 'FISIOTERAPEUTA', 1, '(11) 99999-0002', 
 'Ortopedia, RPG, Pilates Clínico', 1, 1, datetime('now'), datetime('now')),

-- Fisioterapeuta junior  
(3, 'carlos.santos@fisioflow.com', 'Dr. Carlos Santos', 
 '$2a$12$LQv3c1yqBw2fyuPiexD.Au4HjhJVxBJx3.bVqbOT4aYCYG0oBy1Ke', 
 'salt123', 'FISIOTERAPEUTA', 1, '(11) 99999-0003', 
 'Neurologia, Pediatria', 1, 1, datetime('now'), datetime('now')),

-- Recepcionista/Assistente
(4, 'maria.recep@fisioflow.com', 'Maria Receptionist', 
 '$2a$12$LQv3c1yqBw2fyuPiexD.Au4HjhJVxBJx3.bVqbOT4aYCYG0oBy1Ke', 
 'salt123', 'ASSISTENTE', 1, '(11) 99999-0004', 
 'Atendimento ao Cliente', 1, 1, datetime('now'), datetime('now')),

-- Paciente teste
(5, 'paciente.teste@email.com', 'João Paciente', 
 '$2a$12$LQv3c1yqBw2fyuPiexD.Au4HjhJVxBJx3.bVqbOT4aYCYG0oBy1Ke', 
 'salt123', 'PACIENTE', 1, '(11) 99999-0005', 
 '', 1, 1, datetime('now'), datetime('now'));

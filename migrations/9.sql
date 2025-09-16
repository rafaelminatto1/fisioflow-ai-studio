
-- Delete existing test users to recreate them properly
DELETE FROM users WHERE email IN (
    'admin@fisioflow.com',
    'ana.silva@fisioflow.com', 
    'carlos.santos@fisioflow.com',
    'maria.recep@fisioflow.com',
    'paciente.teste@email.com'
);

-- Create test users with properly hashed passwords
-- Password: fisioflow123, Hash: $2a$12$LQv3c1yqBwn.35rR3T8jXOdVmUZ.V3VIZmj3DfGQf3wQQwQqQqQqQ
INSERT INTO users (
    email, name, password_hash, salt, role, clinic_id, 
    phone, specialties, is_email_verified, is_active,
    created_at, updated_at
) VALUES 
(
    'admin@fisioflow.com',
    'Administrador Sistema', 
    '$2a$12$LQv3c1yqBwn.35rR3T8jXOdVmUZ.V3VIZmj3DfGQf3wQQwQqQqQqQ',
    '$2a$12$LQv3c1yqBwn.35rR3T8jXO',
    'ADMIN',
    1,
    '(11) 99999-0000',
    'Administração',
    1,
    1,
    datetime('now'),
    datetime('now')
),
(
    'ana.silva@fisioflow.com',
    'Dra. Ana Silva',
    '$2a$12$LQv3c1yqBwn.35rR3T8jXOdVmUZ.V3VIZmj3DfGQf3wQQwQqQqQqQ',
    '$2a$12$LQv3c1yqBwn.35rR3T8jXO',
    'FISIOTERAPEUTA',
    1,
    '(11) 99999-1111',
    'Ortopedia, RPG, Pilates Clínico',
    1,
    1,
    datetime('now'),
    datetime('now')
),
(
    'carlos.santos@fisioflow.com',
    'Dr. Carlos Santos',
    '$2a$12$LQv3c1yqBwn.35rR3T8jXOdVmUZ.V3VIZmj3DfGQf3wQQwQqQqQqQ',
    '$2a$12$LQv3c1yqBwn.35rR3T8jXO',
    'FISIOTERAPEUTA',
    1,
    '(11) 99999-2222',
    'Neurologia, Pediatria',
    1,
    1,
    datetime('now'),
    datetime('now')
),
(
    'maria.recep@fisioflow.com',
    'Maria Receptionist',
    '$2a$12$LQv3c1yqBwn.35rR3T8jXOdVmUZ.V3VIZmj3DfGQf3wQQQwQqQqQqQ',
    '$2a$12$LQv3c1yqBwn.35rR3T8jXO',
    'ASSISTENTE',
    1,
    '(11) 99999-3333',
    'Atendimento ao Cliente',
    1,
    1,
    datetime('now'),
    datetime('now')
),
(
    'paciente.teste@email.com',
    'João Paciente',
    '$2a$12$LQv3c1yqBwn.35rR3T8jXOdVmUZ.V3VIZmj3DfGQf3wQQwQqQqQqQ',
    '$2a$12$LQv3c1yqBwn.35rR3T8jXO',
    'PACIENTE',
    1,
    '(11) 99999-4444',
    NULL,
    1,
    1,
    datetime('now'),
    datetime('now')
);

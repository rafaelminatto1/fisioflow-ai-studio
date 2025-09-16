import * as bcrypt from "bcryptjs";

export async function createTestUsers(db: any) {
  try {
    console.log('Creating test users with proper password hashing...');

    // Password that will be used for all test users
    const testPassword = 'fisioflow123';
    
    // Generate a proper hash for the test password using bcrypt
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(testPassword, salt);

    console.log('Generated password hash:', passwordHash);
    console.log('Salt used:', salt);

    // Delete existing test users first
    await db.prepare(`
      DELETE FROM users WHERE email IN (?, ?, ?, ?, ?)
    `).bind(
      'admin@fisioflow.com',
      'ana.silva@fisioflow.com',
      'carlos.santos@fisioflow.com',
      'maria.recep@fisioflow.com',
      'paciente.teste@email.com'
    ).run();

    // Test users data
    const testUsers = [
      {
        email: 'admin@fisioflow.com',
        name: 'Administrador Sistema',
        role: 'ADMIN',
        phone: '(11) 99999-0000',
        specialties: 'Administração'
      },
      {
        email: 'ana.silva@fisioflow.com',
        name: 'Dra. Ana Silva',
        role: 'FISIOTERAPEUTA',
        phone: '(11) 99999-1111',
        specialties: 'Ortopedia, RPG, Pilates Clínico'
      },
      {
        email: 'carlos.santos@fisioflow.com',
        name: 'Dr. Carlos Santos',
        role: 'FISIOTERAPEUTA',
        phone: '(11) 99999-2222',
        specialties: 'Neurologia, Pediatria'
      },
      {
        email: 'maria.recep@fisioflow.com',
        name: 'Maria Receptionist',
        role: 'ASSISTENTE',
        phone: '(11) 99999-3333',
        specialties: 'Atendimento ao Cliente'
      },
      {
        email: 'paciente.teste@email.com',
        name: 'João Paciente',
        role: 'PACIENTE',
        phone: '(11) 99999-4444',
        specialties: null
      }
    ];

    // Insert each test user with the same password hash
    for (const user of testUsers) {
      // Generate a fresh hash for each user to be extra sure
      const userPasswordHash = await bcrypt.hash(testPassword, 12);
      
      await db.prepare(`
        INSERT INTO users (
          email, name, password_hash, salt, role, clinic_id, 
          phone, specialties, is_email_verified, is_active,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        user.email,
        user.name,
        userPasswordHash,
        salt,
        user.role,
        1, // clinic_id
        user.phone,
        user.specialties,
        1, // is_email_verified
        1  // is_active
      ).run();

      console.log(`✅ Created user: ${user.email} (${user.name})`);
      
      // Verify the password works immediately after creation
      const verification = await bcrypt.compare(testPassword, userPasswordHash);
      console.log(`🔐 Password verification for ${user.email}:`, verification);
    }

    console.log('🔐 Test password for all users:', testPassword);
    console.log('✅ All test users created successfully!');

    return {
      success: true,
      password: testPassword,
      users: testUsers.map(u => ({ email: u.email, name: u.name, role: u.role }))
    };

  } catch (error) {
    console.error('❌ Error creating test users:', error);
    throw error;
  }
}

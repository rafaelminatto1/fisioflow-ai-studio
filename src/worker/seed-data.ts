// Sample data to populate the database for development and testing

export async function seedDatabase(db: any) {
  try {
    console.log('Starting database seeding...');

    // Check if data already exists
    const existingPatients = await db.prepare('SELECT COUNT(*) as count FROM patients').first();
    if (existingPatients.count > 0) {
      console.log('Database already has data, skipping seed.');
      return;
    }

    // Insert sample clinic
    await db.prepare(`
      INSERT OR IGNORE INTO clinics (
        id, name, cnpj, email, phone, address, subscription_plan, 
        created_at, updated_at
      ) VALUES (
        1, 'Clínica FisioFlow', '12.345.678/0001-90', 'contato@fisioflow.com',
        '(11) 3333-4444', 'Rua das Flores, 123 - São Paulo, SP', 'PROFESSIONAL',
        datetime('now'), datetime('now')
      )
    `).run();

    // Insert sample user
    await db.prepare(`
      INSERT OR IGNORE INTO users (
        id, email, name, role, clinic_id, phone, specialties,
        created_at, updated_at
      ) VALUES (
        1, 'ana.silva@fisioflow.com', 'Dr. Ana Silva', 'FISIOTERAPEUTA',
        1, '(11) 99999-9999', 'Ortopedia, RPG, Pilates',
        datetime('now'), datetime('now')
      )
    `).run();

    // Insert sample patients
    const patients = [
      {
        name: 'Maria Silva Santos',
        cpf: '123.456.789-01',
        email: 'maria.silva@email.com',
        phone: '(11) 98765-4321',
        birthDate: '1985-03-15',
        gender: 'FEMININO',
        address: 'Rua das Palmeiras, 456 - São Paulo, SP',
        emergencyContact: 'João Silva - (11) 98765-1234',
        medicalHistory: 'Histórico de dor lombar crônica. Sem alergias conhecidas.'
      },
      {
        name: 'João Carlos Oliveira',
        cpf: '987.654.321-09',
        email: 'joao.carlos@email.com',
        phone: '(11) 98765-5678',
        birthDate: '1978-07-22',
        gender: 'MASCULINO',
        address: 'Av. Paulista, 1000 - São Paulo, SP',
        emergencyContact: 'Ana Oliveira - (11) 98765-5679',
        medicalHistory: 'Lesão no joelho direito por atividade esportiva.'
      },
      {
        name: 'Ana Paula Costa',
        cpf: '456.789.123-45',
        email: 'ana.paula@email.com',
        phone: '(11) 98765-9012',
        birthDate: '1992-11-08',
        gender: 'FEMININO',
        address: 'Rua Augusta, 2000 - São Paulo, SP',
        emergencyContact: 'Carlos Costa - (11) 98765-9013',
        medicalHistory: 'Tendinite no ombro direito. Pratica natação.'
      },
      {
        name: 'Roberto Fernandes',
        cpf: '789.123.456-78',
        email: 'roberto.fernandes@email.com',
        phone: '(11) 98765-3456',
        birthDate: '1965-01-30',
        gender: 'MASCULINO',
        address: 'Rua Consolação, 500 - São Paulo, SP',
        emergencyContact: 'Lucia Fernandes - (11) 98765-3457',
        medicalHistory: 'Artrose no quadril. Histórico de cirurgia no menisco.'
      },
      {
        name: 'Carla Regina Souza',
        cpf: '321.654.987-12',
        email: 'carla.souza@email.com',
        phone: '(11) 98765-7890',
        birthDate: '1988-05-17',
        gender: 'FEMININO',
        address: 'Rua Rebouças, 800 - São Paulo, SP',
        emergencyContact: 'Paulo Souza - (11) 98765-7891',
        medicalHistory: 'Hérnia de disco L4-L5. Pratica pilates regularmente.'
      }
    ];

    for (const patient of patients) {
      await db.prepare(`
        INSERT INTO patients (
          name, cpf, email, phone, birth_date, gender, address,
          emergency_contact, medical_history, clinic_id, created_by,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, datetime('now'), datetime('now'))
      `).bind(
        patient.name, patient.cpf, patient.email, patient.phone,
        patient.birthDate, patient.gender, patient.address,
        patient.emergencyContact, patient.medicalHistory
      ).run();
    }

    // Insert sample exercises
    const exercises = [
      {
        name: 'Alongamento de Quadríceps',
        description: 'Exercício de alongamento para o músculo quadríceps',
        instructions: '1. Em pé, flexione o joelho levando o calcanhar em direção ao glúteo. 2. Segure o pé com a mão. 3. Mantenha por 30 segundos. 4. Repita do outro lado.',
        duration: 5,
        difficulty: 1,
        equipment: 'Nenhum',
        bodyParts: 'Coxa anterior, quadríceps',
        conditions: 'Tensão muscular, pós-treino',
        category: 'Alongamento',
        specialty: 'Fisioterapia Ortopédica'
      },
      {
        name: 'Fortalecimento de Core com Prancha',
        description: 'Exercício isométrico para fortalecimento do core',
        instructions: '1. Posição de prancha com apoio nos antebraços. 2. Mantenha o corpo alinhado. 3. Contraia o abdômen. 4. Segure por 30-60 segundos.',
        duration: 3,
        difficulty: 2,
        equipment: 'Tapete',
        bodyParts: 'Abdômen, core, estabilizadores',
        conditions: 'Fortalecimento abdominal, estabilidade',
        category: 'Fortalecimento',
        specialty: 'Fisioterapia Ortopédica'
      },
      {
        name: 'Mobilização Cervical',
        description: 'Exercício de mobilização para a coluna cervical',
        instructions: '1. Sentado, cabeça em posição neutra. 2. Gire lentamente a cabeça para direita. 3. Retorne ao centro. 4. Repita para a esquerda.',
        duration: 5,
        difficulty: 1,
        equipment: 'Cadeira',
        bodyParts: 'Cervical, pescoço',
        conditions: 'Rigidez cervical, torcicolo',
        category: 'Mobilização',
        specialty: 'Fisioterapia Ortopédica'
      },
      {
        name: 'Agachamento Terapêutico',
        description: 'Exercício de fortalecimento para membros inferiores',
        instructions: '1. Em pé, pés afastados na largura dos quadris. 2. Flexione joelhos como se fosse sentar. 3. Desça até 90 graus. 4. Retorne à posição inicial.',
        duration: 8,
        difficulty: 3,
        equipment: 'Nenhum ou cadeira de apoio',
        bodyParts: 'Quadríceps, glúteos, panturrilha',
        conditions: 'Fortalecimento geral, reabilitação de joelho',
        category: 'Fortalecimento',
        specialty: 'Fisioterapia Ortopédica'
      },
      {
        name: 'Respiração Diafragmática',
        description: 'Exercício respiratório para reeducação do diafragma',
        instructions: '1. Deitado, uma mão no peito, outra no abdômen. 2. Inspire lentamente pelo nariz. 3. Foque na expansão abdominal. 4. Expire pela boca.',
        duration: 10,
        difficulty: 1,
        equipment: 'Tapete',
        bodyParts: 'Diafragma, músculos respiratórios',
        conditions: 'Reabilitação respiratória, ansiedade',
        category: 'Respiratória',
        specialty: 'Fisioterapia Respiratória'
      },
      {
        name: 'Exercício com Bola Suíça',
        description: 'Exercício de equilíbrio e fortalecimento com bola',
        instructions: '1. Sentado na bola, pés apoiados no chão. 2. Mantenha postura ereta. 3. Faça pequenos movimentos de balanceio. 4. Mantenha equilíbrio.',
        duration: 15,
        difficulty: 3,
        equipment: 'Bola suíça',
        bodyParts: 'Core, estabilizadores, equilíbrio',
        conditions: 'Propriocepção, fortalecimento global',
        category: 'Propriocepção',
        specialty: 'Pilates Clínico'
      }
    ];

    for (const exercise of exercises) {
      await db.prepare(`
        INSERT INTO exercises (
          name, description, instructions, duration, difficulty,
          equipment, body_parts, conditions, category, specialty,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        exercise.name, exercise.description, exercise.instructions,
        exercise.duration, exercise.difficulty, exercise.equipment,
        exercise.bodyParts, exercise.conditions, exercise.category,
        exercise.specialty
      ).run();
    }

    // Insert sample appointments
    const now = new Date();
    const appointments = [
      {
        patientId: 1,
        appointmentDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        duration: 60,
        status: 'SCHEDULED',
        type: 'TREATMENT',
        service: 'Fisioterapia Ortopédica',
        notes: 'Continuar tratamento para dor lombar'
      },
      {
        patientId: 2,
        appointmentDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
        duration: 45,
        status: 'CONFIRMED',
        type: 'CONSULTATION',
        service: 'Avaliação de Joelho',
        notes: 'Primeira consulta pós-lesão'
      },
      {
        patientId: 3,
        appointmentDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 50,
        status: 'SCHEDULED',
        type: 'TREATMENT',
        service: 'Tratamento de Ombro',
        notes: 'Sessão de mobilização'
      }
    ];

    for (const appointment of appointments) {
      await db.prepare(`
        INSERT INTO appointments (
          patient_id, user_id, clinic_id, appointment_date, duration,
          status, type, service, notes, created_at, updated_at
        ) VALUES (?, 1, 1, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        appointment.patientId, appointment.appointmentDate,
        appointment.duration, appointment.status, appointment.type,
        appointment.service, appointment.notes
      ).run();
    }

    // Insert sample financial transactions
    const transactions = [
      {
        type: 'INCOME',
        category: 'Consulta',
        description: 'Consulta - Maria Silva Santos',
        amount: 150.00,
        date: new Date().toISOString().split('T')[0],
        status: 'PAID',
        paymentMethod: 'PIX',
        patientId: 1
      },
      {
        type: 'INCOME',
        category: 'Sessão',
        description: 'Sessão de Fisioterapia - João Carlos',
        amount: 120.00,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'PAID',
        paymentMethod: 'Cartão de Crédito',
        patientId: 2
      },
      {
        type: 'EXPENSE',
        category: 'Equipamentos',
        description: 'Compra de bolas suíças',
        amount: 300.00,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'PAID',
        paymentMethod: 'Cartão de Débito'
      },
      {
        type: 'INCOME',
        category: 'Pilates',
        description: 'Aula de Pilates - Ana Paula',
        amount: 80.00,
        date: new Date().toISOString().split('T')[0],
        status: 'PENDING',
        paymentMethod: 'Dinheiro',
        patientId: 3
      }
    ];

    for (const transaction of transactions) {
      await db.prepare(`
        INSERT INTO financial_transactions (
          clinic_id, user_id, patient_id, type, category, description,
          amount, transaction_date, status, payment_method,
          created_at, updated_at
        ) VALUES (1, 1, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        transaction.patientId || null, transaction.type, transaction.category,
        transaction.description, transaction.amount, transaction.date,
        transaction.status, transaction.paymentMethod
      ).run();
    }

    // Insert sample prescription
    await db.prepare(`
      INSERT INTO prescriptions (
        patient_id, user_id, clinic_id, title, description,
        start_date, end_date, status, notes,
        created_at, updated_at
      ) VALUES (
        1, 1, 1, 'Protocolo de Reabilitação Lombar',
        'Protocolo focado no fortalecimento do core e alívio da dor lombar',
        ?, ?, 'ACTIVE',
        'Paciente deve realizar exercícios 3x por semana. Evitar movimentos bruscos.',
        datetime('now'), datetime('now')
      )
    `).bind(
      new Date().toISOString().split('T')[0],
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    ).run();

    // Insert prescription exercises
    const prescriptionExercises = [
      {
        exerciseId: 1,
        exerciseName: 'Alongamento de Quadríceps',
        sets: 3,
        reps: '30 segundos',
        duration: 5,
        frequency: '2x ao dia',
        notes: 'Manter alongamento suave, sem dor'
      },
      {
        exerciseId: 2,
        exerciseName: 'Fortalecimento de Core com Prancha',
        sets: 3,
        reps: '30 segundos',
        duration: 5,
        frequency: '1x ao dia',
        notes: 'Progredir gradualmente o tempo de sustentação'
      }
    ];

    for (const exercise of prescriptionExercises) {
      await db.prepare(`
        INSERT INTO prescription_exercises (
          prescription_id, exercise_id, exercise_name, sets, reps,
          duration, frequency, notes, created_at, updated_at
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        exercise.exerciseId, exercise.exerciseName, exercise.sets,
        exercise.reps, exercise.duration, exercise.frequency, exercise.notes
      ).run();
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

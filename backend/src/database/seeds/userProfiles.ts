import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedUserProfiles() {
  console.log('🌱 Seeding user profiles...');

  // Hash padrão para todas as senhas de teste
  const defaultPassword = await bcrypt.hash('Test123!@#', 12);

  try {
    // 1. ADMINISTRADOR
    console.log('Creating admin user...');
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@licitabrasil.com' },
      update: {},
      create: {
        email: 'admin@licitabrasil.com',
        password: defaultPassword,
        firstName: 'Administrador',
        lastName: 'Sistema',
        phone: '(11) 99999-9999',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });

    // 2. ÓRGÃO PÚBLICO (COMPRADOR)
    console.log('Creating public entity user...');
    const publicEntityUser = await prisma.user.upsert({
      where: { email: 'comprador@prefeitura.sp.gov.br' },
      update: {},
      create: {
        email: 'comprador@prefeitura.sp.gov.br',
        password: defaultPassword,
        firstName: 'João',
        lastName: 'Silva',
        phone: '(11) 3333-4444',
        role: UserRole.PUBLIC_ENTITY,
        status: UserStatus.ACTIVE,
      },
    });

    // Criar perfil de órgão público
    await prisma.publicEntity.upsert({
      where: { userId: publicEntityUser.id },
      update: {},
      create: {
        userId: publicEntityUser.id,
        name: 'Prefeitura Municipal de São Paulo',
        cnpj: '46.395.000/0001-39',
        entityType: 'Municipal',
        address: 'Rua Libero Badaró, 425',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01009-000',
        phone: '(11) 3113-9000',
        website: 'https://www.prefeitura.sp.gov.br',
        isActive: true,
        verifiedAt: new Date(),
      },
    });

    // 3. FORNECEDOR
    console.log('Creating supplier user...');
    const supplierUser = await prisma.user.upsert({
      where: { email: 'fornecedor@empresa.com.br' },
      update: {},
      create: {
        email: 'fornecedor@empresa.com.br',
        password: defaultPassword,
        firstName: 'Maria',
        lastName: 'Santos',
        phone: '(11) 2222-3333',
        role: UserRole.SUPPLIER,
        status: UserStatus.ACTIVE,
      },
    });

    // Criar perfil de fornecedor
    await prisma.supplier.upsert({
      where: { userId: supplierUser.id },
      update: {},
      create: {
        userId: supplierUser.id,
        companyName: 'Empresa de Tecnologia LTDA',
        tradeName: 'TechSolutions',
        cnpj: '12.345.678/0001-90',
        stateRegistration: '123456789',
        municipalRegistration: '987654321',
        address: 'Av. Paulista, 1000',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100',
        website: 'https://www.techsolutions.com.br',
        description: 'Empresa especializada em soluções tecnológicas para o setor público',
        isActive: true,
        verifiedAt: new Date(),
      },
    });

    // 4. CIDADÃO
    console.log('Creating citizen user...');
    const citizenUser = await prisma.user.upsert({
      where: { email: 'cidadao@email.com' },
      update: {},
      create: {
        email: 'cidadao@email.com',
        password: defaultPassword,
        firstName: 'Carlos',
        lastName: 'Oliveira',
        phone: '(11) 1111-2222',
        role: UserRole.CITIZEN,
        status: UserStatus.ACTIVE,
      },
    });

    // Criar perfil de cidadão
    await prisma.citizen.upsert({
      where: { userId: citizenUser.id },
      update: {},
      create: {
        userId: citizenUser.id,
        cpf: '123.456.789-00',
        dateOfBirth: new Date('1985-05-15'),
        profession: 'Engenheiro Civil',
        address: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '04567-890',
        interests: ['Obras Públicas', 'Tecnologia', 'Educação'],
        isActive: true,
        verifiedAt: new Date(),
      },
    });

    // 5. AUDITOR
    console.log('Creating auditor user...');
    const auditorUser = await prisma.user.upsert({
      where: { email: 'auditor@tcu.gov.br' },
      update: {},
      create: {
        email: 'auditor@tcu.gov.br',
        password: defaultPassword,
        firstName: 'Ana',
        lastName: 'Costa',
        phone: '(61) 3316-5000',
        role: UserRole.AUDITOR,
        status: UserStatus.ACTIVE,
      },
    });

    // Criar usuários adicionais para testes
    console.log('Creating additional test users...');

    // Fornecedor adicional
    const supplier2User = await prisma.user.upsert({
      where: { email: 'fornecedor2@construcoes.com.br' },
      update: {},
      create: {
        email: 'fornecedor2@construcoes.com.br',
        password: defaultPassword,
        firstName: 'Pedro',
        lastName: 'Almeida',
        phone: '(11) 5555-6666',
        role: UserRole.SUPPLIER,
        status: UserStatus.ACTIVE,
      },
    });

    await prisma.supplier.upsert({
      where: { userId: supplier2User.id },
      update: {},
      create: {
        userId: supplier2User.id,
        companyName: 'Construções e Reformas S.A.',
        tradeName: 'ConstrutoraPro',
        cnpj: '98.765.432/0001-10',
        stateRegistration: '987654321',
        municipalRegistration: '123456789',
        address: 'Rua dos Construtores, 500',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '05678-901',
        website: 'https://www.construtorapro.com.br',
        description: 'Empresa especializada em construção civil e reformas',
        isActive: true,
        verifiedAt: new Date(),
      },
    });

    // Órgão público adicional
    const publicEntity2User = await prisma.user.upsert({
      where: { email: 'comprador@governo.rj.gov.br' },
      update: {},
      create: {
        email: 'comprador@governo.rj.gov.br',
        password: defaultPassword,
        firstName: 'Roberto',
        lastName: 'Ferreira',
        phone: '(21) 2334-5678',
        role: UserRole.PUBLIC_ENTITY,
        status: UserStatus.ACTIVE,
      },
    });

    await prisma.publicEntity.upsert({
      where: { userId: publicEntity2User.id },
      update: {},
      create: {
        userId: publicEntity2User.id,
        name: 'Governo do Estado do Rio de Janeiro',
        cnpj: '42.498.733/0001-48',
        entityType: 'Estadual',
        address: 'Rua da Assembleia, 10',
        city: 'Rio de Janeiro',
        state: 'RJ',
        zipCode: '20011-000',
        phone: '(21) 2334-1000',
        website: 'https://www.rj.gov.br',
        isActive: true,
        verifiedAt: new Date(),
      },
    });

    // Cidadão adicional
    const citizen2User = await prisma.user.upsert({
      where: { email: 'cidadao2@email.com' },
      update: {},
      create: {
        email: 'cidadao2@email.com',
        password: defaultPassword,
        firstName: 'Fernanda',
        lastName: 'Lima',
        phone: '(11) 7777-8888',
        role: UserRole.CITIZEN,
        status: UserStatus.ACTIVE,
      },
    });

    await prisma.citizen.upsert({
      where: { userId: citizen2User.id },
      update: {},
      create: {
        userId: citizen2User.id,
        cpf: '987.654.321-00',
        dateOfBirth: new Date('1990-08-20'),
        profession: 'Advogada',
        address: 'Av. Brasil, 456',
        city: 'Rio de Janeiro',
        state: 'RJ',
        zipCode: '20040-020',
        interests: ['Direito Público', 'Transparência', 'Contratos'],
        isActive: true,
        verifiedAt: new Date(),
      },
    });

    console.log('✅ User profiles seeded successfully!');

    // Log das credenciais criadas
    console.log('\n📋 CREDENCIAIS DE TESTE CRIADAS:');
    console.log('================================');
    console.log('👑 ADMINISTRADOR:');
    console.log('   Email: admin@licitabrasil.com');
    console.log('   Senha: Test123!@#');
    console.log('');
    console.log('🏛️  COMPRADOR (Prefeitura SP):');
    console.log('   Email: comprador@prefeitura.sp.gov.br');
    console.log('   Senha: Test123!@#');
    console.log('');
    console.log('🏛️  COMPRADOR (Governo RJ):');
    console.log('   Email: comprador@governo.rj.gov.br');
    console.log('   Senha: Test123!@#');
    console.log('');
    console.log('🏢 FORNECEDOR (TechSolutions):');
    console.log('   Email: fornecedor@empresa.com.br');
    console.log('   Senha: Test123!@#');
    console.log('');
    console.log('🏢 FORNECEDOR (ConstrutoraPro):');
    console.log('   Email: fornecedor2@construcoes.com.br');
    console.log('   Senha: Test123!@#');
    console.log('');
    console.log('👤 CIDADÃO (Carlos):');
    console.log('   Email: cidadao@email.com');
    console.log('   Senha: Test123!@#');
    console.log('');
    console.log('👤 CIDADÃO (Fernanda):');
    console.log('   Email: cidadao2@email.com');
    console.log('   Senha: Test123!@#');
    console.log('');
    console.log('🔍 AUDITOR:');
    console.log('   Email: auditor@tcu.gov.br');
    console.log('   Senha: Test123!@#');
    console.log('================================');

  } catch (error) {
    console.error('❌ Error seeding user profiles:', error);
    throw error;
  }
}

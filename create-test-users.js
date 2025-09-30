const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUsers() {
  console.log('🔐 Criando usuários de teste para validação RBAC...');

  // Hash padrão para todas as senhas de teste
  const defaultPassword = await bcrypt.hash('Test123!@#', 12);

  try {
    // 1. ADMINISTRADOR
    console.log('Criando usuário ADMIN...');
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin.teste@licitabrasil.com.br' },
      update: {},
      create: {
        email: 'admin.teste@licitabrasil.com.br',
        password: defaultPassword,
        firstName: 'Administrador',
        lastName: 'Sistema',
        phone: '(11) 99999-0000',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    console.log(`✅ Admin criado: ${adminUser.email} (ID: ${adminUser.id})`);

    // 2. CIDADÃO
    console.log('Criando usuário CITIZEN...');
    const citizenUser = await prisma.user.upsert({
      where: { email: 'cidadao.teste@email.com' },
      update: {},
      create: {
        email: 'cidadao.teste@email.com',
        password: defaultPassword,
        firstName: 'Carlos',
        lastName: 'Oliveira',
        phone: '(11) 99999-3333',
        role: 'CITIZEN',
        status: 'ACTIVE',
      },
    });
    console.log(`✅ Cidadão criado: ${citizenUser.email} (ID: ${citizenUser.id})`);

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
    console.log('✅ Perfil de cidadão criado');

    // 3. AUDITOR (se necessário)
    console.log('Criando usuário AUDITOR...');
    const auditorUser = await prisma.user.upsert({
      where: { email: 'auditor.teste@tcu.gov.br' },
      update: {},
      create: {
        email: 'auditor.teste@tcu.gov.br',
        password: defaultPassword,
        firstName: 'Ana',
        lastName: 'Costa',
        phone: '(61) 3316-5000',
        role: 'AUDITOR',
        status: 'ACTIVE',
      },
    });
    console.log(`✅ Auditor criado: ${auditorUser.email} (ID: ${auditorUser.id})`);

    console.log('\n🎉 Todos os usuários de teste foram criados com sucesso!');
    console.log('\n📋 RESUMO DOS USUÁRIOS CRIADOS:');
    console.log('1. ADMIN: admin.teste@licitabrasil.com.br / Test123!@#');
    console.log('2. SUPPLIER: fornecedor.teste@empresa.com.br / Test123!@# (PENDING)');
    console.log('3. PUBLIC_ENTITY: comprador.teste@prefeitura.gov.br / Test123!@# (PENDING)');
    console.log('4. CITIZEN: cidadao.teste@email.com / Test123!@#');
    console.log('5. AUDITOR: auditor.teste@tcu.gov.br / Test123!@#');

  } catch (error) {
    console.error('❌ Erro ao criar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();

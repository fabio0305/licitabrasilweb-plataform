import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

async function createAdminUser() {
  try {
    console.log('🔧 Script para criar usuário Administrador - LicitaBrasil Web Platform\n');

    // Verificar se já existe um admin
    const existingAdmin = await prisma.user.findFirst({
      where: { role: UserRole.ADMIN }
    });

    if (existingAdmin) {
      console.log('⚠️  Já existe um usuário administrador no sistema:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Nome: ${existingAdmin.firstName} ${existingAdmin.lastName}`);
      console.log(`   Status: ${existingAdmin.status}\n`);
      
      const confirm = await question('Deseja criar outro administrador? (s/N): ');
      if (confirm.toLowerCase() !== 's' && confirm.toLowerCase() !== 'sim') {
        console.log('Operação cancelada.');
        return;
      }
    }

    // Coletar dados do administrador
    console.log('📝 Informe os dados do novo administrador:\n');
    
    const email = await question('Email: ');
    if (!email || !email.includes('@')) {
      throw new Error('Email inválido');
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('Este email já está cadastrado no sistema');
    }

    const firstName = await question('Nome: ');
    if (!firstName || firstName.length < 2) {
      throw new Error('Nome deve ter pelo menos 2 caracteres');
    }

    const lastName = await question('Sobrenome: ');
    if (!lastName || lastName.length < 2) {
      throw new Error('Sobrenome deve ter pelo menos 2 caracteres');
    }

    const phone = await question('Telefone (opcional): ');

    let password = '';
    while (password.length < 8) {
      password = await question('Senha (mínimo 8 caracteres): ');
      if (password.length < 8) {
        console.log('❌ Senha deve ter pelo menos 8 caracteres');
      }
    }

    const confirmPassword = await question('Confirme a senha: ');
    if (password !== confirmPassword) {
      throw new Error('Senhas não coincidem');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar usuário administrador
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
      }
    });

    console.log('\n✅ Usuário administrador criado com sucesso!');
    console.log('📋 Dados do administrador:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Nome: ${admin.firstName} ${admin.lastName}`);
    console.log(`   Perfil: ${admin.role}`);
    console.log(`   Status: ${admin.status}`);
    console.log(`   Criado em: ${admin.createdAt.toLocaleString('pt-BR')}`);
    console.log('\n🎉 O administrador pode agora fazer login na plataforma!');
    console.log(`🌐 Acesse: https://licitabrasilweb.com.br/login`);

  } catch (error) {
    console.error('\n❌ Erro ao criar administrador:', error instanceof Error ? error.message : error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Executar script
if (require.main === module) {
  createAdminUser();
}

export { createAdminUser };

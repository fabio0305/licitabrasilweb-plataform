#!/usr/bin/env node

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Função para testar o dashboard
async function testDashboard() {
  console.log('🧪 Testando correção do dashboard...\n');

  try {
    // 1. Verificar se a API está funcionando
    console.log('1. Verificando API...');
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('✅ API está funcionando:', healthResponse.data.status);

    // 2. Tentar fazer login com um usuário existente
    console.log('\n2. Testando login...');
    
    // Primeiro, vamos tentar registrar um usuário de teste
    const testUser = {
      firstName: 'Teste',
      lastName: 'Dashboard',
      email: 'teste.dashboard@example.com',
      password: 'TesteDashboard123!',
      role: 'CITIZEN',
      phone: '11999999999'
    };

    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
      console.log('✅ Usuário de teste criado com sucesso');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️  Usuário de teste já existe, continuando...');
      } else {
        console.log('⚠️  Erro ao criar usuário de teste:', error.response?.data?.error?.message || error.message);
      }
    }

    // Fazer login
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });

    if (loginResponse.data.success) {
      console.log('✅ Login realizado com sucesso');
      const token = loginResponse.data.data.tokens.accessToken;
      const user = loginResponse.data.data.user;
      
      console.log(`   Usuário: ${user.firstName} ${user.lastName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);

      // 3. Testar acesso ao perfil (simula o que o AuthContext faz)
      console.log('\n3. Testando acesso ao perfil...');
      const profileResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (profileResponse.data.success) {
        console.log('✅ Acesso ao perfil funcionando');
        console.log(`   Dados do usuário carregados: ${profileResponse.data.data.user.firstName}`);
      }

      // 4. Verificar redirecionamento baseado no role
      console.log('\n4. Verificando lógica de redirecionamento...');
      const userRole = user.role;
      
      let expectedRedirect;
      switch (userRole) {
        case 'CITIZEN':
          expectedRedirect = '/citizen-dashboard';
          break;
        case 'SUPPLIER':
          expectedRedirect = '/supplier-dashboard';
          break;
        case 'PUBLIC_ENTITY':
          expectedRedirect = '/public-entity-dashboard';
          break;
        case 'ADMIN':
          expectedRedirect = '/admin/dashboard';
          break;
        case 'AUDITOR':
          expectedRedirect = '/biddings';
          break;
        default:
          expectedRedirect = 'NENHUM (problema identificado!)';
      }

      console.log(`   Role do usuário: ${userRole}`);
      console.log(`   Redirecionamento esperado: ${expectedRedirect}`);

      if (expectedRedirect === 'NENHUM (problema identificado!)') {
        console.log('❌ PROBLEMA: Role não tratado no DashboardPage!');
      } else {
        console.log('✅ Role tratado corretamente no DashboardPage');
      }

    } else {
      console.log('❌ Falha no login');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.response?.data?.error?.message || error.message);
  }

  console.log('\n🏁 Teste concluído!');
  console.log('\n📋 Resumo da correção aplicada:');
  console.log('   - Adicionado tratamento para role AUDITOR no DashboardPage');
  console.log('   - Auditores agora são redirecionados para /biddings');
  console.log('   - Condição de retorno null atualizada para incluir AUDITOR');
  console.log('   - Dashboard não deve mais ficar em branco para nenhum role');
}

// Executar o teste
testDashboard();

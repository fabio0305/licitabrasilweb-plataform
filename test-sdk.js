#!/usr/bin/env node

/**
 * Teste do LicitaBrasil SDK
 * Valida as funcionalidades principais do SDK
 */

// Simular fetch para Node.js (usando import dinâmico)
let fetch;

// Importar o SDK (simulando import)
const fs = require('fs');
const path = require('path');

// Ler o arquivo do SDK
const sdkPath = path.join(__dirname, 'frontend-sdk', 'licitabrasil-sdk.js');
const sdkCode = fs.readFileSync(sdkPath, 'utf8');

// Executar o código do SDK
eval(sdkCode);

async function testSDK() {
  console.log('🧪 Iniciando testes do LicitaBrasil SDK...\n');

  try {
    // Importar fetch dinamicamente
    const nodeFetch = await import('node-fetch');
    global.fetch = nodeFetch.default;
    // Criar instância do SDK
    const sdk = new LicitaBrasilSDK({
      baseURL: 'http://localhost:3001/api/v1',
      onTokenRefresh: (tokens) => {
        console.log('✅ Tokens renovados automaticamente');
      },
      onAuthError: (error) => {
        console.log('❌ Erro de autenticação:', error.message);
      },
      onNetworkError: (error) => {
        console.log('🌐 Erro de rede:', error.message);
      }
    });

    console.log('✅ SDK inicializado com sucesso');

    // Teste 1: Dashboard público
    console.log('\n📊 Teste 1: Dashboard público');
    try {
      const dashboard = await sdk.getTransparencyDashboard();
      console.log('✅ Dashboard obtido com sucesso');
      console.log(`   - Total de licitações: ${dashboard.statistics.totalBiddings}`);
      console.log(`   - Licitações abertas: ${dashboard.statistics.openBiddings}`);
    } catch (error) {
      console.log('❌ Erro ao obter dashboard:', error.message);
    }

    // Teste 2: Login
    console.log('\n🔐 Teste 2: Login de usuário');
    try {
      const loginResult = await sdk.login('admin@licitabrasil.com', 'Test123!@#');
      console.log('✅ Login realizado com sucesso');
      console.log(`   - Usuário: ${loginResult.user.firstName} ${loginResult.user.lastName}`);
      console.log(`   - Role: ${loginResult.user.role}`);
      console.log(`   - Token válido: ${loginResult.tokens.accessToken ? 'Sim' : 'Não'}`);
    } catch (error) {
      console.log('❌ Erro no login:', error.message);
      return;
    }

    // Teste 3: Perfil do usuário (autenticado)
    console.log('\n👤 Teste 3: Perfil do usuário');
    try {
      const profile = await sdk.getUserProfile();
      console.log('✅ Perfil obtido com sucesso');
      console.log(`   - ID: ${profile.id}`);
      console.log(`   - Email: ${profile.email}`);
      console.log(`   - Status: ${profile.status}`);
    } catch (error) {
      console.log('❌ Erro ao obter perfil:', error.message);
    }

    // Teste 4: Licitações públicas
    console.log('\n📋 Teste 4: Lista de licitações');
    try {
      const biddings = await sdk.getBiddings({ page: 1, limit: 5 });
      console.log('✅ Licitações obtidas com sucesso');
      console.log(`   - Total encontrado: ${biddings.pagination.total}`);
      console.log(`   - Página atual: ${biddings.pagination.page}`);
      console.log(`   - Itens por página: ${biddings.pagination.limit}`);
    } catch (error) {
      console.log('❌ Erro ao obter licitações:', error.message);
    }

    // Teste 5: Contratos públicos
    console.log('\n📄 Teste 5: Lista de contratos');
    try {
      const contracts = await sdk.getContracts({ page: 1, limit: 5 });
      console.log('✅ Contratos obtidos com sucesso');
      console.log(`   - Total encontrado: ${contracts.pagination.total}`);
      console.log(`   - Página atual: ${contracts.pagination.page}`);
    } catch (error) {
      console.log('❌ Erro ao obter contratos:', error.message);
    }

    // Teste 6: Busca
    console.log('\n🔍 Teste 6: Busca de licitações');
    try {
      const searchResults = await sdk.getBiddings({ 
        search: 'tecnologia', 
        page: 1, 
        limit: 3 
      });
      console.log('✅ Busca realizada com sucesso');
      console.log(`   - Resultados encontrados: ${searchResults.pagination.total}`);
    } catch (error) {
      console.log('❌ Erro na busca:', error.message);
    }

    // Teste 7: Logout
    console.log('\n🚪 Teste 7: Logout');
    try {
      await sdk.logout();
      console.log('✅ Logout realizado com sucesso');
    } catch (error) {
      console.log('❌ Erro no logout:', error.message);
    }

    // Teste 8: Tentativa de acesso após logout (deve falhar)
    console.log('\n🔒 Teste 8: Acesso após logout (deve falhar)');
    try {
      await sdk.getUserProfile();
      console.log('❌ Erro: Acesso permitido após logout');
    } catch (error) {
      console.log('✅ Acesso negado corretamente após logout');
    }

    console.log('\n🎉 Testes do SDK concluídos!');

  } catch (error) {
    console.log('\n❌ Erro geral nos testes:', error.message);
    console.log(error.stack);
  }
}

// Executar testes se chamado diretamente
if (require.main === module) {
  testSDK().catch(console.error);
}

module.exports = { testSDK };

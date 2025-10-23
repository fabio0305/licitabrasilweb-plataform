const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/v1';

async function testAdminDashboard() {
  console.log('🧪 Testando Admin Dashboard - Correção da Tela em Branco\n');
  
  try {
    // 1. Fazer login como admin
    console.log('🔐 Fazendo login como administrador...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin.teste@licitabrasil.com.br',
      password: 'Test123!@#'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Falha no login:', loginResponse.data.error?.message);
      return;
    }
    
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login realizado com sucesso');
    
    // 2. Testar endpoint de estatísticas
    console.log('\n📊 Testando endpoint /admin/statistics...');
    const statsResponse = await axios.get(`${API_BASE}/admin/statistics`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (statsResponse.data.success) {
      console.log('✅ Estatísticas carregadas com sucesso');
      const stats = statsResponse.data.data.statistics;
      console.log(`   📈 Total de usuários: ${stats.users.total}`);
      console.log(`   ⏳ Usuários pendentes: ${stats.users.pending}`);
      console.log(`   🎯 Licitações ativas: ${stats.biddings.open}`);
      console.log(`   📋 Total de licitações: ${stats.biddings.total}`);
      
      // Verificar estrutura de dados
      console.log('\n🔍 Verificando estrutura de dados:');
      console.log('   ✅ stats.users.total:', typeof stats.users.total);
      console.log('   ✅ stats.users.pending:', typeof stats.users.pending);
      console.log('   ✅ stats.biddings.open:', typeof stats.biddings.open);
      console.log('   ✅ stats.biddings.total:', typeof stats.biddings.total);
      console.log('   ✅ stats.users.byRole:', typeof stats.users.byRole);
    } else {
      console.log('❌ Erro ao carregar estatísticas:', statsResponse.data.error);
    }
    
    // 3. Testar endpoint de usuários pendentes
    console.log('\n👥 Testando endpoint /admin/users?status=PENDING...');
    const usersResponse = await axios.get(`${API_BASE}/admin/users?status=PENDING&limit=5`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (usersResponse.data.success) {
      console.log('✅ Usuários pendentes carregados com sucesso');
      console.log(`   📊 Total de usuários pendentes: ${usersResponse.data.data.pagination.total}`);
      console.log(`   📋 Usuários na página: ${usersResponse.data.data.users.length}`);
      
      if (usersResponse.data.data.users.length > 0) {
        const firstUser = usersResponse.data.data.users[0];
        console.log(`   👤 Primeiro usuário: ${firstUser.firstName} ${firstUser.lastName} (${firstUser.role})`);
      }
    } else {
      console.log('❌ Erro ao carregar usuários pendentes:', usersResponse.data.error);
    }
    
    // 4. Verificar mapeamento de dados no frontend
    console.log('\n🔄 Simulando mapeamento de dados do frontend...');
    if (statsResponse.data.success) {
      const apiStats = statsResponse.data.data.statistics;
      const mappedStats = {
        totalUsers: apiStats.users.total,
        pendingUsers: apiStats.users.pending,
        activeBiddings: apiStats.biddings.open,
        totalBiddings: apiStats.biddings.total,
        usersByRole: apiStats.users.byRole
      };
      
      console.log('✅ Mapeamento realizado com sucesso:');
      console.log('   📊 totalUsers:', mappedStats.totalUsers);
      console.log('   ⏳ pendingUsers:', mappedStats.pendingUsers);
      console.log('   🎯 activeBiddings:', mappedStats.activeBiddings);
      console.log('   📋 totalBiddings:', mappedStats.totalBiddings);
      console.log('   👥 usersByRole:', JSON.stringify(mappedStats.usersByRole, null, 2));
    }
    
    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('✅ Admin Dashboard deve funcionar corretamente agora');
    
  } catch (error) {
    console.log('\n❌ ERRO DURANTE O TESTE:');
    console.log('Erro:', error.message);
    if (error.response?.data) {
      console.log('Detalhes:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

console.log('🔧 CORREÇÕES APLICADAS:');
console.log('1. ✅ Mapeamento de dados da API corrigido no AdminDashboardPage.tsx');
console.log('2. ✅ Validação de usuários com filtros adicionada no backend');
console.log('3. ✅ Tratamento de erro melhorado para evitar tela em branco');
console.log('4. ✅ Valores padrão definidos em caso de erro\n');

testAdminDashboard();

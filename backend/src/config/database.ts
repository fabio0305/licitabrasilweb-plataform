import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Singleton pattern para Prisma Client
const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

export async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('✅ Conexão com PostgreSQL estabelecida com sucesso');
    
    // Testar a conexão
    await prisma.$queryRaw`SELECT 1`;
    logger.info('✅ Teste de conexão com PostgreSQL bem-sucedido');
    
    return prisma;
  } catch (error) {
    logger.error('❌ Erro ao conectar com PostgreSQL:', error);
    throw error;
  }
}

export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    logger.info('✅ Desconectado do PostgreSQL');
  } catch (error) {
    logger.error('❌ Erro ao desconectar do PostgreSQL:', error);
    throw error;
  }
}

// Função para executar transações
export async function executeTransaction<T>(
  callback: (prisma: any) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(callback);
}

// Função para verificar saúde do banco
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('❌ Falha no health check do banco de dados:', error);
    return false;
  }
}

export { prisma };
export default prisma;

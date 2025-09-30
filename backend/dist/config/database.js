"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
exports.executeTransaction = executeTransaction;
exports.checkDatabaseHealth = checkDatabaseHealth;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const prisma = globalThis.__prisma || new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});
exports.prisma = prisma;
if (process.env.NODE_ENV === 'development') {
    globalThis.__prisma = prisma;
}
async function connectDatabase() {
    try {
        await prisma.$connect();
        logger_1.logger.info('✅ Conexão com PostgreSQL estabelecida com sucesso');
        await prisma.$queryRaw `SELECT 1`;
        logger_1.logger.info('✅ Teste de conexão com PostgreSQL bem-sucedido');
        return prisma;
    }
    catch (error) {
        logger_1.logger.error('❌ Erro ao conectar com PostgreSQL:', error);
        throw error;
    }
}
async function disconnectDatabase() {
    try {
        await prisma.$disconnect();
        logger_1.logger.info('✅ Desconectado do PostgreSQL');
    }
    catch (error) {
        logger_1.logger.error('❌ Erro ao desconectar do PostgreSQL:', error);
        throw error;
    }
}
async function executeTransaction(callback) {
    return await prisma.$transaction(callback);
}
async function checkDatabaseHealth() {
    try {
        await prisma.$queryRaw `SELECT 1`;
        return true;
    }
    catch (error) {
        logger_1.logger.error('❌ Falha no health check do banco de dados:', error);
        return false;
    }
}
exports.default = prisma;
//# sourceMappingURL=database.js.map
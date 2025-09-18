import winston from 'winston';
import path from 'path';

// Definir níveis de log customizados
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Definir cores para cada nível
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Adicionar cores ao winston
winston.addColors(logColors);

// Formato personalizado para logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Formato para arquivos (sem cores)
const fileLogFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Configurar transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: logFormat,
  }),
  
  // Arquivo para todos os logs
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'app.log'),
    format: fileLogFormat,
  }),
  
  // Arquivo apenas para erros
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format: fileLogFormat,
  }),
];

// Criar logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format: fileLogFormat,
  transports,
  exitOnError: false,
});

// Função para log de requisições HTTP
export const logRequest = (req: any, res: any, responseTime: number) => {
  const { method, url, ip } = req;
  const { statusCode } = res;
  
  const logLevel = statusCode >= 400 ? 'error' : 'http';
  const message = `${method} ${url} - ${statusCode} - ${responseTime}ms - ${ip}`;
  
  logger.log(logLevel, message);
};

// Função para log de erros com contexto
export const logError = (error: Error, context?: string) => {
  const message = context 
    ? `[${context}] ${error.message}` 
    : error.message;
  
  logger.error(message, {
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
};

// Função para log de atividades de usuário
export const logUserActivity = (userId: string, action: string, details?: any) => {
  logger.info(`User Activity - ID: ${userId}, Action: ${action}`, {
    userId,
    action,
    details,
    timestamp: new Date().toISOString(),
  });
};

// Função para log de operações de banco de dados
export const logDatabaseOperation = (operation: string, table: string, duration?: number) => {
  const message = duration 
    ? `DB Operation: ${operation} on ${table} - ${duration}ms`
    : `DB Operation: ${operation} on ${table}`;
  
  logger.debug(message);
};

// Função para log de cache operations
export const logCacheOperation = (operation: string, key: string, hit?: boolean) => {
  const hitStatus = hit !== undefined ? (hit ? 'HIT' : 'MISS') : '';
  const message = `Cache ${operation}: ${key} ${hitStatus}`.trim();
  
  logger.debug(message);
};

// Função para log de autenticação
export const logAuth = (event: string, userId?: string, ip?: string) => {
  const message = `Auth Event: ${event}`;
  logger.info(message, {
    event,
    userId,
    ip,
    timestamp: new Date().toISOString(),
  });
};

// Função para log de segurança
export const logSecurity = (event: string, details: any, level: 'warn' | 'error' = 'warn') => {
  logger.log(level, `Security Event: ${event}`, {
    event,
    details,
    timestamp: new Date().toISOString(),
  });
};

// Stream para Morgan
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export { logger };
export default logger;

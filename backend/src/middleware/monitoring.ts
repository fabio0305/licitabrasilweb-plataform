import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

// Interface para métricas
interface RequestMetrics {
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
  ip: string;
  userId?: string;
  timestamp: Date;
}

// Armazenamento em memória das métricas (em produção, usar Redis ou banco de dados)
const metrics: RequestMetrics[] = [];
const MAX_METRICS = 10000; // Manter apenas as últimas 10k requisições

// Middleware de monitoramento
export const monitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Capturar informações da requisição
  const originalSend = res.send;
  
  res.send = function(data) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Criar métrica
    const metric: RequestMetrics = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userId: (req as any).user?.userId,
      timestamp: new Date(),
    };
    
    // Adicionar à lista de métricas
    metrics.push(metric);
    
    // Manter apenas as últimas métricas
    if (metrics.length > MAX_METRICS) {
      metrics.shift();
    }
    
    // Log da requisição
    logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${responseTime}ms`, {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: (req as any).user?.userId,
    });
    
    // Log de requisições lentas (> 1 segundo)
    if (responseTime > 1000) {
      logger.warn(`Requisição lenta detectada: ${req.method} ${req.originalUrl} - ${responseTime}ms`, {
        method: req.method,
        url: req.originalUrl,
        responseTime,
        userId: (req as any).user?.userId,
      });
    }
    
    // Log de erros
    if (res.statusCode >= 400) {
      logger.error(`Erro na requisição: ${req.method} ${req.originalUrl} - ${res.statusCode}`, {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime,
        userId: (req as any).user?.userId,
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Função para obter estatísticas
export const getMetrics = () => {
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  
  const recentMetrics = metrics.filter(m => m.timestamp.getTime() > oneHourAgo);
  const dailyMetrics = metrics.filter(m => m.timestamp.getTime() > oneDayAgo);
  
  // Estatísticas gerais
  const totalRequests = metrics.length;
  const recentRequests = recentMetrics.length;
  const dailyRequests = dailyMetrics.length;
  
  // Tempo de resposta médio
  const avgResponseTime = metrics.length > 0 
    ? metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length 
    : 0;
  
  const recentAvgResponseTime = recentMetrics.length > 0
    ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length
    : 0;
  
  // Contagem por status code
  const statusCodes = metrics.reduce((acc, m) => {
    acc[m.statusCode] = (acc[m.statusCode] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  // Endpoints mais acessados
  const endpointCounts = metrics.reduce((acc, m) => {
    const endpoint = `${m.method} ${m.url}`;
    acc[endpoint] = (acc[endpoint] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topEndpoints = Object.entries(endpointCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([endpoint, count]) => ({ endpoint, count }));
  
  // Requisições por hora (últimas 24h)
  const hourlyRequests = Array.from({ length: 24 }, (_, i) => {
    const hourStart = now - ((i + 1) * 60 * 60 * 1000);
    const hourEnd = now - (i * 60 * 60 * 1000);
    const count = metrics.filter(m => 
      m.timestamp.getTime() >= hourStart && m.timestamp.getTime() < hourEnd
    ).length;
    return {
      hour: new Date(hourEnd).getHours(),
      count
    };
  }).reverse();
  
  return {
    summary: {
      totalRequests,
      recentRequests,
      dailyRequests,
      avgResponseTime: Math.round(avgResponseTime),
      recentAvgResponseTime: Math.round(recentAvgResponseTime),
    },
    statusCodes,
    topEndpoints,
    hourlyRequests,
    errors: metrics.filter(m => m.statusCode >= 400).slice(-50), // Últimos 50 erros
    slowRequests: metrics.filter(m => m.responseTime > 1000).slice(-20), // Últimas 20 requisições lentas
  };
};

// Função para limpar métricas antigas
export const cleanupMetrics = () => {
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  const initialLength = metrics.length;
  
  // Remover métricas mais antigas que 24 horas
  for (let i = metrics.length - 1; i >= 0; i--) {
    if (metrics[i].timestamp.getTime() < oneDayAgo) {
      metrics.splice(i, 1);
    }
  }
  
  const removedCount = initialLength - metrics.length;
  if (removedCount > 0) {
    logger.info(`Limpeza de métricas: ${removedCount} métricas antigas removidas`);
  }
};

// Executar limpeza a cada hora
setInterval(cleanupMetrics, 60 * 60 * 1000);

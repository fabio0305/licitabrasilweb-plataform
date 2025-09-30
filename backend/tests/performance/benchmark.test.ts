import { performance } from 'perf_hooks';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '@/server';
import { prisma } from '@/config/database';
import { redis } from '@/config/redis';

interface BenchmarkResult {
  operation: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  throughput: number; // operações por segundo
}

class PerformanceBenchmark {
  private results: BenchmarkResult[] = [];

  async benchmark(
    name: string,
    operation: () => Promise<void>,
    iterations: number = 100
  ): Promise<BenchmarkResult> {
    const times: number[] = [];
    
    console.log(`🚀 Iniciando benchmark: ${name} (${iterations} iterações)`);
    
    // Warm-up
    for (let i = 0; i < Math.min(10, iterations); i++) {
      await operation();
    }

    // Benchmark real
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      const iterationStart = performance.now();
      await operation();
      const iterationEnd = performance.now();
      times.push(iterationEnd - iterationStart);
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    const result: BenchmarkResult = {
      operation: name,
      iterations,
      totalTime,
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      throughput: iterations / (totalTime / 1000)
    };

    this.results.push(result);
    this.printResult(result);
    
    return result;
  }

  private printResult(result: BenchmarkResult): void {
    console.log(`
📊 Resultado do Benchmark: ${result.operation}
   Iterações: ${result.iterations}
   Tempo Total: ${result.totalTime.toFixed(2)}ms
   Tempo Médio: ${result.averageTime.toFixed(2)}ms
   Tempo Mínimo: ${result.minTime.toFixed(2)}ms
   Tempo Máximo: ${result.maxTime.toFixed(2)}ms
   Throughput: ${result.throughput.toFixed(2)} ops/sec
    `);
  }

  getResults(): BenchmarkResult[] {
    return this.results;
  }

  generateReport(): string {
    let report = '\n🎯 RELATÓRIO DE PERFORMANCE\n';
    report += '=' .repeat(50) + '\n\n';

    this.results.forEach(result => {
      report += `${result.operation}:\n`;
      report += `  Throughput: ${result.throughput.toFixed(2)} ops/sec\n`;
      report += `  Tempo Médio: ${result.averageTime.toFixed(2)}ms\n`;
      report += `  Min/Max: ${result.minTime.toFixed(2)}ms / ${result.maxTime.toFixed(2)}ms\n\n`;
    });

    return report;
  }
}

describe('Performance Benchmarks', () => {
  let benchmark: PerformanceBenchmark;
  let authToken: string;

  beforeAll(async () => {
    benchmark = new PerformanceBenchmark();
    
    // Fazer login para obter token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@licitabrasil.com',
        password: 'Test123!@#'
      });
    
    authToken = loginResponse.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    console.log(benchmark.generateReport());
  });

  describe('Database Operations', () => {
    test('User queries benchmark', async () => {
      const result = await benchmark.benchmark(
        'Database - User Queries',
        async () => {
          await prisma.user.findMany({
            take: 10,
            include: {
              profile: true
            }
          });
        },
        50
      );

      // Expectativas de performance
      expect(result.averageTime).toBeLessThan(100); // < 100ms
      expect(result.throughput).toBeGreaterThan(10); // > 10 ops/sec
    });

    test('Bidding queries benchmark', async () => {
      const result = await benchmark.benchmark(
        'Database - Bidding Queries',
        async () => {
          await prisma.bidding.findMany({
            take: 20,
            include: {
              publicEntity: true,
              category: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          });
        },
        30
      );

      expect(result.averageTime).toBeLessThan(150);
      expect(result.throughput).toBeGreaterThan(5);
    });

    test('Complex aggregation benchmark', async () => {
      const result = await benchmark.benchmark(
        'Database - Complex Aggregation',
        async () => {
          await prisma.bidding.groupBy({
            by: ['status'],
            _count: {
              id: true
            },
            _sum: {
              estimatedValue: true
            }
          });
        },
        20
      );

      expect(result.averageTime).toBeLessThan(200);
    });
  });

  describe('Redis Operations', () => {
    test('Redis SET operations benchmark', async () => {
      const result = await benchmark.benchmark(
        'Redis - SET Operations',
        async () => {
          const key = `test:${Date.now()}:${Math.random()}`;
          await redis.set(key, JSON.stringify({ test: 'data' }), 'EX', 60);
        },
        100
      );

      expect(result.averageTime).toBeLessThan(10);
      expect(result.throughput).toBeGreaterThan(100);
    });

    test('Redis GET operations benchmark', async () => {
      // Preparar dados
      const keys: string[] = [];
      for (let i = 0; i < 50; i++) {
        const key = `benchmark:get:${i}`;
        await redis.set(key, JSON.stringify({ id: i, data: 'test' }));
        keys.push(key);
      }

      const result = await benchmark.benchmark(
        'Redis - GET Operations',
        async () => {
          const randomKey = keys[Math.floor(Math.random() * keys.length)];
          await redis.get(randomKey);
        },
        100
      );

      expect(result.averageTime).toBeLessThan(5);
      expect(result.throughput).toBeGreaterThan(200);

      // Limpar dados de teste
      await redis.del(...keys);
    });
  });

  describe('API Endpoints', () => {
    test('Public transparency dashboard benchmark', async () => {
      const result = await benchmark.benchmark(
        'API - Transparency Dashboard',
        async () => {
          const response = await request(app)
            .get('/api/v1/transparency/dashboard')
            .expect(200);
        },
        30
      );

      expect(result.averageTime).toBeLessThan(500);
      expect(result.throughput).toBeGreaterThan(2);
    });

    test('Authenticated user profile benchmark', async () => {
      const result = await benchmark.benchmark(
        'API - User Profile',
        async () => {
          await request(app)
            .get('/api/v1/auth/profile')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        },
        50
      );

      expect(result.averageTime).toBeLessThan(200);
      expect(result.throughput).toBeGreaterThan(5);
    });

    test('Bidding list with filters benchmark', async () => {
      const result = await benchmark.benchmark(
        'API - Bidding List with Filters',
        async () => {
          await request(app)
            .get('/api/v1/transparency/biddings?page=1&limit=10&status=OPEN')
            .expect(200);
        },
        25
      );

      expect(result.averageTime).toBeLessThan(300);
      expect(result.throughput).toBeGreaterThan(3);
    });

    test('Search functionality benchmark', async () => {
      const searchTerms = ['tecnologia', 'serviços', 'obras', 'equipamentos'];
      
      const result = await benchmark.benchmark(
        'API - Search Functionality',
        async () => {
          const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
          await request(app)
            .get(`/api/v1/transparency/biddings?search=${term}&page=1&limit=5`)
            .expect(200);
        },
        20
      );

      expect(result.averageTime).toBeLessThan(400);
      expect(result.throughput).toBeGreaterThan(2);
    });
  });

  describe('Authentication & Authorization', () => {
    test('Login benchmark', async () => {
      const result = await benchmark.benchmark(
        'Auth - Login Process',
        async () => {
          await request(app)
            .post('/api/v1/auth/login')
            .send({
              email: 'admin@licitabrasil.com',
              password: 'Test123!@#'
            })
            .expect(200);
        },
        20
      );

      expect(result.averageTime).toBeLessThan(1000); // Login pode ser mais lento devido ao bcrypt
      expect(result.throughput).toBeGreaterThan(1);
    });

    test('Token validation benchmark', async () => {
      const result = await benchmark.benchmark(
        'Auth - Token Validation',
        async () => {
          await request(app)
            .get('/api/v1/auth/profile')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        },
        50
      );

      expect(result.averageTime).toBeLessThan(100);
      expect(result.throughput).toBeGreaterThan(10);
    });
  });

  describe('Memory and Resource Usage', () => {
    test('Memory usage during operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Executar operações que consomem memória
      for (let i = 0; i < 100; i++) {
        await prisma.user.findMany({ take: 10 });
        await redis.get('test:key');
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      console.log(`
📊 Uso de Memória:
   Inicial: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB
   Final: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB
   Aumento: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB
      `);
      
      // Verificar se o aumento de memória está dentro do esperado
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // < 50MB
    });
  });

  describe('Concurrent Operations', () => {
    test('Concurrent database queries', async () => {
      const concurrency = 10;
      
      const result = await benchmark.benchmark(
        'Concurrent - Database Queries',
        async () => {
          const promises = Array(concurrency).fill(null).map(() =>
            prisma.user.findMany({ take: 5 })
          );
          await Promise.all(promises);
        },
        10
      );

      expect(result.averageTime).toBeLessThan(500);
    });

    test('Concurrent API requests', async () => {
      const concurrency = 5;
      
      const result = await benchmark.benchmark(
        'Concurrent - API Requests',
        async () => {
          const promises = Array(concurrency).fill(null).map(() =>
            request(app)
              .get('/api/v1/transparency/dashboard')
              .expect(200)
          );
          await Promise.all(promises);
        },
        5
      );

      expect(result.averageTime).toBeLessThan(1000);
    });
  });
});

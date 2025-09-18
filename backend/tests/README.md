# Testes - LicitaBrasil Web Platform

Este diretório contém os testes unitários e de integração para a plataforma LicitaBrasil Web.

## Estrutura dos Testes

```
tests/
├── setup.ts                    # Configuração global dos testes e mocks
├── controllers/                # Testes unitários dos controladores
│   ├── SupplierController.test.ts
│   ├── BiddingController.test.ts
│   └── ...
├── integration/                # Testes de integração
│   ├── auth.test.ts
│   └── ...
└── README.md                   # Este arquivo
```

## Configuração

### Jest Configuration
O Jest está configurado no arquivo `jest.config.js` na raiz do projeto com:
- Preset TypeScript (`ts-jest`)
- Mapeamento de paths (`@/` para `src/`)
- Setup global em `tests/setup.ts`
- Cobertura de código configurada

### Mocks Globais
O arquivo `setup.ts` contém mocks para:
- **Prisma Client**: Todas as operações de banco de dados
- **Redis**: Operações de cache
- **Logger**: Sistema de logs
- **File System**: Operações de arquivo (para upload/download)

## Executando os Testes

### Todos os testes
```bash
npm test
```

### Testes em modo watch
```bash
npm run test:watch
```

### Testes com cobertura
```bash
npm run test:coverage
```

### Testes específicos
```bash
# Testar um arquivo específico
npm test SupplierController

# Testar um diretório específico
npm test controllers/

# Testar com padrão
npm test -- --testNamePattern="should create"
```

## Tipos de Testes

### Testes Unitários (controllers/)
- Testam controladores isoladamente
- Usam mocks para dependências externas
- Focam na lógica de negócio
- Verificam validações e autorizações

**Exemplo de estrutura:**
```typescript
describe('SupplierController', () => {
  describe('create', () => {
    it('should create a new supplier', async () => {
      // Arrange
      const req = mockRequest({ body: supplierData });
      const res = mockResponse();
      
      // Act
      await supplierController.create(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
});
```

### Testes de Integração (integration/)
- Testam endpoints completos
- Usam supertest para requisições HTTP
- Verificam fluxos end-to-end
- Testam middleware e validações

**Exemplo de estrutura:**
```typescript
describe('Auth Integration Tests', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(userData)
      .expect(201);
      
    expect(response.body.success).toBe(true);
  });
});
```

## Helpers de Teste

### Mock Functions
- `mockRequest(overrides)`: Cria objeto de request mockado
- `mockResponse()`: Cria objeto de response mockado
- `mockUser`: Dados de usuário padrão para testes
- `mockSupplier`: Dados de fornecedor padrão
- `mockBidding`: Dados de licitação padrão

### Exemplo de uso:
```typescript
const req = mockRequest({
  user: { userId: 'test-id', role: 'ADMIN' },
  params: { id: 'entity-id' },
  body: { name: 'Test Entity' }
});

const res = mockResponse();
```

## Padrões de Teste

### 1. Arrange-Act-Assert
```typescript
it('should do something', async () => {
  // Arrange - Preparar dados e mocks
  const req = mockRequest({ body: testData });
  const res = mockResponse();
  (prisma.model.create as jest.Mock).mockResolvedValue(result);
  
  // Act - Executar a função
  await controller.method(req, res);
  
  // Assert - Verificar resultados
  expect(res.json).toHaveBeenCalledWith(expectedResult);
});
```

### 2. Testes de Erro
```typescript
it('should throw NotFoundError when entity not found', async () => {
  (prisma.model.findUnique as jest.Mock).mockResolvedValue(null);
  
  await expect(controller.method(req, res))
    .rejects.toThrow(NotFoundError);
});
```

### 3. Testes de Autorização
```typescript
it('should throw AuthorizationError when user is not owner', async () => {
  const req = mockRequest({
    user: { userId: 'different-user', role: 'USER' }
  });
  
  await expect(controller.method(req, res))
    .rejects.toThrow(AuthorizationError);
});
```

## Cobertura de Código

O objetivo é manter cobertura mínima de:
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

### Visualizar cobertura
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Boas Práticas

### 1. Nomenclatura
- Use nomes descritivos para testes
- Siga o padrão "should [expected behavior] when [condition]"
- Agrupe testes relacionados com `describe`

### 2. Isolamento
- Cada teste deve ser independente
- Use `beforeEach` para setup comum
- Limpe mocks entre testes

### 3. Dados de Teste
- Use dados realistas mas simples
- Evite dados hardcoded quando possível
- Reutilize helpers e mocks

### 4. Assertions
- Seja específico nas verificações
- Use matchers apropriados do Jest
- Verifique tanto casos de sucesso quanto de erro

## Executando Testes em CI/CD

Os testes são executados automaticamente em:
- Pull Requests
- Push para branch main
- Releases

### Variáveis de Ambiente para Testes
```bash
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/test_db
REDIS_URL=redis://localhost:6379/1
JWT_SECRET=test-secret
```

## Troubleshooting

### Problemas Comuns

1. **Timeout em testes**: Aumente o timeout no Jest config
2. **Mocks não funcionando**: Verifique se estão no setup.ts
3. **Imports não resolvidos**: Verifique o moduleNameMapping
4. **Testes flaky**: Garanta isolamento entre testes

### Debug
```bash
# Executar com debug
npm test -- --verbose

# Executar teste específico com logs
npm test -- --testNamePattern="test name" --verbose
```

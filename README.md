# Licita Brasil Web - Plataforma Digital de Compras Públicas

A **Licita Brasil Web** é uma plataforma online abrangente desenvolvida para modernizar e transformar o processo de compras públicas no Brasil. Inspirada em soluções como licitar.digital e licitanet.com.br, a plataforma atua como um mercado digital inteligente, conectando entidades governamentais a fornecedores de bens e serviços de forma transparente, segura e eficiente.

## 🎯 Objetivo

Digitalizar e otimizar todo o ciclo de vida das licitações — desde a publicação do edital até a assinatura do contrato — promovendo agilidade, conformidade com a legislação vigente (Nova Lei de Licitações - Lei nº 14.133/21) e redução de burocracias.

## 🏗️ Arquitetura

### Backend
- **Node.js** + **TypeScript** + **Express**
- **PostgreSQL** (banco principal)
- **Redis** (cache e sessões)
- **Prisma** (ORM)
- **JWT** (autenticação)

### Frontend
- **React.js** + **TypeScript**
- **Material-UI** (componentes)
- **React Router** (roteamento)
- **React Hook Form** (formulários)
- **Axios** (requisições HTTP)

## 🚀 Funcionalidades Principais

### 👥 Portal do Fornecedor
- Cadastro e habilitação de fornecedores
- Participação em processos licitatórios
- Envio de propostas e documentos
- Acompanhamento em tempo real
- Histórico de participações

### 🏛️ Portal do Órgão Público
- Criação e gestão de licitações
- Publicação de editais
- Avaliação de propostas
- Gestão de contratos
- Relatórios gerenciais

### 🔍 Portal da Transparência
- Consulta pública de licitações
- Dados abertos (Open Data)
- Acompanhamento cidadão
- Estatísticas e indicadores

### ⚙️ Sistema Administrativo
- Gestão de usuários e permissões
- Configurações do sistema
- Auditoria e logs de segurança
- Backup e recuperação

## 📋 Pré-requisitos

- **Node.js** 18+
- **PostgreSQL** 12+
- **Redis** 6+
- **npm** ou **yarn**

## 🛠️ Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/fabio0305/licitabrasilweb-plataform.git
cd licitabrasilweb-plataform
```

### 2. Instale as dependências
```bash
# Instalar dependências do projeto principal
npm install

# Instalar dependências do backend
cd backend
npm install

# Instalar dependências do frontend
cd ../frontend
npm install
```

### 3. Configure o banco de dados

#### PostgreSQL
```bash
# Criar banco de dados
createdb licita_brasil_web

# Copiar arquivo de configuração
cd ../backend
cp .env.example .env
```

#### Edite o arquivo `.env` com suas configurações:
```env
# Configurações do Banco de Dados PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/licita_brasil_web?schema=public"

# Configurações do Redis
REDIS_URL=redis://localhost:6379

# Configurações de Autenticação
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here

# Configurações do Servidor
PORT=3001
NODE_ENV=development
```

### 4. Execute as migrações do banco
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

## 🚀 Execução

### Desenvolvimento (ambos os serviços)
```bash
# Na raiz do projeto
npm run dev
```

### Executar separadamente

#### Backend
```bash
cd backend
npm run dev
```

#### Frontend
```bash
cd frontend
npm start
```

## 📚 Estrutura do Projeto

```
licitabrasilweb-plataform/
├── backend/                 # API Node.js + TypeScript
│   ├── src/
│   │   ├── config/         # Configurações (DB, Redis)
│   │   ├── controllers/    # Controladores
│   │   ├── middleware/     # Middlewares
│   │   ├── routes/         # Rotas da API
│   │   ├── types/          # Tipos TypeScript
│   │   ├── utils/          # Utilitários
│   │   └── server.ts       # Servidor principal
│   ├── prisma/             # Schema e migrações
│   └── package.json
├── frontend/               # App React + TypeScript
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── contexts/       # Contextos React
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── types/          # Tipos TypeScript
│   │   ├── config/         # Configurações
│   │   └── App.tsx         # Componente principal
│   └── package.json
└── package.json            # Scripts principais
```

## 🔗 URLs de Acesso

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api/v1
- **Health Check**: http://localhost:3001/health

## 📖 API Endpoints

### Autenticação
- `POST /api/v1/auth/register` - Registro de usuário
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Perfil do usuário

### Fornecedores
- `GET /api/v1/suppliers` - Listar fornecedores
- `POST /api/v1/suppliers` - Criar fornecedor
- `PUT /api/v1/suppliers/:id` - Atualizar fornecedor

### Licitações
- `GET /api/v1/biddings` - Listar licitações
- `POST /api/v1/biddings` - Criar licitação
- `GET /api/v1/biddings/public` - Licitações públicas

### Transparência
- `GET /api/v1/transparency/biddings` - Licitações para transparência
- `GET /api/v1/transparency/statistics` - Estatísticas públicas

## 🧪 Testes

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 📝 Conformidade Legal

A plataforma foi desenvolvida seguindo as diretrizes da **Nova Lei de Licitações (Lei nº 14.133/21)**, garantindo:

- ✅ Transparência total dos processos
- ✅ Igualdade de condições para participantes
- ✅ Publicidade dos atos
- ✅ Rastreabilidade e auditoria
- ✅ Eficiência e economicidade

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Equipe

Desenvolvido pela equipe Licita Brasil Web para modernizar o processo de compras públicas no Brasil.

---

**Licita Brasil Web** - Transformando o futuro das compras públicas 🇧🇷

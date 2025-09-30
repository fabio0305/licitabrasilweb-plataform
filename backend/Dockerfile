# Multi-stage build para otimizar o tamanho da imagem
FROM node:18-alpine AS builder

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar todas as dependências (incluindo dev para build)
RUN npm ci && npm cache clean --force

# Gerar cliente Prisma
RUN npx prisma generate

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Instalar apenas dependências de produção necessárias para runtime
RUN npm ci --only=production --ignore-scripts

# Estágio de produção
FROM node:18-alpine AS production

# Instalar dumb-init e dependências do Prisma
RUN apk add --no-cache dumb-init openssl openssl-dev

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S licitabrasil -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos necessários do estágio builder
COPY --from=builder --chown=licitabrasil:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=licitabrasil:nodejs /app/dist ./dist
COPY --from=builder --chown=licitabrasil:nodejs /app/prisma ./prisma
COPY --from=builder --chown=licitabrasil:nodejs /app/package*.json ./

# Gerar cliente Prisma novamente no estágio de produção
RUN npx prisma generate

# Criar diretórios necessários
RUN mkdir -p /app/logs /app/uploads /app/temp && \
    chown -R licitabrasil:nodejs /app/logs /app/uploads /app/temp

# Definir variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3001
ENV LOG_LEVEL=info

# Expor porta
EXPOSE 3001

# Mudar para usuário não-root
USER licitabrasil

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando de inicialização com dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]

# Labels para metadados
LABEL maintainer="LicitaBrasil Team"
LABEL version="1.0.0"
LABEL description="LicitaBrasil Web Backend API"

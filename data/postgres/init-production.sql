-- Inicialização do Banco de Dados de Produção
-- LicitaBrasil Web Platform

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Configurar timezone
SET timezone = 'America/Sao_Paulo';

-- Criar usuário de aplicação com privilégios limitados
CREATE USER licitabrasil_app WITH PASSWORD 'CHANGE_ME_APP_PASSWORD';
GRANT CONNECT ON DATABASE licita_brasil_production TO licitabrasil_app;
GRANT USAGE ON SCHEMA public TO licitabrasil_app;
GRANT CREATE ON SCHEMA public TO licitabrasil_app;

-- Configurações de performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET log_statement = 'mod';

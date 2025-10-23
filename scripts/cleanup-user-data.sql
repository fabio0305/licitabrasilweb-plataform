-- =====================================================================
-- SCRIPT DE LIMPEZA DE DADOS - LICITABRASIL WEB PLATFORM
-- =====================================================================
-- 
-- ATENÇÃO: Este script é DESTRUTIVO e IRREVERSÍVEL!
-- 
-- Este script remove todos os perfis e registros de usuários 
-- não-administrativos do banco de dados, preservando apenas 
-- dados de administradores (role = 'ADMIN').
-- 
-- REQUISITOS OBRIGATÓRIOS:
-- 1. Backup completo do banco de dados DEVE ser criado antes da execução
-- 2. Verificar se existem usuários administradores no sistema
-- 3. Executar em ambiente de teste primeiro
-- 4. Ter plano de rollback preparado
-- 
-- COMO USAR:
-- 1. Criar backup: pg_dump -U licitabrasil licita_brasil_web > backup.sql
-- 2. Executar: psql -U licitabrasil -d licita_brasil_web -f cleanup-user-data.sql
-- 
-- =====================================================================

-- Iniciar transação para garantir atomicidade
BEGIN;

-- =====================================================================
-- SEÇÃO 1: VERIFICAÇÕES DE SEGURANÇA
-- =====================================================================

-- Verificar se existem administradores
DO $$
DECLARE
    admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count 
    FROM users 
    WHERE role = 'ADMIN';
    
    IF admin_count = 0 THEN
        RAISE EXCEPTION 'ERRO: Nenhum usuário administrador encontrado! Operação cancelada para evitar perda de acesso ao sistema.';
    END IF;
    
    RAISE NOTICE 'Verificação OK: % administrador(es) encontrado(s)', admin_count;
END $$;

-- =====================================================================
-- SEÇÃO 2: CONTAGEM DE REGISTROS ANTES DA LIMPEZA
-- =====================================================================

-- Criar tabela temporária para estatísticas
CREATE TEMP TABLE cleanup_stats (
    description TEXT,
    count_before INTEGER,
    count_after INTEGER DEFAULT 0
);

-- Contar registros antes da limpeza
INSERT INTO cleanup_stats (description, count_before)
SELECT 'Usuários não-admin', COUNT(*)
FROM users 
WHERE role != 'ADMIN';

INSERT INTO cleanup_stats (description, count_before)
SELECT 'Fornecedores', COUNT(*)
FROM suppliers s
JOIN users u ON s."userId" = u.id
WHERE u.role != 'ADMIN';

INSERT INTO cleanup_stats (description, count_before)
SELECT 'Órgãos públicos', COUNT(*)
FROM public_entities pe
JOIN users u ON pe."userId" = u.id
WHERE u.role != 'ADMIN';

INSERT INTO cleanup_stats (description, count_before)
SELECT 'Cidadãos', COUNT(*)
FROM citizens c
JOIN users u ON c."userId" = u.id
WHERE u.role != 'ADMIN';

INSERT INTO cleanup_stats (description, count_before)
SELECT 'Licitações', COUNT(*)
FROM biddings b
JOIN public_entities pe ON b."publicEntityId" = pe.id
JOIN users u ON pe."userId" = u.id
WHERE u.role != 'ADMIN';

INSERT INTO cleanup_stats (description, count_before)
SELECT 'Propostas', COUNT(*)
FROM proposals p
JOIN suppliers s ON p."supplierId" = s.id
JOIN users u ON s."userId" = u.id
WHERE u.role != 'ADMIN';

INSERT INTO cleanup_stats (description, count_before)
SELECT 'Contratos', COUNT(*)
FROM contracts c
JOIN suppliers s ON c."supplierId" = s.id
JOIN users u ON s."userId" = u.id
WHERE u.role != 'ADMIN';

INSERT INTO cleanup_stats (description, count_before)
SELECT 'Sessões de usuário', COUNT(*)
FROM user_sessions us
JOIN users u ON us."userId" = u.id
WHERE u.role != 'ADMIN';

INSERT INTO cleanup_stats (description, count_before)
SELECT 'Logs de auditoria', COUNT(*)
FROM audit_logs al
JOIN users u ON al."userId" = u.id
WHERE u.role != 'ADMIN';

-- Exibir estatísticas antes da limpeza
RAISE NOTICE '=====================================================';
RAISE NOTICE 'ESTATÍSTICAS ANTES DA LIMPEZA:';
RAISE NOTICE '=====================================================';

DO $$
DECLARE
    stat_record RECORD;
BEGIN
    FOR stat_record IN 
        SELECT description, count_before 
        FROM cleanup_stats 
        ORDER BY description
    LOOP
        RAISE NOTICE '% : %', stat_record.description, stat_record.count_before;
    END LOOP;
END $$;

RAISE NOTICE '=====================================================';

-- =====================================================================
-- SEÇÃO 3: LIMPEZA DE DADOS (EM ORDEM ESPECÍFICA)
-- =====================================================================

RAISE NOTICE 'Iniciando limpeza de dados...';

-- 3.1. Remover itens de propostas
RAISE NOTICE 'Removendo itens de propostas...';
DELETE FROM proposal_items 
WHERE "proposalId" IN (
    SELECT p.id 
    FROM proposals p
    JOIN suppliers s ON p."supplierId" = s.id
    JOIN users u ON s."userId" = u.id
    WHERE u.role != 'ADMIN'
);

-- 3.2. Remover contratos
RAISE NOTICE 'Removendo contratos...';
DELETE FROM contracts 
WHERE "supplierId" IN (
    SELECT s.id 
    FROM suppliers s
    JOIN users u ON s."userId" = u.id
    WHERE u.role != 'ADMIN'
) OR "publicEntityId" IN (
    SELECT pe.id 
    FROM public_entities pe
    JOIN users u ON pe."userId" = u.id
    WHERE u.role != 'ADMIN'
);

-- 3.3. Remover propostas
RAISE NOTICE 'Removendo propostas...';
DELETE FROM proposals 
WHERE "supplierId" IN (
    SELECT s.id 
    FROM suppliers s
    JOIN users u ON s."userId" = u.id
    WHERE u.role != 'ADMIN'
);

-- 3.4. Remover categorias de licitações
RAISE NOTICE 'Removendo categorias de licitações...';
DELETE FROM bidding_categories 
WHERE "biddingId" IN (
    SELECT b.id 
    FROM biddings b
    JOIN public_entities pe ON b."publicEntityId" = pe.id
    JOIN users u ON pe."userId" = u.id
    WHERE u.role != 'ADMIN'
);

-- 3.5. Remover licitações
RAISE NOTICE 'Removendo licitações...';
DELETE FROM biddings 
WHERE "publicEntityId" IN (
    SELECT pe.id 
    FROM public_entities pe
    JOIN users u ON pe."userId" = u.id
    WHERE u.role != 'ADMIN'
);

-- 3.6. Remover documentos
RAISE NOTICE 'Removendo documentos...';
DELETE FROM documents 
WHERE "supplierId" IN (
    SELECT s.id 
    FROM suppliers s
    JOIN users u ON s."userId" = u.id
    WHERE u.role != 'ADMIN'
) OR "publicEntityId" IN (
    SELECT pe.id 
    FROM public_entities pe
    JOIN users u ON pe."userId" = u.id
    WHERE u.role != 'ADMIN'
);

-- 3.7. Remover categorias de fornecedores
RAISE NOTICE 'Removendo categorias de fornecedores...';
DELETE FROM supplier_categories 
WHERE "supplierId" IN (
    SELECT s.id 
    FROM suppliers s
    JOIN users u ON s."userId" = u.id
    WHERE u.role != 'ADMIN'
);

-- 3.8. Remover sessões de usuário
RAISE NOTICE 'Removendo sessões de usuário...';
DELETE FROM user_sessions 
WHERE "userId" IN (
    SELECT id FROM users WHERE role != 'ADMIN'
);

-- 3.9. Remover permissões de usuário
RAISE NOTICE 'Removendo permissões de usuário...';
DELETE FROM user_permissions 
WHERE "userId" IN (
    SELECT id FROM users WHERE role != 'ADMIN'
);

-- 3.10. Remover logs de auditoria
RAISE NOTICE 'Removendo logs de auditoria...';
DELETE FROM audit_logs 
WHERE "userId" IN (
    SELECT id FROM users WHERE role != 'ADMIN'
);

-- 3.11. Remover notificações
RAISE NOTICE 'Removendo notificações...';
DELETE FROM notifications 
WHERE "userId" IN (
    SELECT id FROM users WHERE role != 'ADMIN'
);

-- 3.12. Remover perfis específicos
RAISE NOTICE 'Removendo perfis de fornecedores...';
DELETE FROM suppliers 
WHERE "userId" IN (
    SELECT id FROM users WHERE role != 'ADMIN'
);

RAISE NOTICE 'Removendo perfis de órgãos públicos...';
DELETE FROM public_entities 
WHERE "userId" IN (
    SELECT id FROM users WHERE role != 'ADMIN'
);

RAISE NOTICE 'Removendo perfis de cidadãos...';
DELETE FROM citizens 
WHERE "userId" IN (
    SELECT id FROM users WHERE role != 'ADMIN'
);

-- 3.13. Finalmente, remover usuários não-admin
RAISE NOTICE 'Removendo usuários não-admin...';
DELETE FROM users 
WHERE role != 'ADMIN';

RAISE NOTICE 'Limpeza de dados concluída!';

-- =====================================================================
-- SEÇÃO 4: VERIFICAÇÃO FINAL
-- =====================================================================

-- Atualizar estatísticas após limpeza
UPDATE cleanup_stats SET count_after = (
    SELECT COUNT(*) FROM users WHERE role != 'ADMIN'
) WHERE description = 'Usuários não-admin';

UPDATE cleanup_stats SET count_after = (
    SELECT COUNT(*) FROM suppliers
) WHERE description = 'Fornecedores';

UPDATE cleanup_stats SET count_after = (
    SELECT COUNT(*) FROM public_entities
) WHERE description = 'Órgãos públicos';

UPDATE cleanup_stats SET count_after = (
    SELECT COUNT(*) FROM citizens
) WHERE description = 'Cidadãos';

UPDATE cleanup_stats SET count_after = (
    SELECT COUNT(*) FROM biddings
) WHERE description = 'Licitações';

UPDATE cleanup_stats SET count_after = (
    SELECT COUNT(*) FROM proposals
) WHERE description = 'Propostas';

UPDATE cleanup_stats SET count_after = (
    SELECT COUNT(*) FROM contracts
) WHERE description = 'Contratos';

UPDATE cleanup_stats SET count_after = (
    SELECT COUNT(*) FROM user_sessions
) WHERE description = 'Sessões de usuário';

UPDATE cleanup_stats SET count_after = (
    SELECT COUNT(*) FROM audit_logs
) WHERE description = 'Logs de auditoria';

-- Exibir relatório final
RAISE NOTICE '=====================================================';
RAISE NOTICE 'RELATÓRIO FINAL DA LIMPEZA:';
RAISE NOTICE '=====================================================';

DO $$
DECLARE
    stat_record RECORD;
    total_users INTEGER;
    admin_users INTEGER;
BEGIN
    -- Estatísticas detalhadas
    FOR stat_record IN 
        SELECT description, count_before, count_after, (count_before - count_after) as removed
        FROM cleanup_stats 
        ORDER BY description
    LOOP
        RAISE NOTICE '% : % → % (% removidos)', 
            stat_record.description, 
            stat_record.count_before, 
            stat_record.count_after,
            stat_record.removed;
    END LOOP;
    
    -- Verificação final
    SELECT COUNT(*) INTO total_users FROM users;
    SELECT COUNT(*) INTO admin_users FROM users WHERE role = 'ADMIN';
    
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'VERIFICAÇÃO FINAL:';
    RAISE NOTICE 'Total de usuários restantes: %', total_users;
    RAISE NOTICE 'Usuários administradores: %', admin_users;
    
    IF total_users = admin_users AND admin_users > 0 THEN
        RAISE NOTICE 'STATUS: ✅ SUCESSO - Apenas administradores permanecem';
    ELSE
        RAISE NOTICE 'STATUS: ⚠️  ATENÇÃO - Possíveis inconsistências detectadas';
    END IF;
    
    RAISE NOTICE '=====================================================';
END $$;

-- Limpar tabela temporária
DROP TABLE cleanup_stats;

-- Confirmar transação
COMMIT;

RAISE NOTICE 'Limpeza de dados concluída com sucesso!';
RAISE NOTICE 'IMPORTANTE: Verifique a integridade do sistema antes de colocar em produção.';

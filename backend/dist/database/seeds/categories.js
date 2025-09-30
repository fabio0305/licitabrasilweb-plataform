"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedCategories = seedCategories;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function seedCategories() {
    console.log('🌱 Seeding categories...');
    try {
        const categories = [
            {
                name: 'Tecnologia da Informação',
                code: 'TI',
                description: 'Equipamentos, software e serviços de TI',
            },
            {
                name: 'Construção Civil',
                code: 'CONST',
                description: 'Obras, reformas e construções',
            },
            {
                name: 'Serviços Gerais',
                code: 'SERV',
                description: 'Serviços diversos para administração pública',
            },
            {
                name: 'Material de Escritório',
                code: 'ESC',
                description: 'Materiais e equipamentos de escritório',
            },
            {
                name: 'Veículos e Transporte',
                code: 'TRANSP',
                description: 'Veículos, combustível e serviços de transporte',
            },
            {
                name: 'Saúde',
                code: 'SAUDE',
                description: 'Equipamentos médicos, medicamentos e serviços de saúde',
            },
            {
                name: 'Educação',
                code: 'EDU',
                description: 'Material didático, equipamentos e serviços educacionais',
            },
            {
                name: 'Segurança',
                code: 'SEG',
                description: 'Equipamentos e serviços de segurança',
            },
            {
                name: 'Alimentação',
                code: 'ALIM',
                description: 'Gêneros alimentícios e serviços de alimentação',
            },
            {
                name: 'Limpeza e Conservação',
                code: 'LIMP',
                description: 'Produtos de limpeza e serviços de conservação',
            },
        ];
        for (const category of categories) {
            await prisma.category.upsert({
                where: { code: category.code },
                update: {},
                create: category,
            });
        }
        const tiCategory = await prisma.category.findUnique({
            where: { code: 'TI' },
        });
        if (tiCategory) {
            const tiSubcategories = [
                {
                    name: 'Hardware',
                    code: 'TI-HW',
                    description: 'Computadores, servidores, equipamentos de rede',
                    parentId: tiCategory.id,
                },
                {
                    name: 'Software',
                    code: 'TI-SW',
                    description: 'Licenças de software, sistemas, aplicativos',
                    parentId: tiCategory.id,
                },
                {
                    name: 'Serviços de TI',
                    code: 'TI-SERV',
                    description: 'Desenvolvimento, manutenção, consultoria em TI',
                    parentId: tiCategory.id,
                },
            ];
            for (const subcategory of tiSubcategories) {
                await prisma.category.upsert({
                    where: { code: subcategory.code },
                    update: {},
                    create: subcategory,
                });
            }
        }
        const constCategory = await prisma.category.findUnique({
            where: { code: 'CONST' },
        });
        if (constCategory) {
            const constSubcategories = [
                {
                    name: 'Obras Públicas',
                    code: 'CONST-OBRAS',
                    description: 'Construção de prédios públicos, estradas, pontes',
                    parentId: constCategory.id,
                },
                {
                    name: 'Reformas',
                    code: 'CONST-REF',
                    description: 'Reformas e manutenção de edificações',
                    parentId: constCategory.id,
                },
                {
                    name: 'Material de Construção',
                    code: 'CONST-MAT',
                    description: 'Cimento, ferro, materiais de construção',
                    parentId: constCategory.id,
                },
            ];
            for (const subcategory of constSubcategories) {
                await prisma.category.upsert({
                    where: { code: subcategory.code },
                    update: {},
                    create: subcategory,
                });
            }
        }
        const saudeCategory = await prisma.category.findUnique({
            where: { code: 'SAUDE' },
        });
        if (saudeCategory) {
            const saudeSubcategories = [
                {
                    name: 'Equipamentos Médicos',
                    code: 'SAUDE-EQUIP',
                    description: 'Equipamentos hospitalares e médicos',
                    parentId: saudeCategory.id,
                },
                {
                    name: 'Medicamentos',
                    code: 'SAUDE-MED',
                    description: 'Medicamentos e produtos farmacêuticos',
                    parentId: saudeCategory.id,
                },
                {
                    name: 'Serviços de Saúde',
                    code: 'SAUDE-SERV',
                    description: 'Serviços médicos e hospitalares',
                    parentId: saudeCategory.id,
                },
            ];
            for (const subcategory of saudeSubcategories) {
                await prisma.category.upsert({
                    where: { code: subcategory.code },
                    update: {},
                    create: subcategory,
                });
            }
        }
        console.log('✅ Categories seeded successfully!');
    }
    catch (error) {
        console.error('❌ Error seeding categories:', error);
        throw error;
    }
}
//# sourceMappingURL=categories.js.map
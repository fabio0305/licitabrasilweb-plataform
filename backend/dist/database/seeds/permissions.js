"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedPermissions = seedPermissions;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function seedPermissions() {
    console.log('🌱 Seeding user permissions...');
    try {
        const adminUsers = await prisma.user.findMany({
            where: { role: client_1.UserRole.ADMIN },
        });
        const supplierUsers = await prisma.user.findMany({
            where: { role: client_1.UserRole.SUPPLIER },
        });
        const publicEntityUsers = await prisma.user.findMany({
            where: { role: client_1.UserRole.PUBLIC_ENTITY },
        });
        const auditorUsers = await prisma.user.findMany({
            where: { role: client_1.UserRole.AUDITOR },
        });
        const citizenUsers = await prisma.user.findMany({
            where: { role: client_1.UserRole.CITIZEN },
        });
        const adminPermissions = [
            client_1.Permission.READ_PUBLIC_DATA,
            client_1.Permission.READ_PRIVATE_DATA,
            client_1.Permission.WRITE_DATA,
            client_1.Permission.DELETE_DATA,
            client_1.Permission.CREATE_BIDDING,
            client_1.Permission.EDIT_BIDDING,
            client_1.Permission.DELETE_BIDDING,
            client_1.Permission.PUBLISH_BIDDING,
            client_1.Permission.CANCEL_BIDDING,
            client_1.Permission.CREATE_PROPOSAL,
            client_1.Permission.EDIT_PROPOSAL,
            client_1.Permission.DELETE_PROPOSAL,
            client_1.Permission.SUBMIT_PROPOSAL,
            client_1.Permission.CREATE_CONTRACT,
            client_1.Permission.EDIT_CONTRACT,
            client_1.Permission.SIGN_CONTRACT,
            client_1.Permission.TERMINATE_CONTRACT,
            client_1.Permission.MANAGE_USERS,
            client_1.Permission.MANAGE_SYSTEM,
            client_1.Permission.VIEW_AUDIT_LOGS,
            client_1.Permission.MANAGE_CATEGORIES,
            client_1.Permission.GENERATE_REPORTS,
            client_1.Permission.EXPORT_DATA,
        ];
        for (const admin of adminUsers) {
            for (const permission of adminPermissions) {
                await prisma.userPermission.upsert({
                    where: {
                        userId_permission: {
                            userId: admin.id,
                            permission,
                        },
                    },
                    update: {},
                    create: {
                        userId: admin.id,
                        permission,
                        grantedBy: admin.id,
                        isActive: true,
                    },
                });
            }
        }
        const supplierPermissions = [
            client_1.Permission.READ_PUBLIC_DATA,
            client_1.Permission.CREATE_PROPOSAL,
            client_1.Permission.EDIT_PROPOSAL,
            client_1.Permission.DELETE_PROPOSAL,
            client_1.Permission.SUBMIT_PROPOSAL,
            client_1.Permission.GENERATE_REPORTS,
        ];
        for (const supplier of supplierUsers) {
            for (const permission of supplierPermissions) {
                await prisma.userPermission.upsert({
                    where: {
                        userId_permission: {
                            userId: supplier.id,
                            permission,
                        },
                    },
                    update: {},
                    create: {
                        userId: supplier.id,
                        permission,
                        isActive: true,
                    },
                });
            }
        }
        const publicEntityPermissions = [
            client_1.Permission.READ_PUBLIC_DATA,
            client_1.Permission.READ_PRIVATE_DATA,
            client_1.Permission.WRITE_DATA,
            client_1.Permission.CREATE_BIDDING,
            client_1.Permission.EDIT_BIDDING,
            client_1.Permission.DELETE_BIDDING,
            client_1.Permission.PUBLISH_BIDDING,
            client_1.Permission.CANCEL_BIDDING,
            client_1.Permission.CREATE_CONTRACT,
            client_1.Permission.EDIT_CONTRACT,
            client_1.Permission.SIGN_CONTRACT,
            client_1.Permission.TERMINATE_CONTRACT,
            client_1.Permission.GENERATE_REPORTS,
            client_1.Permission.EXPORT_DATA,
        ];
        for (const publicEntity of publicEntityUsers) {
            for (const permission of publicEntityPermissions) {
                await prisma.userPermission.upsert({
                    where: {
                        userId_permission: {
                            userId: publicEntity.id,
                            permission,
                        },
                    },
                    update: {},
                    create: {
                        userId: publicEntity.id,
                        permission,
                        isActive: true,
                    },
                });
            }
        }
        const auditorPermissions = [
            client_1.Permission.READ_PUBLIC_DATA,
            client_1.Permission.READ_PRIVATE_DATA,
            client_1.Permission.VIEW_AUDIT_LOGS,
            client_1.Permission.GENERATE_REPORTS,
            client_1.Permission.EXPORT_DATA,
        ];
        for (const auditor of auditorUsers) {
            for (const permission of auditorPermissions) {
                await prisma.userPermission.upsert({
                    where: {
                        userId_permission: {
                            userId: auditor.id,
                            permission,
                        },
                    },
                    update: {},
                    create: {
                        userId: auditor.id,
                        permission,
                        isActive: true,
                    },
                });
            }
        }
        const citizenPermissions = [
            client_1.Permission.READ_PUBLIC_DATA,
        ];
        for (const citizen of citizenUsers) {
            for (const permission of citizenPermissions) {
                await prisma.userPermission.upsert({
                    where: {
                        userId_permission: {
                            userId: citizen.id,
                            permission,
                        },
                    },
                    update: {},
                    create: {
                        userId: citizen.id,
                        permission,
                        isActive: true,
                    },
                });
            }
        }
        console.log('✅ User permissions seeded successfully!');
        console.log('\n📋 PERMISSÕES ATRIBUÍDAS:');
        console.log('========================');
        console.log(`👑 ADMINISTRADORES: ${adminPermissions.length} permissões (acesso total)`);
        console.log(`🏛️  COMPRADORES: ${publicEntityPermissions.length} permissões (gestão de licitações)`);
        console.log(`🏢 FORNECEDORES: ${supplierPermissions.length} permissões (participação em licitações)`);
        console.log(`🔍 AUDITORES: ${auditorPermissions.length} permissões (auditoria e relatórios)`);
        console.log(`👤 CIDADÃOS: ${citizenPermissions.length} permissões (acesso público)`);
        console.log('========================');
    }
    catch (error) {
        console.error('❌ Error seeding permissions:', error);
        throw error;
    }
}
//# sourceMappingURL=permissions.js.map
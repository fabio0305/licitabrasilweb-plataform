"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const userProfiles_1 = require("./userProfiles");
const categories_1 = require("./categories");
const permissions_1 = require("./permissions");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🚀 Starting database seeding...');
    try {
        await (0, categories_1.seedCategories)();
        await (0, userProfiles_1.seedUserProfiles)();
        await (0, permissions_1.seedPermissions)();
        console.log('✅ Database seeding completed successfully!');
    }
    catch (error) {
        console.error('❌ Error during seeding:', error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=index.js.map
import { PrismaClient } from '@prisma/client';
import { seedUserProfiles } from './userProfiles';
import { seedCategories } from './categories';
import { seedPermissions } from './permissions';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting database seeding...');
  
  try {
    // Seed categories first (dependencies)
    await seedCategories();
    
    // Seed user profiles
    await seedUserProfiles();
    
    // Seed permissions
    await seedPermissions();
    
    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

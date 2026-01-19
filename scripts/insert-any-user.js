import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get user details from command line arguments
const username = process.argv[2];
const password = process.argv[3] || username; // Default password = username
const warehouse = process.argv[4];
const role = process.argv[5] || 'floorhead';
const isActive = process.argv[6] !== 'false';

if (!username || !warehouse) {
  console.log('\nUsage: node scripts/insert-any-user.js <username> [password] <warehouse> [role] [is_active]');
  console.log('\nExample:');
  console.log('  node scripts/insert-any-user.js riteshdige riteshdige A101 floorhead true');
  console.log('  node scripts/insert-any-user.js newuser newpass W202 manager true\n');
  process.exit(1);
}

async function insertUser() {
  try {
    const query = `
      INSERT INTO stocktake_users (username, password, warehouse, role, is_active) 
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (username) DO NOTHING
      RETURNING id, username, warehouse, role, is_active, created_at
    `;
    
    const result = await prisma.$executeRawUnsafe(
      `INSERT INTO stocktake_users (username, password, warehouse, role, is_active) 
       VALUES ('${username}', '${password}', '${warehouse}', '${role}', ${isActive})
       ON CONFLICT (username) DO NOTHING
       RETURNING id, username, warehouse, role, is_active, created_at`
    );
    
    console.log('\n=== INSERTING USER ===\n');
    console.log(`Username: ${username}`);
    console.log(`Warehouse: ${warehouse}`);
    console.log(`Role: ${role}`);
    console.log(`Active: ${isActive}\n`);
    
    // Verify the user
    const verifyQuery = `
      SELECT id, username, warehouse, role, is_active, created_at 
      FROM stocktake_users 
      WHERE username = '${username}'
    `;
    const user = await prisma.$queryRawUnsafe(verifyQuery);
    
    if (user.length > 0) {
      console.log('✅ User inserted/verified successfully!');
      console.log(JSON.stringify(user[0], null, 2));
    } else {
      console.log('⚠️  User might already exist or insertion failed');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

insertUser();

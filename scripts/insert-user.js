import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function insertUser() {
  try {
    const query = `
      INSERT INTO stocktake_users (username, password, warehouse, role, is_active) 
      VALUES ('riteshdige', 'riteshdige', 'A101', 'floorhead', TRUE)
      ON CONFLICT (username) DO NOTHING
      RETURNING id, username, warehouse, role, is_active
    `;
    
    const result = await prisma.$executeRawUnsafe(query);
    
    console.log('\n=== INSERTING USER ===\n');
    console.log('User inserted successfully!');
    console.log('Username: riteshdige');
    console.log('Warehouse: A101');
    console.log('Role: floorhead\n');
    
    // Verify the user
    const verifyQuery = `
      SELECT id, username, warehouse, role, is_active, created_at 
      FROM stocktake_users 
      WHERE username = 'riteshdige'
    `;
    const user = await prisma.$queryRawUnsafe(verifyQuery);
    
    if (user.length > 0) {
      console.log('Verification:');
      console.log(JSON.stringify(user[0], null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

insertUser();

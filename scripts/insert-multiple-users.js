import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function insertUsers() {
  try {
    const users = [
      { username: 'satishingole', password: 'satishingole', warehouse: 'A185', role: 'floorhead' },
      { username: 'sumitbaikar', password: 'sumitbaikar', warehouse: 'A185', role: 'floorhead' },
      { username: 'surajbhilare', password: 'surajbhilare', warehouse: 'A185', role: 'floorhead' },
      { username: 'shubhammhatre', password: 'shubhammhatre', warehouse: 'A185', role: 'floorhead' }
    ];

    console.log('\n=== INSERTING USERS ===\n');

    for (const user of users) {
      const query = `
        INSERT INTO stocktake_users (username, password, warehouse, role, is_active) 
        VALUES ('${user.username}', '${user.password}', '${user.warehouse}', '${user.role}', TRUE)
        ON CONFLICT (username) DO NOTHING
      `;
      
      await prisma.$executeRawUnsafe(query);
      console.log(`✓ ${user.username} - ${user.warehouse} - ${user.role}`);
    }

    console.log('\n=== VERIFICATION ===\n');
    
    // Verify all inserted users
    const verifyQuery = `
      SELECT id, username, warehouse, role, is_active, created_at 
      FROM stocktake_users 
      WHERE username IN ('satishingole', 'sumitbaikar', 'surajbhilare', 'shubhammhatre')
      ORDER BY username
    `;
    const insertedUsers = await prisma.$queryRawUnsafe(verifyQuery);
    
    console.log(`Total users found: ${insertedUsers.length}\n`);
    insertedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} - Warehouse: ${user.warehouse} - Role: ${user.role} - Active: ${user.is_active}`);
    });
    
    console.log('\n✅ All users processed successfully!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

insertUsers();

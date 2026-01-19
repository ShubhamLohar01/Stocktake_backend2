import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkManagers() {
  try {
    const query = `
      SELECT 
        id,
        username,
        password,
        warehouse,
        role,
        name,
        email,
        is_active,
        created_at
      FROM stocktake_users
      WHERE LOWER(role) = 'manager' OR role = 'manager' OR role = 'MANAGER'
      ORDER BY username
    `;
    
    const managers = await prisma.$queryRawUnsafe(query);
    
    console.log('\n=== MANAGER USERS IN DATABASE ===\n');
    console.log(`Total Manager Users: ${managers.length}\n`);
    
    if (managers.length === 0) {
      console.log('No manager users found in the database.');
    } else {
      managers.forEach((m, index) => {
        console.log(`${index + 1}. Username: ${m.username}`);
        console.log(`   Password: ${m.password}`);
        console.log(`   Warehouse: ${m.warehouse || 'N/A'}`);
        console.log(`   Role: ${m.role}`);
        console.log(`   Name: ${m.name || 'N/A'}`);
        console.log(`   Email: ${m.email || 'N/A'}`);
        console.log(`   Active: ${m.is_active ? 'Yes' : 'No'}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkManagers();

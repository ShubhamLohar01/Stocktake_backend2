import { PrismaClient, Prisma } from "@prisma/client";
const prisma = new PrismaClient();
// Get all manager users from stocktake_users table
export const getManagerUsers = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // Query manager users from stocktake_users table
        const query = Prisma.sql `
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
        const managers = await prisma.$queryRaw(query);
        res.json({
            success: true,
            count: managers.length,
            managers: managers.map((m) => ({
                id: m.id.toString(),
                username: m.username,
                password: m.password,
                warehouse: m.warehouse,
                role: m.role,
                name: m.name,
                email: m.email,
                isActive: m.is_active,
                createdAt: m.created_at,
            })),
        });
    }
    catch (error) {
        console.error("Get manager users error:", error);
        res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
};

import { RequestHandler } from "express";
import { generateToken } from "../utils/auth.js";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// Map database roles to application roles
function mapRoleToAppRole(dbRole: string): "ADMIN" | "INVENTORY_MANAGER" | "FLOOR_MANAGER" {
  const roleUpper = dbRole.toUpperCase();
  if (roleUpper === "FLOORHEAD" || roleUpper === "FLOOR_HEAD") {
    return "FLOOR_MANAGER";
  }
  if (roleUpper === "MANAGER" || roleUpper === "INVENTORY_MANAGER") {
    return "INVENTORY_MANAGER";
  }
  if (roleUpper === "ADMIN") {
    return "ADMIN";
  }
  // Default to FLOOR_MANAGER for unknown roles
  return "FLOOR_MANAGER";
}

interface LoginRequest {
  username: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export const login: RequestHandler<{}, any, LoginRequest> = async (
  req,
  res
) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    // Find user in stocktake_users table
    const query = Prisma.sql`
      SELECT id, username, password, warehouse, role, name, email, is_active
      FROM stocktake_users
      WHERE username = ${username}
      LIMIT 1
    `;
    
    const users: any[] = await prisma.$queryRaw(query) as any[];

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const dbUser = users[0];

    // Check if user is active
    if (!dbUser.is_active) {
      return res.status(403).json({ error: "Account is disabled" });
    }

    // Check password (plain text comparison for now - should be hashed in production)
    if (dbUser.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Map database role to application role
    const appRole = mapRoleToAppRole(dbUser.role || "");

    const token = generateToken({
      userId: dbUser.id.toString(),
      email: dbUser.email || dbUser.username,
      role: appRole,
    });

    res.json({
      token,
      user: {
        id: dbUser.id.toString(),
        username: dbUser.username,
        email: dbUser.email || dbUser.username,
        name: dbUser.name || dbUser.username,
        role: appRole,
        warehouse: dbUser.warehouse,
        dbRole: dbUser.role, // Keep original role from DB
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const register: RequestHandler<{}, any, RegisterRequest> = async (
  req,
  res
) => {
  try {
    const { email, password, name, role = "FLOOR_MANAGER" } = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ error: "Email, password, and name are required" });
    }

    // Check if user already exists in database
    const existingQuery = Prisma.sql`
      SELECT id, email, username
      FROM stocktake_users
      WHERE email = ${email} OR username = ${email}
      LIMIT 1
    `;
    
    const existingUsers: any[] = await prisma.$queryRaw(existingQuery) as any[];
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "Email or username already in use" });
    }

    // Create new user in database
    const insertQuery = Prisma.sql`
      INSERT INTO stocktake_users (username, email, password, name, role, is_active, created_at)
      VALUES (${email}, ${email}, ${password}, ${name}, ${role}, true, NOW())
      RETURNING id, username, email, name, role
    `;
    
    const newUsers: any[] = await prisma.$queryRaw(insertQuery) as any[];
    
    if (newUsers.length === 0) {
      return res.status(500).json({ error: "Failed to create user" });
    }

    const newUser = newUsers[0];
    const appRole = mapRoleToAppRole(newUser.role || role);

    const token = generateToken({
      userId: newUser.id.toString(),
      email: newUser.email || newUser.username,
      role: appRole,
    });

    res.status(201).json({
      token,
      user: {
        id: newUser.id.toString(),
        email: newUser.email || newUser.username,
        name: newUser.name,
        role: appRole,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const me: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Find user in stocktake_users table by ID
    const query = Prisma.sql`
      SELECT id, username, warehouse, role, name, email, is_active
      FROM stocktake_users
      WHERE id = ${parseInt(req.user.userId)} OR id::text = ${req.user.userId}
      LIMIT 1
    `;
    
    const users: any[] = await prisma.$queryRaw(query) as any[];

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const dbUser = users[0];
    const appRole = mapRoleToAppRole(dbUser.role || "");

    res.json({
      id: dbUser.id.toString(),
      username: dbUser.username,
      email: dbUser.email || dbUser.username,
      name: dbUser.name || dbUser.username,
      role: appRole,
      warehouse: dbUser.warehouse,
      dbRole: dbUser.role,
    });
  } catch (error) {
    console.error("Me error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

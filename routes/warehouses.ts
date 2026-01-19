import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get user's warehouses
export const getUserWarehouses: RequestHandler = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        userWarehouses: {
          include: {
            warehouse: {
              include: {
                floors: true,
              },
            },
          },
        },
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    // If user is INVENTORY_MANAGER or ADMIN, they can see all warehouses
    if (req.user.role === "INVENTORY_MANAGER" || req.user.role === "ADMIN") {
      const allWarehouses = await prisma.warehouse.findMany({
        include: {
          floors: true,
        },
      });
      return res.json(allWarehouses);
    }

    // Floor managers only see their assigned warehouses
    const warehouses = user.userWarehouses.map((uw) => uw.warehouse);
    res.json(warehouses);
  } catch (error) {
    console.error("Get warehouses error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get warehouse with all floors
export const getWarehouse: RequestHandler<{ warehouseId: string }> = async (
  req,
  res
) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const { warehouseId } = req.params;

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
      include: {
        floors: {
          orderBy: { name: "asc" },
        },
      },
    });

    if (!warehouse) return res.status(404).json({ error: "Warehouse not found" });

    res.json(warehouse);
  } catch (error) {
    console.error("Get warehouse error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get warehouse floors
export const getWarehouseFloors: RequestHandler<{ warehouseId: string }> =
  async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const { warehouseId } = req.params;

      const floors = await prisma.floor.findMany({
        where: { warehouseId },
        orderBy: { name: "asc" },
      });

      res.json(floors);
    } catch (error) {
      console.error("Get warehouse floors error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

// Create warehouse (admin only)
export const createWarehouse: RequestHandler<
  {},
  any,
  { name: string; location?: string }
> = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Only admins can create warehouses" });
    }

    const { name, location } = req.body;

    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        location,
      },
      include: {
        floors: true,
      },
    });

    res.status(201).json(warehouse);
  } catch (error: any) {
    console.error("Create warehouse error:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Warehouse name already exists" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

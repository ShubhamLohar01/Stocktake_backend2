import "dotenv/config";

// Construct DATABASE_URL from individual DB variables if DATABASE_URL doesn't exist
if (!process.env.DATABASE_URL && process.env.DB_HOST) {
  const dbUser = process.env.DB_USER || process.env.DB_USERNAME || "postgres";
  const dbPassword = process.env.DB_PASSWORD || "";
  const dbHost = process.env.DB_HOST;
  const dbPort = process.env.DB_PORT || "5432";
  const dbName = process.env.DB_NAME || process.env.DB_DATABASE || "postgres";
  const dbSchema = process.env.DB_SCHEMA || "public";
  
  // Construct PostgreSQL connection string
  process.env.DATABASE_URL = `postgresql://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}?schema=${dbSchema}`;
}

import express from "express";
import cors from "cors";
import { authMiddleware, requireRole } from "./middleware/auth.js";
import { blockFloorManagerWritesDuringAudit } from "./middleware/auditLock.js";
import { login, register, me } from "./routes/auth.js";
import {
  getUserWarehouses,
  getWarehouse,
  getWarehouseFloors,
  createWarehouse,
} from "./routes/warehouses.js";
import {
  startAudit,
  getAudit,
  getWarehouseAudits,
  getOrCreateFloorSession,
  getFloorSession,
  submitFloorSession,
  approveFloorSession,
} from "./routes/audits.js";
import {
  createPallet,
  updatePallet,
  deletePallet,
  addStockLine,
  updateStockLine,
  deleteStockLine,
} from "./routes/pallets.js";
import {
  getCategories,
  getItemsByCategory,
  getAllItems,
  getItem,
  createItem,
  createCategory,
  createSubCategory,
  getCategorialInventory,
  submitStocktakeEntries,
  getStocktakeEntries,
  getGroupedStocktakeEntries,
  updateStocktakeEntry,
  deleteStocktakeEntry,
  getAuditSessionStatus,
  saveStocktakeResultsheet,
  clearAllEntries,
  getResultsheetList,
  getResultsheetData,
  deleteResultsheet,
  searchItemDescriptions,
} from "./routes/items.js";
import { generateExport, getExports } from "./routes/exports.js";
import { getManagerUsers } from "./routes/users.js";

export function createServer() {
  const app = express();

  // Request logging middleware (development only)
  if (process.env.NODE_ENV === "development") {
    app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      if (req.body && Object.keys(req.body).length > 0) {
        console.log("Request body:", JSON.stringify(req.body).substring(0, 200));
      }
      next();
    });
  }

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "pong" });
  });

  // ============ Auth Routes (public) ============
  app.post("/api/auth/login", login);
  app.post("/api/auth/register", register);
  app.get("/api/auth/me", authMiddleware, me);

  // ============ Warehouse Routes ============
  app.get("/api/warehouses", authMiddleware, getUserWarehouses);
  app.get("/api/warehouses/:warehouseId", authMiddleware, getWarehouse);
  app.get(
    "/api/warehouses/:warehouseId/floors",
    authMiddleware,
    getWarehouseFloors
  );
  app.post(
    "/api/warehouses",
    authMiddleware,
    requireRole("ADMIN"),
    createWarehouse
  );

  // ============ Audit Routes ============
  app.post(
    "/api/audits/start",
    authMiddleware,
    requireRole("INVENTORY_MANAGER", "ADMIN"),
    startAudit
  );
  app.get(
    "/api/audits/:auditId",
    authMiddleware,
    getAudit
  );
  app.get(
    "/api/warehouses/:warehouseId/audits",
    authMiddleware,
    getWarehouseAudits
  );

  // ============ Floor Session Routes ============
  app.post(
    "/api/audits/:auditId/floors/:floorId/session",
    authMiddleware,
    getOrCreateFloorSession
  );
  app.get("/api/sessions/:sessionId", authMiddleware, getFloorSession);
  app.post("/api/sessions/:sessionId/submit", authMiddleware, submitFloorSession);
  app.post(
    "/api/sessions/:sessionId/approve",
    authMiddleware,
    requireRole("INVENTORY_MANAGER", "ADMIN"),
    approveFloorSession
  );

  // ============ Pallet Routes ============
  app.post(
    "/api/sessions/:sessionId/pallets",
    authMiddleware,
    blockFloorManagerWritesDuringAudit,
    createPallet
  );
  app.patch(
    "/api/pallets/:palletId",
    authMiddleware,
    blockFloorManagerWritesDuringAudit,
    updatePallet
  );
  app.delete(
    "/api/pallets/:palletId",
    authMiddleware,
    blockFloorManagerWritesDuringAudit,
    deletePallet
  );

  // ============ Stock Line Routes ============
  app.post(
    "/api/pallets/:palletId/stock",
    authMiddleware,
    blockFloorManagerWritesDuringAudit,
    addStockLine
  );
  app.patch(
    "/api/stock/:stockLineId",
    authMiddleware,
    blockFloorManagerWritesDuringAudit,
    updateStockLine
  );
  app.delete(
    "/api/stock/:stockLineId",
    authMiddleware,
    blockFloorManagerWritesDuringAudit,
    deleteStockLine
  );

  // ============ Item & Category Routes ============
  app.get("/api/categories", authMiddleware, getCategories);
  app.get(
    "/api/categories/:categoryId/items",
    authMiddleware,
    getItemsByCategory
  );
  app.get("/api/items", authMiddleware, getAllItems);
  app.get("/api/items/:itemId", authMiddleware, getItem);
  app.get("/api/categorial-inv/:itemType/search", authMiddleware, searchItemDescriptions);
  app.get("/api/categorial-inv/:itemType", authMiddleware, getCategorialInventory);
  app.post(
    "/api/items",
    authMiddleware,
    requireRole("ADMIN"),
    createItem
  );
  app.post(
    "/api/categories",
    authMiddleware,
    requireRole("ADMIN"),
    createCategory
  );
  app.post(
    "/api/categories/sub-categories",
    authMiddleware,
    requireRole("ADMIN"),
    createSubCategory
  );

  // ============ StockTake Entries Routes ============
  app.post(
    "/api/stocktake-entries/submit",
    authMiddleware,
    blockFloorManagerWritesDuringAudit,
    submitStocktakeEntries
  );
  app.get("/api/stocktake-entries", authMiddleware, getStocktakeEntries);
  app.get("/api/stocktake-entries/grouped", authMiddleware, getGroupedStocktakeEntries);
  app.get("/api/stocktake-entries/audit-status", authMiddleware, getAuditSessionStatus);
  app.post(
    "/api/stocktake-entries/save-resultsheet",
    authMiddleware,
    requireRole("INVENTORY_MANAGER", "ADMIN"),
    saveStocktakeResultsheet
  );
  app.delete("/api/stocktake-entries/clear-all", authMiddleware, requireRole("INVENTORY_MANAGER", "ADMIN"), clearAllEntries);
  // Note: Specific routes (like clear-all) must come before parameterized routes (like :entryId)
  app.put(
    "/api/stocktake-entries/:entryId",
    authMiddleware,
    blockFloorManagerWritesDuringAudit,
    updateStocktakeEntry
  );
  app.delete(
    "/api/stocktake-entries/:entryId",
    authMiddleware,
    blockFloorManagerWritesDuringAudit,
    deleteStocktakeEntry
  );
  
  // ============ Stocktake Resultsheet Routes ============
  app.get("/api/stocktake-resultsheet/list", authMiddleware, getResultsheetList);
  app.get("/api/stocktake-resultsheet/:date", authMiddleware, getResultsheetData);
  app.delete("/api/stocktake-resultsheet/:date", authMiddleware, requireRole("INVENTORY_MANAGER", "ADMIN"), deleteResultsheet);

  // ============ Users Routes ============
  app.get("/api/users/managers", authMiddleware, getManagerUsers);

  // ============ Export Routes ============
  app.post(
    "/api/export/generate",
    authMiddleware,
    requireRole("INVENTORY_MANAGER", "ADMIN"),
    generateExport
  );
  app.get(
    "/api/exports",
    authMiddleware,
    requireRole("ADMIN"),
    getExports
  );

  // 404 handler for unmatched API routes (must be after all route definitions)
  // This will only run if no route matched above
  app.use((req, res) => {
    if (req.path.startsWith("/api/")) {
      res.status(404).json({ error: "API endpoint not found", path: req.path });
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  // Global error handler - must be last
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled error:", err);
    if (!res.headersSent) {
      res.status(err.status || 500).json({
        error: err.message || "Internal server error",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
      });
    }
  });

  return app;
}

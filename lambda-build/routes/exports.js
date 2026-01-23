import { PrismaClient } from "@prisma/client";
import { generateAuditExcel } from "../services/excelService.js";
const prisma = new PrismaClient();
// Generate and download audit Excel export
export const generateExport = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: "Unauthorized" });
        if (req.user.role !== "ADMIN" && req.user.role !== "INVENTORY_MANAGER") {
            return res
                .status(403)
                .json({ error: "Only admins and inventory managers can export" });
        }
        const { auditId } = req.body;
        if (!auditId) {
            return res.status(400).json({ error: "Audit ID is required" });
        }
        // Generate Excel file
        const filePath = await generateAuditExcel({
            auditId,
            userId: req.user.userId,
        });
        // Save export record to database
        const fileName = `audit_${auditId}_${new Date().toISOString().split("T")[0]}.xlsx`;
        await prisma.exportFile.create({
            data: {
                auditId,
                fileName,
                filePath,
                generatedBy: req.user.userId,
            },
        });
        // Send file
        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error("Download error:", err);
            }
        });
    }
    catch (error) {
        console.error("Generate export error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
// Get export history
export const getExports = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: "Unauthorized" });
        if (req.user.role !== "ADMIN") {
            return res.status(403).json({ error: "Only admins can view exports" });
        }
        const exports = await prisma.exportFile.findMany({
            include: {
                audit: true,
                user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(exports);
    }
    catch (error) {
        console.error("Get exports error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

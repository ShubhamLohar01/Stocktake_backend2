import { PrismaClient, Prisma } from "@prisma/client";
const prisma = new PrismaClient();
// Get all item categories
export const getCategories = async (_req, res) => {
    try {
        const categories = await prisma.itemCategory.findMany({
            include: {
                subCategories: true,
            },
            orderBy: { name: "asc" },
        });
        res.json(categories);
    }
    catch (error) {
        console.error("Get categories error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
// Get items by category
export const getItemsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const items = await prisma.item.findMany({
            where: { categoryId },
            include: {
                category: true,
                subCategory: true,
            },
            orderBy: { name: "asc" },
        });
        res.json(items);
    }
    catch (error) {
        console.error("Get items by category error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
// Get all items with categories
export const getAllItems = async (_req, res) => {
    try {
        const items = await prisma.item.findMany({
            include: {
                category: true,
                subCategory: true,
            },
            orderBy: { name: "asc" },
        });
        res.json(items);
    }
    catch (error) {
        console.error("Get all items error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
// Get single item
export const getItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const item = await prisma.item.findUnique({
            where: { id: itemId },
            include: {
                category: true,
                subCategory: true,
            },
        });
        if (!item)
            return res.status(404).json({ error: "Item not found" });
        res.json(item);
    }
    catch (error) {
        console.error("Get item error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
// Create item (admin only)
export const createItem = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: "Unauthorized" });
        if (req.user.role !== "ADMIN") {
            return res.status(403).json({ error: "Only admins can create items" });
        }
        const { name, categoryId, subCategoryId, description, kgPerUnit, unitName, } = req.body;
        const item = await prisma.item.create({
            data: {
                name,
                categoryId,
                subCategoryId: subCategoryId || null,
                description,
                kgPerUnit,
                unitName,
            },
            include: {
                category: true,
                subCategory: true,
            },
        });
        res.status(201).json(item);
    }
    catch (error) {
        console.error("Create item error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
// Create category (admin only)
export const createCategory = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: "Unauthorized" });
        if (req.user.role !== "ADMIN") {
            return res.status(403).json({ error: "Only admins can create categories" });
        }
        const { name } = req.body;
        const category = await prisma.itemCategory.create({
            data: { name },
            include: { subCategories: true },
        });
        res.status(201).json(category);
    }
    catch (error) {
        console.error("Create category error:", error);
        if (error.code === "P2002") {
            return res.status(400).json({ error: "Category already exists" });
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
// Create sub-category (admin only)
export const createSubCategory = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: "Unauthorized" });
        if (req.user.role !== "ADMIN") {
            return res
                .status(403)
                .json({ error: "Only admins can create sub-categories" });
        }
        const { categoryId, name } = req.body;
        const subCategory = await prisma.itemSubCategory.create({
            data: {
                categoryId,
                name,
            },
        });
        res.status(201).json(subCategory);
    }
    catch (error) {
        console.error("Create sub-category error:", error);
        if (error.code === "P2002") {
            return res
                .status(400)
                .json({ error: "Sub-category already exists in this category" });
        }
        res.status(500).json({ error: "Internal server error" });
    }
};
// Get categorial inventory data based on item type (PM/RM/FG)
export const getCategorialInventory = async (req, res) => {
    try {
        const { itemType } = req.params;
        if (!["pm", "rm", "fg"].includes(itemType.toLowerCase())) {
            return res.status(400).json({ error: "Invalid item type. Must be PM, RM, or FG" });
        }
        // The item type (pm, rm, fg) is a VALUE in a column, not a column name itself
        // Search for the selected item type value in the fg/rm/pm column
        // Then return distinct group (category), sub_group (subcategory), and particulars (description)
        // Note: "group" is a reserved word in SQL, so it must be quoted
        const itemTypeValue = itemType.toLowerCase(); // pm, rm, or fg (as a value to search for)
        // Try different possible column names for the item type column
        // The column might be named: "fg/rm/pm", "item_type", "type", etc.
        // Also fetch UOM column which contains weight in kg
        let data;
        const queries = [
            // Try column name "fg/rm/pm" (with quotes for special characters) and include UOM
            // Try both quoted and unquoted UOM column (PostgreSQL might return either)
            `SELECT DISTINCT "group", "sub_group", "particulars", "uom" FROM categorial_inv WHERE "fg/rm/pm" = '${itemTypeValue}' AND "group" IS NOT NULL AND TRIM(CAST("group" AS VARCHAR)) != '' ORDER BY "group", "sub_group", "particulars"`,
            // Try with unquoted UOM column
            `SELECT DISTINCT "group", "sub_group", "particulars", uom FROM categorial_inv WHERE "fg/rm/pm" = '${itemTypeValue}' AND "group" IS NOT NULL AND TRIM(CAST("group" AS VARCHAR)) != '' ORDER BY "group", "sub_group", "particulars"`,
            // Try unquoted item_type column (PostgreSQL will lowercase) and include UOM
            `SELECT DISTINCT "group", "sub_group", "particulars", uom FROM categorial_inv WHERE item_type = '${itemTypeValue}' AND "group" IS NOT NULL AND TRIM(CAST("group" AS VARCHAR)) != '' ORDER BY "group", "sub_group", "particulars"`,
            // Try "type" column and include UOM
            `SELECT DISTINCT "group", "sub_group", "particulars", uom FROM categorial_inv WHERE type = '${itemTypeValue}' AND "group" IS NOT NULL AND TRIM(CAST("group" AS VARCHAR)) != '' ORDER BY "group", "sub_group", "particulars"`,
            // Try "fg_rm_pm" (underscore version) and include UOM
            `SELECT DISTINCT "group", "sub_group", "particulars", uom FROM categorial_inv WHERE fg_rm_pm = '${itemTypeValue}' AND "group" IS NOT NULL AND TRIM(CAST("group" AS VARCHAR)) != '' ORDER BY "group", "sub_group", "particulars"`,
            // Try "category_type" and include UOM
            `SELECT DISTINCT "group", "sub_group", "particulars", uom FROM categorial_inv WHERE category_type = '${itemTypeValue}' AND "group" IS NOT NULL AND TRIM(CAST("group" AS VARCHAR)) != '' ORDER BY "group", "sub_group", "particulars"`
        ];
        let lastError = null;
        for (let i = 0; i < queries.length; i++) {
            try {
                data = await prisma.$queryRawUnsafe(queries[i]);
                console.log(`Successfully queried using query attempt ${i + 1}`);
                break;
            }
            catch (error) {
                console.error(`Query error with attempt ${i + 1}:`, error.message);
                lastError = error;
                if (i === queries.length - 1) {
                    // Last attempt failed
                    return res.json({
                        itemType: itemType.toUpperCase(),
                        groups: [],
                        error: `Unable to query categorial_inv table. Tried different column names for item type. Please verify the column name that stores PM/RM/FG values. Last error: ${lastError?.message}. Column name should be one of: "fg/rm/pm", fg_rm_pm, item_type, or type`,
                    });
                }
                continue;
            }
        }
        // Group the data by group -> subgroup -> particulars with UOM
        const groupedData = {};
        data.forEach((row) => {
            // Handle different possible column name variations
            // PostgreSQL returns column names based on how they were selected (quoted or unquoted)
            const group = (row.group || row.Group || row["group"] || "").toString().trim().toUpperCase();
            const subgroup = (row.sub_group || row.subgroup || row.SubGroup || row.Subgroup || row["sub_group"] || "").toString().trim().toUpperCase();
            const particulars = (row.particulars || row.Particulars || row["particulars"] || "").toString().trim().toUpperCase();
            // Handle UOM column - try different case variations and handle null/empty values
            const uom = row.uom || row.UOM || row.Uom || row["uom"] || null;
            let uomValue = null;
            if (uom !== null && uom !== undefined && uom !== '') {
                const parsedUom = parseFloat(uom.toString());
                if (!isNaN(parsedUom)) {
                    uomValue = parsedUom;
                }
            }
            if (!group)
                return; // Skip rows without group
            if (!groupedData[group]) {
                groupedData[group] = {};
            }
            if (subgroup) {
                if (!groupedData[group][subgroup]) {
                    groupedData[group][subgroup] = [];
                }
                if (particulars) {
                    // Check if this particulars already exists
                    const existingIndex = groupedData[group][subgroup].findIndex(p => p.name === particulars);
                    if (existingIndex === -1) {
                        groupedData[group][subgroup].push({ name: particulars, uom: uomValue });
                    }
                    else {
                        // If UOM is missing from existing entry but we have it now, update it
                        if (groupedData[group][subgroup][existingIndex].uom === null && uomValue !== null) {
                            groupedData[group][subgroup][existingIndex].uom = uomValue;
                        }
                    }
                }
            }
        });
        res.json({
            itemType: itemType.toUpperCase(),
            groups: Object.keys(groupedData).sort().map(group => ({
                name: group,
                subgroups: Object.keys(groupedData[group]).sort().map(subgroup => ({
                    name: subgroup,
                    particulars: groupedData[group][subgroup].sort((a, b) => a.name.localeCompare(b.name)),
                })),
            })),
        });
    }
    catch (error) {
        console.error("Get categorial inventory error:", error);
        res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
};
// Submit stocktake entries to database
export const submitStocktakeEntries = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { entries } = req.body; // Array of entry objects
        if (!entries || !Array.isArray(entries) || entries.length === 0) {
            return res.status(400).json({ error: "Entries array is required and must not be empty" });
        }
        // Validate each entry
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            if (!entry.description && !entry.itemName) {
                return res.status(400).json({
                    error: `Entry ${i + 1}: Missing required field: itemName or description`
                });
            }
            if (!entry.floorName && !entry.floor) {
                return res.status(400).json({
                    error: `Entry ${i + 1}: Missing required field: floorName or floor`
                });
            }
            if (!entry.warehouse) {
                return res.status(400).json({
                    error: `Entry ${i + 1}: Missing required field: warehouse`
                });
            }
            if (!entry.userName && !entry.enteredBy) {
                return res.status(400).json({
                    error: `Entry ${i + 1}: Missing required field: userName or enteredBy`
                });
            }
            if (!entry.authority) {
                return res.status(400).json({
                    error: `Entry ${i + 1}: Missing required field: authority`
                });
            }
        }
        // Prepare entries for insertion
        // DO NOT include id in INSERT - let DB auto-generate
        const insertPromises = entries.map(async (entry) => {
            const itemName = (entry.itemName || entry.description || "").toUpperCase();
            const itemType = (entry.itemType || "").toUpperCase();
            const itemCategory = (entry.category || entry.itemCategory || "").toUpperCase();
            const itemSubcategory = (entry.subcategory || entry.itemSubcategory || "").toUpperCase();
            const floorName = (entry.floorName || entry.floor || "").toUpperCase();
            const warehouse = (entry.warehouse || "").toUpperCase();
            const totalQuantity = parseInt(entry.units || entry.totalQuantity, 10);
            const unitUom = parseFloat(entry.packageSize || entry.unitUom || 0);
            const totalWeight = parseFloat(entry.totalWeight || (totalQuantity * unitUom).toFixed(2));
            const enteredBy = (entry.enteredBy || entry.userName || "").toUpperCase();
            const enteredByEmail = entry.enteredByEmail || entry.userEmail || null;
            const authority = (entry.authority || "").toUpperCase();
            // Use Prisma.sql for safe parameterized query
            // RETURNING clause to get inserted row with generated ID
            const query = Prisma.sql `
        INSERT INTO stocktake_entries (
          item_name, item_type, item_category, item_subcategory,
          floor_name, warehouse, total_quantity, unit_uom, total_weight,
          entered_by, entered_by_email, authority, created_at, updated_at
        ) VALUES (${itemName}, ${itemType}, ${itemCategory}, ${itemSubcategory},
          ${floorName}, ${warehouse}, ${totalQuantity}, ${unitUom}, ${totalWeight},
          ${enteredBy}, ${enteredByEmail || null}, ${authority}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, item_name, warehouse, floor_name, total_quantity, total_weight
      `;
            const inserted = await prisma.$queryRaw(query);
            return inserted[0]; // Return inserted row with generated ID
        });
        const insertedRows = await Promise.all(insertPromises);
        res.json({
            success: true,
            message: `Successfully submitted ${entries.length} entries`,
            count: entries.length,
            insertedIds: insertedRows.map(r => r.id), // Return generated IDs
        });
    }
    catch (error) {
        console.error("Submit stocktake entries error:", error);
        res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
};
// Get stocktake entries with filters
export const getStocktakeEntries = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { warehouse, floorName, itemName, enteredBy, itemType, startDate, endDate } = req.query;
        // Build where clause
        const where = {};
        if (warehouse) {
            where.warehouse = warehouse;
        }
        if (floorName) {
            where.floorName = floorName;
        }
        if (itemName) {
            where.itemName = {
                contains: itemName.toUpperCase(),
                mode: 'insensitive',
            };
        }
        if (enteredBy) {
            where.enteredBy = {
                contains: enteredBy,
                mode: 'insensitive',
            };
        }
        if (itemType) {
            where.itemType = itemType.toUpperCase();
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate);
            }
        }
        // Build SQL query - validate and sanitize inputs first to prevent SQL injection
        const warehouseValue = warehouse ? String(warehouse).toUpperCase().replace(/[^A-Z0-9\s-]/g, '') : null;
        const floorNameValue = floorName ? String(floorName).toUpperCase().replace(/[^A-Z0-9\s-]/g, '') : null;
        const itemNamePattern = itemName ? `%${String(itemName).replace(/[%_\\]/g, '')}%` : null;
        const enteredByPattern = enteredBy ? `%${String(enteredBy).replace(/[%_\\]/g, '')}%` : null;
        const itemTypeValue = itemType ? String(itemType).toUpperCase().replace(/[^A-Z]/g, '') : null;
        const startDateValue = startDate ? new Date(startDate) : null;
        const endDateValue = endDate ? new Date(endDate) : null;
        // Build query using Prisma.sql for safe parameterization
        // Start with base query and add conditions conditionally
        let entries;
        if (warehouseValue && floorNameValue) {
            // Most common case: warehouse + floorName - use Prisma.sql for safety
            let query = Prisma.sql `
        SELECT * FROM stocktake_entries
        WHERE UPPER(warehouse) = ${warehouseValue}
          AND UPPER(floor_name) = ${floorNameValue}
      `;
            if (itemNamePattern) {
                query = Prisma.sql `${query} AND UPPER(item_name) LIKE ${itemNamePattern}`;
            }
            if (enteredByPattern) {
                query = Prisma.sql `${query} AND UPPER(entered_by) LIKE ${enteredByPattern}`;
            }
            if (itemTypeValue) {
                query = Prisma.sql `${query} AND item_type = ${itemTypeValue}`;
            }
            if (startDateValue) {
                query = Prisma.sql `${query} AND created_at >= ${startDateValue}`;
            }
            if (endDateValue) {
                query = Prisma.sql `${query} AND created_at <= ${endDateValue}`;
            }
            query = Prisma.sql `${query} ORDER BY created_at DESC`;
            entries = await prisma.$queryRaw(query);
        }
        else {
            // Fallback for other cases - build query with validated inputs
            const whereParts = [];
            if (warehouseValue) {
                whereParts.push(`UPPER(warehouse) = '${warehouseValue.replace(/'/g, "''")}'`);
            }
            if (floorNameValue) {
                whereParts.push(`UPPER(floor_name) = '${floorNameValue.replace(/'/g, "''")}'`);
            }
            if (itemNamePattern) {
                whereParts.push(`UPPER(item_name) LIKE '${itemNamePattern.replace(/'/g, "''")}'`);
            }
            if (enteredByPattern) {
                whereParts.push(`UPPER(entered_by) LIKE '${enteredByPattern.replace(/'/g, "''")}'`);
            }
            if (itemTypeValue) {
                whereParts.push(`item_type = '${itemTypeValue.replace(/'/g, "''")}'`);
            }
            if (startDateValue) {
                whereParts.push(`created_at >= '${startDateValue.toISOString()}'`);
            }
            if (endDateValue) {
                whereParts.push(`created_at <= '${endDateValue.toISOString()}'`);
            }
            const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';
            const queryString = `SELECT * FROM stocktake_entries ${whereClause} ORDER BY created_at DESC`;
            // Values are validated and sanitized above - safe to use $queryRawUnsafe
            entries = await prisma.$queryRawUnsafe(queryString);
        }
        // Format entries for response (convert snake_case to camelCase)
        const formattedEntries = entries.map((entry) => ({
            id: entry.id,
            itemName: entry.item_name,
            itemType: entry.item_type,
            itemCategory: entry.item_category,
            itemSubcategory: entry.item_subcategory,
            floorName: entry.floor_name,
            warehouse: entry.warehouse,
            totalQuantity: entry.total_quantity,
            unitUom: parseFloat(entry.unit_uom.toString()),
            totalWeight: parseFloat(entry.total_weight.toString()),
            enteredBy: entry.entered_by,
            enteredByEmail: entry.entered_by_email,
            authority: entry.authority,
            createdAt: entry.created_at ? new Date(entry.created_at).toISOString() : null,
            updatedAt: entry.updated_at ? new Date(entry.updated_at).toISOString() : null,
        }));
        res.json({
            success: true,
            entries: formattedEntries,
            count: formattedEntries.length,
        });
    }
    catch (error) {
        console.error("Get stocktake entries error:", error);
        res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
};
// Get grouped stocktake entries (for manager review)
export const getGroupedStocktakeEntries = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { warehouse, floorName } = req.query;
        if (!warehouse || !floorName) {
            return res.status(400).json({ error: "warehouse and floorName query parameters are required" });
        }
        // Get all entries for this warehouse and floor using raw SQL
        // Use case-insensitive matching for warehouse and floor_name
        const warehouseUpper = warehouse.toUpperCase();
        const floorNameUpper = floorName.toUpperCase();
        const query = Prisma.sql `
      SELECT * FROM stocktake_entries
      WHERE UPPER(warehouse) = UPPER(${warehouseUpper}) AND UPPER(floor_name) = UPPER(${floorNameUpper})
      ORDER BY created_at DESC
    `;
        const entries = await prisma.$queryRaw(query);
        // Group entries by item name (description)
        const grouped = {};
        entries.forEach((entry) => {
            const key = (entry.item_name || "").toUpperCase();
            if (!grouped[key]) {
                grouped[key] = {
                    description: entry.item_name,
                    category: entry.item_category,
                    subcategory: entry.item_subcategory,
                    itemType: entry.item_type,
                    entries: [],
                    totalEntries: 0,
                    totalQuantity: 0,
                    totalWeight: 0,
                };
            }
            grouped[key].entries.push({
                id: entry.id.toString(),
                description: entry.item_name,
                category: entry.item_category,
                subcategory: entry.item_subcategory,
                packageSize: parseFloat(entry.unit_uom.toString()),
                units: entry.total_quantity,
                totalWeight: parseFloat(entry.total_weight.toString()),
                userName: entry.entered_by,
                userEmail: entry.entered_by_email,
                authority: entry.authority,
                createdAt: entry.created_at ? new Date(entry.created_at).toISOString() : new Date().toISOString(),
            });
            grouped[key].totalEntries++;
            grouped[key].totalQuantity += entry.total_quantity;
            grouped[key].totalWeight += parseFloat(entry.total_weight.toString());
        });
        res.json({
            success: true,
            warehouse,
            floorName,
            groups: Object.values(grouped).sort((a, b) => a.description.localeCompare(b.description)),
            totalEntries: entries.length,
        });
    }
    catch (error) {
        console.error("Get grouped stocktake entries error:", error);
        res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
};
// Helper function to check if audit session is active and locks entries
const checkAuditSessionLock = async (warehouse, floorName) => {
    try {
        // Check if there's an active audit session for this warehouse
        // Lock floor-manager edits ONLY while audit is IN_PROGRESS.
        // Once manager "saves" (resultsheet saved), we mark audit as SUBMITTED and unlock editing.
        const warehouseUpper = warehouse.toUpperCase();
        const query = Prisma.sql `
      SELECT a.status 
      FROM audit_sessions a
      JOIN warehouses w ON w.id = a.warehouse_id
      WHERE UPPER(w.name) = UPPER(${warehouseUpper})
        AND a.status IN ('IN_PROGRESS')
      ORDER BY a.created_at DESC
      LIMIT 1
    `;
        const result = await prisma.$queryRaw(query);
        return result.length > 0;
    }
    catch (error) {
        console.error("Check audit session lock error:", error);
        // Fail open - allow editing if we can't determine lock status
        return false;
    }
};
// Update stocktake entry
export const updateStocktakeEntry = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { entryId } = req.params;
        const { itemName, itemType, category, subcategory, totalQuantity, unitUom, totalWeight, floorName, warehouse } = req.body;
        // Get the entry first to check authorization and audit status
        const getEntryQuery = Prisma.sql `
      SELECT * FROM stocktake_entries WHERE id = ${parseInt(entryId)}
    `;
        const entries = await prisma.$queryRaw(getEntryQuery);
        if (entries.length === 0) {
            return res.status(404).json({ error: "Entry not found" });
        }
        const entry = entries[0];
        // Check if audit session is active - if yes, only managers can edit
        const isAuditActive = await checkAuditSessionLock(entry.warehouse || warehouse, entry.floor_name || floorName);
        // Authorization check:
        // 1. Managers (INVENTORY_MANAGER, ADMIN) can always edit
        // 2. Floor managers can only edit their own entries, and only if audit is not active
        const isManager = req.user.role === "INVENTORY_MANAGER" || req.user.role === "ADMIN";
        const isOwner = entry.entered_by?.toUpperCase() === req.user.email.toUpperCase() ||
            entry.entered_by_email?.toUpperCase() === req.user.email.toUpperCase();
        if (!isManager && (isAuditActive || !isOwner)) {
            return res.status(403).json({
                error: isAuditActive
                    ? "Cannot edit entries while audit session is active"
                    : "You can only edit your own entries"
            });
        }
        // Prepare update data
        const updateData = {};
        if (itemName !== undefined)
            updateData.item_name = String(itemName).toUpperCase();
        if (itemType !== undefined)
            updateData.item_type = String(itemType).toUpperCase();
        if (category !== undefined)
            updateData.item_category = String(category).toUpperCase();
        if (subcategory !== undefined)
            updateData.item_subcategory = String(subcategory).toUpperCase();
        if (totalQuantity !== undefined)
            updateData.total_quantity = parseInt(totalQuantity, 10);
        if (unitUom !== undefined)
            updateData.unit_uom = parseFloat(unitUom);
        if (floorName !== undefined)
            updateData.floor_name = String(floorName).toUpperCase();
        if (warehouse !== undefined)
            updateData.warehouse = String(warehouse).toUpperCase();
        // Recalculate total weight if quantity or UOM changed
        if (totalQuantity !== undefined || unitUom !== undefined) {
            const qty = totalQuantity !== undefined ? parseInt(totalQuantity, 10) : entry.total_quantity;
            const uom = unitUom !== undefined ? parseFloat(unitUom) : parseFloat(entry.unit_uom.toString());
            updateData.total_weight = parseFloat((qty * uom).toFixed(2));
        }
        else if (totalWeight !== undefined) {
            updateData.total_weight = parseFloat(totalWeight);
        }
        // Build update query with Prisma.sql
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: "No fields to update" });
        }
        // Build update SET clause
        const setParts = [];
        const updateValues = [];
        let paramIndex = 1;
        Object.keys(updateData).forEach((key) => {
            setParts.push(`${key} = $${paramIndex++}`);
            updateValues.push(updateData[key]);
        });
        setParts.push(`updated_at = CURRENT_TIMESTAMP`);
        const updateQuery = `
      UPDATE stocktake_entries 
      SET ${setParts.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
        updateValues.push(parseInt(entryId));
        const updatedEntries = await prisma.$queryRawUnsafe(updateQuery, ...updateValues);
        if (updatedEntries.length === 0) {
            return res.status(404).json({ error: "Entry not found after update" });
        }
        const updated = updatedEntries[0];
        res.json({
            success: true,
            entry: {
                id: updated.id,
                itemName: updated.item_name,
                itemType: updated.item_type,
                itemCategory: updated.item_category,
                itemSubcategory: updated.item_subcategory,
                floorName: updated.floor_name,
                warehouse: updated.warehouse,
                totalQuantity: updated.total_quantity,
                unitUom: parseFloat(updated.unit_uom.toString()),
                totalWeight: parseFloat(updated.total_weight.toString()),
                enteredBy: updated.entered_by,
                enteredByEmail: updated.entered_by_email,
                authority: updated.authority,
                createdAt: updated.created_at ? new Date(updated.created_at).toISOString() : null,
                updatedAt: updated.updated_at ? new Date(updated.updated_at).toISOString() : null,
            },
        });
    }
    catch (error) {
        console.error("Update stocktake entry error:", error);
        res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
};
// Delete stocktake entry
export const deleteStocktakeEntry = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { entryId } = req.params;
        // Get the entry first to check authorization and audit status
        const getEntryQuery = Prisma.sql `
      SELECT * FROM stocktake_entries WHERE id = ${parseInt(entryId)}
    `;
        const entries = await prisma.$queryRaw(getEntryQuery);
        if (entries.length === 0) {
            return res.status(404).json({ error: "Entry not found" });
        }
        const entry = entries[0];
        // Check if audit session is active - if yes, only managers can delete
        const isAuditActive = await checkAuditSessionLock(entry.warehouse, entry.floor_name);
        // Authorization check:
        // 1. Managers (INVENTORY_MANAGER, ADMIN) can always delete
        // 2. Floor managers can only delete their own entries, and only if audit is not active
        const isManager = req.user.role === "INVENTORY_MANAGER" || req.user.role === "ADMIN";
        const isOwner = entry.entered_by?.toUpperCase() === req.user.email.toUpperCase() ||
            entry.entered_by_email?.toUpperCase() === req.user.email.toUpperCase();
        if (!isManager && (isAuditActive || !isOwner)) {
            return res.status(403).json({
                error: isAuditActive
                    ? "Cannot delete entries while audit session is active"
                    : "You can only delete your own entries"
            });
        }
        // Delete the entry
        const deleteQuery = Prisma.sql `
      DELETE FROM stocktake_entries WHERE id = ${parseInt(entryId)} RETURNING id
    `;
        const deleted = await prisma.$queryRaw(deleteQuery);
        if (deleted.length === 0) {
            return res.status(404).json({ error: "Entry not found" });
        }
        res.json({
            success: true,
            message: "Entry deleted successfully",
            entryId: deleted[0].id.toString(),
        });
    }
    catch (error) {
        console.error("Delete stocktake entry error:", error);
        res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
};
// Get audit session status for warehouse (check if entries are locked)
export const getAuditSessionStatus = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { warehouse } = req.query;
        if (!warehouse) {
            return res.status(400).json({ error: "warehouse query parameter is required" });
        }
        // Check if there's an active audit session for this warehouse
        const warehouseUpper = String(warehouse).toUpperCase();
        const query = Prisma.sql `
      SELECT a.id, a.status, a.audit_date, a.created_at, u.name as manager_name
      FROM audit_sessions a
      JOIN warehouses w ON w.id = a.warehouse_id
      JOIN users u ON u.id = a.user_id
      WHERE UPPER(w.name) = UPPER(${warehouseUpper})
      AND a.status IN ('IN_PROGRESS', 'SUBMITTED', 'APPROVED')
      ORDER BY a.created_at DESC
      LIMIT 1
    `;
        const sessions = await prisma.$queryRaw(query);
        const isLocked = sessions.length > 0;
        const auditSession = sessions.length > 0 ? {
            id: sessions[0].id,
            status: sessions[0].status,
            auditDate: sessions[0].audit_date ? new Date(sessions[0].audit_date).toISOString() : null,
            createdAt: sessions[0].created_at ? new Date(sessions[0].created_at).toISOString() : null,
            managerName: sessions[0].manager_name,
        } : null;
        res.json({
            success: true,
            isLocked,
            auditSession,
            canEdit: !isLocked || req.user.role === "INVENTORY_MANAGER" || req.user.role === "ADMIN",
        });
    }
    catch (error) {
        console.error("Get audit session status error:", error);
        res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
};
// Save checked entries directly to stocktake_entries table
// Accepts full entry data instead of IDs to avoid ID mismatch issues
export const saveStocktakeResultsheet = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { entries } = req.body;
        if (!entries || !Array.isArray(entries) || entries.length === 0) {
            return res.status(400).json({ error: "Entries array is required and must not be empty" });
        }
        console.log(`Processing ${entries.length} entries. Will save to both stocktake_entries and stocktake_resultsheet`);
        // Get today's date for resultsheet
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        // Process entries - use provided data directly, no need to fetch from DB
        const processedEntries = [];
        // Validate and process all entries
        for (const entry of entries) {
            // Use provided entry data directly - no need to fetch from DB
            const entryAny = entry; // Type assertion for fallback properties
            const itemName = (entry.itemName || "").toString().trim().toUpperCase();
            const itemType = (entry.itemType || "").toString().trim().toUpperCase();
            const itemCategory = (entry.category || entryAny.itemCategory || "").toString().trim().toUpperCase();
            const itemSubcategory = (entry.subcategory || entryAny.itemSubcategory || "").toString().trim().toUpperCase();
            const floorName = (entry.floorName || "").toString().trim().toUpperCase();
            const warehouse = (entry.warehouse || "").toString().trim().toUpperCase();
            const totalQuantity = parseInt(entry.quantity || entryAny.totalQuantity || "0", 10);
            const unitUom = parseFloat(entry.uom || entryAny.unitUom || "0");
            const totalWeight = parseFloat(entry.weight || entryAny.totalWeight || (totalQuantity * unitUom).toFixed(2));
            const enteredBy = (req.user?.email || "MANAGER").toUpperCase();
            const enteredByEmail = req.user?.email || null;
            const authority = "MANAGER";
            // Validate required fields
            if (!itemName || !warehouse || !floorName) {
                console.warn(`⚠ Skipping entry ${processedEntries.length + 1}: Missing required fields`);
                console.warn(`  - itemName: "${itemName}" (required: non-empty)`);
                console.warn(`  - warehouse: "${warehouse}" (required: non-empty)`);
                console.warn(`  - floorName: "${floorName}" (required: non-empty)`);
                continue;
            }
            if (totalQuantity <= 0 || totalWeight <= 0) {
                console.warn(`⚠ Skipping entry ${processedEntries.length + 1}: Invalid quantity/weight`);
                console.warn(`  - itemName: "${itemName}"`);
                console.warn(`  - quantity: ${totalQuantity} (required: > 0)`);
                console.warn(`  - weight: ${totalWeight} (required: > 0)`);
                continue;
            }
            console.log(`✓ Entry ${processedEntries.length + 1} validated: ${itemName} (${warehouse}/${floorName}) - Qty: ${totalQuantity}, Weight: ${totalWeight}kg`);
            processedEntries.push({
                itemName,
                itemType,
                itemCategory,
                itemSubcategory,
                floorName,
                warehouse,
                totalQuantity,
                unitUom,
                totalWeight,
                enteredBy,
                enteredByEmail,
                authority,
            });
        }
        if (processedEntries.length === 0) {
            return res.status(400).json({
                error: "No valid entries to save. Please check that all entries have required fields (itemName, warehouse, floorName, quantity, weight)."
            });
        }
        console.log(`\n=== VALIDATION COMPLETE ===`);
        console.log(`Processed ${processedEntries.length} valid entries (from ${entries.length} received)`);
        if (processedEntries.length < entries.length) {
            console.warn(`Skipped ${entries.length - processedEntries.length} invalid entries`);
        }
        // Insert into stocktake_entries table
        console.log("\n=== INSERTING INTO stocktake_entries ===");
        const entriesInsertPromises = processedEntries.map(async (entry) => {
            const insertQuery = Prisma.sql `
        INSERT INTO stocktake_entries (
          item_name, item_type, item_category, item_subcategory,
          floor_name, warehouse, total_quantity, unit_uom, total_weight,
          entered_by, entered_by_email, authority, created_at, updated_at
        ) VALUES (${entry.itemName}, ${entry.itemType}, ${entry.itemCategory}, ${entry.itemSubcategory},
          ${entry.floorName}, ${entry.warehouse}, ${entry.totalQuantity}, ${entry.unitUom}, ${entry.totalWeight},
          ${entry.enteredBy}, ${entry.enteredByEmail || null}, ${entry.authority}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, item_name, warehouse, floor_name
      `;
            const inserted = await prisma.$queryRaw(insertQuery);
            return inserted[0];
        });
        const insertedEntries = await Promise.all(entriesInsertPromises);
        // Aggregate entries for resultsheet (group by item_name, category, subcategory, warehouse, floor_name)
        const aggregatedForResultsheet = {};
        processedEntries.forEach((entry) => {
            const key = `${entry.itemName}_${entry.itemCategory}_${entry.itemSubcategory}_${entry.warehouse}_${entry.floorName}`.toUpperCase();
            if (!aggregatedForResultsheet[key]) {
                aggregatedForResultsheet[key] = {
                    item_name: entry.itemName,
                    group: entry.itemCategory,
                    subgroup: entry.itemSubcategory,
                    warehouse: entry.warehouse,
                    floor_name: entry.floorName,
                    total_weight: 0,
                    total_quantity: 0,
                    uom: entry.unitUom,
                };
            }
            aggregatedForResultsheet[key].total_weight += entry.totalWeight;
            aggregatedForResultsheet[key].total_quantity += entry.totalQuantity;
        });
        // Insert aggregated data into stocktake_resultsheet
        // Check if record exists first, then update or insert
        const resultsheetInsertPromises = Object.values(aggregatedForResultsheet).map(async (agg) => {
            // First check if a record exists for this combination
            const checkQuery = Prisma.sql `
        SELECT id, weight, quantity 
        FROM stocktake_resultsheet
        WHERE item_name = ${agg.item_name}
          AND "group" = ${agg.group}
          AND subgroup = ${agg.subgroup}
          AND warehouse = ${agg.warehouse}
          AND floor_name = ${agg.floor_name}
          AND date = ${dateStr}::date
        LIMIT 1
      `;
            const existing = await prisma.$queryRaw(checkQuery);
            if (existing.length > 0) {
                // Record exists, update it
                const existingRecord = existing[0];
                const newWeight = parseFloat(existingRecord.weight?.toString() || "0") + agg.total_weight;
                const newQuantity = parseInt(existingRecord.quantity?.toString() || "0", 10) + agg.total_quantity;
                const updateQuery = Prisma.sql `
          UPDATE stocktake_resultsheet
          SET 
            weight = ${newWeight},
            quantity = ${newQuantity},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${existingRecord.id}
        `;
                await prisma.$executeRaw(updateQuery);
                console.log(`  ✓ Updated existing resultsheet entry: ${agg.item_name} (${agg.warehouse}/${agg.floor_name})`);
                return { action: 'updated', id: existingRecord.id };
            }
            else {
                // Record doesn't exist, insert it
                const insertQuery = Prisma.sql `
          INSERT INTO stocktake_resultsheet (item_name, "group", subgroup, warehouse, floor_name, weight, quantity, uom, date, created_at, updated_at)
          VALUES (${agg.item_name}, ${agg.group}, ${agg.subgroup}, ${agg.warehouse}, ${agg.floor_name}, ${agg.total_weight}, ${agg.total_quantity}, ${agg.uom}, ${dateStr}::date, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id
        `;
                const inserted = await prisma.$queryRaw(insertQuery);
                console.log(`  ✓ Inserted new resultsheet entry: ${agg.item_name} (${agg.warehouse}/${agg.floor_name})`);
                return { action: 'inserted', id: inserted[0]?.id };
            }
        });
        await Promise.all(resultsheetInsertPromises);
        console.log(`✓ Inserted ${Object.keys(aggregatedForResultsheet).length} aggregated entries into stocktake_resultsheet`);
        // === END AUDIT on manager save ===
        // When manager saves resultsheet, mark latest IN_PROGRESS audit for this warehouse as SUBMITTED
        // so floor managers can resume editing.
        try {
            const warehouseToEnd = processedEntries[0]?.warehouse;
            if (warehouseToEnd) {
                const updateAuditQuery = Prisma.sql `
          UPDATE audit_sessions a
          SET status = 'SUBMITTED', updated_at = CURRENT_TIMESTAMP
          FROM warehouses w
          WHERE w.id = a.warehouse_id
            AND UPPER(w.name) = UPPER(${warehouseToEnd})
            AND a.status = 'IN_PROGRESS'
          RETURNING a.id
        `;
                const updatedAudits = await prisma.$queryRaw(updateAuditQuery);
                console.log(`✓ Audit ended for warehouse ${warehouseToEnd}. Updated audits: ${updatedAudits.length}`);
            }
        }
        catch (auditUpdateError) {
            // Fail open: saving resultsheet succeeded, so don't fail the request if audit status update fails.
            console.error("Failed to update audit status after save:", auditUpdateError);
        }
        console.log("\n=== SAVE COMPLETE ===");
        console.log(`Total entries saved: ${insertedEntries.length} to stocktake_entries`);
        console.log(`Total aggregated entries saved: ${Object.keys(aggregatedForResultsheet).length} to stocktake_resultsheet`);
        console.log(`Date used for resultsheet: ${dateStr}`);
        console.log("=== REQUEST FINISHED ===\n");
        res.json({
            success: true,
            message: "Stock take entries saved successfully to both stocktake_entries and stocktake_resultsheet",
            savedCount: insertedEntries.length,
            resultsheetCount: Object.keys(aggregatedForResultsheet).length,
            insertedIds: insertedEntries.map(r => r.id),
        });
    }
    catch (error) {
        console.error("Save stocktake entries error:", error);
        res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
};
// Clear all entries from stocktake_entries table
export const clearAllEntries = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // Only allow managers and admins to clear entries
        if (req.user.role !== "INVENTORY_MANAGER" && req.user.role !== "ADMIN") {
            return res.status(403).json({ error: "Only managers and admins can clear entries" });
        }
        // Delete all entries from stocktake_entries table
        const deleteQuery = Prisma.sql `
      DELETE FROM stocktake_entries
      RETURNING id
    `;
        const deleted = await prisma.$queryRaw(deleteQuery);
        res.json({
            success: true,
            message: "All entries cleared successfully",
            deletedCount: deleted.length,
        });
    }
    catch (error) {
        console.error("Clear all entries error:", error);
        res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
};
// Get stocktake resultsheet entries grouped by date/time
export const getResultsheetList = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // Get all resultsheet entries grouped by date and time
        // Group by date and created_at timestamp to get unique save sessions
        const query = Prisma.sql `
      SELECT 
        date,
        DATE_TRUNC('hour', created_at) as time_group,
        COUNT(*) as entry_count,
        SUM(weight) as total_weight,
        MIN(created_at) as first_created_at,
        MAX(created_at) as last_created_at
      FROM stocktake_resultsheet
      GROUP BY date, DATE_TRUNC('hour', created_at)
      ORDER BY date DESC, first_created_at DESC
    `;
        const entries = await prisma.$queryRaw(query);
        // Format the response
        const grouped = entries.map((entry) => {
            const timeGroup = entry.time_group ? new Date(entry.time_group).toISOString() : null;
            const timeStr = timeGroup ? new Date(timeGroup).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            }) : "";
            return {
                date: entry.date ? new Date(entry.date).toISOString().split('T')[0] : null,
                time: timeStr,
                entryCount: parseInt(entry.entry_count?.toString() || "0"),
                totalWeight: parseFloat(entry.total_weight?.toString() || "0"),
                createdAt: entry.first_created_at ? new Date(entry.first_created_at).toISOString() : null,
            };
        });
        res.json({
            success: true,
            entries: grouped,
        });
    }
    catch (error) {
        console.error("Get resultsheet list error:", error);
        res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
};
// Get stocktake resultsheet data for a specific date/time (transformed for table view)
export const getResultsheetData = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { date } = req.params;
        if (!date) {
            return res.status(400).json({ error: "Date parameter is required" });
        }
        // Parse date (format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
            return res.status(400).json({ error: "Invalid date format" });
        }
        // Get all resultsheet entries for this date
        const query = Prisma.sql `
      SELECT 
        item_name,
        "group",
        subgroup,
        warehouse,
        floor_name,
        weight,
        quantity,
        uom,
        date,
        created_at
      FROM stocktake_resultsheet
      WHERE date = ${date}::date
      ORDER BY item_name, warehouse, floor_name
    `;
        const entries = await prisma.$queryRaw(query);
        if (entries.length === 0) {
            return res.json({
                success: true,
                date,
                items: [],
                warehouses: [],
                data: {},
            });
        }
        // Transform data into table format:
        // - Rows: Item names (grouped by item_name, group, subgroup)
        // - Columns: Warehouses
        // - Sub-columns: Floor names within each warehouse
        // - Data: Weight
        // Get unique items
        const itemsMap = new Map();
        // Get unique warehouses and floors
        const warehousesSet = new Set();
        const floorsByWarehouse = new Map();
        entries.forEach((entry) => {
            const itemKey = entry.item_name?.toUpperCase() || "";
            if (!itemsMap.has(itemKey)) {
                itemsMap.set(itemKey, {
                    item_name: entry.item_name,
                    group: entry.group || "",
                    subgroup: entry.subgroup || "",
                });
            }
            const warehouse = entry.warehouse?.toUpperCase() || "";
            const floorName = entry.floor_name?.toUpperCase() || "";
            warehousesSet.add(warehouse);
            if (!floorsByWarehouse.has(warehouse)) {
                floorsByWarehouse.set(warehouse, new Set());
            }
            floorsByWarehouse.get(warehouse)?.add(floorName);
        });
        // Build data structure: item -> warehouse -> floor -> { weight, quantity, uom }
        const data = {};
        entries.forEach((entry) => {
            const itemKey = entry.item_name?.toUpperCase() || "";
            const warehouse = entry.warehouse?.toUpperCase() || "";
            const floorName = entry.floor_name?.toUpperCase() || "";
            const weight = parseFloat(entry.weight?.toString() || "0");
            const quantity = parseInt(entry.quantity?.toString() || "0", 10);
            const uom = parseFloat(entry.uom?.toString() || "0");
            if (!data[itemKey]) {
                data[itemKey] = {};
            }
            if (!data[itemKey][warehouse]) {
                data[itemKey][warehouse] = {};
            }
            data[itemKey][warehouse][floorName] = { weight, quantity, uom };
        });
        // Convert to arrays for easier frontend handling
        const items = Array.from(itemsMap.values()).sort((a, b) => a.item_name.localeCompare(b.item_name));
        const warehouses = Array.from(warehousesSet).sort();
        // Build warehouse structure with floors
        const warehouseStructure = warehouses.map(warehouse => ({
            name: warehouse,
            floors: Array.from(floorsByWarehouse.get(warehouse) || []).sort(),
        }));
        res.json({
            success: true,
            date,
            items,
            warehouses: warehouseStructure,
            data,
        });
    }
    catch (error) {
        console.error("Get resultsheet data error:", error);
        res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
};
// Search item descriptions from categorial_inv table
export const searchItemDescriptions = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // itemType comes from URL path parameter, query comes from query string
        const { itemType } = req.params;
        const { query } = req.query;
        if (!itemType || !query) {
            return res.status(400).json({ error: "itemType and query parameters are required" });
        }
        if (!["pm", "rm", "fg"].includes(itemType.toLowerCase())) {
            return res.status(400).json({ error: "Invalid item type. Must be PM, RM, or FG" });
        }
        const itemTypeValue = itemType.toLowerCase();
        // Normalize search query - keep original case for user input
        const searchQuery = query.trim();
        if (searchQuery.length < 2) {
            return res.json({ success: true, results: [] });
        }
        // Sanitize search query to prevent SQL injection
        // Convert to uppercase for case-insensitive search (matching database storage pattern)
        const sanitizedQuery = searchQuery.replace(/[%_\\]/g, "\\$&");
        const searchPattern = `%${sanitizedQuery}%`;
        // Try different column names for item type, similar to getCategorialInventory
        // Use case-insensitive search on particulars column - works with both uppercase and lowercase input
        // For SELECT DISTINCT with ORDER BY in PostgreSQL, the ORDER BY expression must appear in SELECT list
        let data;
        const queries = [
            Prisma.sql `
        SELECT DISTINCT 
          "group", 
          "sub_group", 
          "particulars", 
          "uom",
          LOWER(TRIM(CAST("particulars" AS VARCHAR))) as particulars_lower
        FROM categorial_inv 
        WHERE UPPER("fg/rm/pm") = UPPER(${itemTypeValue})
          AND LOWER(TRIM(CAST("particulars" AS VARCHAR))) LIKE LOWER(${searchPattern})
          AND "group" IS NOT NULL 
          AND TRIM(CAST("group" AS VARCHAR)) != ''
        ORDER BY particulars_lower
        LIMIT 50
      `,
            Prisma.sql `
        SELECT DISTINCT 
          "group", 
          "sub_group", 
          "particulars", 
          uom,
          LOWER(TRIM(CAST("particulars" AS VARCHAR))) as particulars_lower
        FROM categorial_inv 
        WHERE UPPER("fg/rm/pm") = UPPER(${itemTypeValue})
          AND LOWER(TRIM(CAST("particulars" AS VARCHAR))) LIKE LOWER(${searchPattern})
          AND "group" IS NOT NULL 
          AND TRIM(CAST("group" AS VARCHAR)) != ''
        ORDER BY particulars_lower
        LIMIT 50
      `,
        ];
        let lastError = null;
        for (let i = 0; i < queries.length; i++) {
            try {
                data = await prisma.$queryRaw(queries[i]);
                console.log(`Successfully searched using query attempt ${i + 1}`);
                break;
            }
            catch (error) {
                console.error(`Search query error with attempt ${i + 1}:`, error.message);
                lastError = error;
                if (i === queries.length - 1) {
                    return res.status(500).json({
                        error: "Unable to search categorial_inv table",
                        details: lastError?.message,
                    });
                }
                continue;
            }
        }
        // Format results
        const results = data.map((row) => {
            const group = (row.group || row.Group || row["group"] || "").toString().trim().toUpperCase();
            const subgroup = (row.sub_group || row.subgroup || row.SubGroup || row.Subgroup || row["sub_group"] || "").toString().trim().toUpperCase();
            const particulars = (row.particulars || row.Particulars || row["particulars"] || "").toString().trim().toUpperCase();
            const uom = row.uom || row.UOM || row.Uom || row["uom"] || null;
            let uomValue = null;
            if (uom !== null && uom !== undefined && uom !== '') {
                const parsedUom = parseFloat(uom.toString());
                if (!isNaN(parsedUom)) {
                    uomValue = parsedUom;
                }
            }
            return {
                group,
                subgroup,
                particulars,
                uom: uomValue,
            };
        }).filter((item) => item.group && item.subgroup && item.particulars);
        res.json({
            success: true,
            results,
            count: results.length,
        });
    }
    catch (error) {
        console.error("Search item descriptions error:", error);
        res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
};
// Delete stocktake resultsheet entries for a specific date
export const deleteResultsheet = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // Only allow managers and admins to delete resultsheets
        if (req.user.role !== "INVENTORY_MANAGER" && req.user.role !== "ADMIN") {
            return res.status(403).json({ error: "Only managers and admins can delete resultsheets" });
        }
        const { date } = req.params;
        if (!date) {
            return res.status(400).json({ error: "Date parameter is required" });
        }
        // Parse date (format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
            return res.status(400).json({ error: "Invalid date format" });
        }
        // Delete all resultsheet entries for this date
        const deleteQuery = Prisma.sql `
      DELETE FROM stocktake_resultsheet
      WHERE date = ${date}::date
      RETURNING id
    `;
        const deleted = await prisma.$queryRaw(deleteQuery);
        res.json({
            success: true,
            message: "Resultsheet entries deleted successfully",
            deletedCount: deleted.length,
            date,
        });
    }
    catch (error) {
        console.error("Delete resultsheet error:", error);
        res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
};

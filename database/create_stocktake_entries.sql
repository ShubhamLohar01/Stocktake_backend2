-- Create stocktake_entries table for storing floor user entries
-- Run this SQL query in your PostgreSQL database

CREATE TABLE IF NOT EXISTS stocktake_entries (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    item_type VARCHAR(10) NOT NULL, -- 'PM', 'RM', 'FG'
    item_category VARCHAR(255) NOT NULL, -- Group
    item_subcategory VARCHAR(255) NOT NULL, -- Sub-group
    floor_name VARCHAR(255) NOT NULL,
    warehouse VARCHAR(255) NOT NULL,
    total_quantity INTEGER NOT NULL, -- Number of units
    unit_uom DECIMAL(10, 3) NOT NULL, -- UOM (weight per unit in kg)
    total_weight DECIMAL(10, 2) NOT NULL, -- Calculated: total_quantity * unit_uom
    entered_by VARCHAR(255) NOT NULL, -- Username
    entered_by_email VARCHAR(255), -- User email
    authority VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for better query performance
    INDEX idx_item_name (item_name),
    INDEX idx_warehouse (warehouse),
    INDEX idx_floor_name (floor_name),
    INDEX idx_entered_by (entered_by),
    INDEX idx_created_at (created_at),
    INDEX idx_item_type (item_type)
);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_stocktake_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER stocktake_entries_updated_at
    BEFORE UPDATE ON stocktake_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_stocktake_entries_updated_at();

-- Alternative: If your PostgreSQL version doesn't support direct INDEX syntax in CREATE TABLE,
-- Use these separate CREATE INDEX statements instead:

-- CREATE INDEX IF NOT EXISTS idx_stocktake_entries_item_name ON stocktake_entries(item_name);
-- CREATE INDEX IF NOT EXISTS idx_stocktake_entries_warehouse ON stocktake_entries(warehouse);
-- CREATE INDEX IF NOT EXISTS idx_stocktake_entries_floor_name ON stocktake_entries(floor_name);
-- CREATE INDEX IF NOT EXISTS idx_stocktake_entries_entered_by ON stocktake_entries(entered_by);
-- CREATE INDEX IF NOT EXISTS idx_stocktake_entries_created_at ON stocktake_entries(created_at);
-- CREATE INDEX IF NOT EXISTS idx_stocktake_entries_item_type ON stocktake_entries(item_type);

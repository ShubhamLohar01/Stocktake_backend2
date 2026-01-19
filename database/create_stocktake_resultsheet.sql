-- Create stocktake_resultsheet table
CREATE TABLE IF NOT EXISTS stocktake_resultsheet (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    "group" VARCHAR(255) NOT NULL,
    subgroup VARCHAR(255) NOT NULL,
    warehouse VARCHAR(255) NOT NULL,
    floor_name VARCHAR(255) NOT NULL,
    weight DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stocktake_resultsheet_item_name ON stocktake_resultsheet(item_name);
CREATE INDEX IF NOT EXISTS idx_stocktake_resultsheet_warehouse ON stocktake_resultsheet(warehouse);
CREATE INDEX IF NOT EXISTS idx_stocktake_resultsheet_floor_name ON stocktake_resultsheet(floor_name);
CREATE INDEX IF NOT EXISTS idx_stocktake_resultsheet_date ON stocktake_resultsheet(date);
CREATE INDEX IF NOT EXISTS idx_stocktake_resultsheet_warehouse_floor ON stocktake_resultsheet(warehouse, floor_name);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_stocktake_resultsheet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row update
CREATE TRIGGER trigger_update_stocktake_resultsheet_updated_at
    BEFORE UPDATE ON stocktake_resultsheet
    FOR EACH ROW
    EXECUTE FUNCTION update_stocktake_resultsheet_updated_at();

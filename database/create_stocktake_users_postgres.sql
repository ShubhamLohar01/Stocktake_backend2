-- PostgreSQL compatible SQL query for stocktake_users table
-- This version uses PostgreSQL-specific syntax and is tested

CREATE TABLE IF NOT EXISTS stocktake_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Should store hashed password
    warehouse VARCHAR(255), -- Can be NULL if user has access to multiple warehouses
    role VARCHAR(50) NOT NULL, -- 'FLOOR_MANAGER', 'INVENTORY_MANAGER', 'ADMIN'
    email VARCHAR(255), -- Optional email field
    name VARCHAR(255), -- Optional full name field
    is_active BOOLEAN DEFAULT TRUE, -- To enable/disable user accounts
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance (PostgreSQL syntax)
CREATE INDEX IF NOT EXISTS idx_stocktake_users_username ON stocktake_users(username);
CREATE INDEX IF NOT EXISTS idx_stocktake_users_warehouse ON stocktake_users(warehouse);
CREATE INDEX IF NOT EXISTS idx_stocktake_users_role ON stocktake_users(role);
CREATE INDEX IF NOT EXISTS idx_stocktake_users_email ON stocktake_users(email);
CREATE INDEX IF NOT EXISTS idx_stocktake_users_warehouse_role ON stocktake_users(warehouse, role);
CREATE INDEX IF NOT EXISTS idx_stocktake_users_is_active ON stocktake_users(is_active);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_stocktake_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS stocktake_users_updated_at ON stocktake_users;
CREATE TRIGGER stocktake_users_updated_at
    BEFORE UPDATE ON stocktake_users
    FOR EACH ROW
    EXECUTE FUNCTION update_stocktake_users_updated_at();

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON stocktake_users TO your_user;
-- GRANT USAGE, SELECT ON SEQUENCE stocktake_users_id_seq TO your_user;

-- Optional: Add comments to columns for documentation
COMMENT ON TABLE stocktake_users IS 'User accounts for StockTake application';
COMMENT ON COLUMN stocktake_users.username IS 'Unique username for login';
COMMENT ON COLUMN stocktake_users.password IS 'Hashed password (should never store plain text)';
COMMENT ON COLUMN stocktake_users.warehouse IS 'Primary warehouse assignment (NULL if user has access to multiple)';
COMMENT ON COLUMN stocktake_users.role IS 'User role: FLOOR_MANAGER, INVENTORY_MANAGER, or ADMIN';
COMMENT ON COLUMN stocktake_users.is_active IS 'Flag to enable/disable user account';

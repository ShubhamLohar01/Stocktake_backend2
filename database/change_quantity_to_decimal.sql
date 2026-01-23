-- Change total_quantity column from INTEGER to DECIMAL to support decimal values (e.g., 55.6)
-- This allows users to enter fractional quantities like 55.6 instead of only whole numbers

-- Check if column is already DECIMAL, if not change it
DO $$ 
BEGIN
    -- Check current data type
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'stocktake_entries' 
        AND column_name = 'total_quantity'
        AND data_type = 'integer'
    ) THEN
        -- Change from INTEGER to DECIMAL(10, 2) to support decimal values
        ALTER TABLE stocktake_entries
        ALTER COLUMN total_quantity TYPE DECIMAL(10, 2) USING total_quantity::DECIMAL(10, 2);
        
        COMMENT ON COLUMN stocktake_entries.total_quantity IS 'Number of units (supports decimal values like 55.6)';
        
        RAISE NOTICE 'Column total_quantity changed from INTEGER to DECIMAL(10, 2)';
    ELSIF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'stocktake_entries' 
        AND column_name = 'total_quantity'
        AND data_type = 'numeric'
    ) THEN
        RAISE NOTICE 'Column total_quantity is already DECIMAL/NUMERIC type';
    ELSE
        RAISE NOTICE 'Column total_quantity not found';
    END IF;
END $$;

-- Also update stocktake_resultsheet quantity column if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'stocktake_resultsheet' 
        AND column_name = 'quantity'
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE stocktake_resultsheet
        ALTER COLUMN quantity TYPE DECIMAL(10, 2) USING quantity::DECIMAL(10, 2);
        
        COMMENT ON COLUMN stocktake_resultsheet.quantity IS 'Total quantity (supports decimal values like 55.6)';
        
        RAISE NOTICE 'Column stocktake_resultsheet.quantity changed from INTEGER to DECIMAL(10, 2)';
    END IF;
END $$;

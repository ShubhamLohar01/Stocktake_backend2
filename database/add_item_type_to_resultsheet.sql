-- Add item_type column to stocktake_resultsheet table
-- This column stores the item type (PM, RM, or FG) for each item

-- Check if column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'stocktake_resultsheet' 
        AND column_name = 'item_type'
    ) THEN
        ALTER TABLE stocktake_resultsheet
        ADD COLUMN item_type VARCHAR(10);
        
        COMMENT ON COLUMN stocktake_resultsheet.item_type IS 'Item type: PM (Packing Material), RM (Raw Material), or FG (Finished Goods)';
        
        -- Create index for better query performance
        CREATE INDEX IF NOT EXISTS idx_stocktake_resultsheet_item_type ON stocktake_resultsheet(item_type);
        
        RAISE NOTICE 'Column item_type added to stocktake_resultsheet table';
    ELSE
        RAISE NOTICE 'Column item_type already exists in stocktake_resultsheet table';
    END IF;
END $$;

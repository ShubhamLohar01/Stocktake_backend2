-- Add quantity column to stocktake_resultsheet table
ALTER TABLE stocktake_resultsheet
ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 0;

-- Add comment to column
COMMENT ON COLUMN stocktake_resultsheet.quantity IS 'Total quantity (number of units) for this item at this warehouse and floor';

# StockTake Entries Database Setup

## Step 1: Create the Database Table

Run the SQL query in `create_stocktake_entries_postgres.sql` in your PostgreSQL database.

You can do this by:

1. **Using psql command line:**
   ```bash
   psql -h <host> -U <username> -d <database> -f create_stocktake_entries_postgres.sql
   ```

2. **Using pgAdmin or another PostgreSQL client:**
   - Open pgAdmin
   - Connect to your database
   - Open Query Tool
   - Copy and paste the contents of `create_stocktake_entries_postgres.sql`
   - Execute the query

3. **Using Prisma Migrate (if using Prisma):**
   - Run: `npx prisma migrate dev --name add_stocktake_entries`
   - This will apply the schema changes and create the table

## Step 2: Update Prisma Client (if using Prisma)

After adding the model to `schema.prisma`, run:

```bash
npx prisma generate
```

This will generate the Prisma client with the new `StockTakeEntry` model.

## Step 3: Verify Table Creation

Verify the table was created successfully:

```sql
SELECT * FROM stocktake_entries LIMIT 1;
```

If the query runs without errors, the table is created successfully.

## Table Structure

The `stocktake_entries` table stores:
- `id`: Auto-incrementing primary key
- `item_name`: Item description/name
- `item_type`: PM, RM, or FG
- `item_category`: Item category (Group)
- `item_subcategory`: Item subcategory (Sub-group)
- `floor_name`: Floor name
- `warehouse`: Warehouse name
- `total_quantity`: Number of units
- `unit_uom`: UOM (weight per unit in kg)
- `total_weight`: Calculated total weight
- `entered_by`: Username who entered the entry
- `entered_by_email`: User email
- `authority`: Authority name
- `created_at`: Timestamp when entry was created
- `updated_at`: Timestamp when entry was last updated

## API Endpoints

After setup, the following endpoints will be available:

- `POST /api/stocktake-entries/submit` - Submit entries to database
- `GET /api/stocktake-entries` - Get entries with optional filters
- `GET /api/stocktake-entries/grouped?warehouse=<warehouse>&floorName=<floorName>` - Get grouped entries for manager review

## Notes

- The table uses indexes for better query performance on frequently searched columns
- A trigger automatically updates the `updated_at` timestamp on row updates
- All text fields are stored in uppercase for consistency

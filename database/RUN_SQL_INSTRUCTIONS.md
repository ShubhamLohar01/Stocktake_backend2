# How to Run SQL Files in PostgreSQL Terminal

## Method 1: Using psql Command Line (Recommended)

### If you have connection string in .env file:
```bash
# Navigate to backend directory
cd backend

# Run the SQL file using psql
psql $DATABASE_URL -f database/insert_riteshdige_user.sql
```

### If you have separate database credentials:
```bash
# Replace with your actual database details
psql -h localhost -U your_username -d your_database_name -f database/insert_riteshdige_user.sql
```

### Example with specific values:
```bash
psql -h localhost -U postgres -d stocktake -f database/insert_riteshdige_user.sql
```

## Method 2: Connect to psql first, then run file

```bash
# Step 1: Connect to PostgreSQL
psql -h localhost -U your_username -d your_database_name

# Step 2: Once connected, run:
\i database/insert_riteshdige_user.sql

# Or copy-paste the SQL directly:
INSERT INTO stocktake_users (username, password, warehouse, role, is_active) 
VALUES ('riteshdige', 'riteshdige', 'A101', 'floorhead', TRUE)
ON CONFLICT (username) DO NOTHING;
```

## Method 3: Direct SQL execution (one-liner)

```bash
psql -h localhost -U postgres -d your_database_name -c "INSERT INTO stocktake_users (username, password, warehouse, role, is_active) VALUES ('riteshdige', 'riteshdige', 'A101', 'floorhead', TRUE) ON CONFLICT (username) DO NOTHING;"
```

## Method 4: Using Node.js script (if psql not available)

You can also use the check-managers.js script as a template and modify it to insert users.

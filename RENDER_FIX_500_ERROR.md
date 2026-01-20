# Fix 500 Error on Login - Render Backend

## Problem
The login endpoint returns 500 error because the `stocktake_users` table doesn't exist in your Render database.

## Solution: Create the Table

### Option 1: Using Render Shell (Recommended)

1. Go to Render Dashboard → Your Service → **"Shell"** tab
2. Run this command to execute the SQL script:

```bash
psql $DATABASE_URL -f database/create_stocktake_users_postgres.sql
```

Or copy and paste the SQL directly:

```bash
psql $DATABASE_URL
```

Then paste this SQL:

```sql
CREATE TABLE IF NOT EXISTS stocktake_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    warehouse VARCHAR(255),
    role VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stocktake_users_username ON stocktake_users(username);
CREATE INDEX IF NOT EXISTS idx_stocktake_users_warehouse ON stocktake_users(warehouse);
CREATE INDEX IF NOT EXISTS idx_stocktake_users_role ON stocktake_users(role);
CREATE INDEX IF NOT EXISTS idx_stocktake_users_email ON stocktake_users(email);
CREATE INDEX IF NOT EXISTS idx_stocktake_users_warehouse_role ON stocktake_users(warehouse, role);
CREATE INDEX IF NOT EXISTS idx_stocktake_users_is_active ON stocktake_users(is_active);

CREATE OR REPLACE FUNCTION update_stocktake_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS stocktake_users_updated_at ON stocktake_users;
CREATE TRIGGER stocktake_users_updated_at
    BEFORE UPDATE ON stocktake_users
    FOR EACH ROW
    EXECUTE FUNCTION update_stocktake_users_updated_at();
```

Press Enter, then type `\q` to exit.

### Option 2: Using Prisma Studio

1. In Render Shell, run:
   ```bash
   npx prisma studio
   ```
2. This opens Prisma Studio in your browser
3. You can't create tables directly, but you can verify if tables exist

### Option 3: Using External Database Tool

If you have access to your database via external tool (like pgAdmin, DBeaver, etc.):
1. Connect to your Render database using the External Database URL
2. Run the SQL from `database/create_stocktake_users_postgres.sql`

## Step 2: Create a Test User

After creating the table, create a test user:

```sql
INSERT INTO stocktake_users (username, email, password, name, role, is_active, created_at)
VALUES ('admin', 'admin@example.com', 'password123', 'Admin User', 'ADMIN', true, NOW());
```

Or using psql in Render Shell:

```bash
psql $DATABASE_URL -c "INSERT INTO stocktake_users (username, email, password, name, role, is_active, created_at) VALUES ('admin', 'admin@example.com', 'password123', 'Admin User', 'ADMIN', true, NOW());"
```

## Step 3: Verify Table Exists

Check if table was created:

```bash
psql $DATABASE_URL -c "\dt stocktake_users"
```

Or:

```bash
psql $DATABASE_URL -c "SELECT * FROM stocktake_users;"
```

## Step 4: Test Login

Try logging in with:
- Username: `admin`
- Password: `password123`

## Additional Tables Needed

You may also need to create other tables. Check if these exist:

```bash
psql $DATABASE_URL -c "\dt"
```

If missing, you may need to run:
- `create_stocktake_entries_postgres.sql`
- `create_stocktake_resultsheet.sql`

## Quick Fix Script

Run this in Render Shell to create table and add test user:

```bash
psql $DATABASE_URL << EOF
CREATE TABLE IF NOT EXISTS stocktake_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    warehouse VARCHAR(255),
    role VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stocktake_users_username ON stocktake_users(username);

INSERT INTO stocktake_users (username, email, password, name, role, is_active)
VALUES ('admin', 'admin@example.com', 'password123', 'Admin User', 'ADMIN', true)
ON CONFLICT (username) DO NOTHING;
EOF
```

---

**After creating the table, the 500 error should be resolved!**

# Render Backend Troubleshooting Guide

## 500 Internal Server Error on Login

### Common Causes:

1. **Database not connected**
2. **Table doesn't exist** (migrations not run)
3. **Prisma Client not generated**
4. **Missing environment variables**

## Step-by-Step Fix

### Step 1: Check Render Logs

1. Go to your Render dashboard
2. Click on your service: `stocktake-backend2`
3. Go to **"Logs"** tab
4. Look for error messages (especially around database connection)

### Step 2: Verify Environment Variables

In Render dashboard → Your Service → **"Environment"** tab, ensure you have:

- ✅ `DATABASE_URL` - Your PostgreSQL connection string
- ✅ `JWT_SECRET` - Secret key for JWT tokens
- ✅ `NODE_ENV` - Set to `production`

### Step 3: Check Database Connection

1. In Render dashboard, go to your **PostgreSQL database**
2. Copy the **"Internal Database URL"** (if database is on Render)
3. Verify it's set as `DATABASE_URL` in your service

### Step 4: Run Database Migrations

The `stocktake_users` table needs to exist. Run migrations:

1. In Render dashboard → Your Service → **"Shell"** tab
2. Run:
   ```bash
   npx prisma db push
   ```
   
   Or if you have migrations:
   ```bash
   npx prisma migrate deploy
   ```

### Step 5: Verify Table Exists

In Render Shell, check if table exists:

```bash
# Connect to database (if you have psql)
psql $DATABASE_URL

# Then run:
\dt stocktake_users

# Or check with Prisma:
npx prisma studio
```

### Step 6: Create Initial User (if table is empty)

If the table exists but is empty, create a test user:

```sql
INSERT INTO stocktake_users (username, email, password, name, role, is_active, created_at)
VALUES ('admin', 'admin@example.com', 'password123', 'Admin User', 'ADMIN', true, NOW());
```

## Quick Test

Test the database connection from Render Shell:

```bash
npx prisma db execute --stdin
```

Then paste:
```sql
SELECT * FROM stocktake_users LIMIT 1;
```

## Common Error Messages

### "Can't reach database server"
- **Fix:** Check `DATABASE_URL` is correct
- **Fix:** Verify database is running
- **Fix:** Check if using Internal URL (for Render databases)

### "relation 'stocktake_users' does not exist"
- **Fix:** Run `npx prisma db push` in Render Shell
- **Fix:** Check if migrations were run

### "Prisma Client not generated"
- **Fix:** The build command should include `npx prisma generate`
- **Fix:** Check build logs to verify Prisma Client was generated

## Check Your Build Command

In Render → Settings → Build Command, ensure it includes:

```bash
npm install && npx prisma generate
```

## Check Your Database Schema

Verify your `prisma/schema.prisma` has the `stocktake_users` table defined, or that you're using raw SQL queries with the correct table name.

---

**Next Steps:**
1. Check Render logs for the exact error
2. Verify DATABASE_URL is set correctly
3. Run `npx prisma db push` in Render Shell
4. Test the connection

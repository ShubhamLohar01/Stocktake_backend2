# Render Deployment Guide - StockTake Backend

This guide will walk you through deploying your Express.js backend to Render step by step.

## Prerequisites

- GitHub account with the code pushed to repository
- Render account (sign up at https://render.com - free tier available)  
- Database connection string (PostgreSQL)

## Step 1: Sign Up / Sign In to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Sign up for a free account (or sign in if you already have one)
3. Connect your GitHub account when prompted

## Step 2: Create a New Web Service

1. In the Render dashboard, click **"New +"** button
2. Select **"Web Service"** from the dropdown
3. You'll be prompted to connect a repository

## Step 3: Connect Your GitHub Repository

1. Click **"Connect account"** if you haven't connected GitHub yet
2. Authorize Render to access your GitHub repositories
3. Search for your repository: `kaushalp3005/Stocktake_backend`
4. Click **"Connect"** next to your repository

## Step 4: Configure Your Web Service

Fill in the following configuration:

### Basic Settings

- **Name:** `stocktake-backend` (or your preferred name)
- **Region:** Choose closest to your users (e.g., `Oregon (US West)`)
- **Branch:** `main` (or your default branch)
- **Root Directory:** `backend` (if your repo has frontend/backend structure) or leave empty if backend is at root
- **Runtime:** `Node`
- **Build Command:** `npm install && npx prisma generate`
- **Start Command:** `npm start` or `node node-build.ts` or `tsx node-build.ts`

### Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add:

| Key | Value | Description |
|-----|-------|-------------|
| `DATABASE_URL` | `postgresql://user:password@host:port/dbname?schema=public` | Your PostgreSQL connection string |
| `JWT_SECRET` | `your-secret-key-here` | Secret key for JWT tokens (use a strong random string) |
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `8000` | Port (Render will set this automatically, but you can specify) |

**Note:** You can also set individual database variables instead of `DATABASE_URL`:
- `DB_HOST`
- `DB_PORT`
- `DB_USER` or `DB_USERNAME`
- `DB_PASSWORD`
- `DB_NAME` or `DB_DATABASE`
- `DB_SCHEMA` (optional, defaults to 'public')

### Build & Deploy Settings

- **Auto-Deploy:** `Yes` (deploys automatically on push to main branch)
- **Docker:** Leave unchecked (unless you're using Docker)

## Step 5: Update package.json Scripts

Make sure your `package.json` has the correct start script. Check if you need to update it:

```json
{
  "scripts": {
    "start": "node node-build.ts",
    // OR if using tsx:
    "start": "tsx node-build.ts",
    // OR if you have a build step:
    "build": "tsc",
    "start": "node dist/node-build.js"
  }
}
```

**Note:** If you're using TypeScript directly, you'll need `tsx` in dependencies (not devDependencies) for production.

## Step 6: Create Render PostgreSQL Database (Optional)

If you don't have a database yet:

1. In Render dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name:** `stocktake-db`
   - **Database:** `stocktake` (or your preferred name)
   - **User:** Auto-generated
   - **Region:** Same as your web service
   - **PostgreSQL Version:** Latest
3. Click **"Create Database"**
4. Wait for database to be created
5. Copy the **"Internal Database URL"** or **"External Database URL"**
6. Use this as your `DATABASE_URL` environment variable

## Step 7: Deploy

1. Review all your settings
2. Click **"Create Web Service"**
3. Render will start building and deploying your service
4. Watch the build logs in real-time

## Step 8: Monitor Deployment

1. You'll see build logs showing:
   - Installing dependencies
   - Running build commands
   - Starting the service
2. Wait for deployment to complete (usually 2-5 minutes)
3. You'll see a green "Live" status when ready

## Step 9: Get Your Service URL

Once deployed, you'll get a URL like:
- `https://stocktake-backend.onrender.com`

This is your API base URL. Your endpoints will be:
- `https://stocktake-backend.onrender.com/api/ping`
- `https://stocktake-backend.onrender.com/api/auth/login`
- etc.

## Step 10: Run Database Migrations

After deployment, you need to set up your database schema:

### Option A: Using Render Shell

1. In your service dashboard, click **"Shell"** tab
2. Run:
   ```bash
   npx prisma migrate deploy
   ```
   Or if using db push:
   ```bash
   npx prisma db push
   ```

### Option B: Using Local Machine

1. Set `DATABASE_URL` environment variable locally
2. Run:
   ```bash
   npx prisma migrate deploy
   ```

### Option C: Using Prisma Studio (for initial setup)

1. In Render Shell:
   ```bash
   npx prisma studio
   ```
2. This will open Prisma Studio in your browser

## Step 11: Test Your Deployment

1. Test health check endpoint:
   ```bash
   curl https://stocktake-backend.onrender.com/api/ping
   ```
   Expected response: `{"message":"pong"}`

2. Test login endpoint:
   ```bash
   curl -X POST https://stocktake-backend.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"your-username","password":"your-password"}'
   ```

## Step 12: Update Frontend API URL

Update your frontend to use the Render URL instead of localhost:

```typescript
// In your frontend API configuration
const API_URL = 'https://stocktake-backend.onrender.com';
```

## Important Notes

### Free Tier Limitations

- **Spins down after 15 minutes of inactivity** (takes ~30 seconds to wake up)
- **750 hours/month free** (enough for always-on if you upgrade)
- **512 MB RAM**
- Consider upgrading to paid plan for production

### Environment Variables

- Never commit `.env` files to Git
- Always set sensitive data in Render dashboard
- Use Render's environment variable encryption

### Database Connection

- Use **Internal Database URL** if database is on Render (faster, free)
- Use **External Database URL** if database is elsewhere
- Ensure database allows connections from Render's IPs

### Build Commands

If you need to compile TypeScript:

```bash
# Build command
npm install && npm run build && npx prisma generate

# Start command  
node dist/node-build.js
```

### Logs

- View logs in Render dashboard under **"Logs"** tab
- Logs are available for 7 days (free tier)
- Use `console.log()` for debugging

### Custom Domain (Optional)

1. Go to **"Settings"** → **"Custom Domains"**
2. Add your domain
3. Update DNS records as instructed
4. Render provides free SSL certificates

## Troubleshooting

### Build Fails

**Issue:** Build command fails
- **Solution:** Check build logs, ensure all dependencies are in `package.json`
- **Solution:** Make sure `prisma` is available (install it in dependencies if needed)

### Service Crashes on Start

**Issue:** Service starts then crashes
- **Solution:** Check logs for error messages
- **Solution:** Verify environment variables are set correctly
- **Solution:** Ensure database is accessible

### Database Connection Error

**Issue:** Cannot connect to database
- **Solution:** Verify `DATABASE_URL` is correct
- **Solution:** Check if database allows external connections
- **Solution:** Ensure database is in same region (for internal connections)

### Port Issues

**Issue:** Service not starting
- **Solution:** Ensure your code uses `process.env.PORT`:
  ```typescript
  const port = process.env.PORT || 8000;
  ```
- Render sets `PORT` automatically

### TypeScript Issues

**Issue:** TypeScript not compiling
- **Solution:** Add TypeScript to dependencies (not just devDependencies)
- **Solution:** Or use `tsx` for runtime TypeScript execution
- **Solution:** Or compile locally and commit `dist/` folder

## Updating Your Deployment

### Automatic Updates

- Render automatically deploys when you push to the connected branch
- No manual action needed

### Manual Deploy

1. Go to your service dashboard
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

### Rollback

1. Go to **"Events"** tab
2. Find previous successful deployment
3. Click **"Redeploy"**

## Next Steps

1. Set up monitoring and alerts
2. Configure custom domain
3. Set up staging environment
4. Enable auto-scaling (paid plans)
5. Set up CI/CD pipeline

## Support

- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com
- Check service logs for detailed error messages

---

**Your backend will be live at:** `https://your-service-name.onrender.com`

**Repository:** https://github.com/kaushalp3005/Stocktake_backend

Good luck with your deployment! 🚀

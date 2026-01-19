# Render Quick Start Guide

## Quick Deployment Steps

1. **Go to Render Dashboard:** https://dashboard.render.com
2. **Click "New +"** → **"Web Service"**
3. **Connect Repository:** `kaushalp3005/Stocktake_backend`
4. **Configure:**

   - **Name:** `stocktake-backend`
   - **Build Command:** `npm install && npx prisma generate`
   - **Start Command:** `npm start`
   - **Environment Variables:**
     - `DATABASE_URL` = Your PostgreSQL connection string
     - `JWT_SECRET` = Your secret key
     - `NODE_ENV` = `production`

5. **Click "Create Web Service"**
6. **Wait for deployment** (2-5 minutes)
7. **Run migrations:** In Shell tab, run `npx prisma db push`
8. **Test:** Visit `https://your-service.onrender.com/api/ping`

## Your Service URL

After deployment, you'll get:
- `https://stocktake-backend.onrender.com` (or your custom name)

## Important Notes

- ✅ Uses `process.env.PORT` (Render sets this automatically)
- ✅ `tsx` is in dependencies (runs TypeScript directly)
- ✅ Start command: `npm start` → runs `tsx node-build.ts`
- ⚠️ Free tier spins down after 15 min inactivity
- ⚠️ First request after spin-down takes ~30 seconds

## Environment Variables Needed

```
DATABASE_URL=postgresql://user:pass@host:port/dbname
JWT_SECRET=your-secret-key
NODE_ENV=production
```

## Database Setup

1. Create PostgreSQL database in Render (optional)
2. Copy connection string
3. Set as `DATABASE_URL` environment variable
4. Run `npx prisma db push` in Render Shell after first deployment

---

For detailed instructions, see `RENDER_DEPLOYMENT_GUIDE.md`

# StockTake - Modern Inventory Management System

A production-ready stock take management application built for warehouse operations. Floor managers enter stock data pallet-wise, inventory managers review and approve, and the system generates unified Excel reports.

## Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- PostgreSQL database (or use Neon/Supabase for managed PostgreSQL)

### 1. Setup Database

#### Option A: Using Neon (Recommended - Free Tier Available)
1. Go to https://neon.tech and create a free account
2. Create a new database project
3. Copy the connection string
4. Update `.env`: `DATABASE_URL="your-neon-connection-string"`

#### Option B: Using Supabase
1. Go to https://supabase.com and create a project
2. Go to Project Settings → Database
3. Copy the connection string
4. Update `.env`: `DATABASE_URL="your-supabase-connection-string"`

#### Option C: Local PostgreSQL
```bash
createdb stocktake
# Update .env with your local connection
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Setup Database Schema
```bash
# Create tables
pnpm db:push

# Or with migrations:
pnpm db:migrate
```

### 4. Seed Initial Data
```bash
pnpm db:seed
```

This creates:
- 7 floors (Floor 1-7)
- 5 users (Admin, Inventory Manager, 3 Floor Managers)
- 8 stock items (Rice, Flour, Sugar, Oil, etc.)

**Demo Credentials:**
- Admin: `admin@example.com` / `password123`
- Inventory Manager: `manager@example.com` / `password123`
- Floor Manager 1: `floor1@example.com` / `password123`

### 5. Start Development Server
```bash
pnpm dev
```

Visit http://localhost:5173

## Architecture

### Tech Stack
- **Frontend**: React 18 + React Router 6 + TypeScript + TailwindCSS
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT + bcrypt
- **Excel**: exceljs

### Project Structure
```
client/                    # React SPA
├── pages/                 # Route components
├── components/            # UI components (Radix + Tailwind)
└── global.css            # Theme variables

server/                    # Express API
├── routes/               # API endpoints
├── middleware/           # Auth middleware
├── utils/                # Utilities (JWT, bcrypt)
└── services/             # Business logic (Excel export)

prisma/                   # Database schema
├── schema.prisma         # Data models
└── seed.ts              # Seed script

shared/                   # Shared types
```

## Key Features

### Roles & Permissions

**Floor Manager**
- Access only assigned floor(s)
- Enter/edit stock in DRAFT status
- Submit sessions for review
- Read-only after submission

**Inventory Manager**
- Access all floors
- Edit before approval
- Approve sessions
- Generate reports
- Full audit access

**Admin**
- Manage users, floors, items
- View all exports
- System configuration

### Workflow

1. **Entry**: Floor manager selects floor → creates pallet → adds items
2. **Submission**: Floor manager submits session (DRAFT → SUBMITTED)
3. **Review**: Inventory manager reviews, edits if needed, approves (SUBMITTED → APPROVED)
4. **Locked**: After approval, no edits allowed at API level
5. **Export**: Generate consolidated Excel across all floors

### Database Models

- **User**: Authenticated users with roles
- **Floor**: Warehouse floors
- **UserFloor**: User-Floor assignments
- **Item**: Stock items with unit and KG per unit
- **FloorSession**: Daily stock session per floor
- **Pallet**: Logical grouping (auto-numbered, internal only)
- **StockLine**: Items within pallets
- **AuditLog**: Complete audit trail
- **ExportFile**: Generated Excel reports

## API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/me` - Current user info

### Floors & Sessions
- `GET /api/floors` - User's floors
- `POST /api/floors/:floorId/sessions/today` - Get/create session
- `GET /api/sessions/:sessionId` - Get session details
- `POST /api/sessions/:sessionId/submit` - Submit for review
- `POST /api/sessions/:sessionId/approve` - Approve (Inventory Manager only)

### Stock Management
- `POST /api/sessions/:sessionId/pallets` - Create pallet
- `POST /api/pallets/:palletId/stock` - Add stock line
- `PATCH /api/stock/:stockLineId` - Update stock line
- `DELETE /api/stock/:stockLineId` - Delete stock line
- `GET /api/items` - List all items
- `POST /api/items` - Create item (Admin only)

### Reports
- `POST /api/export/generate` - Generate Excel export
- `GET /api/exports` - Export history (Admin only)

## Development

### Available Scripts
```bash
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm test             # Run tests
pnpm typecheck        # TypeScript validation
pnpm format.fix       # Format code
pnpm db:migrate       # Create DB migration
pnpm db:push          # Push schema to DB
pnpm db:seed          # Seed initial data
pnpm db:studio        # Open Prisma Studio
```

## Excel Export Format

The exported Excel file includes:
- Header section (Company, Date, Generated At, Generated By, Approval Status)
- Item rows with:
  - Item Name
  - Unit Name
  - Warehouse Total (KG)
  - Individual floor columns (Floor 1-7)
  - Last Updated Time
- Totals row
- Frozen header row
- Professional formatting

## Environment Variables

```env
DATABASE_URL         # PostgreSQL connection string
JWT_SECRET          # JWT signing key
JWT_EXPIRY          # Token expiration (e.g., "7d")
NODE_ENV            # "development" or "production"
PORT                # Server port (default: 3000)
```

## Security

- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens for authentication
- Role-based access control enforced at API level
- Complete audit logging of all operations
- Approved sessions locked for editing at backend level

## Production Deployment

### Netlify (Recommended)
1. Connect your GitHub repository
2. Configure build command: `pnpm build`
3. Configure publish directory: `dist/spa`
4. Set environment variables in Netlify dashboard
5. Deploy!

### Vercel
1. Import your project
2. Set environment variables
3. Deploy automatically on push

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm build
CMD ["pnpm", "start"]
```

## Troubleshooting

### Database Connection Issues
- Check `DATABASE_URL` format
- Ensure PostgreSQL is running
- Verify credentials and network access
- For Neon/Supabase: Check IP whitelist

### Auth Issues
- Check JWT_SECRET is set
- Verify token is included in Authorization header
- Check token expiration

### Build Issues
- Clear node_modules: `rm -rf node_modules && pnpm install`
- Clear Prisma: `rm -rf node_modules/.prisma`
- Rebuild Prisma: `pnpm db:push`

## License

Built for Candor Foods - All rights reserved

## Support

For issues and feature requests, contact the development team.

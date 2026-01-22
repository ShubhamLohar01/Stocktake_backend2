# Lambda Deployment - Quick Commands

## 1. Prepare Package
```powershell
cd backend
.\prepare-lambda.ps1
```

## 2. Create ZIP
```powershell
.\create-lambda-zip.ps1
```

## 3. Upload to Lambda (AWS CLI)
```bash
# Create function (first time)
aws lambda create-function \
  --function-name stocktake-backend \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/YOUR_LAMBDA_ROLE \
  --handler lambda.handler \
  --zip-file fileb://stocktake-lambda.zip \
  --timeout 30 \
  --memory-size 1024

# Update existing function
aws lambda update-function-code \
  --function-name stocktake-backend \
  --zip-file fileb://stocktake-lambda.zip
```

## 4. Test Endpoint
```bash
# Health check
curl https://YOUR_API_ID.execute-api.REGION.amazonaws.com/api/ping

# Should return: {"message":"pong"}
```

## Environment Variables to Set in Lambda:
- `DB_HOST` - Your PostgreSQL host
- `DB_PORT` - 5432
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `DB_SCHEMA` - public
- `JWT_SECRET` - Your JWT secret
- `NODE_ENV` - production

## Lambda Configuration:
- **Handler**: `lambda.handler`
- **Runtime**: Node.js 18.x or higher
- **Timeout**: 30 seconds (minimum)
- **Memory**: 1024 MB (recommended)
- **Architecture**: x86_64

## Files in lambda-zip-file folder:
- `lambda.js` - Lambda handler (entry point)
- `index.ts` - Express server
- `package.json` - Dependencies
- `routes/` - API routes
- `middleware/` - Auth & middleware
- `services/` - Business logic
- `utils/` - Utilities
- `shared/` - Shared code
- `prisma/` - Database schema
- `node_modules/` - Dependencies

## Common Issues:
1. **Timeout**: Increase Lambda timeout to 30s+
2. **Memory**: Use 1024 MB for Excel generation
3. **VPC**: If RDS is in VPC, Lambda must be too
4. **Prisma**: Ensure generated for Linux

See LAMBDA-DEPLOYMENT.md for detailed instructions.

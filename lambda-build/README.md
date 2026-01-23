# StockTake Lambda Deployment Package

This package contains all files needed for AWS Lambda deployment with Linux support.

## Package Contents

- **lambda.js** - Lambda handler entry point
- **index.js** - Express application server
- **package.json** - Production dependencies
- **node_modules/** - Linux-compatible dependencies
- **routes/** - API route handlers
- **middleware/** - Authentication & middleware
- **services/** - Business logic
- **utils/** - Utility functions
- **shared/** - Shared types & API definitions
- **prisma/** - Database schema & generated client

## Prerequisites

1. AWS Lambda function configured with:
   - Runtime: Node.js 18.x or later
   - Architecture: x86_64
   - Memory: 512 MB minimum (1024 MB recommended)
   - Timeout: 30 seconds minimum

2. RDS PostgreSQL database or compatible database

3. Environment variables configured in Lambda

## Environment Variables

Configure these in your Lambda function:

DATABASE_URL=postgresql://username:password@host:5432/database?schema=public
JWT_SECRET=your-secret-key
NODE_ENV=production

Or use individual DB variables:
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=stocktake
DB_SCHEMA=public
JWT_SECRET=your-secret-key
NODE_ENV=production

## Deployment Steps

### Method 1: Direct Upload (< 50 MB)

1. Upload **stocktake-lambda-linux.zip** directly to Lambda
2. Set handler to: lambda.handler
3. Configure environment variables
4. Test the function

### Method 2: S3 Upload (> 50 MB)

1. Upload zip to S3:
   aws s3 cp stocktake-lambda-linux.zip s3://your-bucket/

2. Update Lambda from S3:
   aws lambda update-function-code \
     --function-name your-function-name \
     --s3-bucket your-bucket \
     --s3-key stocktake-lambda-linux.zip

### Method 3: Using AWS CLI

aws lambda update-function-code \
  --function-name stocktake-api \
  --zip-file fileb://stocktake-lambda-linux.zip

## Testing

After deployment, test with:

aws lambda invoke \
  --function-name stocktake-api \
  --payload '{"httpMethod":"GET","path":"/api/health"}' \
  response.json

## API Gateway Integration

Configure API Gateway with:
- Integration type: Lambda Proxy
- Lambda function: your-function-name
- Enable CORS if needed

## Database Migrations

Run Prisma migrations on your RDS database before deploying:

npx prisma migrate deploy

## Troubleshooting

### Import Errors
- Ensure all paths use forward slashes
- Check that all dependencies are in package.json

### Database Connection Issues
- Verify DATABASE_URL or DB_* environment variables
- Check RDS security group allows Lambda access
- Ensure Lambda is in same VPC as RDS (if applicable)

### Timeout Issues
- Increase Lambda timeout (30s minimum)
- Check database query performance
- Monitor CloudWatch logs

## File Size Optimization

If package is too large:
1. Remove unused dependencies
2. Use Lambda Layers for large dependencies
3. Remove source maps and test files

## Support

Built: 2026-01-22 12:28:13
Platform: Linux x64 (AWS Lambda compatible)
Node Version: 18+

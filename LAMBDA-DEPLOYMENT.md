# AWS Lambda Deployment Guide for StockTake Backend

This guide will help you deploy the StockTake backend to AWS Lambda.

## Prerequisites

1. **AWS Account** with access to:
   - AWS Lambda
   - API Gateway
   - RDS PostgreSQL (or external PostgreSQL database)
   - (Optional) S3 for large deployment packages

2. **Node.js 18+** installed on your machine

3. **Database**: PostgreSQL database accessible from Lambda

## Step-by-Step Deployment

### Step 1: Prepare the Lambda Package

Run the preparation script from the backend directory:

```powershell
.\prepare-lambda.ps1
```

This script will:
- Copy all necessary source files to `lambda-zip-file` folder
- Install Linux-compatible npm dependencies
- Generate Prisma Client for Linux
- Create deployment documentation

### Step 2: Configure Environment Variables

1. Navigate to `lambda-zip-file` folder
2. Copy `.env.example` to `.env`
3. Update with your actual values:

```env
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=stocktake
DB_SCHEMA=public
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=production
```

**Important:** Don't include `.env` in the ZIP file for security. Instead, configure these as Lambda Environment Variables.

### Step 3: Create ZIP File

Run the ZIP creation script:

```powershell
.\create-lambda-zip.ps1
```

Or manually create it:

```powershell
cd lambda-zip-file
Compress-Archive -Path * -DestinationPath ..\stocktake-lambda.zip -Force
```

### Step 4: Create Lambda Function

#### Option A: Using AWS Console

1. Go to **AWS Lambda Console**
2. Click **Create function**
3. Choose **Author from scratch**
4. Configure:
   - **Function name**: `stocktake-backend`
   - **Runtime**: Node.js 18.x (or higher)
   - **Architecture**: x86_64
5. Click **Create function**

#### Option B: Using AWS CLI

```bash
aws lambda create-function \
  --function-name stocktake-backend \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-execution-role \
  --handler lambda.handler \
  --zip-file fileb://stocktake-lambda.zip \
  --timeout 30 \
  --memory-size 1024
```

### Step 5: Upload Code

#### If ZIP < 50 MB (Direct Upload):

1. In Lambda Console, go to **Code** tab
2. Click **Upload from** > **.zip file**
3. Select `stocktake-lambda.zip`
4. Click **Save**

#### If ZIP > 50 MB (S3 Upload):

1. Upload ZIP to S3:
```bash
aws s3 cp stocktake-lambda.zip s3://your-bucket/stocktake-lambda.zip
```

2. Update Lambda from S3:
```bash
aws lambda update-function-code \
  --function-name stocktake-backend \
  --s3-bucket your-bucket \
  --s3-key stocktake-lambda.zip
```

### Step 6: Configure Lambda Settings

1. **Handler**: Set to `lambda.handler`

2. **Environment Variables**: Add these in Lambda Configuration > Environment variables:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
   - `DB_SCHEMA`
   - `JWT_SECRET`
   - `NODE_ENV=production`

3. **Timeout**: Increase to **30 seconds** (or 300 for large operations)
   - Configuration > General configuration > Edit
   - Set Timeout to 30 seconds

4. **Memory**: Set to **1024 MB** (recommended for Excel generation)
   - Configuration > General configuration > Edit
   - Set Memory to 1024 MB

5. **VPC Configuration** (if using RDS in VPC):
   - Configuration > VPC > Edit
   - Select the same VPC as your RDS
   - Select private subnets
   - Select security group that allows RDS access

### Step 7: Set Up API Gateway

#### Option A: HTTP API (Recommended - Simpler & Cheaper)

1. Go to **API Gateway Console**
2. Click **Create API** > **HTTP API** > **Build**
3. Add integration:
   - Integration type: Lambda
   - Lambda function: `stocktake-backend`
   - Version: 2.0
4. Configure routes:
   - Method: ANY
   - Resource path: `/{proxy+}`
5. Configure CORS (if needed)
6. Create and deploy

#### Option B: REST API (More features)

1. Go to **API Gateway Console**
2. Click **Create API** > **REST API** > **Build**
3. Create API:
   - Name: `StockTake API`
   - Endpoint Type: Regional
4. Create resource:
   - Resource Path: `/{proxy+}`
   - Enable CORS
5. Create method:
   - Method: ANY
   - Integration type: Lambda Function
   - Lambda Function: `stocktake-backend`
   - Use Lambda Proxy integration: ✓
6. Deploy API:
   - Deployment stage: `prod`

### Step 8: Database Setup

Ensure your PostgreSQL database has:

1. **Required tables**: Run Prisma migrations or SQL scripts from `backend/database/` folder

2. **Network Access**: 
   - If Lambda is in VPC, ensure security groups allow traffic
   - If using public RDS, enable public access and whitelist Lambda IPs

3. **Test connection** from Lambda:
   - Use Lambda test event
   - Check CloudWatch logs for connection errors

### Step 9: Update Frontend

Update your frontend `.env` file with the new API endpoint:

```env
VITE_API_URL=https://your-api-id.execute-api.region.amazonaws.com
```

### Step 10: Test Deployment

1. **Test health check**:
```bash
curl https://your-api-id.execute-api.region.amazonaws.com/api/ping
```

Expected response: `{"message":"pong"}`

2. **Test login endpoint**:
```bash
curl -X POST https://your-api-id.execute-api.region.amazonaws.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

3. **Check CloudWatch Logs**:
   - Go to CloudWatch > Log groups
   - Find `/aws/lambda/stocktake-backend`
   - Check for errors

## Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   - Check VPC configuration
   - Verify security groups
   - Ensure RDS allows connections from Lambda
   - Check DATABASE_URL format

2. **Function Timeout**
   - Increase Lambda timeout (Configuration > General)
   - Check for slow database queries
   - Consider connection pooling

3. **Package Too Large**
   - Remove development dependencies
   - Use Lambda Layers for large dependencies
   - Upload to S3 instead of direct upload

4. **Prisma Connection Issues**
   - Ensure Prisma Client is generated for Linux
   - Run `npx prisma generate` in lambda-zip-file folder
   - Check DATABASE_URL environment variable

5. **CORS Errors**
   - Enable CORS in API Gateway
   - Check allowed origins
   - Ensure preflight requests work

## Updating the Lambda Function

To update after making changes:

1. Make your code changes in the backend folder
2. Run `.\prepare-lambda.ps1` again
3. Run `.\create-lambda-zip.ps1` again
4. Upload new ZIP to Lambda

Or use AWS CLI for quick updates:

```bash
aws lambda update-function-code \
  --function-name stocktake-backend \
  --zip-file fileb://stocktake-lambda.zip
```

## Cost Optimization

1. **Use HTTP API** instead of REST API (cheaper)
2. **Right-size memory**: Start with 1024 MB, adjust based on actual usage
3. **Set appropriate timeout**: Don't set too high to avoid unnecessary charges
4. **Use RDS Proxy**: For connection pooling and better performance
5. **Monitor**: Use CloudWatch to track invocations and optimize

## Monitoring

1. **CloudWatch Logs**: Check `/aws/lambda/stocktake-backend`
2. **CloudWatch Metrics**: Monitor invocations, errors, duration
3. **X-Ray**: Enable for detailed tracing
4. **API Gateway Metrics**: Monitor API requests and latency

## Security Best Practices

1. **Never commit** `.env` or credentials
2. **Use Secrets Manager** for sensitive data (DB passwords, JWT secret)
3. **Enable VPC** for Lambda if using private RDS
4. **Use IAM roles** with minimum required permissions
5. **Enable API Gateway authentication** (API keys, Cognito, etc.)
6. **Keep dependencies updated** regularly

## Support

For issues or questions:
- Check CloudWatch logs first
- Review API Gateway execution logs
- Test database connectivity
- Verify environment variables

## Additional Resources

- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [Prisma with AWS Lambda](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-aws-lambda)

# AWS Lambda + API Gateway Complete Setup Guide - StockTake Backend

This comprehensive guide walks you through deploying your StockTake backend to AWS Lambda and exposing it via API Gateway.

## Quick Reference

**Package Location:** `D:\StockTake module\backend\backend-lambda.zip`  
**Lambda Handler:** `dist/lambda.handler`  
**Runtime:** Node.js 20.x (or 18.x)  
**Architecture:** x86_64  
**Timeout:** 30 seconds (recommended)  
**Memory:** 512-1024 MB (recommended)  
**Database:** RDS PostgreSQL (Public Endpoint - No VPC needed)  
**RDS Endpoint:** `wms-postgres-db.cpis084golp7.ap-south-1.rds.amazonaws.com`

**Required Environment Variables:**
- `DATABASE_URL` = `postgresql://username:password@wms-postgres-db.cpis084golp7.ap-south-1.rds.amazonaws.com:5432/stocktake?schema=public`
- `JWT_SECRET` = Your secret key for JWT signing
- `NODE_ENV` = `production`

## Prerequisites

- AWS Account with appropriate permissions (Lambda, API Gateway, and RDS access)
- AWS CLI installed and configured (optional, for CLI deployment)
- The `backend-lambda.zip` file created by the packaging script
- RDS PostgreSQL database credentials (your public endpoint: `wms-postgres-db.cpis084golp7.ap-south-1.rds.amazonaws.com`)
- Database security group configured to allow inbound connections on port 5432 from anywhere (0.0.0.0/0) or specific Lambda IP ranges

## Step 1: Verify Your Package

Your zip file should contain:
- `dist/` folder with compiled JavaScript files
- `node_modules/` folder with production dependencies
- `prisma/` folder with schema and generated client
- `package.json`

**Location:** `D:\StockTake module\backend\backend-lambda.zip`

### Linux Compatibility Note

The package was created on Windows, but your dependencies are primarily JavaScript-based:
- ✅ `bcryptjs` - Pure JavaScript (no native bindings)
- ✅ `express`, `cors`, `jsonwebtoken`, `zod` - Pure JavaScript
- ✅ `exceljs` - Mostly JavaScript (should work on Linux)
- ✅ `prisma` - Generates platform-specific binaries, but Prisma Client should work on Linux Lambda

**If you encounter module loading errors**, you may need to rebuild the package in a Linux environment using Docker. However, for most cases, the current package should work fine on Lambda's Linux runtime.

### Important: ES Module Configuration

The `tsconfig.lambda.json` is configured to output ES modules (`"module": "ES2020"`) to match the `"type": "module"` in `package.json`. If you encounter "exports is not defined" errors, ensure:
1. The TypeScript config uses `"module": "ES2020"` (not `"commonjs"`)
2. The compiled code uses `export` syntax (not `module.exports`)
3. Rebuild the package after any TypeScript config changes

## Step 2: Create Lambda Function in AWS Console

### 2.1 Navigate to Lambda

1. Go to [AWS Console](https://console.aws.amazon.com)
2. Search for "Lambda" in the services search bar
3. Click on **Lambda** service

### 2.2 Create New Function

1. Click **"Create function"** button
2. Select **"Author from scratch"**
3. Configure the function:
   - **Function name:** `stocktake-backend` (or your preferred name)
   - **Runtime:** `Node.js 20.x` (or `Node.js 18.x`)
   - **Architecture:** `x86_64`
   - **Execution role:** Choose "Create a new role with basic Lambda permissions"
4. Click **"Create function"**

**Important Note:** Since your RDS database (`wms-postgres-db.cpis084golp7.ap-south-1.rds.amazonaws.com`) has a **public endpoint**, you do **NOT need to configure VPC** for this Lambda function. This simplifies setup and eliminates VPC-related cold start delays.

## Step 3: Upload Your Deployment Package

### 3.1 Upload via AWS Console (Recommended for First Time)

1. In your Lambda function page, scroll down to **"Code source"** section
2. Click **"Upload from"** dropdown
3. Select **".zip file"**
4. Click **"Upload"** button
5. Browse and select your `backend-lambda.zip` file
6. Click **"Save"** button
7. Wait for the upload to complete (this may take a few minutes for large packages)

### 3.2 Upload via AWS CLI (Alternative)

If you have AWS CLI configured:

```bash
aws lambda update-function-code \
  --function-name stocktake-backend \
  --zip-file fileb://backend-lambda.zip
```

## Step 4: Configure Lambda Handler

1. In your Lambda function page, go to **"Code"** tab
2. Scroll to **"Runtime settings"** section
3. Click **"Edit"** button
4. Set the handler to: **`dist/lambda.handler`**
5. Click **"Save"**

**Note:** This tells Lambda to look for the `handler` export in `dist/lambda.js` (compiled from `lambda.ts`)

## Step 5: Configure Environment Variables

1. In your Lambda function page, go to **"Configuration"** tab
2. Click **"Environment variables"** in the left sidebar
3. Click **"Edit"** button
4. Add the following environment variables:

### Required Variables:

| Variable Name | Example Value | Description |
|--------------|---------------|-------------|
| `DATABASE_URL` | `postgresql://user:password@host:5432/dbname?schema=public` | Full PostgreSQL connection string |
| `JWT_SECRET` | `your-secret-key-here` | Secret key for JWT token signing (use a strong random string) |
| `NODE_ENV` | `production` | Environment mode |

### Alternative: Individual Database Variables

If you prefer not to use `DATABASE_URL`, you can set individual variables:

| Variable Name | Example Value | Description |
|--------------|---------------|-------------|
| `DB_HOST` | `your-db-host.amazonaws.com` | Database hostname |
| `DB_PORT` | `5432` | Database port |
| `DB_USER` or `DB_USERNAME` | `postgres` | Database username |
| `DB_PASSWORD` | `your-password` | Database password |
| `DB_NAME` or `DB_DATABASE` | `stocktake` | Database name |
| `DB_SCHEMA` | `public` | Database schema (optional, defaults to 'public') |

5. Click **"Save"** after adding all variables

## Step 6: Configure Lambda Settings

### 6.1 General Configuration

1. Go to **"Configuration"** → **"General configuration"**
2. Click **"Edit"**
3. Configure:
   - **Timeout:** Set to **30 seconds** (or higher if your operations take longer)
   - **Memory:** Set to **512 MB** (minimum) or **1024 MB** (recommended for better performance)
4. Click **"Save"**

### 6.2 No VPC Configuration Needed

Since your RDS database has a **public endpoint** (`wms-postgres-db.cpis084golp7.ap-south-1.rds.amazonaws.com`), you do NOT need to configure VPC settings for this Lambda function.

**Benefits of no VPC:**
- ✅ Faster cold starts (no ENI creation delay)
- ✅ Simpler configuration
- ✅ No NAT Gateway costs
- ✅ Easier troubleshooting

**Database Security Group Configuration:**
Ensure your RDS security group allows inbound traffic on port 5432 from:
- **Source:** `0.0.0.0/0` (for public access) OR
- **Source:** Specific Lambda IP ranges for your region (for better security)

To allow Lambda access, you can also use the security group ID of your Lambda function's execution role, but since Lambda is not in a VPC, the simplest approach is to allow public access with strong authentication (username/password).

## Step 7: Test Your Lambda Function (Before API Gateway)

Before setting up API Gateway, test your Lambda function directly to ensure it's working correctly.

### 7.1 Create Test Event in Lambda Console

1. In your Lambda function page, go to **"Test"** tab
2. Click **"Create new test event"** (or **"Test"** if you already have events)
3. Select **"Create new test event"**
4. Choose **"API Gateway AWS Proxy"** template (or use the JSON below)
5. Name your test event: `health-check`

### 7.2 Simple Health Check Test Event

Use this JSON for a simple health check to test your `/api/ping` endpoint:

```json
{
  "httpMethod": "GET",
  "path": "/api/ping",
  "pathParameters": null,
  "queryStringParameters": null,
  "headers": {
    "Content-Type": "application/json"
  },
  "body": null,
  "isBase64Encoded": false,
  "requestContext": {
    "requestId": "test-request-id",
    "stage": "test",
    "httpMethod": "GET",
    "path": "/api/ping",
    "protocol": "HTTP/1.1",
    "requestTime": "09/Apr/2015:12:34:56 +0000",
    "requestTimeEpoch": 1428582896000,
    "accountId": "123456789012",
    "apiId": "1234567890",
    "identity": {
      "sourceIp": "127.0.0.1",
      "userAgent": "Custom User Agent String"
    }
  }
}
```

### 7.3 Run the Test

1. Select your test event from the dropdown (e.g., `health-check`)
2. Click **"Test"** button
3. Wait for execution to complete
4. Check the **"Execution result"** section:
   - **Status:** Should be "Succeeded"
   - **Response:** Should show status code 200 and JSON body with `{"message":"pong"}`
   - **Logs:** Check for any errors in CloudWatch logs

### 7.4 Expected Response

If successful, you should see:

```json
{
  "statusCode": 200,
  "headers": {
    "content-type": "application/json"
  },
  "body": "{\"message\":\"pong\"}"
}
```

### 7.5 Troubleshooting Test Failures

**If test fails:**

1. **Check Execution Result:**
   - Look at the error message
   - Check the stack trace

2. **Check CloudWatch Logs:**
   - Go to **"Monitor"** tab → **"View CloudWatch logs"**
   - Look for error messages

3. **Common Issues:**
   - **"exports is not defined in ES module scope"** → The TypeScript config was compiling to CommonJS but package.json has `"type": "module"`. Fix: Update `tsconfig.lambda.json` to use `"module": "ES2020"` instead of `"module": "commonjs"`, then rebuild the package.
   - **"Cannot find module"** → Check that all dependencies are in the package
   - **"Database connection error"** → Verify environment variables are set correctly
   - **"Handler not found"** → Verify handler is set to `dist/lambda.handler`
   - **"Timeout"** → Increase Lambda timeout in configuration

4. **Verify Environment Variables:**
   - Go to **"Configuration"** → **"Environment variables"**
   - Ensure all required variables are set

### 7.6 Success Indicators

✅ **Test is successful if:**
- Execution result shows "Succeeded"
- Response status code is 200
- Response body contains `{"message":"pong"}` for ping endpoint
- No errors in CloudWatch logs

Once your Lambda function tests successfully, proceed to set up API Gateway.

## Step 8: Set Up API Gateway (To Expose HTTP Endpoints)

### 8.1 Create API Gateway

1. Go to **API Gateway** service in AWS Console
2. Click **"Create API"**
3. Choose **"REST API"** (not Private or HTTP API) → **"Build"**
4. Configure:
   - **Protocol:** REST
   - **Create new API:** New API
   - **API name:** `stocktake-api`
   - **Description:** `StockTake Backend API`
   - **Endpoint Type:** Regional (recommended) or Edge (for global distribution)
5. Click **"Create API"**

### 8.2 Create Root Proxy Resource

This allows your Lambda to handle all API routes (`/api/*`):

1. In your API Gateway console, select your API (`stocktake-api`)
2. Click **"Actions"** → **"Create Resource"**
3. Configure:
   - **Configure as proxy resource:** ✅ Check this box
   - **Resource Name:** Will auto-fill as `proxy`
   - **Resource Path:** Will auto-fill as `{proxy+}`
   - **Enable API Gateway CORS:** ✅ Check this box (if your frontend is on a different domain)
4. Click **"Create Resource"**

### 8.3 Configure ANY Method

1. With the `{proxy+}` resource selected, click **"Actions"** → **"Create Method"**
2. Select **"ANY"** from the dropdown and click the checkmark ✅
3. Configure the integration:
   - **Integration type:** Lambda Function
   - **Use Lambda Proxy integration:** ✅ Check this box (IMPORTANT!)
   - **Lambda Region:** Select your region (e.g., `ap-south-1`)
   - **Lambda Function:** Type `stocktake-backend` (it should autocomplete)
4. Click **"Save"**
5. A popup will appear asking for permission: **"Add Permission to Lambda Function"**
   - Click **"OK"** to allow API Gateway to invoke your Lambda

### 8.4 Create Root Method (Optional but Recommended)

To handle requests to the root path (`/`):

1. Click on the root resource (`/`) in the resource tree
2. Click **"Actions"** → **"Create Method"**
3. Select **"ANY"** from dropdown and click checkmark ✅
4. Configure the same way as above:
   - **Integration type:** Lambda Function
   - **Use Lambda Proxy integration:** ✅ Check this box
   - **Lambda Function:** `stocktake-backend`
5. Click **"Save"** and **"OK"** on the permission popup

### 8.5 Deploy API

1. Click **"Actions"** → **"Deploy API"**
2. Configure:
   - **Deployment stage:** `[New Stage]`
   - **Stage name:** `prod` (or `dev` for development)
   - **Stage description:** `Production deployment`
   - **Deployment description:** `Initial deployment`
3. Click **"Deploy"**

### 8.6 Get Your API Endpoint URL

1. After deployment, you'll be taken to the **Stages** section
2. Click on your stage (e.g., `prod`)
3. At the top, you'll see **"Invoke URL"** - this is your API endpoint
   - Example: `https://abc123xyz.execute-api.ap-south-1.amazonaws.com/prod`
4. **Copy this URL** - you'll use it in your frontend

### 8.7 Test Your API

Test your deployed API using the invoke URL:

**Test the ping endpoint:**
```
https://your-api-id.execute-api.ap-south-1.amazonaws.com/prod/api/ping
```

You should get: `{"message":"pong"}`

**Test login endpoint:**
```bash
curl -X POST https://your-api-id.execute-api.ap-south-1.amazonaws.com/prod/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your-username","password":"your-password"}'
```

## Step 9: Update Frontend API URL

Update your frontend to use the API Gateway URL instead of localhost:

1. Open your frontend configuration file (e.g., `.env` or API config file)
2. Update the API URL to your API Gateway endpoint:
   ```
   VITE_API_URL=https://your-api-id.execute-api.ap-south-1.amazonaws.com/prod
   ```
3. Rebuild and redeploy your frontend

## Step 10: Monitor and Troubleshoot

### 10.1 View Logs

1. In Lambda function, go to **"Monitor"** tab
2. Click **"View CloudWatch logs"**
3. Check for any errors or warnings

### 10.2 Common Issues

**Issue: "Cannot find module"**
- Solution: Ensure all dependencies are in `node_modules` folder
- Check that Prisma Client was generated

**Issue: "Handler not found"**
- Solution: Verify handler is set to `dist/lambda.handler`
- Check that `dist/lambda.js` exists in your zip

**Issue: "Database connection timeout"**
- Solution: Verify database credentials in environment variables
- Check that RDS security group allows inbound traffic on port 5432 from 0.0.0.0/0
- Ensure `DATABASE_URL` is correctly formatted
- Test database connection from another public source to verify it's accessible

**Issue: "Module initialization error"**
- Solution: Check CloudWatch logs for specific error
- Verify all environment variables are set correctly
- Ensure Prisma schema is included in package

## Step 11: Set Up CORS (If Needed)

If your frontend is on a different domain:

1. In API Gateway, go to **"Actions"** → **"Enable CORS"**
2. Configure allowed origins, methods, and headers
3. Click **"Enable CORS"** and **"Deploy API"**

Or handle CORS in your Lambda code (which you already do with `cors()` middleware).

Or handle CORS in your Lambda code (which you already do with `cors()` middleware).

## Step 12: Set Up Custom Domain (Optional)

1. Go to API Gateway → **"Custom domain names"**
2. Click **"Create"**
3. Enter your domain name
4. Configure SSL certificate
5. Map to your API stage
6. Update DNS records as instructed

## Important Notes

### Package Size Limit
- Lambda deployment package limit: **50 MB** (zipped)
- If your package exceeds 50 MB, use Lambda Layers or upload to S3 first

### Cold Starts
- First request after idle period may be slower (cold start)
- Consider using Provisioned Concurrency for production

### Database Connections
- Use connection pooling (Prisma handles this)
- Consider RDS Proxy for better connection management

### Security
- Never commit `.env` files with secrets
- Use AWS Secrets Manager for sensitive data
- Rotate JWT secrets regularly
- Use IAM roles with least privilege

## Next Steps

1. Set up CI/CD pipeline for automated deployments
2. Configure CloudWatch alarms for monitoring
3. Set up API Gateway throttling and rate limiting
4. Configure custom domain and SSL
5. Set up staging and production environments

## Support

If you encounter issues:
1. Check CloudWatch logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test the Lambda function directly before testing through API Gateway
4. Ensure your database is accessible from Lambda's network

---

**Your deployment package is ready at:** `D:\StockTake module\backend\backend-lambda.zip`

**Lambda Handler:** `dist/lambda.handler`

**Runtime:** Node.js 20.x (or 18.x)

Good luck with your deployment! 🚀

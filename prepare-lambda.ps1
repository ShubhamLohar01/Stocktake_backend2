# PowerShell script to prepare Lambda deployment package
# This copies all necessary files to lambda-zip-file folder

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  StockTake Lambda Package Builder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$BackendDir = $PSScriptRoot
$LambdaZipDir = Join-Path $BackendDir "lambda-zip-file"

# Create lambda-zip-file directory if it doesn't exist
if (-not (Test-Path $LambdaZipDir)) {
    New-Item -ItemType Directory -Path $LambdaZipDir -Force | Out-Null
    Write-Host "[+] Created lambda-zip-file directory" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 1: Copying source code files..." -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray

# Copy JavaScript/TypeScript source files
$SourceFiles = @(
    "index.ts"
)

foreach ($file in $SourceFiles) {
    $sourcePath = Join-Path $BackendDir $file
    $destPath = Join-Path $LambdaZipDir $file
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $destPath -Force
        Write-Host "  ✓ Copied: $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Missing: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Step 2: Copying directories..." -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray

# Copy necessary directories
$Directories = @(
    "routes",
    "middleware",
    "services",
    "utils",
    "shared",
    "prisma"
)

foreach ($dir in $Directories) {
    $sourcePath = Join-Path $BackendDir $dir
    $destPath = Join-Path $LambdaZipDir $dir
    
    if (Test-Path $sourcePath) {
        # Remove existing directory if it exists
        if (Test-Path $destPath) {
            Remove-Item -Path $destPath -Recurse -Force
        }
        
        # Copy directory
        Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
        $fileCount = (Get-ChildItem -Path $destPath -Recurse -File).Count
        Write-Host "  ✓ Copied: $dir ($fileCount files)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Missing: $dir" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Step 3: Installing Linux-compatible dependencies..." -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray
Write-Host "  This will install npm packages with --platform=linux --arch=x64" -ForegroundColor Gray
Write-Host ""

# Change to lambda-zip-file directory
Push-Location $LambdaZipDir

# Remove existing node_modules if present
if (Test-Path "node_modules") {
    Write-Host "  Removing existing node_modules..." -ForegroundColor Gray
    Remove-Item -Path "node_modules" -Recurse -Force
}

# Install dependencies for Linux x64 (Lambda environment)
Write-Host "  Installing dependencies (this may take a few minutes)..." -ForegroundColor Cyan
try {
    # Install dependencies with Linux platform
    npm install --production --platform=linux --arch=x64 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Dependencies installed successfully" -ForegroundColor Green
        
        # Count installed packages
        $packageCount = (Get-ChildItem -Path "node_modules" -Directory).Count
        Write-Host "  ✓ Installed $packageCount packages" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Warning: npm install completed with warnings" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ✗ Error installing dependencies: $_" -ForegroundColor Red
}

Pop-Location

Write-Host ""
Write-Host "Step 4: Generating Prisma Client..." -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray

Push-Location $LambdaZipDir

try {
    # Generate Prisma Client for Linux
    npx prisma generate 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Prisma Client generated successfully" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Warning: Prisma generate completed with warnings" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ✗ Error generating Prisma Client: $_" -ForegroundColor Red
}

Pop-Location

Write-Host ""
Write-Host "Step 5: Creating deployment instructions..." -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray

# Create README with deployment instructions
$readmeContent = @"
# StockTake Lambda Deployment Package

This folder contains all files needed for AWS Lambda deployment.

## Files Included:
- lambda.js - Lambda handler (entry point)
- index.ts - Express server code
- package.json - Dependencies configuration
- routes/ - API route handlers
- middleware/ - Authentication and middleware
- services/ - Business logic services
- utils/ - Utility functions
- shared/ - Shared types and utilities
- prisma/ - Database schema and client
- node_modules/ - Linux-compatible dependencies

## Deployment Steps:

### 1. Configure Environment Variables
Before deployment, create a .env file or configure Lambda environment variables:
- DB_HOST - Your RDS PostgreSQL host
- DB_USER - Database username
- DB_PASSWORD - Database password
- DB_NAME - Database name
- DB_SCHEMA - Database schema (usually 'public')
- JWT_SECRET - Your JWT secret key
- NODE_ENV - Set to 'production'

### 2. Create ZIP file
**On Windows (PowerShell):**
``````powershell
Compress-Archive -Path * -DestinationPath ..\stocktake-lambda.zip -Force
``````

**On Linux/Mac:**
``````bash
zip -r ../stocktake-lambda.zip .
``````

### 3. Upload to AWS Lambda
1. Go to AWS Lambda Console
2. Create a new function or update existing one
3. Runtime: Node.js 18.x or higher
4. Upload the ZIP file (stocktake-lambda.zip)
5. Set Handler to: lambda.handler
6. Configure environment variables
7. Increase timeout to at least 30 seconds
8. Increase memory to at least 512 MB (1024 MB recommended)

### 4. Configure API Gateway
1. Create HTTP API or REST API
2. Add Lambda integration
3. Configure routes with ANY method and path: /{proxy+}
4. Enable CORS if needed

### 5. Database Setup
Ensure your RDS PostgreSQL database:
- Is accessible from Lambda (check VPC and Security Groups)
- Has the required tables (run migrations)
- Has proper user permissions

## Important Notes:
- Lambda timeout: Set to 30 seconds minimum (300 seconds for large operations)
- Memory: 1024 MB recommended for Excel generation
- VPC: If your RDS is in a VPC, Lambda must be in the same VPC
- Environment Variables: Never commit .env file - use Lambda environment variables

## Testing:
After deployment, test the endpoint:
``````
GET https://your-api-id.execute-api.region.amazonaws.com/api/ping
``````

Should return: {"message": "pong"}
"@

$readmePath = Join-Path $LambdaZipDir "DEPLOYMENT-README.md"
Set-Content -Path $readmePath -Value $readmeContent -Force
Write-Host "  ✓ Created DEPLOYMENT-README.md" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Package Preparation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Configure .env file in lambda-zip-file folder" -ForegroundColor White
Write-Host "  2. Navigate to lambda-zip-file directory:" -ForegroundColor White
Write-Host "     cd lambda-zip-file" -ForegroundColor Gray
Write-Host "  3. Create ZIP file:" -ForegroundColor White
Write-Host "     Compress-Archive -Path * -DestinationPath ..\stocktake-lambda.zip -Force" -ForegroundColor Gray
Write-Host "  4. Upload stocktake-lambda.zip to AWS Lambda" -ForegroundColor White
Write-Host ""
Write-Host "See DEPLOYMENT-README.md in lambda-zip-file for detailed instructions" -ForegroundColor Cyan
Write-Host ""

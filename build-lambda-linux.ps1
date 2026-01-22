# PowerShell script to build Lambda deployment package with Linux support
# This creates a complete zip file ready for AWS Lambda deployment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Lambda Package Builder (Linux Support)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$BackendDir = $PSScriptRoot
$BuildDir = Join-Path $BackendDir "lambda-build"
$ZipFile = Join-Path $BackendDir "stocktake-lambda-linux.zip"

# Clean up previous builds
Write-Host "Step 1: Cleaning up previous builds..." -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray
if (Test-Path $BuildDir) {
    Remove-Item -Path $BuildDir -Recurse -Force
    Write-Host "  [OK] Removed previous build directory" -ForegroundColor Green
}
if (Test-Path $ZipFile) {
    Remove-Item -Path $ZipFile -Force
    Write-Host "  [OK] Removed previous zip file" -ForegroundColor Green
}

# Create build directory
New-Item -ItemType Directory -Path $BuildDir -Force | Out-Null
Write-Host "  [OK] Created build directory" -ForegroundColor Green

# Step 2: Copy source files
Write-Host ""
Write-Host "Step 2: Copying source files..." -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray

$FilesToCopy = @(
    "index.ts",
    "lambda.ts"
)

foreach ($file in $FilesToCopy) {
    $sourcePath = Join-Path $BackendDir $file
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $BuildDir -Force
        Write-Host "  [OK] Copied: $file" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] Missing: $file" -ForegroundColor Red
    }
}

# Step 3: Copy directories
Write-Host ""
Write-Host "Step 3: Copying directories..." -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray

$DirsToCopy = @(
    "routes",
    "middleware",
    "services",
    "utils",
    "shared",
    "prisma"
)

foreach ($dir in $DirsToCopy) {
    $sourcePath = Join-Path $BackendDir $dir
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $BuildDir -Recurse -Force
        $fileCount = (Get-ChildItem -Path (Join-Path $BuildDir $dir) -Recurse -File).Count
        Write-Host "  [OK] Copied: $dir ($fileCount files)" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Skipped: $dir (not found)" -ForegroundColor Yellow
    }
}

# Step 4: Create package.json for Lambda
Write-Host ""
Write-Host "Step 4: Creating Lambda package.json..." -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray

$lambdaPackageJson = @{
    name = "stocktake-lambda"
    version = "1.0.0"
    type = "module"
    main = "lambda.js"
    dependencies = @{
        "@prisma/client" = "^5.20.0"
        "bcryptjs" = "^3.0.3"
        "cors" = "^2.8.5"
        "dotenv" = "^17.2.1"
        "exceljs" = "^4.4.0"
        "express" = "^5.1.0"
        "jsonwebtoken" = "^9.0.3"
        "multer" = "^2.0.2"
        "serverless-http" = "^3.2.0"
        "zod" = "^3.25.76"
    }
    engines = @{
        node = ">=18.0.0"
    }
}

$packageJsonPath = Join-Path $BuildDir "package.json"
$lambdaPackageJson | ConvertTo-Json -Depth 10 | Set-Content -Path $packageJsonPath
Write-Host "  [OK] package.json created" -ForegroundColor Green

# Step 5: Install Linux-compatible dependencies using Docker or npm
Write-Host ""
Write-Host "Step 5: Installing Linux-compatible dependencies..." -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray

Push-Location $BuildDir

# Check if Docker is available for truly Linux-compatible builds
$dockerAvailable = $false
try {
    docker --version | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $dockerAvailable = $true
        Write-Host "  [INFO] Docker detected - using Docker for Linux-compatible build" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  [INFO] Docker not available - using npm with platform flags" -ForegroundColor Yellow
}

if ($dockerAvailable) {
    # Use Docker to install dependencies in Linux environment
    Write-Host "  Installing dependencies in Linux container..." -ForegroundColor Cyan
    
    try {
        docker run --rm -v "${BuildDir}:/build" -w /build node:18-alpine sh -c "npm install --omit=dev --legacy-peer-deps"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] Dependencies installed successfully (Linux-compatible)" -ForegroundColor Green
        } else {
            Write-Host "  [WARN] Docker install had warnings, trying npm fallback..." -ForegroundColor Yellow
            $dockerAvailable = $false
        }
    } catch {
        Write-Host "  [WARN] Docker install failed, falling back to npm..." -ForegroundColor Yellow
        $dockerAvailable = $false
    }
}

if (-not $dockerAvailable) {
    # Fallback: Use npm with platform flags
    Write-Host "  Installing with npm (platform=linux arch=x64)..." -ForegroundColor Cyan
    
    # Clean any existing node_modules
    if (Test-Path "node_modules") {
        Remove-Item -Path "node_modules" -Recurse -Force
    }
    
    # Install with Linux platform flags
    npm install --omit=dev --legacy-peer-deps --platform=linux --arch=x64
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Installation completed with warnings" -ForegroundColor Yellow
    }
}

# Count installed packages
$packageCount = (Get-ChildItem -Path "node_modules" -Directory -ErrorAction SilentlyContinue).Count
Write-Host "  [OK] Installed $packageCount packages" -ForegroundColor Green

Pop-Location

# Step 6: Generate Prisma Client
Write-Host ""
Write-Host "Step 6: Generating Prisma Client..." -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray

Push-Location $BuildDir

if ($dockerAvailable) {
    # Use Docker for Prisma generation
    Write-Host "  Generating Prisma Client in Linux container..." -ForegroundColor Cyan
    
    try {
        docker run --rm -v "${BuildDir}:/build" -w /build node:18-alpine sh -c "npx prisma generate"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] Prisma Client generated successfully (Linux)" -ForegroundColor Green
        }
    } catch {
        Write-Host "  [WARN] Docker Prisma generation failed" -ForegroundColor Yellow
    }
} else {
    # Fallback: Use local npx
    Write-Host "  Generating Prisma Client locally..." -ForegroundColor Cyan
    npx prisma generate
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Prisma Client generated successfully" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Prisma generation had warnings" -ForegroundColor Yellow
    }
}

Pop-Location

# Step 7: Build TypeScript to JavaScript
Write-Host ""
Write-Host "Step 7: Building TypeScript to JavaScript..." -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray

Push-Location $BuildDir

# Create tsconfig for lambda build
$tsconfigContent = @{
    compilerOptions = @{
        target = "ES2020"
        module = "ES2020"
        lib = @("ES2020")
        outDir = "."
        rootDir = "."
        strict = $true
        esModuleInterop = $true
        skipLibCheck = $true
        forceConsistentCasingInFileNames = $true
        resolveJsonModule = $true
        moduleResolution = "node"
        declaration = $false
        sourceMap = $false
    }
    include = @("*.ts", "**/*.ts")
    exclude = @("node_modules", "**/*.test.ts", "**/*.spec.ts")
}

$tsconfigPath = Join-Path $BuildDir "tsconfig.json"
$tsconfigContent | ConvertTo-Json -Depth 10 | Set-Content -Path $tsconfigPath

# Install TypeScript temporarily
Write-Host "  Installing TypeScript compiler..." -ForegroundColor Cyan
npm install --no-save typescript

# Compile TypeScript
Write-Host "  Compiling TypeScript files..." -ForegroundColor Cyan
npx tsc

if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] TypeScript compiled successfully" -ForegroundColor Green
    
    # Remove TypeScript source files (keep only .js)
    Get-ChildItem -Path $BuildDir -Filter "*.ts" -Recurse | Remove-Item -Force
    Write-Host "  [OK] Removed TypeScript source files" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] TypeScript compilation failed" -ForegroundColor Red
}

# Remove TypeScript from node_modules (production doesn't need it)
if (Test-Path "node_modules\typescript") {
    Remove-Item -Path "node_modules\typescript" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  [OK] Removed TypeScript from node_modules" -ForegroundColor Green
}

# Remove tsconfig.json (not needed in deployment)
if (Test-Path $tsconfigPath) {
    Remove-Item -Path $tsconfigPath -Force
}

Pop-Location

# Step 8: Create .env template
Write-Host ""
Write-Host "Step 8: Creating .env template..." -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray

$envTemplate = @"
# Database Configuration
DATABASE_URL=postgresql://username:password@host:5432/database?schema=public

# Or use individual DB variables
# DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
# DB_PORT=5432
# DB_USER=postgres
# DB_PASSWORD=your-password
# DB_NAME=stocktake
# DB_SCHEMA=public

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Node Environment
NODE_ENV=production
"@

$envPath = Join-Path $BuildDir ".env.template"
$envTemplate | Set-Content -Path $envPath
Write-Host "  [OK] .env template created" -ForegroundColor Green

# Step 9: Create deployment README
Write-Host ""
Write-Host "Step 9: Creating deployment README..." -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray

$readmeContent = @"
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

Built: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Platform: Linux x64 (AWS Lambda compatible)
Node Version: 18+
"@

$readmePath = Join-Path $BuildDir "README.md"
$readmeContent | Set-Content -Path $readmePath
Write-Host "  [OK] README.md created" -ForegroundColor Green

# Step 10: Create ZIP file
Write-Host ""
Write-Host "Step 10: Creating ZIP file..." -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray

Push-Location $BuildDir

try {
    # Create ZIP file from build directory contents
    Compress-Archive -Path * -DestinationPath $ZipFile -CompressionLevel Optimal -Force
    
    # Get file size
    $zipSize = (Get-Item $ZipFile).Length / 1MB
    $zipSizeFormatted = "{0:N2}" -f $zipSize
    
    Write-Host "  [OK] ZIP file created successfully" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host "  [ERROR] Error creating ZIP: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

# Step 11: Display summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "         Build Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ZIP File Details:" -ForegroundColor Yellow
Write-Host "  Location: $ZipFile" -ForegroundColor White
Write-Host "  Size: $zipSizeFormatted MB" -ForegroundColor White
Write-Host ""

if ($zipSize -gt 50) {
    Write-Host "[WARN] Package size exceeds 50 MB" -ForegroundColor Yellow
    Write-Host "  Upload to S3 first, then deploy to Lambda" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Upload to S3:" -ForegroundColor Cyan
    Write-Host "  aws s3 cp stocktake-lambda-linux.zip s3://your-bucket/" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Deploy from S3:" -ForegroundColor Cyan
    Write-Host "  aws lambda update-function-code --function-name stocktake-api \" -ForegroundColor Gray
    Write-Host "    --s3-bucket your-bucket --s3-key stocktake-lambda-linux.zip" -ForegroundColor Gray
} else {
    Write-Host "[OK] Package size is acceptable for direct upload" -ForegroundColor Green
    Write-Host ""
    Write-Host "Deploy with AWS CLI:" -ForegroundColor Cyan
    Write-Host "  aws lambda update-function-code --function-name stocktake-api \" -ForegroundColor Gray
    Write-Host "    --zip-file fileb://stocktake-lambda-linux.zip" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Configure environment variables in Lambda" -ForegroundColor White
Write-Host "  2. Set handler to: lambda.handler" -ForegroundColor White
Write-Host "  3. Upload the ZIP file" -ForegroundColor White
Write-Host "  4. Test the deployment" -ForegroundColor White
Write-Host ""
Write-Host "Build directory: $BuildDir" -ForegroundColor Gray
Write-Host "See README.md in build directory for detailed deployment instructions" -ForegroundColor Gray
Write-Host ""

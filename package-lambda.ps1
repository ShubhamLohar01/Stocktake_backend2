# PowerShell script to package backend for AWS Lambda deployment
# This script creates a zip file with Linux-compatible dependencies

Write-Host "Starting Lambda packaging process..." -ForegroundColor Green

# Configuration
$BackendDir = $PSScriptRoot
$PackageDir = Join-Path $BackendDir "lambda-package"
$ZipFile = Join-Path $BackendDir "backend-lambda.zip"

# Clean up previous builds
Write-Host "Cleaning up previous builds..." -ForegroundColor Yellow
if (Test-Path $PackageDir) {
    Remove-Item -Path $PackageDir -Recurse -Force
}
if (Test-Path $ZipFile) {
    Remove-Item -Path $ZipFile -Force
}

# Create package directory
New-Item -ItemType Directory -Path $PackageDir -Force | Out-Null
Write-Host "Created package directory: $PackageDir" -ForegroundColor Green

# Step 1: Copy source files
Write-Host "`nStep 1: Copying source files..." -ForegroundColor Cyan
$FilesToCopy = @(
    "index.ts",
    "lambda.ts",
    "node-build.ts",
    "package.json",
    "package-lock.json",
    "tsconfig.lambda.json"
)

$DirsToCopy = @(
    "routes",
    "middleware",
    "services",
    "utils",
    "shared",
    "prisma"
)

foreach ($file in $FilesToCopy) {
    $sourcePath = Join-Path $BackendDir $file
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $PackageDir -Force
        Write-Host "  Copied: $file" -ForegroundColor Gray
    }
}

foreach ($dir in $DirsToCopy) {
    $sourcePath = Join-Path $BackendDir $dir
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $PackageDir -Recurse -Force
        Write-Host "  Copied directory: $dir" -ForegroundColor Gray
    }
}

# Step 2: Install production dependencies
Write-Host "`nStep 2: Installing production dependencies..." -ForegroundColor Cyan
Push-Location $PackageDir
try {
    npm ci --production --legacy-peer-deps
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error installing dependencies!" -ForegroundColor Red
        exit 1
    }
    Write-Host "  Dependencies installed successfully" -ForegroundColor Green
} finally {
    Pop-Location
}

# Step 3: Generate Prisma Client
Write-Host "`nStep 3: Generating Prisma Client..." -ForegroundColor Cyan
Push-Location $PackageDir
try {
    # Install prisma CLI temporarily for generation (it's needed to generate the client)
    npm install prisma --no-save --legacy-peer-deps
    npx prisma generate
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error generating Prisma client!" -ForegroundColor Red
        exit 1
    }
    Write-Host "  Prisma Client generated successfully" -ForegroundColor Green
    
    # Clean up: Remove prisma CLI and its dependencies (we only need @prisma/client)
    Write-Host "  Cleaning up Prisma CLI..." -ForegroundColor Gray
    Remove-Item -Path "node_modules\prisma" -Recurse -Force -ErrorAction SilentlyContinue
    # Remove other unnecessary prisma-related packages that were installed
    Get-ChildItem -Path "node_modules" -Directory | Where-Object { 
        $_.Name -like "*prisma*" -and $_.Name -ne "@prisma" 
    } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
} finally {
    Pop-Location
}

# Step 4: Build TypeScript
Write-Host "`nStep 4: Building TypeScript code..." -ForegroundColor Cyan
Push-Location $PackageDir
try {
    # Check if typescript is available
    if (-not (Get-Command tsc -ErrorAction SilentlyContinue)) {
        Write-Host "  Installing TypeScript globally..." -ForegroundColor Yellow
        npm install -g typescript
    }
    
    tsc --project tsconfig.lambda.json
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error building TypeScript!" -ForegroundColor Red
        exit 1
    }
    Write-Host "  TypeScript compiled successfully" -ForegroundColor Green
} finally {
    Pop-Location
}

# Step 5: Clean up unnecessary files
Write-Host "`nStep 5: Cleaning up unnecessary files..." -ForegroundColor Cyan

# Remove TypeScript source files (keep only compiled JS)
Get-ChildItem -Path $PackageDir -Filter "*.ts" -Recurse -Force -ErrorAction SilentlyContinue | 
    Where-Object { $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*dist*" } | 
    Remove-Item -Force -ErrorAction SilentlyContinue

# Remove other unnecessary files
$FilesToRemove = @(
    "tsconfig.lambda.json",
    "pnpm-lock.yaml",
    ".git",
    ".gitignore",
    "*.md",
    "*.bat",
    "*.ps1",
    "node-build.ts"
)

foreach ($pattern in $FilesToRemove) {
    Get-ChildItem -Path $PackageDir -Filter $pattern -Recurse -Force -ErrorAction SilentlyContinue | 
        Where-Object { $_.FullName -notlike "*node_modules*" } | 
        Remove-Item -Force -ErrorAction SilentlyContinue
}

# Remove source directories (keep only dist with compiled JS)
$SourceDirs = @("routes", "middleware", "services", "utils", "shared")
foreach ($dir in $SourceDirs) {
    $dirPath = Join-Path $PackageDir $dir
    if (Test-Path $dirPath) {
        Remove-Item -Path $dirPath -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# Remove the original index.ts and lambda.ts from root (they're in dist now)
$RootFilesToRemove = @("index.ts", "lambda.ts")
foreach ($file in $RootFilesToRemove) {
    $filePath = Join-Path $PackageDir $file
    if (Test-Path $filePath) {
        Remove-Item -Path $filePath -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "  Cleaned up source files" -ForegroundColor Green

# Step 6: Create zip file
Write-Host "`nStep 6: Creating zip file..." -ForegroundColor Cyan
Push-Location $PackageDir
try {
    # Use .NET compression for better compatibility
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory($PackageDir, $ZipFile)
    Write-Host "  Zip file created: $ZipFile" -ForegroundColor Green
} catch {
    Write-Host "  Error creating zip with .NET, trying Compress-Archive..." -ForegroundColor Yellow
    Compress-Archive -Path "$PackageDir\*" -DestinationPath $ZipFile -Force
    Write-Host "  Zip file created: $ZipFile" -ForegroundColor Green
} finally {
    Pop-Location
}

# Get file size
$ZipSize = (Get-Item $ZipFile).Length / 1MB
Write-Host "`nPackage created successfully!" -ForegroundColor Green
Write-Host "  Location: $ZipFile" -ForegroundColor Cyan
Write-Host "  Size: $([math]::Round($ZipSize, 2)) MB" -ForegroundColor Cyan
Write-Host "`nImportant Notes:" -ForegroundColor Yellow
Write-Host "  - Lambda handler: dist/lambda.handler" -ForegroundColor Cyan
Write-Host "  - Runtime: Node.js 18.x or 20.x" -ForegroundColor Cyan
Write-Host "  - For native modules (if any), use Docker for Linux compatibility" -ForegroundColor Yellow
Write-Host "  - Make sure to set environment variables in Lambda configuration" -ForegroundColor Yellow

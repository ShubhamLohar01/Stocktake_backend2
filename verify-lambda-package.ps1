# Script to verify Lambda package structure
# This helps diagnose handler configuration issues

Write-Host "`n=== Lambda Package Verification ===" -ForegroundColor Cyan

$BackendDir = $PSScriptRoot
$ZipFile = Join-Path $BackendDir "backend-lambda.zip"
$PackageDir = Join-Path $BackendDir "lambda-package-verify"

# Check if zip exists
if (-not (Test-Path $ZipFile)) {
    Write-Host "`n❌ ERROR: backend-lambda.zip not found!" -ForegroundColor Red
    Write-Host "   Location expected: $ZipFile" -ForegroundColor Yellow
    Write-Host "`n   Run: .\package-lambda.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n✓ Found zip file: $ZipFile" -ForegroundColor Green

# Extract to temp directory
if (Test-Path $PackageDir) {
    Remove-Item -Path $PackageDir -Recurse -Force
}
New-Item -ItemType Directory -Path $PackageDir -Force | Out-Null

Write-Host "`nExtracting package for verification..." -ForegroundColor Cyan
Expand-Archive -Path $ZipFile -DestinationPath $PackageDir -Force

# Check critical files
Write-Host "`n=== Checking Package Structure ===" -ForegroundColor Cyan

$CriticalFiles = @(
    "dist/lambda.js",
    "dist/index.js",
    "package.json",
    "node_modules",
    "prisma"
)

$AllGood = $true
foreach ($file in $CriticalFiles) {
    $filePath = Join-Path $PackageDir $file
    if (Test-Path $filePath) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ MISSING: $file" -ForegroundColor Red
        $AllGood = $false
    }
}

# Check lambda.js content
$LambdaFile = Join-Path $PackageDir "dist/lambda.js"
if (Test-Path $LambdaFile) {
    Write-Host "`n=== Checking dist/lambda.js ===" -ForegroundColor Cyan
    $content = Get-Content $LambdaFile -Raw
    
    if ($content -match "export\s+(const|function)\s+handler") {
        Write-Host "  ✓ Handler export found (ES module format)" -ForegroundColor Green
    } elseif ($content -match "module\.exports\.handler|exports\.handler") {
        Write-Host "  ✓ Handler export found (CommonJS format)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ WARNING: Handler export not found!" -ForegroundColor Red
        Write-Host "     File should export: export const handler = ..." -ForegroundColor Yellow
        $AllGood = $false
    }
    
    if ($content -match "serverless-http|serverless") {
        Write-Host "  ✓ serverless-http import found" -ForegroundColor Green
    } else {
        Write-Host "  ❌ WARNING: serverless-http not found!" -ForegroundColor Red
        $AllGood = $false
    }
    
    # Show first few lines
    Write-Host "`n  First 10 lines of dist/lambda.js:" -ForegroundColor Gray
    Get-Content $LambdaFile -TotalCount 10 | ForEach-Object {
        Write-Host "    $_" -ForegroundColor Gray
    }
}

# Check package.json
$PackageJsonPath = Join-Path $PackageDir "package.json"
if (Test-Path $PackageJsonPath) {
    Write-Host "`n=== Checking package.json ===" -ForegroundColor Cyan
    $packageJson = Get-Content $PackageJsonPath | ConvertFrom-Json
    
    if ($packageJson.type -eq "module") {
        Write-Host "  ✓ type: 'module' (ES modules)" -ForegroundColor Green
        Write-Host "    Handler should be: dist/lambda.handler" -ForegroundColor Cyan
    } else {
        Write-Host "  ⚠ type not set to 'module'" -ForegroundColor Yellow
        Write-Host "    This might cause issues with ES module imports" -ForegroundColor Yellow
    }
    
    if ($packageJson.main) {
        Write-Host "  main: $($packageJson.main)" -ForegroundColor Gray
    }
}

# List dist directory contents
Write-Host "`n=== Contents of dist/ directory ===" -ForegroundColor Cyan
$DistDir = Join-Path $PackageDir "dist"
if (Test-Path $DistDir) {
    Get-ChildItem -Path $DistDir -File | ForEach-Object {
        Write-Host "  - $($_.Name) ($([math]::Round($_.Length/1KB, 2)) KB)" -ForegroundColor Gray
    }
} else {
    Write-Host "  ❌ dist/ directory not found!" -ForegroundColor Red
    $AllGood = $false
}

# Summary
Write-Host "`n=== Summary ===" -ForegroundColor Cyan
if ($AllGood) {
    Write-Host "✓ Package structure looks correct!" -ForegroundColor Green
    Write-Host "`nHandler Configuration:" -ForegroundColor Yellow
    Write-Host "  Set handler to: dist/lambda.handler" -ForegroundColor Cyan
    Write-Host "  Runtime: Node.js 18.x or 20.x" -ForegroundColor Cyan
} else {
    Write-Host "❌ Package has issues! Please rebuild:" -ForegroundColor Red
    Write-Host "  .\package-lambda.ps1" -ForegroundColor Yellow
}

# Cleanup
Write-Host "`nCleaning up temporary extraction..." -ForegroundColor Gray
Remove-Item -Path $PackageDir -Recurse -Force

Write-Host "`nDone!" -ForegroundColor Green

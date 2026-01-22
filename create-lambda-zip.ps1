# Quick ZIP creation script
# Run this after prepare-lambda.ps1

$BackendDir = $PSScriptRoot
$LambdaZipDir = Join-Path $BackendDir "lambda-zip-file"
$ZipFile = Join-Path $BackendDir "stocktake-lambda.zip"

Write-Host "Creating Lambda deployment ZIP..." -ForegroundColor Cyan

# Remove existing ZIP if present
if (Test-Path $ZipFile) {
    Remove-Item -Path $ZipFile -Force
    Write-Host "  Removed existing ZIP file" -ForegroundColor Gray
}

# Change to lambda-zip-file directory
Push-Location $LambdaZipDir

try {
    # Create ZIP file
    Compress-Archive -Path * -DestinationPath $ZipFile -Force
    
    # Get file size
    $zipSize = (Get-Item $ZipFile).Length / 1MB
    $zipSizeFormatted = "{0:N2}" -f $zipSize
    
    Write-Host "  ✓ ZIP file created successfully" -ForegroundColor Green
    Write-Host "  ✓ File: stocktake-lambda.zip" -ForegroundColor Green
    Write-Host "  ✓ Size: $zipSizeFormatted MB" -ForegroundColor Green
    Write-Host ""
    Write-Host "ZIP file location:" -ForegroundColor Yellow
    Write-Host "  $ZipFile" -ForegroundColor White
    Write-Host ""
    
    if ($zipSize -gt 50) {
        Write-Host "⚠ Warning: ZIP file is larger than 50 MB" -ForegroundColor Yellow
        Write-Host "  You may need to upload to S3 first, then deploy to Lambda" -ForegroundColor Yellow
    } else {
        Write-Host "✓ File size is acceptable for direct Lambda upload" -ForegroundColor Green
    }
    
} catch {
    Write-Host "  ✗ Error creating ZIP: $_" -ForegroundColor Red
} finally {
    Pop-Location
}

Write-Host ""

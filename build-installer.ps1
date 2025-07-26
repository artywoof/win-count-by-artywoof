# Win Count by ArtYWoof Installer Builder
# PowerShell Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Building Win Count by ArtYWoof Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host ""

# Step 1: Build Tauri application
Write-Host "Step 1: Building Tauri application..." -ForegroundColor Yellow
try {
    bun run tauri build
    if ($LASTEXITCODE -ne 0) {
        throw "Tauri build failed with exit code $LASTEXITCODE"
    }
    Write-Host "✅ Tauri build completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Tauri build failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Step 2: Check if NSIS is installed
$nsisPath = "C:\Program Files (x86)\NSIS\makensis.exe"
if (-not (Test-Path $nsisPath)) {
    Write-Host "❌ Error: NSIS not found at $nsisPath" -ForegroundColor Red
    Write-Host "Please install NSIS from: https://nsis.sourceforge.io/Download" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 3: Create installer
Write-Host "Step 2: Creating installer..." -ForegroundColor Yellow
try {
    & $nsisPath installer.nsi
    if ($LASTEXITCODE -ne 0) {
        throw "Installer creation failed with exit code $LASTEXITCODE"
    }
    Write-Host "✅ Installer created successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Installer creation failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎉 Installer created successfully!" -ForegroundColor Green
Write-Host "File: Win_Count_by_ArtYWoof_Setup.exe" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan

Read-Host "Press Enter to exit" 
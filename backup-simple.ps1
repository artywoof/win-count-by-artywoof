# Win Count Application - Simple Backup Script
Write-Host "Starting Complete Win Count Application Backup..." -ForegroundColor Green

# Create backup directory
$BackupDir = "backup-complete-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
Write-Host "Created backup directory: $BackupDir" -ForegroundColor Yellow

# Copy core files
Write-Host "Backing up core application files..." -ForegroundColor Cyan
Copy-Item -Path "src" -Destination $BackupDir -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path "src-tauri" -Destination $BackupDir -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path "overlay-bridge" -Destination $BackupDir -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path "static" -Destination $BackupDir -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path "public" -Destination $BackupDir -Recurse -Force -ErrorAction SilentlyContinue

# Copy configuration files
Write-Host "Backing up configuration files..." -ForegroundColor Cyan
$ConfigFiles = @("package.json", "package-lock.json", "bun.lock", "vite.config.js", "svelte.config.js", "tailwind.config.js", "tsconfig.json", "postcss.config.js", "playwright.config.ts", "global.d.ts", "index.ts", ".gitignore", ".gitattributes", "README.md")
foreach ($file in $ConfigFiles) {
    if (Test-Path $file) {
        Copy-Item -Path $file -Destination $BackupDir -Force
    }
}

# Copy development scripts
Write-Host "Backing up development scripts..." -ForegroundColor Cyan
$ScriptFiles = @("start-dev.bat", "start-dev.sh", "backup-script.sh", "backup-script.ps1", "backup-complete-final.sh", "backup-complete-final.ps1")
foreach ($file in $ScriptFiles) {
    if (Test-Path $file) {
        Copy-Item -Path $file -Destination $BackupDir -Force
    }
}

# Copy other important directories
Write-Host "Backing up other important files..." -ForegroundColor Cyan
if (Test-Path ".vscode") { Copy-Item -Path ".vscode" -Destination $BackupDir -Recurse -Force }
if (Test-Path "tests") { Copy-Item -Path "tests" -Destination $BackupDir -Recurse -Force }
if (Test-Path "test-results") { Copy-Item -Path "test-results" -Destination $BackupDir -Recurse -Force }
if (Test-Path "presets") { Copy-Item -Path "presets" -Destination $BackupDir -Recurse -Force }
if (Test-Path "logs") { Copy-Item -Path "logs" -Destination $BackupDir -Recurse -Force }

# Copy documentation and backup files
Get-ChildItem -Path "." -Filter "*.md" | Copy-Item -Destination $BackupDir -Force
Get-ChildItem -Path "." -Filter "BACKUP_*" | Copy-Item -Destination $BackupDir -Force
Get-ChildItem -Path "." -Filter "test-*" | Copy-Item -Destination $BackupDir -Force

# Copy assets
$AssetFiles = @("APP.png", "launch.json", "cyberpunk-examples.svelte")
foreach ($file in $AssetFiles) {
    if (Test-Path $file) {
        Copy-Item -Path $file -Destination $BackupDir -Force
    }
}

# Create backup info file
Write-Host "Creating backup information file..." -ForegroundColor Cyan
$BackupInfo = "# Win Count Application - Complete Backup`n`n"
$BackupInfo += "Backup Date: $(Get-Date)`n"
$BackupInfo += "Backup Directory: $BackupDir`n`n"
$BackupInfo += "## Contents:`n"
$BackupInfo += "- Core Application (src/, src-tauri/, overlay-bridge/)`n"
$BackupInfo += "- Static Assets (static/, public/)`n"
$BackupInfo += "- Configuration Files`n"
$BackupInfo += "- Development Scripts`n"
$BackupInfo += "- Documentation`n"
$BackupInfo += "- Previous Backups`n`n"
$BackupInfo += "## Current State:`n"
$BackupInfo += "- Application is working perfectly`n"
$BackupInfo += "- Overlay positioning optimized`n"
$BackupInfo += "- Crown icon locked at -16px offset`n"
$BackupInfo += "- Dynamic container width based on character count`n"
$BackupInfo += "- All hotkeys functioning correctly`n"

$BackupInfo | Out-File -FilePath "$BackupDir\BACKUP_INFO.md" -Encoding UTF8

# Create compressed backup
Write-Host "Creating compressed backup..." -ForegroundColor Cyan
Compress-Archive -Path $BackupDir -DestinationPath "$BackupDir.zip" -Force

Write-Host "Backup completed successfully!" -ForegroundColor Green
Write-Host "Backup location: $BackupDir/" -ForegroundColor Yellow
Write-Host "Compressed backup: $BackupDir.zip" -ForegroundColor Yellow
Write-Host "Keep this backup safe!" -ForegroundColor Magenta 
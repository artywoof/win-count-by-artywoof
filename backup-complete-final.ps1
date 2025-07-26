# Win Count Application - Complete Backup Script (PowerShell)
# This script creates a full backup of the entire application
# Date: $(Get-Date -Format "yyyy-MM-dd_HH-mm-ss")

Write-Host "🔄 Starting Complete Win Count Application Backup..." -ForegroundColor Green

# Create backup directory with timestamp
$BackupDir = "backup-complete-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

Write-Host "📁 Creating backup directory: $BackupDir" -ForegroundColor Yellow

# Core Application Files
Write-Host "📦 Backing up core application files..." -ForegroundColor Cyan
Copy-Item -Path "src" -Destination $BackupDir -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path "src-tauri" -Destination $BackupDir -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path "overlay-bridge" -Destination $BackupDir -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path "static" -Destination $BackupDir -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path "public" -Destination $BackupDir -Recurse -Force -ErrorAction SilentlyContinue

# Configuration Files
Write-Host "⚙️ Backing up configuration files..." -ForegroundColor Cyan
$ConfigFiles = @(
    "package.json", "package-lock.json", "bun.lock", "vite.config.js",
    "svelte.config.js", "tailwind.config.js", "tsconfig.json", "postcss.config.js",
    "playwright.config.ts", "global.d.ts", "index.ts", ".gitignore", 
    ".gitattributes", "README.md"
)

foreach ($file in $ConfigFiles) {
    if (Test-Path $file) {
        Copy-Item -Path $file -Destination $BackupDir -Force
    }
}

# Development Scripts
Write-Host "🛠️ Backing up development scripts..." -ForegroundColor Cyan
$ScriptFiles = @("start-dev.bat", "start-dev.sh", "backup-script.sh", "backup-script.ps1")
foreach ($file in $ScriptFiles) {
    if (Test-Path $file) {
        Copy-Item -Path $file -Destination $BackupDir -Force
    }
}

# VS Code Settings
Write-Host "🔧 Backing up VS Code settings..." -ForegroundColor Cyan
if (Test-Path ".vscode") {
    Copy-Item -Path ".vscode" -Destination $BackupDir -Recurse -Force
}

# Test Files
Write-Host "🧪 Backing up test files..." -ForegroundColor Cyan
if (Test-Path "tests") {
    Copy-Item -Path "tests" -Destination $BackupDir -Recurse -Force
}
if (Test-Path "test-results") {
    Copy-Item -Path "test-results" -Destination $BackupDir -Recurse -Force
}
Get-ChildItem -Path "." -Filter "test-*" | Copy-Item -Destination $BackupDir -Force

# Backup Files (Previous backups)
Write-Host "💾 Backing up previous backup files..." -ForegroundColor Cyan
Get-ChildItem -Path "." -Filter "BACKUP_*" | Copy-Item -Destination $BackupDir -Force

# Documentation Files
Write-Host "📚 Backing up documentation..." -ForegroundColor Cyan
Get-ChildItem -Path "." -Filter "*.md" | Copy-Item -Destination $BackupDir -Force

# Presets and Configuration
Write-Host "🎨 Backing up presets and configurations..." -ForegroundColor Cyan
$PresetDirs = @("presets", "for_you", "for you")
foreach ($dir in $PresetDirs) {
    if (Test-Path $dir) {
        Copy-Item -Path $dir -Destination $BackupDir -Recurse -Force
    }
}

# Log Files
Write-Host "📋 Backing up log files..." -ForegroundColor Cyan
if (Test-Path "logs") {
    Copy-Item -Path "logs" -Destination $BackupDir -Recurse -Force
}

# Application Assets
Write-Host "🖼️ Backing up application assets..." -ForegroundColor Cyan
$AssetFiles = @("APP.png", "launch.json", "cyberpunk-examples.svelte")
foreach ($file in $AssetFiles) {
    if (Test-Path $file) {
        Copy-Item -Path $file -Destination $BackupDir -Force
    }
}

# Create backup info file
Write-Host "📝 Creating backup information file..." -ForegroundColor Cyan
$BackupInfo = @"
# Win Count Application - Complete Backup

**Backup Date:** $(Get-Date)
**Backup Directory:** $BackupDir

## Contents:
- Core Application (src/, src-tauri/, overlay-bridge/)
- Static Assets (static/, public/)
- Configuration Files (package.json, vite.config.js, etc.)
- Development Scripts (start-dev.*, backup-script.*)
- VS Code Settings (.vscode/)
- Test Files (tests/, test-results/)
- Documentation (*.md files)
- Previous Backups (BACKUP_*.*)
- Presets and Configurations
- Log Files
- Application Assets

## Restore Instructions:
1. Extract/copy all files from this backup directory
2. Run: `npm install` or `bun install`
3. Run: `npm run tauri dev` or `bun run tauri dev`
4. Test all functionality:
   - Main application hotkeys
   - Overlay display
   - Settings persistence
   - Auto-updater

## Critical Files:
- `src/routes/+page.svelte` - Main application UI
- `src/routes/overlay/+page.svelte` - Overlay display
- `src-tauri/src/main.rs` - Tauri backend
- `overlay-bridge/server.js` - WebSocket bridge
- `src/lib/hotkeyManager.ts` - Hotkey management
- `src/lib/autoUpdater.ts` - Auto-update functionality

## Current State:
- Application is working perfectly
- Overlay positioning and sizing optimized
- Crown icon locked at -16px offset
- Dynamic container width based on character count
- All hotkeys functioning correctly
- Auto-repeat and key release working properly

"@

$BackupInfo | Out-File -FilePath "$BackupDir/BACKUP_INFO.md" -Encoding UTF8

# Create compressed backup
Write-Host "🗜️ Creating compressed backup..." -ForegroundColor Cyan
Compress-Archive -Path $BackupDir -DestinationPath "$BackupDir.zip" -Force

Write-Host "✅ Backup completed successfully!" -ForegroundColor Green
Write-Host "📦 Backup location: $BackupDir/" -ForegroundColor Yellow
Write-Host "🗜️ Compressed backup: $BackupDir.zip" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔄 To restore from backup:" -ForegroundColor Cyan
Write-Host "1. Extract: Expand-Archive $BackupDir.zip" -ForegroundColor White
Write-Host "2. Copy files to your project directory" -ForegroundColor White
Write-Host "3. Run: npm install && npm run tauri dev" -ForegroundColor White
Write-Host ""
Write-Host "💡 Keep this backup safe! It contains your complete working application." -ForegroundColor Magenta 
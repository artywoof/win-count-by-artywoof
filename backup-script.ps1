# Win Count Backup Script
# สคริปต์สำหรับสำรองไฟล์ที่สำคัญของโปรเจ็กต์

param(
    [string]$BackupPath = ".\backups",
    [switch]$IncludeNodeModules = $false
)

# สร้าง timestamp สำหรับชื่อ backup
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupName = "backup-$timestamp"
$fullBackupPath = Join-Path $BackupPath $backupName

Write-Host "กำลังสร้าง backup: $backupName" -ForegroundColor Green

# สร้างโฟลเดอร์ backup
New-Item -ItemType Directory -Force -Path $fullBackupPath | Out-Null

# รายการไฟล์และโฟลเดอร์ที่สำคัญ
$importantItems = @(
    "package.json",
    "bun.lock",
    "tsconfig.json",
    "svelte.config.js",
    "vite.config.js",
    "vite.config.ts",
    "tailwind.config.js",
    "postcss.config.js",
    "playwright.config.ts",
    "global.d.ts",
    "src",
    "static",
    "src-tauri",
    "ai-sync-api",
    "tests",
    "README.md",
    "launch.json",
    "presets",
    "index.ts",
    "project-scan.ts"
)

# Optional: รวม node_modules ถ้าระบุ
if ($IncludeNodeModules) {
    $importantItems += "node_modules"
}

# Copy ไฟล์และโฟลเดอร์ที่สำคัญ
foreach ($item in $importantItems) {
    if (Test-Path $item) {
        $destination = Join-Path $fullBackupPath $item
        
        if (Test-Path $item -PathType Container) {
            Write-Host "กำลัง copy โฟลเดอร์: $item" -ForegroundColor Yellow
            Copy-Item -Path $item -Destination $destination -Recurse -Force
        } else {
            Write-Host "กำลัง copy ไฟล์: $item" -ForegroundColor Yellow
            $destinationDir = Split-Path $destination -Parent
            if (-not (Test-Path $destinationDir)) {
                New-Item -ItemType Directory -Force -Path $destinationDir | Out-Null
            }
            Copy-Item -Path $item -Destination $destination -Force
        }
    } else {
        Write-Host "ไม่พบไฟล์: $item" -ForegroundColor Red
    }
}

# สร้างไฟล์ backup info
$backupInfo = @{
    "backup_date" = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "backup_name" = $backupName
    "project_name" = "win-count-by-artywoof"
    "items_backed_up" = $importantItems
    "include_node_modules" = $IncludeNodeModules
    "total_size_mb" = [math]::Round((Get-ChildItem $fullBackupPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
}

$backupInfo | ConvertTo-Json -Depth 3 | Out-File -FilePath (Join-Path $fullBackupPath "backup-info.json") -Encoding UTF8

Write-Host ""
Write-Host "✅ Backup เสร็จสิ้น!" -ForegroundColor Green
Write-Host "📁 ตำแหน่ง: $fullBackupPath" -ForegroundColor Cyan
Write-Host "📊 ขนาด: $($backupInfo.total_size_mb) MB" -ForegroundColor Cyan
Write-Host "📅 วันที่: $($backupInfo.backup_date)" -ForegroundColor Cyan

# สร้าง ZIP file
$zipPath = "$fullBackupPath.zip"
Write-Host "กำลังสร้างไฟล์ ZIP..." -ForegroundColor Yellow
Compress-Archive -Path $fullBackupPath -DestinationPath $zipPath -Force
Write-Host "✅ สร้าง ZIP เสร็จสิ้น: $zipPath" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Backup เสร็จสมบูรณ์!" -ForegroundColor Green

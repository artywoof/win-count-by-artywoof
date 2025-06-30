# Backup Scripts for Win Count Project

This directory contains backup scripts to help you create backups of important project files.

## Available Scripts

### 1. PowerShell Script (Windows)
**File:** `backup-script.ps1`

#### Usage:
```powershell
# Basic backup
.\backup-script.ps1

# Specify custom backup path
.\backup-script.ps1 -BackupPath "D:\MyBackups"

# Include node_modules (not recommended unless needed)
.\backup-script.ps1 -IncludeNodeModules
```

### 2. Bash Script (Cross-platform)
**File:** `backup-script.sh`

#### Usage:
```bash
# Make script executable (Linux/Mac)
chmod +x backup-script.sh

# Basic backup
./backup-script.sh

# Specify custom backup path
./backup-script.sh --backup-path "/path/to/backups"

# Include node_modules
./backup-script.sh --include-node-modules
```

## What Gets Backed Up

### Configuration Files
- `package.json` - Project dependencies and scripts
- `bun.lock` - Lock file for Bun package manager
- `tsconfig.json` - TypeScript configuration
- `svelte.config.js` - Svelte configuration
- `vite.config.js/ts` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `playwright.config.ts` - Playwright testing configuration
- `global.d.ts` - Global TypeScript definitions

### Source Code
- `src/` - Main application source code
- `static/` - Static assets
- `src-tauri/` - Tauri application files
- `ai-sync-api/` - API server code
- `tests/` - Test files

### Important Files
- `README.md` - Project documentation
- `launch.json` - VS Code launch configuration
- `presets/` - Application presets
- `index.ts` - Main TypeScript entry point
- `project-scan.ts` - Project scanning utility

## Backup Structure

Each backup creates:
1. **Timestamped folder** - `backup-YYYYMMDD-HHMMSS/`
2. **All important files and directories**
3. **backup-info.json** - Metadata about the backup
4. **ZIP file** - Compressed version of the backup

## Example Backup Info

```json
{
    "backup_date": "2025-06-30 13:12:55",
    "backup_name": "backup-20250630-131255",
    "project_name": "win-count-by-artywoof",
    "items_backed_up": ["package.json", "src", "..."],
    "include_node_modules": false,
    "total_size_mb": 15.7
}
```

## Tips

### ✅ Recommended
- Run backups before major changes
- Store backups in different locations (cloud storage, external drives)
- Regular automated backups using task scheduler

### ⚠️ Notes
- `node_modules` is excluded by default (can be recreated with `npm install`)
- Build artifacts (`build/`, `dist/`) are excluded (can be recreated)
- Large binary files might be excluded

### 🔄 Restore Process
To restore from backup:
1. Extract the ZIP file or copy the backup folder
2. Run `npm install` or `bun install` to restore dependencies
3. Run `npm run build` to rebuild the project

## Automation

### Windows Task Scheduler
```powershell
# Create daily backup task
schtasks /create /tn "WinCount-Backup" /tr "powershell.exe -File 'C:\path\to\backup-script.ps1'" /sc daily /st 02:00
```

### Linux/Mac Cron
```bash
# Add to crontab for daily backup at 2 AM
0 2 * * * /path/to/backup-script.sh --backup-path "/backups/win-count"
```

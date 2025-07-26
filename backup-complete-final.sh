#!/bin/bash

# Win Count Application - Complete Backup Script
# This script creates a full backup of the entire application
# Date: $(date +%Y-%m-%d_%H-%M-%S)

echo "🔄 Starting Complete Win Count Application Backup..."

# Create backup directory with timestamp
BACKUP_DIR="backup-complete-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📁 Creating backup directory: $BACKUP_DIR"

# Core Application Files
echo "📦 Backing up core application files..."
cp -r src/ "$BACKUP_DIR/"
cp -r src-tauri/ "$BACKUP_DIR/"
cp -r overlay-bridge/ "$BACKUP_DIR/"
cp -r static/ "$BACKUP_DIR/"
cp -r public/ "$BACKUP_DIR/"

# Configuration Files
echo "⚙️ Backing up configuration files..."
cp package.json "$BACKUP_DIR/"
cp package-lock.json "$BACKUP_DIR/"
cp bun.lock "$BACKUP_DIR/"
cp vite.config.js "$BACKUP_DIR/"
cp svelte.config.js "$BACKUP_DIR/"
cp tailwind.config.js "$BACKUP_DIR/"
cp tsconfig.json "$BACKUP_DIR/"
cp postcss.config.js "$BACKUP_DIR/"
cp playwright.config.ts "$BACKUP_DIR/"
cp global.d.ts "$BACKUP_DIR/"
cp index.ts "$BACKUP_DIR/"
cp .gitignore "$BACKUP_DIR/"
cp .gitattributes "$BACKUP_DIR/"
cp README.md "$BACKUP_DIR/"

# Development Scripts
echo "🛠️ Backing up development scripts..."
cp start-dev.bat "$BACKUP_DIR/"
cp start-dev.sh "$BACKUP_DIR/"
cp backup-script.sh "$BACKUP_DIR/"
cp backup-script.ps1 "$BACKUP_DIR/"

# VS Code Settings
echo "🔧 Backing up VS Code settings..."
cp -r .vscode/ "$BACKUP_DIR/" 2>/dev/null || echo "No .vscode directory found"

# Test Files
echo "🧪 Backing up test files..."
cp -r tests/ "$BACKUP_DIR/" 2>/dev/null || echo "No tests directory found"
cp -r test-results/ "$BACKUP_DIR/" 2>/dev/null || echo "No test-results directory found"
cp test-*.html "$BACKUP_DIR/" 2>/dev/null || echo "No test HTML files found"
cp test-*.md "$BACKUP_DIR/" 2>/dev/null || echo "No test markdown files found"

# Backup Files (Previous backups)
echo "💾 Backing up previous backup files..."
cp BACKUP_*.* "$BACKUP_DIR/" 2>/dev/null || echo "No previous backup files found"

# Documentation Files
echo "📚 Backing up documentation..."
cp *.md "$BACKUP_DIR/" 2>/dev/null || echo "No markdown files found"

# Presets and Configuration
echo "🎨 Backing up presets and configurations..."
cp -r presets/ "$BACKUP_DIR/" 2>/dev/null || echo "No presets directory found"
cp -r for_you/ "$BACKUP_DIR/" 2>/dev/null || echo "No for_you directory found"
cp -r "for you/" "$BACKUP_DIR/" 2>/dev/null || echo "No 'for you' directory found"

# Log Files
echo "📋 Backing up log files..."
cp -r logs/ "$BACKUP_DIR/" 2>/dev/null || echo "No logs directory found"

# Application Assets
echo "🖼️ Backing up application assets..."
cp APP.png "$BACKUP_DIR/" 2>/dev/null || echo "No APP.png found"
cp launch.json "$BACKUP_DIR/" 2>/dev/null || echo "No launch.json found"
cp cyberpunk-examples.svelte "$BACKUP_DIR/" 2>/dev/null || echo "No cyberpunk examples found"

# Create backup info file
echo "📝 Creating backup information file..."
cat > "$BACKUP_DIR/BACKUP_INFO.md" << EOF
# Win Count Application - Complete Backup

**Backup Date:** $(date)
**Backup Directory:** $BACKUP_DIR

## Contents:
- ✅ Core Application (src/, src-tauri/, overlay-bridge/)
- ✅ Static Assets (static/, public/)
- ✅ Configuration Files (package.json, vite.config.js, etc.)
- ✅ Development Scripts (start-dev.*, backup-script.*)
- ✅ VS Code Settings (.vscode/)
- ✅ Test Files (tests/, test-results/)
- ✅ Documentation (*.md files)
- ✅ Previous Backups (BACKUP_*.*)
- ✅ Presets and Configurations
- ✅ Log Files
- ✅ Application Assets

## Restore Instructions:
1. Extract/copy all files from this backup directory
2. Run: \`npm install\` or \`bun install\`
3. Run: \`npm run tauri dev\` or \`bun run tauri dev\`
4. Test all functionality:
   - Main application hotkeys
   - Overlay display
   - Settings persistence
   - Auto-updater

## Critical Files:
- \`src/routes/+page.svelte\` - Main application UI
- \`src/routes/overlay/+page.svelte\` - Overlay display
- \`src-tauri/src/main.rs\` - Tauri backend
- \`overlay-bridge/server.js\` - WebSocket bridge
- \`src/lib/hotkeyManager.ts\` - Hotkey management
- \`src/lib/autoUpdater.ts\` - Auto-update functionality

## Current State:
- Application is working perfectly
- Overlay positioning and sizing optimized
- Crown icon locked at -16px offset
- Dynamic container width based on character count
- All hotkeys functioning correctly
- Auto-repeat and key release working properly

EOF

# Create compressed backup
echo "🗜️ Creating compressed backup..."
tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR/"

echo "✅ Backup completed successfully!"
echo "📦 Backup location: $BACKUP_DIR/"
echo "🗜️ Compressed backup: $BACKUP_DIR.tar.gz"
echo ""
echo "🔄 To restore from backup:"
echo "1. Extract: tar -xzf $BACKUP_DIR.tar.gz"
echo "2. Copy files to your project directory"
echo "3. Run: npm install && npm run tauri dev"
echo ""
echo "💡 Keep this backup safe! It contains your complete working application." 
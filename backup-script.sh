#!/bin/bash

# Win Count Backup Script (Bash version for cross-platform support)
# สคริปต์สำหรับสำรองไฟล์ที่สำคัญของโปรเจ็กต์

# Configuration
BACKUP_DIR="./backups"
INCLUDE_NODE_MODULES=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --backup-path)
            BACKUP_DIR="$2"
            shift 2
            ;;
        --include-node-modules)
            INCLUDE_NODE_MODULES=true
            shift
            ;;
        *)
            echo "Unknown option $1"
            exit 1
            ;;
    esac
done

# Create timestamp for backup name
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_NAME="backup-$TIMESTAMP"
FULL_BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

echo "🗂️  กำลังสร้าง backup: $BACKUP_NAME"

# Create backup directory
mkdir -p "$FULL_BACKUP_PATH"

# List of important files and directories
IMPORTANT_ITEMS=(
    # Configuration files
    "package.json"
    "bun.lock"
    "tsconfig.json"
    "svelte.config.js"
    "vite.config.js"
    "vite.config.ts"
    "tailwind.config.js"
    "postcss.config.js"
    "playwright.config.ts"
    "global.d.ts"
    
    # Source code
    "src"
    "static"
    
    # Tauri
    "src-tauri"
    
    # API server
    "ai-sync-api"
    
    # Tests
    "tests"
    
    # Important docs and configs
    "README.md"
    "launch.json"
    "presets"
    
    # Project specific
    "index.ts"
    "project-scan.ts"
)

# Optional: include node_modules if specified
if [ "$INCLUDE_NODE_MODULES" = true ]; then
    IMPORTANT_ITEMS+=("node_modules")
fi

# Copy important files and directories
for item in "${IMPORTANT_ITEMS[@]}"; do
    if [ -e "$item" ]; then
        if [ -d "$item" ]; then
            echo "📁 กำลัง copy โฟลเดอร์: $item"
            cp -r "$item" "$FULL_BACKUP_PATH/"
        else
            echo "📄 กำลัง copy ไฟล์: $item"
            cp "$item" "$FULL_BACKUP_PATH/"
        fi
    else
        echo "⚠️  ไม่พบไฟล์: $item"
    fi
done

# Calculate backup size
BACKUP_SIZE=$(du -sh "$FULL_BACKUP_PATH" | cut -f1)

# Create backup info file
cat > "$FULL_BACKUP_PATH/backup-info.json" << EOF
{
    "backup_date": "$(date -Iseconds)",
    "backup_name": "$BACKUP_NAME",
    "project_name": "win-count-by-artywoof",
    "items_backed_up": [$(printf '"%s",' "${IMPORTANT_ITEMS[@]}" | sed 's/,$//')]
    "include_node_modules": $INCLUDE_NODE_MODULES,
    "total_size": "$BACKUP_SIZE"
}
EOF

echo ""
echo "✅ Backup เสร็จสิ้น!"
echo "📁 ตำแหน่ง: $FULL_BACKUP_PATH"
echo "📊 ขนาด: $BACKUP_SIZE"
echo "📅 วันที่: $(date)"

# Create ZIP file
ZIP_PATH="$FULL_BACKUP_PATH.zip"
echo "🗜️  กำลังสร้างไฟล์ ZIP..."
if command -v zip &> /dev/null; then
    cd "$BACKUP_DIR"
    zip -r "$BACKUP_NAME.zip" "$BACKUP_NAME"
    cd ..
    echo "✅ สร้าง ZIP เสร็จสิ้น: $ZIP_PATH"
else
    echo "⚠️  ไม่พบคำสั่ง zip - ข้าม การสร้าง ZIP file"
fi

echo ""
echo "🎉 Backup เสร็จสมบูรณ์!"

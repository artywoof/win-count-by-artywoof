@echo off
echo.
echo ========================================
echo    Build Complete Release Package
echo ========================================
echo.

echo Step 1: Checking Signing Keys...
echo.

REM Check if signing keys exist (check both possible locations)
if exist "%~dp0~\.tauri\keys" (
    echo ✅ Signing Keys found at %~dp0~\.tauri\keys
    set KEYS_PATH=%~dp0~\.tauri
) else if exist "%~dp0~\.tauri\keys.pub" (
    echo ✅ Signing Keys found at %~dp0~\.tauri\keys.pub
    set KEYS_PATH=%~dp0~\.tauri
) else (
    echo ❌ Signing Keys not found
    echo.
    echo Creating Signing Keys...
    bunx tauri signer generate -w %~dp0~\.tauri
    echo.
    echo ✅ Signing Keys created successfully!
    echo Please copy the Public Key to tauri.conf.json
    echo.
    set KEYS_PATH=%~dp0~\.tauri
)

echo.
echo ========================================
echo    Build Complete Release Package
echo ========================================
echo.

echo Step 1: Building application...
echo.

REM Build application
bunx tauri build

echo.
echo ========================================
echo    Build Complete
echo ========================================
echo.

REM Check if MSI file was created successfully
if not exist "src-tauri\target\release\bundle\msi\Win_Count_by_ArtYWoof_1.0.0_x64_en-US.msi" (
    echo ❌ Build failed
    echo.
    pause
    exit /b 1
)

echo ✅ Build successful!
echo File created: Win_Count_by_ArtYWoof_1.0.0_x64_en-US.msi
echo.

echo Step 2: Creating Signature...
echo.

REM Create signature file
cd "src-tauri\target\release\bundle\msi"
bunx tauri signer sign "Win_Count_by_ArtYWoof_1.0.0_x64_en-US.msi"
cd "%~dp0"

echo.
echo ========================================
echo    Signature Complete
echo ========================================
echo.

REM Check if .sig file was created successfully
if exist "src-tauri\target\release\bundle\msi\Win_Count_by_ArtYWoof_1.0.0_x64_en-US.msi.sig" (
    echo ✅ Signature created successfully!
    echo File created: Win_Count_by_ArtYWoof_1.0.0_x64_en-US.msi.sig
    echo.
) else (
    echo ❌ Could not create signature
    echo Please check signing keys
    echo.
    pause
    exit /b 1
)

echo Step 3: Creating Distribution Package...
echo.

REM Create distribution folder
if not exist "dist" mkdir dist
if not exist "dist\Win Count by ArtYWoof" mkdir "dist\Win Count by ArtYWoof"

REM Copy MSI file to distribution folder
copy "src-tauri\target\release\bundle\msi\Win_Count_by_ArtYWoof_1.0.0_x64_en-US.msi" "dist\Win Count by ArtYWoof\"

REM Create README file for distribution
echo Win Count by ArtYWoof v1.0.1 > "dist\Win Count by ArtYWoof\README.txt"
echo. >> "dist\Win Count by ArtYWoof\README.txt"
echo Installation Instructions: >> "dist\Win Count by ArtYWoof\README.txt"
echo 1. Double-click the MSI file to install >> "dist\Win Count by ArtYWoof\README.txt"
echo 2. Follow the installation wizard >> "dist\Win Count by ArtYWoof\README.txt"
echo 3. Launch from Start Menu or Desktop shortcut >> "dist\Win Count by ArtYWoof\README.txt"
echo. >> "dist\Win Count by ArtYWoof\README.txt"
echo Features: >> "dist\Win Count by ArtYWoof\README.txt"
echo - Win counter for TikTok Live streams >> "dist\Win Count by ArtYWoof\README.txt"
echo - Customizable hotkeys >> "dist\Win Count by ArtYWoof\README.txt"
echo - Overlay support for streaming >> "dist\Win Count by ArtYWoof\README.txt"
echo - Preset management >> "dist\Win Count by ArtYWoof\README.txt"
echo - Auto-update system >> "dist\Win Count by ArtYWoof\README.txt"
echo. >> "dist\Win Count by ArtYWoof\README.txt"
echo Copyright © 2025 ArtYWoof >> "dist\Win Count by ArtYWoof\README.txt"

REM Create ZIP file for distribution
echo Creating ZIP package...
powershell -command "Compress-Archive -Path 'dist\Win Count by ArtYWoof\*' -DestinationPath 'dist\Win_Count_by_ArtYWoof_v1.0.1.zip' -Force"

echo.
echo ========================================
echo    🎉 Complete! Files ready for upload
echo ========================================
echo.
echo Files created:
echo 1. Win_Count_by_ArtYWoof_1.0.0_x64_en-US.msi
echo 2. Win_Count_by_ArtYWoof_1.0.0_x64_en-US.msi.sig
echo 3. Win_Count_by_ArtYWoof_v1.0.1.zip (for distribution)
echo.
echo Next steps:
echo 1. Upload MSI file to GitHub Releases
echo 2. GitHub will auto-generate latest.json
echo 3. Copy signature from .sig file to GitHub Release
echo 4. Upload ZIP file to Google Drive for sales
echo.

pause 
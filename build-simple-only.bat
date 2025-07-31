@echo off
echo.
echo ========================================
echo    Simple Build - MSI Installer Only
echo ========================================
echo.

echo Building application...
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
echo 📋 Features:
echo - ✅ MSI Installer
echo - ✅ Icon in Installer
echo - ✅ Multi-drive support (C:, D:, E:, F:)
echo - ✅ Static files support multiple paths
echo - ✅ Overlay: http://localhost:777/overlay.html
echo.
echo 🚀 Ready to use!
echo.

pause 
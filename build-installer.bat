@echo off
echo ========================================
echo Building Win Count by ArtYWoof Installer
echo ========================================

echo.
echo Step 1: Building Tauri application...
call bun run tauri build

if %ERRORLEVEL% NEQ 0 (
    echo Error: Tauri build failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Creating installer...
"C:\Program Files (x86)\NSIS\makensis.exe" installer.nsi

if %ERRORLEVEL% NEQ 0 (
    echo Error: Installer creation failed!
    echo Please make sure NSIS is installed at C:\Program Files (x86)\NSIS\
    pause
    exit /b 1
)

echo.
echo ========================================
echo Installer created successfully!
echo File: Win_Count_by_ArtYWoof_Setup.exe
echo ========================================
pause 
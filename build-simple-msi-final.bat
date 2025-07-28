@echo off
echo ========================================
echo Building MSI with bunx tauri build
echo ========================================

echo.
echo Step 1: Checking required files...
call .\check-files.bat

if %ERRORLEVEL% NEQ 0 (
    echo Error: Missing required files!
    pause
    exit /b 1
)

echo.
echo Step 2: Building MSI with bunx tauri build...
call bunx tauri build

if %ERRORLEVEL% NEQ 0 (
    echo Error: Build failed!
    pause
    exit /b 1
)

echo.
echo Step 3: Verifying MSI file...
if exist "src-tauri\target\release\bundle\msi\*.msi" (
    echo ✅ MSI file created successfully!
    dir "src-tauri\target\release\bundle\msi\*.msi"
) else (
    echo ❌ MSI file not found!
    pause
    exit /b 1
)

echo.
echo ========================================
echo MSI Build finished!
echo ========================================
echo.
echo MSI file location:
echo src-tauri\target\release\bundle\msi\
echo.
echo Static files are automatically included
echo Overlay should work correctly
echo.
pause 
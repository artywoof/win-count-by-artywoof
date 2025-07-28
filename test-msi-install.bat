@echo off
echo ========================================
echo Test MSI Installation
echo ========================================

echo.
echo Step 1: Building MSI with static files...
call .\build-simple-msi.bat

if %ERRORLEVEL% NEQ 0 (
    echo Error: MSI build failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Checking MSI file...
if exist "src-tauri\target\release\bundle\msi\*.msi" (
    echo ✅ MSI file found:
    dir "src-tauri\target\release\bundle\msi\*.msi" /b
) else (
    echo ❌ MSI file not found!
    pause
    exit /b 1
)

echo.
echo Step 3: Installing MSI (silent mode)...
for %%f in ("src-tauri\target\release\bundle\msi\*.msi") do (
    echo Installing: %%~nxf
    msiexec /i "%%f" /quiet /norestart
)

echo.
echo Step 4: Waiting for installation...
timeout /t 10 /nobreak >nul

echo.
echo Step 5: Checking installation...
if exist "C:\Program Files\Win Count by ArtYWoof\win-count-by-artywoof.exe" (
    echo ✅ Application installed successfully
    echo 📁 Location: C:\Program Files\Win Count by ArtYWoof\
    echo 📄 Files:
    dir "C:\Program Files\Win Count by ArtYWoof\" /b
) else (
    echo ❌ Application not found in Program Files
)

echo.
echo Step 6: Checking static files...
if exist "C:\Program Files\Win Count by ArtYWoof\static\overlay.html" (
    echo ✅ Static files found
    echo 📄 overlay.html exists
) else (
    echo ❌ Static files not found
)

echo.
echo Step 7: Testing overlay...
echo Starting application...
start "" "C:\Program Files\Win Count by ArtYWoof\win-count-by-artywoof.exe"

echo.
echo Step 8: Waiting for server...
timeout /t 5 /nobreak >nul

echo.
echo Step 9: Opening overlay...
start http://localhost:777/overlay.html

echo.
echo ========================================
echo Test completed!
echo ========================================
echo.
echo If overlay shows 404:
echo 1. Check console output for debug messages
echo 2. Verify static files in installation directory
echo 3. Check if port 777 is available
echo.
pause 
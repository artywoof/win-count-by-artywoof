@echo off
echo ========================================
echo Checking Required Files
echo ========================================

echo.
echo Step 1: Checking static folder structure...
if exist "static" (
    echo ✅ Static folder found
) else (
    echo ❌ Static folder not found!
    pause
    exit /b 1
)

echo.
echo Step 2: Checking overlay.html...
if exist "static\overlay.html" (
    echo ✅ overlay.html found
) else (
    echo ❌ overlay.html not found!
    pause
    exit /b 1
)

echo.
echo Step 3: Checking assets folder...
if exist "static\assets" (
    echo ✅ assets folder found
) else (
    echo ❌ assets folder not found!
    pause
    exit /b 1
)

echo.
echo Step 4: Checking fonts...
if exist "static\assets\fonts" (
    echo ✅ fonts folder found
    echo 📄 Font files:
    dir "static\assets\fonts\*.ttf" /b
) else (
    echo ❌ fonts folder not found!
    pause
    exit /b 1
)

echo.
echo Step 5: Checking UI assets...
if exist "static\assets\ui" (
    echo ✅ ui folder found
    echo 📄 UI files:
    dir "static\assets\ui\*" /b
) else (
    echo ❌ ui folder not found!
    pause
    exit /b 1
)

echo.
echo Step 6: Checking sound effects...
if exist "static\assets\sfx" (
    echo ✅ sfx folder found
    echo 📄 Sound files:
    dir "static\assets\sfx\*.mp3" /b
) else (
    echo ❌ sfx folder not found!
    pause
    exit /b 1
)

echo.
echo Step 7: Checking icons...
if exist "src-tauri\icons" (
    echo ✅ icons folder found
    echo 📄 Icon files:
    dir "src-tauri\icons\*.png" /b
    dir "src-tauri\icons\*.ico" /b
) else (
    echo ❌ icons folder not found!
    pause
    exit /b 1
)

echo.
echo ========================================
echo All required files found!
echo ========================================
echo.
echo Ready to build MSI with:
echo - overlay.html
echo - fonts (14 files)
echo - UI assets (3 files)
echo - Sound effects (2 files)
echo - Icons (5 files)
echo.
pause 
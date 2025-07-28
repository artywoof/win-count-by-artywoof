@echo off
echo.
echo ========================================
echo    Update Version in All Files
echo ========================================
echo.

if "%1"=="" (
    echo Usage: update-version.bat [VERSION]
    echo Example: update-version.bat 1.0.0
    echo.
    pause
    exit /b 1
)

set VERSION=%1
echo Updating version to: %VERSION%
echo.

echo Step 1: Updating package.json...
powershell -Command "(Get-Content 'package.json') -replace '\"version\": \"[^\"]*\"', '\"version\": \"%VERSION%\"' | Set-Content 'package.json'"

echo Step 2: Updating package-lock.json...
powershell -Command "(Get-Content 'package-lock.json') -replace '\"version\": \"[^\"]*\"', '\"version\": \"%VERSION%\"' | Set-Content 'package-lock.json'"

echo Step 3: Updating tauri.conf.json...
powershell -Command "(Get-Content 'src-tauri/tauri.conf.json') -replace '\"version\": \"[^\"]*\"', '\"version\": \"%VERSION%\"' | Set-Content 'src-tauri/tauri.conf.json'"

echo Step 4: Updating latest.json...
powershell -Command "(Get-Content 'latest.json') -replace '\"version\": \"[^\"]*\"', '\"version\": \"%VERSION%\"' | Set-Content 'latest.json'"

echo Step 5: Updating installer.wxs...
powershell -Command "(Get-Content 'src-tauri/installer.wxs') -replace 'Version=\"[^\"]*\"', 'Version=\"%VERSION%\"' | Set-Content 'src-tauri/installer.wxs'"

echo.
echo ========================================
echo    ✅ Version Updated Successfully!
echo ========================================
echo.
echo Updated files:
echo - package.json
echo - package-lock.json
echo - src-tauri/tauri.conf.json
echo - latest.json
echo - src-tauri/installer.wxs
echo.
echo Current version: %VERSION%
echo.

pause 
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

echo Step 3: Updating latest.json...
echo.

REM Read signature from file
for /f "tokens=*" %%i in ('type "src-tauri\target\release\bundle\msi\Win_Count_by_ArtYWoof_1.0.0_x64_en-US.msi.sig"') do set SIGNATURE=%%i

echo SIGNATURE: %SIGNATURE%
echo.

REM Update latest.json
powershell -Command "(Get-Content 'latest.json') -replace 'YOUR_ACTUAL_SIGNATURE_FROM_MSI_SIG_FILE', '%SIGNATURE%' | Set-Content 'latest.json'"

echo ✅ Updated latest.json successfully!
echo.

echo ========================================
echo    🎉 Complete! Files ready for upload
echo ========================================
echo.
echo Files created:
echo 1. Win_Count_by_ArtYWoof_1.0.0_x64_en-US.msi
echo 2. Win_Count_by_ArtYWoof_1.0.0_x64_en-US.msi.sig
echo 3. latest.json (updated)
echo.
echo Next steps:
echo 1. Upload files to GitHub Releases
echo 2. Set correct URL in latest.json
echo.

pause 
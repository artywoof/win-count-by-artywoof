@echo off
echo.
echo ========================================
echo    Build with Auto Update Check
echo ========================================
echo.

echo Step 1: Checking Signing Keys...
echo.

REM Check if signing keys exist
if not exist "~\.tauri\keys" (
    echo ❌ Signing Keys not found
    echo.
    echo Do you want to create Signing Keys?
    echo 1. Create Signing Keys (for Auto Update)
    echo 2. Build Simple (no Auto Update)
    echo.
    set /p choice="Choose (1 or 2): "
    
    if "!choice!"=="1" (
        echo.
        echo Creating Signing Keys...
        bunx tauri signer generate -w ~\.tauri
        echo.
        echo ✅ Signing Keys created successfully!
        echo Please copy the Public Key to tauri.conf.json
        echo.
        echo Now building with Auto Update...
        echo.
        goto :build_complete
    ) else (
        echo.
        echo Building simple version...
        goto :build_simple
    )
) else (
    echo ✅ Signing Keys found
    echo.
    goto :build_complete
)

:build_simple
echo.
echo ========================================
echo    Build Simple MSI Installer
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
if not exist "src-tauri\target\release\bundle\msi\Win Count by ArtYWoof_1.0.0_x64_en-US.msi" (
    echo ❌ Build failed
    echo.
    pause
    exit /b 1
)

echo ✅ Build successful!
echo File created: Win Count by ArtYWoof_1.0.0_x64_en-US.msi
echo.
echo 📋 Features:
echo - ✅ Executable name: Win Count By ArtYWoof.exe
echo - ✅ Icon in Installer
echo - ✅ Multi-drive support (C:, D:, E:, F:)
echo - ✅ Static files support multiple paths
echo - ✅ Overlay: http://localhost:777/overlay.html
echo.
echo 🚀 Ready to use!
echo.
pause
exit /b 0

:build_complete
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
if not exist "src-tauri\target\release\bundle\msi\Win Count by ArtYWoof_1.0.0_x64_en-US.msi" (
    echo ❌ Build failed
    echo.
    pause
    exit /b 1
)

echo ✅ Build successful!
echo File created: Win Count by ArtYWoof_1.0.0_x64_en-US.msi
echo.

echo Step 2: Creating Signature...
echo.

REM Create signature file
bunx tauri signer sign "src-tauri\target\release\bundle\msi\Win Count by ArtYWoof_1.0.0_x64_en-US.msi"

echo.
echo ========================================
echo    Signature Complete
echo ========================================
echo.

REM Check if .sig file was created successfully
if exist "src-tauri\target\release\bundle\msi\Win Count by ArtYWoof_1.0.0_x64_en-US.msi.sig" (
    echo ✅ Signature created successfully!
    echo File created: Win Count by ArtYWoof_1.0.0_x64_en-US.msi.sig
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
for /f "tokens=*" %%i in ('type "src-tauri\target\release\bundle\msi\Win Count by ArtYWoof_1.0.0_x64_en-US.msi.sig"') do set SIGNATURE=%%i

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
echo 1. Win Count by ArtYWoof_1.0.0_x64_en-US.msi
echo 2. Win Count by ArtYWoof_1.0.0_x64_en-US.msi.sig
echo 3. latest.json (updated)
echo.
echo Next steps:
echo 1. Upload files to GitHub Releases
echo 2. Set correct URL in latest.json
echo.

pause 
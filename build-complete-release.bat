@echo off
echo.
echo ========================================
echo    Build Complete Release Package
echo ========================================
echo.

echo ขั้นตอนที่ 1: Build แอพ...
echo.

REM Build แอพ
bunx tauri build

echo.
echo ========================================
echo    Build เสร็จสิ้น
echo ========================================
echo.

REM ตรวจสอบว่าสร้างไฟล์ MSI สำเร็จหรือไม่
if not exist "src-tauri\target\release\bundle\msi\Win Count by ArtYWoof_1.0.0_x64_en-US.msi" (
    echo ❌ Build ไม่สำเร็จ
    echo.
    pause
    exit /b 1
)

echo ✅ Build สำเร็จ!
echo ไฟล์ที่สร้าง: Win Count by ArtYWoof_1.0.0_x64_en-US.msi
echo.

echo ขั้นตอนที่ 2: สร้าง Signature...
echo.

REM สร้าง signature file
npx tauri signer sign "src-tauri\target\release\bundle\msi\Win Count by ArtYWoof_1.0.0_x64_en-US.msi"

echo.
echo ========================================
echo    Signature เสร็จสิ้น
echo ========================================
echo.

REM ตรวจสอบว่าสร้างไฟล์ .sig สำเร็จหรือไม่
if exist "src-tauri\target\release\bundle\msi\Win Count by ArtYWoof_1.0.0_x64_en-US.msi.sig" (
    echo ✅ สร้าง signature สำเร็จ!
    echo ไฟล์ที่สร้าง: Win Count by ArtYWoof_1.0.0_x64_en-US.msi.sig
    echo.
) else (
    echo ❌ ไม่สามารถสร้าง signature ได้
    echo กรุณาตรวจสอบ signing keys
    echo.
    pause
    exit /b 1
)

echo ขั้นตอนที่ 3: อัพเดท latest.json...
echo.

REM อ่าน signature จากไฟล์
for /f "tokens=*" %%i in ('type "src-tauri\target\release\bundle\msi\Win Count by ArtYWoof_1.0.0_x64_en-US.msi.sig"') do set SIGNATURE=%%i

echo SIGNATURE: %SIGNATURE%
echo.

REM อัพเดท latest.json
powershell -Command "(Get-Content 'latest.json') -replace 'YOUR_ACTUAL_SIGNATURE_FROM_MSI_SIG_FILE', '%SIGNATURE%' | Set-Content 'latest.json'"

echo ✅ อัพเดท latest.json เรียบร้อยแล้ว!
echo.

echo ========================================
echo    🎉 เสร็จสิ้น! ไฟล์พร้อมอัพโหลด
echo ========================================
echo.
echo ไฟล์ที่สร้างขึ้น:
echo 1. Win Count by ArtYWoof_1.0.0_x64_en-US.msi
echo 2. Win Count by ArtYWoof_1.0.0_x64_en-US.msi.sig
echo 3. latest.json (อัพเดทแล้ว)
echo.
echo ขั้นตอนต่อไป:
echo 1. อัพโหลดไฟล์ขึ้น GitHub Releases
echo 2. ตั้งค่า URL ใน latest.json ให้ถูกต้อง
echo.

pause 
@echo off
echo.
echo ========================================
echo    Build Simple MSI Installer
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
echo 📋 คุณสมบัติ:
echo - ✅ ชื่อไฟล์: Win Count By ArtYWoof.exe
echo - ✅ ไอคอนใน Installer
echo - ✅ รองรับหลายไดร์ (C:, D:, E:, F:)
echo - ✅ Static files รองรับหลาย path
echo - ✅ Overlay: http://localhost:777/overlay.html
echo.
echo 🚀 พร้อมใช้งานแล้ว!
echo.
pause 
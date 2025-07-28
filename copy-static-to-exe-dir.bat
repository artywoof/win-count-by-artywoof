@echo off
echo.
echo ========================================
echo    Copy Static Files to EXE Directory
echo ========================================
echo.

REM ตรวจสอบว่ามีโฟลเดอร์ static หรือไม่
if not exist "static" (
    echo ❌ ไม่พบโฟลเดอร์ static
    echo กรุณารัน build ก่อน
    pause
    exit /b 1
)

echo ✅ พบโฟลเดอร์ static
echo.

REM สร้างโฟลเดอร์ static ในโฟลเดอร์เดียวกับ executable
if not exist "Win Count By ArtYWoof.exe\static" (
    mkdir "Win Count By ArtYWoof.exe\static"
    echo ✅ สร้างโฟลเดอร์ Win Count By ArtYWoof.exe\static
) else (
    echo ✅ โฟลเดอร์ Win Count By ArtYWoof.exe\static มีอยู่แล้ว
)

echo.

REM Copy ไฟล์ทั้งหมดจาก static ไปยัง Win Count By ArtYWoof.exe\static
echo 📁 Copying files...
xcopy "static\*" "Win Count By ArtYWoof.exe\static\" /E /Y /Q

if %ERRORLEVEL% EQU 0 (
    echo ✅ Copy สำเร็จ!
    echo.
    echo 📋 ไฟล์ที่ copy:
    dir "Win Count By ArtYWoof.exe\static" /B
) else (
    echo ❌ Copy ไม่สำเร็จ
    pause
    exit /b 1
)

echo.
echo ========================================
echo    ✅ เสร็จสิ้น!
echo ========================================
echo.
echo ตอนนี้ static files อยู่ในโฟลเดอร์เดียวกับ executable แล้ว
echo สามารถเปิด http://localhost:777/overlay.html ได้เลย
echo.
pause 
# Win Count by ArtYWoof - Installer System

## 📦 **Installer Features:**

### **✅ สิ่งที่ Installer จะทำ:**
- **เลือกโฟลเดอร์ติดตั้ง:** ผู้ใช้สามารถเลือกโฟลเดอร์ติดตั้งได้ (เช่น `C:\Win Count by ArtYWoof`)
- **สร้าง Desktop Shortcut:** สร้างไอคอนบน Desktop อัตโนมัติ
- **สร้าง Start Menu:** สร้างเมนูใน Start Menu พร้อม Uninstall
- **Registry Integration:** บันทึกข้อมูลใน Registry สำหรับ Uninstall
- **License Agreement:** แสดง License Agreement ก่อนติดตั้ง
- **Professional UI:** หน้าตา installer ที่สวยงามและเป็นมืออาชีพ

### **🛡️ การป้องกัน:**
- **Machine Binding:** License Key ผูกกับเครื่องเดียว
- **Anti-Decompilation:** ป้องกันการแกะโค้ด
- **Registry Protection:** ข้อมูลติดตั้งใน Registry
- **Professional Branding:** ใช้ชื่อและแบรนด์ของคุณ

## 🚀 **วิธีสร้าง Installer:**

### **1. ติดตั้ง NSIS:**
```bash
# ดาวน์โหลดและติดตั้ง NSIS จาก:
https://nsis.sourceforge.io/Download
```

### **2. สร้าง Installer:**
```bash
# ใช้ PowerShell (แนะนำ)
.\build-installer.ps1

# หรือใช้ Batch
.\build-installer.bat
```

### **3. ผลลัพธ์:**
- ไฟล์: `Win_Count_by_ArtYWoof_Setup.exe`
- ขนาด: ประมาณ 50-100 MB (ขึ้นอยู่กับ dependencies)

## 📋 **ขั้นตอนการติดตั้ง:**

### **สำหรับผู้ใช้:**
1. **ดาวน์โหลด:** `Win_Count_by_ArtYWoof_Setup.exe`
2. **รัน Installer:** ดับเบิลคลิกไฟล์ installer
3. **ยอมรับ License:** อ่านและยอมรับ License Agreement
4. **เลือกโฟลเดอร์:** เลือกโฟลเดอร์ติดตั้ง (เช่น `C:\Win Count by ArtYWoof`)
5. **ติดตั้ง:** กด Install และรอให้เสร็จ
6. **กรอก License:** เปิดแอพและกรอก License Key
7. **ใช้งาน:** แอพพร้อมใช้งาน!

### **สำหรับคุณ (ผู้พัฒนา):**
1. **Build:** รัน `build-installer.ps1`
2. **ทดสอบ:** ทดสอบ installer บนเครื่องอื่น
3. **แจกจ่าย:** อัพโหลดไฟล์ installer ไปยัง Google Drive หรือเว็บไซต์
4. **ขาย:** แจกจ่ายให้ลูกค้า

## 🔧 **การปรับแต่ง:**

### **เปลี่ยนชื่อแอพ:**
แก้ไขใน `installer.nsi`:
```nsi
!define APP_NAME "Win Count by ArtYWoof"
!define APP_VERSION "1.0.0"
!define APP_PUBLISHER "ArtYWoof"
```

### **เปลี่ยนไอคอน:**
แก้ไขใน `installer.nsi`:
```nsi
!define MUI_ICON "src-tauri\icons\icon.ico"
!define MUI_UNICON "src-tauri\icons\icon.ico"
```

### **เปลี่ยน License:**
แก้ไขไฟล์ `LICENSE.txt`

## 📁 **โครงสร้างไฟล์:**
```
project/
├── installer.nsi              # NSIS installer script
├── LICENSE.txt                # License agreement
├── build-installer.bat        # Batch build script
├── build-installer.ps1        # PowerShell build script
└── INSTALLER_README.md        # This file
```

## 🎯 **ข้อแนะนำ:**

### **ก่อนสร้าง Installer:**
1. **ทดสอบแอพ:** ให้แน่ใจว่าแอพทำงานปกติ
2. **อัพเดทเวอร์ชัน:** เปลี่ยนเวอร์ชันใน `installer.nsi`
3. **ตรวจสอบไอคอน:** ให้แน่ใจว่ามีไฟล์ `icon.ico`

### **หลังสร้าง Installer:**
1. **ทดสอบบนเครื่องอื่น:** ทดสอบ installer บนเครื่องที่ไม่มีแอพ
2. **ตรวจสอบ Uninstall:** ทดสอบการถอนการติดตั้ง
3. **ตรวจสอบ Registry:** ตรวจสอบข้อมูลใน Registry

## 🚨 **หมายเหตุสำคัญ:**
- **NSIS ต้องติดตั้ง:** ต้องติดตั้ง NSIS ก่อนสร้าง installer
- **Tauri Build:** ต้อง build Tauri app ก่อนสร้าง installer
- **License Key:** ต้องมี License Key system ที่ทำงานปกติ
- **Machine Binding:** License ต้องผูกกับเครื่องเดียว

---

**🎉 ตอนนี้คุณพร้อมสร้าง installer และขายแอพได้แล้ว!** 
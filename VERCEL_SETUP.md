# 🚀 Vercel Setup Guide สำหรับ Win Count License API

## 📋 ขั้นตอนการเชื่อมต่อ Vercel กับ GitHub Repository

### **1. สมัครและเข้าสู่ระบบ Vercel**

1. เปิดเบราว์เซอร์ไปที่ [vercel.com](https://vercel.com)
2. คลิกปุ่ม "Sign Up" หรือ "Get Started for Free"
3. เลือก "Continue with GitHub" เพื่อใช้ GitHub account
4. อนุญาตให้ Vercel เข้าถึง repositories ของคุณ

### **2. Import Repository**

1. ในหน้า Dashboard ของ Vercel คลิก "Add New..." → "Project"
2. เลือก repository `win-count-by-artywoof` จากรายการ
3. คลิกปุ่ม "Import"

### **3. ตั้งค่า Project**

#### **Framework Preset:**
- เลือก **"Other"** หรือ **"Vite"**
- ไม่ต้องเลือก Svelte เพราะเราแค่ต้องการ deploy API

#### **Build Settings:**
- **Framework Preset:** เลือก **"Other"**
- **Build Command:** (ไม่ต้องใส่ - ใช้ default)
- **Output Directory:** (ไม่ต้องใส่ - ใช้ default)
- **Install Command:** (ไม่ต้องใส่ - ใช้ default)

### **4. ตั้งค่า Environment Variables**

ในส่วน "Environment Variables" เพิ่มตัวแปรต่อไปนี้:

#### **สำหรับ Production:**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
ADMIN_KEY=ArtYWoof_y7#LO54Cc$%8#CwVwDvS9$!OAOU!QdJ*_WinCount2025
```

#### **สำหรับ Preview/Development:**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
ADMIN_KEY=ArtYWoof_y7#LO54Cc$%8#CwVwDvS9$!OAOU!QdJ*_WinCount2025
```

### **5. Deploy**

1. คลิกปุ่ม "Deploy"
2. รอประมาณ 1-2 นาที
3. เมื่อเสร็จแล้วจะได้ URL เช่น: `https://win-count-by-artywoof.vercel.app`

## 🔧 การตั้งค่า Supabase

### **1. สร้าง Supabase Project**

1. ไปที่ [supabase.com](https://supabase.com)
2. สร้าง project ใหม่
3. เก็บ **Project URL** และ **service_role key**

### **2. รัน SQL Schema**

1. ไปที่ SQL Editor ใน Supabase Dashboard
2. คัดลอกและรันโค้ดจากไฟล์ `supabase-schema.sql`
3. ตรวจสอบว่าตารางและ functions ถูกสร้างแล้ว

### **3. ทดสอบ API**

```bash
# Health Check
curl https://your-project.vercel.app/api/health

# Create License (Admin)
curl -X POST https://your-project.vercel.app/api/create-license \
  -H "Content-Type: application/json" \
  -d '{
    "admin_key": "ArtYWoof_y7#LO54Cc$%8#CwVwDvS9$!OAOU!QdJ*_WinCount2025",
    "machine_id": "test-machine-001",
    "discord_id": "123456789012345678",
    "duration_months": 12,
    "notes": "Test license"
  }'

# Validate License
curl -X POST https://your-project.vercel.app/api/validate-license \
  -H "Content-Type: application/json" \
  -d '{
    "license_key": "LICENSE-KEY-HERE",
    "machine_id": "test-machine-001"
  }'
```

## 🔗 API Endpoints

### **Health Check**
- **URL:** `GET /api/health`
- **Description:** ตรวจสอบสถานะ API

### **Validate License**
- **URL:** `POST /api/validate-license`
- **Body:** `{ "license_key": "...", "machine_id": "..." }`
- **Description:** ตรวจสอบ license key

### **Heartbeat**
- **URL:** `POST /api/heartbeat`
- **Body:** `{ "license_key": "...", "machine_id": "...", "timestamp": "...", "signature": "..." }`
- **Description:** อัปเดต heartbeat

### **Create License (Admin)**
- **URL:** `POST /api/create-license`
- **Body:** `{ "admin_key": "ArtYWoof_y7#LO54Cc$%8#CwVwDvS9$!OAOU!QdJ*_WinCount2025", "machine_id": "...", "discord_id": "...", "duration_months": 12, "notes": "..." }`
- **Description:** สร้าง license ใหม่

## 🔒 Security Features

### **Environment Variables**
- **SUPABASE_URL:** URL ของ Supabase project
- **SUPABASE_SERVICE_KEY:** Service role key สำหรับ database access
- **ADMIN_KEY:** Key สำหรับ admin functions (ArtYWoof_y7#LO54Cc$%8#CwVwDvS9$!OAOU!QdJ*_WinCount2025)

### **Authentication**
- Admin endpoints ต้องใช้ `admin_key`
- License validation ใช้ `license_key` + `machine_id`
- Heartbeat ใช้ cryptographic signature

### **CORS**
- อนุญาต CORS จากทุก origin
- รองรับ preflight requests

## 🚀 Continuous Deployment

เมื่อ push โค้ดใหม่ไปยัง GitHub:
1. Vercel จะ detect การเปลี่ยนแปลง
2. Deploy ใหม่โดยอัตโนมัติ
3. ใช้เวลา 1-2 นาที

## 📞 Support

หากมีปัญหา:
1. ตรวจสอบ Vercel logs ใน Dashboard
2. ตรวจสอบ Supabase logs
3. ทดสอบ API endpoints ด้วย curl
4. ตรวจสอบ Environment Variables

---

**🎯 หลังจากตั้งค่าเสร็จแล้ว Desktop App จะสามารถเชื่อมต่อกับ API ได้ทันที!**

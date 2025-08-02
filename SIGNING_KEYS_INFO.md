# 🔐 Signing Keys Information

## 📋 Private Key (สำหรับ GitHub Secret: TAURI_SIGNING_PRIVATE_KEY)

```
dW50cnVzdGVkIGNvbW1lbnQ6IHJzaWduIGVuY3J5cHRlZCBzZWNyZXQga2V5ClJXUlRZMEl5UHRlMzJpQ3FIQVNzdjlhRGFDclJYK1FxRC80
blhoQ0ZYQ1Zra1NNZk5wSUFBQkFBQUFBQUFBQUFBQUlBQUFBQTJ6ODZvWE5rL2YzbCt0TUc0NzRYQkpRVDRLOWRBTCtIZ0ZNWGpwL05mQkhu
SzFma0YwMndRNDRjeEZONUpESmlkcGIxRlZNeGcrazRwSTI3Vk1uSkRmRDZvVGVrV1dORDV1bUU3RDFtUGZHWUgvOGg5RDFkeU4xb3hyVE1i
WlRwNTJGREwrMnNKNUU9Cg==
```

## 🔑 Public Key (อัพเดทใน tauri.conf.json แล้ว)

```
dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDgwNDgzQzdCMDZBRjZCNTEKUldSUmE2OEdlenhJZ0RnNlFydmFUdnoyclVIMXIwd0doWDFNVnZyV2Q0L3cwVHV6ZTAvNVZMcHMK
```

## ⚙️ การตั้งค่า GitHub Secrets

ไปที่ GitHub repository → Settings → Secrets and variables → Actions

### 1. เพิ่ม TAURI_SIGNING_PRIVATE_KEY
- **Name**: `TAURI_SIGNING_PRIVATE_KEY`
- **Value**: ใส่ private key ข้างบนทั้งหมด

### 2. เพิ่ม TAURI_SIGNING_PRIVATE_KEY_PASSWORD
- **Name**: `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
- **Value**: ใส่ password ที่คุณตั้งไว้ตอนสร้าง key

## ⚠️ ข้อควรระวัง

1. **เก็บ Private Key ไว้เป็นความลับ** - อย่าแชร์หรือ commit เข้า repository
2. **จำ Password ไว้** - ถ้าลืม password จะไม่สามารถ sign updates ได้
3. **สำรองข้อมูล** - เก็บ private key และ password ไว้ในที่ปลอดภัย

## 🔄 ขั้นตอนต่อไป

1. ตั้งค่า GitHub Secrets ตามข้างบน
2. Commit และ push การเปลี่ยนแปลง
3. สร้าง tag ใหม่: `git tag v1.0.1`
4. Push tag: `git push origin v1.0.1`

---

**หมายเหตุ**: ไฟล์นี้ควรลบออกหลังจากตั้งค่า GitHub Secrets เสร็จแล้ว 
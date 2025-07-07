# แก้ไขปัญหาการแสดงผลเลขลบไม่ครบ (-999 แสดงเป็น -9...)

## วันที่: 6 กรกฎาคม 2025

## ปัญหาที่แก้ไข
- เมื่อพิมพ์เลข -999 จะแสดงเป็น -9... ไม่ครบ
- ตัวเลขยาวถูกตัดด้วย ellipsis (...)
- Container ไม่กว้างพอสำหรับเลขลบ

## การแก้ไขที่ทำ

### 1. **เพิ่มขนาด Container**
```css
.win-number-container {
  min-width: calc(476px * 0.40); /* เพิ่มจาก 0.35 เป็น 0.40 ~190px */
  max-width: calc(476px * 0.70); /* เพิ่มจาก 0.55 เป็น 0.70 ~333px */
  padding: 0 12px; /* เพิ่มจาก 8px เป็น 12px */
  overflow: visible; /* เปลี่ยนจาก hidden */
}
```

### 2. **ลบ Text Ellipsis**
```css
.win-number {
  overflow: visible; /* เปลี่ยนจาก hidden */
  /* ลบ text-overflow: ellipsis; */
}
```

### 3. **ปรับปรุง Font Size Logic**
```typescript
function adjustInputFontSize(inputElement: HTMLInputElement, value: string | number) {
  const valueStr = value.toString();
  const length = valueStr.length;
  let fontSize: string;
  
  // รองรับเครื่องหมาย - ใน calculation
  if (length <= 2) {
    fontSize = 'calc(476px * 0.12 + 32px)'; // ~89px for 1-2 digits
  } else if (length === 3) {
    fontSize = 'calc(476px * 0.11 + 30px)'; // ~82px for 3 digits (-12, 123)
  } else if (length === 4) {
    fontSize = 'calc(476px * 0.095 + 26px)'; // ~71px for 4 digits (-123, -999)
  } else if (length === 5) {
    fontSize = 'calc(476px * 0.085 + 22px)'; // ~62px for 5 digits (-1234)
  } else {
    fontSize = 'calc(476px * 0.075 + 18px)'; // ~54px for 6+ digits
  }
  
  inputElement.style.fontSize = fontSize;
}
```

### 4. **อัปเดต CSS Responsive Classes**
```css
.win-number[data-length="3"] {
  font-size: calc(476px * 0.11 + 30px); /* ~82px */
}

.win-number[data-length="4"] {
  font-size: calc(476px * 0.095 + 26px); /* ~71px สำหรับ -999 */
}

.win-number[data-length="5"] {
  font-size: calc(476px * 0.085 + 22px); /* ~62px */
}

.win-number[data-length="6"],
.win-number[data-length="7"],
.win-number[data-length="8"] {
  font-size: calc(476px * 0.075 + 18px); /* ~54px */
}
```

### 5. **ปรับปรุง Input Field**
```css
.win-number-input {
  padding: 8px 12px; /* เพิ่ม padding */
  overflow: visible; /* เปลี่ยนจาก hidden */
}
```

## ผลลัพธ์หลังการแก้ไข

### ✅ **สิ่งที่ได้รับการแก้ไข**
- **เลข -999 แสดงครบแล้ว** - ไม่เป็น -9... อีกต่อไป
- **Container กว้างขึ้น** - รองรับเลขยาวมากขึ้น
- **ไม่มี ellipsis** - เห็นตัวเลขครบทุกหลัก
- **Font size responsive** - ปรับขนาดอัตโนมัติตามความยาว

### 📊 **ขนาดตัวอักษรใหม่**
| ความยาว | ตัวอย่าง | ขนาดตัวอักษร |
|---------|----------|-------------|
| 1-2 หลัก | 5, -7 | ~89px |
| 3 หลัก | 123, -12 | ~82px |
| 4 หลัก | -123, -999 | ~71px |
| 5 หลัก | -1234, 12345 | ~62px |
| 6+ หลัก | -12345 | ~54px |

### 🎯 **การทดสอบ**
- ✅ เลข -999 แสดงครบ
- ✅ เลข -12345 แสดงครบ
- ✅ การพิมพ์ real-time ทำงาน
- ✅ Font size ปรับอัตโนมัติ
- ✅ Container ขยายตามความต้องการ

## หมายเหตุ
- การแก้ไขนี้รักษาความสวยงามของ UI
- ยังคงรองรับ responsive design
- Font size จะปรับอัตโนมัติขณะพิมพ์
- Container จะขยายตามความจำเป็น แต่ไม่เกิน max-width

## ไฟล์ที่แก้ไข
- `src/routes/+page.svelte` - CSS และ JavaScript functions

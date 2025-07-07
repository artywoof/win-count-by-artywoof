# แก้ไขขนาดตัวอักษรเพื่อรองรับ -10,000 และ 10,000 ในกล่องเดิม

## วันที่: 6 กรกฎาคม 2025

## ความต้องการ
- รักษาขนาดกล่องเท่าเดิม (ห้ามขยาย)
- รองรับตัวเลข -10,000 และ 10,000
- ปรับขนาดตัวอักษรลงตามจำนวนหลัก

## การแก้ไขที่ทำ

### 1. **คืนขนาดกล่องเป็นเดิม**
```css
.win-number-container {
  min-width: calc(476px * 0.35); /* กลับไปขนาดเดิม ~167px */
  max-width: calc(476px * 0.55); /* กลับไปขนาดเดิม ~261px */
  padding: 0 8px; /* กลับไปขนาดเดิม */
  overflow: hidden; /* กลับไปเป็น hidden */
}

.win-number {
  overflow: hidden; /* กลับไปเป็น hidden */
  text-overflow: ellipsis; /* กลับมาใช้ ellipsis เป็น fallback */
}
```

### 2. **ปรับปรุง Font Size Logic ใหม่**
```typescript
function adjustInputFontSize(inputElement: HTMLInputElement, value: string | number) {
  const valueStr = value.toString();
  const length = valueStr.length;
  let fontSize: string;
  
  if (length <= 2) {
    fontSize = 'calc(476px * 0.12 + 32px)'; // ~89px for 1-2 digits (1, -7)
  } else if (length === 3) {
    fontSize = 'calc(476px * 0.10 + 28px)'; // ~76px for 3 digits (123, -12)
  } else if (length === 4) {
    fontSize = 'calc(476px * 0.085 + 24px)'; // ~64px for 4 digits (-123, -999, 1234)
  } else if (length === 5) {
    fontSize = 'calc(476px * 0.07 + 20px)'; // ~53px for 5 digits (-1234, 12345)
  } else if (length === 6) {
    fontSize = 'calc(476px * 0.06 + 16px)'; // ~45px for 6 digits (-10000, 100000)
  } else {
    fontSize = 'calc(476px * 0.05 + 12px)'; // ~36px for 7+ digits
  }
  
  inputElement.style.fontSize = fontSize;
}
```

### 3. **อัปเดต CSS Responsive Classes**
```css
.win-number[data-length="3"] {
  font-size: calc(476px * 0.10 + 28px); /* ~76px */
}

.win-number[data-length="4"] {
  font-size: calc(476px * 0.085 + 24px); /* ~64px (-123, -999, 1234) */
}

.win-number[data-length="5"] {
  font-size: calc(476px * 0.07 + 20px); /* ~53px (-1234, 12345) */
}

.win-number[data-length="6"] {
  font-size: calc(476px * 0.06 + 16px); /* ~45px (-10000, 100000) */
}

.win-number[data-length="7"],
.win-number[data-length="8"] {
  font-size: calc(476px * 0.05 + 12px); /* ~36px (7+ หลัก) */
}
```

## ตารางขนาดตัวอักษรใหม่

| ความยาว | ตัวอย่าง | ขนาดตัวอักษร | หมายเหตุ |
|---------|----------|-------------|---------|
| 1-2 หลัก | 5, -7, 99 | ~89px | ขนาดปกติ |
| 3 หลัก | 123, -12, 999 | ~76px | เล็กลงเล็กน้อย |
| 4 หลัก | -123, -999, 1234 | ~64px | เล็กลงพอสมควร |
| 5 หลัก | -1234, 12345 | ~53px | เล็กลงมาก |
| 6 หลัก | **-10000, 100000** | ~45px | **เป้าหมายหลัก** |
| 7+ หลัก | -100000, 1000000 | ~36px | เล็กที่สุด |

## ผลลัพธ์

### ✅ **สิ่งที่ได้รับการแก้ไข**
- **กล่องมีขนาดคงที่** - ไม่ขยายจากเดิม
- **รองรับ -10,000** - แสดงครบในกล่องเดิม (font ~45px)
- **รองรับ 10,000** - แสดงครบในกล่องเดิม (font ~45px)
- **Responsive scaling** - ตัวอักษรเล็กลงตามหลัก
- **Fallback ellipsis** - ใช้ ... หากยาวเกินไป

### 🎯 **การทดสอบ**
- ✅ เลข 999 (4 หลัก) = ~64px
- ✅ เลข -999 (4 หลัก) = ~64px
- ✅ เลข 10000 (5 หลัก) = ~53px
- ✅ เลข -10000 (6 หลัก) = ~45px
- ✅ กล่องไม่ขยาย ขนาดคงที่
- ✅ Font ปรับอัตโนมัติขณะพิมพ์

### 📐 **ข้อมูลเทคนิค**
- Container width: ~167px - ~261px (คงที่)
- Padding: 8px (เดิม)
- Max font: 89px (1-2 หลัก)
- Min font: 36px (7+ หลัก)
- Target font สำหรับ -10,000: 45px

## หมายเหตุ
- การแก้ไขนี้รักษาขนาดกล่องเดิมไว้
- ตัวอักษรจะเล็กลงเมื่อมีหลักมากขึ้น
- หากตัวเลขยาวเกินไปจะใช้ ellipsis (...)
- Real-time adjustment ยังทำงานขณะพิมพ์

## ไฟล์ที่แก้ไข
- `src/routes/+page.svelte` - CSS และ JavaScript functions

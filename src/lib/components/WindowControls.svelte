<script lang="ts">
  // นำเข้า API สำหรับจัดการหน้าต่างโดยเฉพาะ
  import { getCurrentWindow } from '@tauri-apps/api/window';

  // ได้รับ instance ของหน้าต่างปัจจุบัน
  const appWindow = getCurrentWindow();

  // ฟังก์ชันสำหรับย่อหน้าต่าง
  function minimizeWindow() {
    appWindow.minimize();
  }

  // ฟังก์ชันสำหรับซ่อนหน้าต่าง (เป็นขั้นตอนแรกของการ "ปิดเพื่อไปที่ Tray")
  function hideWindow() {
    appWindow.hide();
  }
</script>

<!-- ส่วนของ HTML ไม่มีการเปลี่ยนแปลง -->
<div class="absolute top-3 right-4 flex space-x-2 z-20">
  <button on:click={minimizeWindow} class="w-6 h-6 flex items-center justify-center bg-yellow-500/80 rounded-full hover:bg-yellow-400 transition-colors">
    <span class="font-black text-black text-sm">-</span>
  </button>
  <button on:click={hideWindow} class="w-6 h-6 flex items-center justify-center bg-red-500/80 rounded-full hover:bg-red-400 transition-colors">
    <span class="font-black text-black text-sm">×</span>
  </button>
</div>

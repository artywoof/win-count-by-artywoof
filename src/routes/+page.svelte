<script lang="ts">
  // นำเข้าคอมโพเนนต์ที่เราจะสร้าง
  import WinCounter from '../lib/components/WinCounter.svelte';
  import GoalTracker from '../lib/components/GoalTracker.svelte';
  import WindowControls from '../lib/components/WindowControls.svelte';
</script>

<!-- 
  - data-tauri-drag-region ทำให้ลากหน้าต่างได้
  - เพิ่ม bg-gray-900/50 และ backdrop-blur-lg เพื่อสร้างเอฟเฟกต์กระจกฝ้า
-->
<main data-tauri-drag-region class="relative flex flex-col h-screen w-full bg-gray-900/50 backdrop-blur-lg rounded-2xl overflow-hidden">
  
  <!-- กรอบแอปดีไซน์ Cyberpunk -->
  <div class="absolute inset-0 border-2 border-cyan-400 rounded-2xl shadow-[0_0_20px_rgba(0,255,255,0.5)] pointer-events-none"></div>
  <div class="absolute inset-2 border border-fuchsia-500 rounded-lg pointer-events-none"></div>

  <!-- เนื้อหาหลักของแอป -->
  <div class="relative z-10 flex flex-col flex-grow p-6 text-white font-sans">
    
    <!-- ส่วนควบคุมหน้าต่าง (จะถูกวางไว้มุมขวาบน) -->
    <WindowControls />

    <!-- ชื่อ Preset (ส่วนหัว) -->
    <div class="text-center mt-4" data-tauri-drag-region>
      <input 
        type="text" 
        value="Default Preset"
        class="bg-transparent text-2xl font-bold text-center border-none focus:ring-0 focus:outline-none placeholder-gray-500 w-full"
        placeholder="ตั้งชื่อ Preset..."
      />
    </div>

    <!-- ส่วนแสดงผลหลัก -->
    <div class="flex-grow flex flex-col items-center justify-center space-y-8 mt-8">
      <!-- คอมโพเนนต์นับคะแนน Win -->
      <WinCounter />
      
      <!-- คอมโพเนนต์นับเป้าหมาย -->
      <GoalTracker />
    </div>

    <!-- ส่วนท้าย (สำหรับปุ่ม Preset, Settings) -->
    <div class="h-20 flex items-center justify-center space-x-4">
       <!-- Placeholder for future buttons -->
       <div class="w-12 h-12 bg-fuchsia-500/20 rounded-full border border-fuchsia-500"></div>
       <div class="w-12 h-12 bg-cyan-400/20 rounded-full border border-cyan-400"></div>
    </div>
  </div>
</main>

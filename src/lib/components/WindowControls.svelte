<script lang="ts">
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import { invoke } from '@tauri-apps/api/core';

  const appWindow = getCurrentWindow();

  // Animation states
  let minimizeAnimating = false;
  let closeAnimating = false;

  // ฟังก์ชันสำหรับย่อหน้าต่างพร้อมลูกเล่น
  async function minimizeWindow() {
    if (minimizeAnimating) return;
    minimizeAnimating = true;
    
    // เพิ่มเอฟเฟคก่อนย่อ
    const button = document.querySelector('.minimize-btn') as HTMLElement;
    if (button) {
      button.style.transform = 'scale(0.8) rotate(180deg)';
      button.style.transition = 'all 0.3s ease';
    }
    
    // เล่นเสียง (ถ้ามี)
    try {
      await invoke('play_test_sounds');
    } catch (e) {
      console.log('Sound not available');
    }
    
    // รอสักครู่แล้วย่อ
    setTimeout(() => {
      appWindow.minimize();
      minimizeAnimating = false;
    }, 300);
  }

  // ฟังก์ชันสำหรับซ่อนหน้าต่างพร้อมลูกเล่น
  async function hideWindow() {
    if (closeAnimating) return;
    closeAnimating = true;
    
    // เพิ่มเอฟเฟคก่อนซ่อน
    const button = document.querySelector('.close-btn') as HTMLElement;
    if (button) {
      button.style.transform = 'scale(0.8) rotate(90deg)';
      button.style.transition = 'all 0.3s ease';
    }
    
    // เล่นเสียง (ถ้ามี)
    try {
      await invoke('play_test_sounds');
    } catch (e) {
      console.log('Sound not available');
    }
    
    // รอสักครู่แล้วซ่อน
    setTimeout(() => {
      appWindow.hide();
      closeAnimating = false;
    }, 300);
  }
</script>

<div class="absolute top-3 right-4 flex space-x-2 z-20">
  <!-- Minimize Button -->
  <button 
    on:click={minimizeWindow} 
    class="minimize-btn w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 group"
    style="background: linear-gradient(135deg, #ffd700, #ffed4e); box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);"
  >
    <span class="font-black text-black text-lg group-hover:text-yellow-800 transition-colors">−</span>
    <div class="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 opacity-0 group-hover:opacity-20 transition-opacity"></div>
  </button>
  
  <!-- Close Button -->
  <button 
    on:click={hideWindow} 
    class="close-btn w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 group"
    style="background: linear-gradient(135deg, #ff4757, #ff3742); box-shadow: 0 4px 15px rgba(255, 71, 87, 0.3);"
  >
    <span class="font-black text-white text-lg group-hover:text-red-100 transition-colors">×</span>
    <div class="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 to-red-600 opacity-0 group-hover:opacity-20 transition-opacity"></div>
  </button>
</div>

<style>
  .minimize-btn:hover {
    box-shadow: 0 6px 20px rgba(255, 215, 0, 0.5) !important;
  }
  
  .close-btn:hover {
    box-shadow: 0 6px 20px rgba(255, 71, 87, 0.5) !important;
  }
  
  .minimize-btn:active {
    transform: scale(0.95) !important;
  }
  
  .close-btn:active {
    transform: scale(0.95) !important;
  }
</style>

<!-- ================================================================= -->
<!-- FILE: src/lib/components/WinCounter.svelte                        -->
<!-- ACTION: Agent ได้อัปเดตไฟล์นี้                                     -->
<!-- PURPOSE: แก้ไข path ของรูปภาพให้ถูกต้องตามโครงสร้างของ Tauri        -->
<!-- ================================================================= -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';

  let winCount: number = 0;

  onMount(async () => {
    // ดึงค่า win count ล่าสุดจาก Backend
    winCount = await invoke('get_initial_win_count');
  });

  async function handleIncrement() {
    winCount = await invoke('increment_win');
  }

  async function handleDecrement() {
    winCount = await invoke('decrement_win');
  }
</script>

<div class="w-full max-w-xs p-4 bg-black/30 rounded-xl border border-cyan-400/50 backdrop-blur-sm">
  <div class="flex items-center justify-center space-x-4">

    <button on:click={handleDecrement} class="flex items-center justify-center w-12 h-12 bg-red-500/50 rounded-full text-4xl font-light hover:bg-red-500 transition-colors">-</button>

    <!-- นี่คือวิธีที่ถูกต้องของ v2: ไฟล์ใน static folder -->
    <img 
      src="/assets/ui/app_crown.png" 
      alt="Crown Icon" 
      class="w-10 h-10 drop-shadow-[0_0_5px_rgba(250,204,21,0.7)]"
    />
    
    <div class="text-6xl font-bold text-white tracking-tighter w-24 text-center">
      {winCount}
    </div>

    <button on:click={handleIncrement} class="flex items-center justify-center w-12 h-12 bg-green-500/50 rounded-full text-4xl font-light hover:bg-green-500 transition-colors">+</button>

  </div>
</div>

<!-- FILE: src/lib/components/WinCounter.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { listen, type EventCallback } from '@tauri-apps/api/event';

  let winCount: number = 0;
  let unlistenIncrement: Function | null = null;
  let unlistenDecrement: Function | null = null;

  onMount(async () => {
    try {
      winCount = await invoke('get_initial_win_count');

      const incrementListener: EventCallback<null> = () => handleIncrement();
      unlistenIncrement = await listen('hotkey-increment', incrementListener);

      const decrementListener: EventCallback<null> = () => handleDecrement();
      unlistenDecrement = await listen('hotkey-decrement', decrementListener);
    } catch (e) {
      console.error("Error setting up WinCounter:", e);
    }
  });

  onDestroy(() => {
    if (unlistenIncrement) unlistenIncrement();
    if (unlistenDecrement) unlistenDecrement();
  });

  async function handleIncrement() {
    try {
      winCount = await invoke('increment_win');
    } catch (e) {
      console.error("Error incrementing win count:", e);
    }
  }

  async function handleDecrement() {
    try {
      winCount = await invoke('decrement_win');
    } catch (e) {
      console.error("Error decrementing win count:", e);
    }
  }
</script>

<!-- 
  Layout has been completely reworked for robustness.
  - Uses simple and predictable flexbox.
  - A dedicated container now constrains the icon's size.
-->
<div class="w-full max-w-xs p-4 bg-black/30 rounded-xl border border-cyan-400/50">
  <div class="flex items-center justify-between">
    
    <!-- Decrement Button -->
    <button on:click={handleDecrement} class="flex-shrink-0 flex items-center justify-center w-14 h-14 bg-red-500/50 rounded-full text-4xl font-light hover:bg-red-500 transition-colors">-</button>

    <!-- Center Group (Icon and Number) -->
    <div class="flex-grow flex items-center justify-center space-x-2">
      <!-- Icon container to constrain size - ขนาดเล็กสุดๆ -->
      <!-- ขนาดปัจจุบัน: w-1 h-1 (4px) - เล็กสุดๆ -->
      <!-- ตัวเลือกอื่น: w-2 h-2 (8px), w-4 h-4 (16px), w-6 h-6 (24px), w-8 h-8 (32px) -->
      <div class="w-1 h-1 flex items-center justify-center">
        <img 
          src="/assets/ui/app_crown.png" 
          alt="Crown Icon" 
          class="max-w-full max-h-full object-contain drop-shadow-[0_0_5px_rgba(250,204,21,0.7)]"
        />
      </div>
      <div class="text-6xl font-bold text-white tracking-tighter">
        {winCount}
      </div>
    </div>

    <!-- Increment Button -->
    <button on:click={handleIncrement} class="flex-shrink-0 flex items-center justify-center w-14 h-14 bg-green-500/50 rounded-full text-4xl font-light hover:bg-green-500 transition-colors">+</button>

  </div>
</div>

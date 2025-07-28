<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let show = false;
  export let title = 'เกิดข้อผิดพลาด';
  export let message = 'มีบางอย่างผิดพลาด กรุณาลองใหม่อีกครั้ง';
  export let type: 'error' | 'warning' | 'success' | 'info' = 'error';
  export let duration = 5000; // Auto hide after 5 seconds
  
  const dispatch = createEventDispatcher();
  
  let timeoutId: number | null = null;
  
  $: if (show && duration > 0) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      hide();
    }, duration);
  }
  
  function hide() {
    show = false;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    dispatch('close');
  }
  
  function getIcon() {
    switch (type) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      default: return '❌';
    }
  }
  
  function getBgColor() {
    switch (type) {
      case 'error': return 'bg-red-500/10 border-red-500/30';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/30';
      case 'success': return 'bg-green-500/10 border-green-500/30';
      case 'info': return 'bg-blue-500/10 border-blue-500/30';
      default: return 'bg-red-500/10 border-red-500/30';
    }
  }
  
  function getTextColor() {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'success': return 'text-green-400';
      case 'info': return 'text-blue-400';
      default: return 'text-red-400';
    }
  }
</script>

{#if show}
  <div class="fixed top-4 right-4 z-50 max-w-sm w-full animate-slide-in">
    <div class="relative p-4 rounded-lg border backdrop-blur-sm shadow-lg {getBgColor()}">
      <!-- Close button -->
      <button 
        on:click={hide}
        class="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors duration-200"
        aria-label="ปิดข้อความ"
      >
        ✕
      </button>
      
      <!-- Icon and content -->
      <div class="flex items-start space-x-3">
        <div class="text-2xl flex-shrink-0">
          {getIcon()}
        </div>
        
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-semibold {getTextColor()} mb-1">
            {title}
          </h3>
          <p class="text-sm text-gray-300 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
      
      <!-- Progress bar for auto-hide -->
      {#if duration > 0}
        <div class="mt-3 h-1 bg-gray-700/30 rounded-full overflow-hidden">
          <div 
            class="h-full bg-gradient-to-r from-transparent to-white/20 transition-all duration-300 ease-linear"
            style="width: 100%; animation: progress {duration}ms linear forwards;"
          />
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes progress {
    from { width: 100%; }
    to { width: 0%; }
  }
  
  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
</style> 
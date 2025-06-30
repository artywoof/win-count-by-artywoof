<!-- ================================================================= -->
<!-- FILE: src/lib/components/PresetManager.svelte                   -->
<!-- ACTION: Create this new file.                                   -->
<!-- PURPOSE: A placeholder component for the Preset Management UI.  -->
<!-- ================================================================= -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  function goBack() {
    dispatch('back');
  }
</script>

<div class="w-full h-full p-4 flex flex-col text-white">
  <!-- Header for the Preset Manager -->
  <header class="flex items-center justify-between flex-shrink-0" data-tauri-drag-region>
    <h1 class="text-2xl font-bold text-cyan-300">Preset Management</h1>
    <!-- Back Button -->
    <button on:click={goBack} class="text-gray-400 hover:text-white transition-colors" aria-label="ย้อนกลับ">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-8 h-8">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
    </button>
  </header>

  <!-- Content Area -->
  <div class="flex-grow flex items-center justify-center">
    <p class="text-gray-500">Preset management UI is under construction.</p>
  </div>
</div>

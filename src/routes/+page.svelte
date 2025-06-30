<!-- ================================================================= -->
<!-- FILE: src/routes/+page.svelte                                   -->
<!-- ACTION: Replace the entire content of this file.                -->
<!-- PURPOSE: A complete UI reset to establish a stable and correct  -->
<!--          foundation for the MAIN DESKTOP APP.                   -->
<!-- ================================================================= -->
<script lang="ts">
  // We will only import components. All logic will be inside them.
  import WindowControls from '$lib/components/WindowControls.svelte';
  import WinCounter from '$lib/components/WinCounter.svelte';
  import GoalTracker from '$lib/components/GoalTracker.svelte';
</script>

<div class="relative flex flex-col h-screen w-full select-none bg-gray-900/60 backdrop-blur-xl rounded-2xl overflow-hidden font-sans" data-tauri-drag-region>
  
  <!-- Borders -->
  <div class="absolute inset-0 border-2 border-cyan-400/80 rounded-2xl shadow-[0_0_25px_rgba(0,255,255,0.4)] pointer-events-none"></div>
  <div class="absolute inset-2 border border-fuchsia-500/70 rounded-lg pointer-events-none"></div>

  <!-- Main Content Area -->
  <div class="relative z-10 flex flex-col flex-grow w-full h-full">

    <!-- Header: Window Controls and Preset Name -->
    <header class="flex-shrink-0 h-16 px-4 flex items-center" data-tauri-drag-region>
      <div class="flex-grow">
        <!-- This empty div helps center the title -->
      </div>
      <div class="text-center">
        <input 
          type="text" 
          value="Default Preset"
          class="bg-transparent text-xl font-bold text-center text-white border-none focus:ring-0 focus:outline-none placeholder-gray-400 w-full"
          placeholder="ตั้งชื่อ Preset..."
        />
      </div>
      <div class="flex-grow flex justify-end">
        <WindowControls />
      </div>
    </header>

    <!-- Body: Counters -->
    <section class="flex-grow flex flex-col items-center justify-center space-y-8 px-6">
      <WinCounter />
      <GoalTracker />
    </section>

    <!-- Footer: Action Buttons -->
    <footer class="flex-shrink-0 h-24 flex items-center justify-center space-x-6">
       <!-- ปุ่ม Preset -->
       <button class="flex flex-col items-center justify-center text-cyan-300 hover:text-cyan-100 transition-colors group">
        <div class="w-14 h-14 flex items-center justify-center bg-cyan-500/10 rounded-full border-2 border-cyan-500/50 group-hover:bg-cyan-500/20 transition-colors">
          <img 
            src="/assets/ui/app_crown.png" 
            alt="Preset Icon" 
            class="w-7 h-7 object-contain"
          />
        </div>
        <span class="mt-1 text-xs font-semibold tracking-wider">PRESET</span>
       </button>

       <!-- ปุ่ม Settings -->
       <button class="flex flex-col items-center justify-center text-fuchsia-300 hover:text-fuchsia-100 transition-colors group">
        <div class="w-14 h-14 flex items-center justify-center bg-fuchsia-500/10 rounded-full border-2 border-fuchsia-500/50 group-hover:bg-fuchsia-500/20 transition-colors">
          <img 
            src="/assets/ui/app_crown.png" 
            alt="Settings Icon" 
            class="w-7 h-7 object-contain"
          />
        </div>
        <span class="mt-1 text-xs font-semibold tracking-wider">SETTINGS</span>
       </button>
    </footer>

  </div>
</div>

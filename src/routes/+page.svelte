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
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.115 5.115A9.75 9.75 0 0 1 12 3m0 0a9.75 9.75 0 0 1 5.885 2.115M12 3v18M12 21a9.75 9.75 0 0 1-5.885-2.115M12 21a9.75 9.75 0 0 0 5.885-2.115M3 12a9.75 9.75 0 0 1 2.115-5.885M3 12a9.75 9.75 0 0 0 2.115 5.885M21 12a9.75 9.75 0 0 0-2.115 5.885M21 12a9.75 9.75 0 0 1-2.115-5.885" />
          </svg>
        </div>
        <span class="mt-1 text-xs font-semibold tracking-wider">PRESET</span>
       </button>

       <!-- ปุ่ม Settings -->
       <button class="flex flex-col items-center justify-center text-fuchsia-300 hover:text-fuchsia-100 transition-colors group">
        <div class="w-14 h-14 flex items-center justify-center bg-fuchsia-500/10 rounded-full border-2 border-fuchsia-500/50 group-hover:bg-fuchsia-500/20 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.447.37.537.98.26 1.431l-1.296 2.247a1.125 1.125 0 0 1-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.075.124a6.57 6.57 0 0 1-.22.127c-.332.183-.582.495-.645.87l-.213 1.281c-.09.543-.56.94-1.11.94h-2.593c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 0 1-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 0 1-1.37-.49l-1.296-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.437-.995s-.145-.755-.437-.995l-1.004-.827a1.125 1.125 0 0 1-.26-1.431l1.296-2.247a1.125 1.125 0 0 1 1.37-.49l1.217.456c.355.133.75.072 1.075-.124.073-.044.146-.087.22-.127.332-.183.582-.495.645-.87l.213-1.281Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </div>
        <span class="mt-1 text-xs font-semibold tracking-wider">SETTINGS</span>
       </button>
    </footer>

  </div>
</div>

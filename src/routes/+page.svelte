<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import { browser } from '$app/environment';
  import { presetName } from '../lib/stores';
  import { savePreset, loadPreset, getLastUsedPreset, restoreDefaultPreset, listPresets, readPreset, writePreset, ensureDefaultPreset, saveLastUsedPreset } from '../lib/presetManager';
  import { listen, type UnlistenFn } from '@tauri-apps/api/event';
  import { invoke } from '@tauri-apps/api/core';
  import { getCurrentWindow } from '@tauri-apps/api/window';

  // State stores - these will be updated by Tauri events
  const win = writable(0);
  const goal = writable(10);
  const showGoal = writable(true);
  const showCrown = writable(true);
  const hotkeys = writable({ increase: 'Alt+Equal', decrease: 'Alt+Minus', step_size: 1 });
  const presets = writable<string[]>([]);
  const currentPreset = writable('Default');

  // UI state
  let showPresetManager = false;
  let showHotkeyConfig = false;
  let showSoundConfig = false;
  let newPresetName = '';
  let isCreatingPreset = false;

  let tauriAvailable = false;
  let unlisten: UnlistenFn | null = null;

  // Get current window instance
  const appWindow = getCurrentWindow();

  // Initialize Tauri connection and load initial state
  async function initializeTauri() {
    if (!browser) return;
    
    try {
      // Load initial state from Tauri
      const state = await invoke('get_win_state') as any;
      console.log('🎯 Loaded initial state from Tauri:', state);
      
      win.set(state.win || 0);
      goal.set(state.goal || 10);
      showGoal.set(state.show_goal !== false);
      showCrown.set(state.show_crown !== false);
      
      tauriAvailable = true;
      
      // Listen for state updates from Tauri
      unlisten = await listen('state-updated', (event) => {
        console.log('🎯 Received state update from Tauri:', event.payload);
        const state = event.payload as any;
        win.set(state.win || 0);
        goal.set(state.goal || 10);
        showGoal.set(state.show_goal !== false);
        showCrown.set(state.show_crown !== false);
        
        // Broadcast the update to overlay via BroadcastChannel
        if (overlayChannel) {
          overlayChannel.postMessage(state);
          console.log('📻 Broadcasted Tauri state to overlay:', state);
        }
      });
      
      // Listen for sound events from Tauri hotkeys
      await listen('play-increase-sound', () => {
        console.log('🔊 Playing increase sound from Tauri event');
        playIncreaseSound();
      });
      
      await listen('play-decrease-sound', () => {
        console.log('🔊 Playing decrease sound from Tauri event');
        playDecreaseSound();
      });
      
      console.log('✅ Tauri connection established');
    } catch (err) {
      console.error('❌ Failed to initialize Tauri:', err);
      tauriAvailable = false;
    }
  }

  let audioUp: HTMLAudioElement;
  let audioDown: HTMLAudioElement;

  function playIncreaseSound() {
    if (audioUp) {
      audioUp.currentTime = 0;
      audioUp.play();
    }
  }
  function playDecreaseSound() {
    if (audioDown) {
      audioDown.currentTime = 0;
      audioDown.play();
    }
  }

  // Tauri command wrappers
  async function tauriSetWin(value: number) {
    if (!tauriAvailable) return;
    try {
      const clampedValue = Math.max(-9999, Math.min(9999, Math.floor(value)));
      await invoke('set_win', { value: clampedValue });
      console.log('🎯 Win set via Tauri:', clampedValue);
    } catch (err) {
      console.error('❌ Failed to set win:', err);
    }
  }

  async function tauriSetGoal(value: number) {
    if (!tauriAvailable) return;
    try {
      const clampedValue = Math.max(-9999, Math.min(9999, Math.floor(value)));
      await invoke('set_goal', { value: clampedValue });
      console.log('🎯 Goal set via Tauri:', clampedValue);
    } catch (err) {
      console.error('❌ Failed to set goal:', err);
    }
  }

  async function tauriToggleGoal() {
    if (!tauriAvailable) return;
    try {
      await invoke('toggle_goal_visibility');
      console.log('🎯 Goal visibility toggled via Tauri');
    } catch (err) {
      console.error('❌ Failed to toggle goal visibility:', err);
    }
  }

  async function tauriToggleCrown() {
    if (!tauriAvailable) return;
    try {
      await invoke('toggle_crown_visibility');
      console.log('👑 Crown visibility toggled via Tauri');
    } catch (err) {
      console.error('❌ Failed to toggle crown visibility:', err);
    }
  }

  async function copyOverlayLink() {
    if (!tauriAvailable) return;
    try {
      const url = await invoke('copy_overlay_link');
      console.log('📋 Overlay link copied:', url);
      alert(`Overlay link copied to clipboard:\n${url}`);
    } catch (err) {
      console.error('❌ Failed to copy overlay link:', err);
      alert('Failed to copy overlay link to clipboard');
    }
  }

  async function hide_to_tray() {
    if (!tauriAvailable) return;
    try {
      await appWindow.hide();
      console.log('🫥 App hidden to tray');
    } catch (err) {
      console.error('❌ Failed to hide to tray:', err);
    }
  }

  // Window control functions
  async function minimize_app() {
    if (!browser || !tauriAvailable) return;
    try {
      await appWindow.minimize();
      console.log('🔽 Window minimized');
    } catch (err) {
      console.error('❌ Failed to minimize window:', err);
    }
  }

  // Preset Management Functions
  async function loadPresetsList() {
    try {
      const presetList = await invoke('load_presets') as Array<{name: string}>;
      const names = presetList.map(p => p.name);
      if (!names.includes('Default')) {
        names.unshift('Default');
      }
      presets.set(names);
      console.log('📋 Loaded presets:', names);
    } catch (err) {
      console.error('❌ Failed to load presets:', err);
      presets.set(['Default']);
    }
  }

  async function loadPresetToUI(presetName: string) {
    try {
      const preset = await invoke('load_preset', { name: presetName });
      currentPreset.set(presetName);
      await saveLastUsedPreset(presetName);
      console.log('✅ Loaded preset to UI:', presetName);
    } catch (err) {
      console.error('❌ Failed to load preset:', err);
    }
  }

  async function createNewPreset() {
    if (!newPresetName.trim()) return;
    if ($presets.includes(newPresetName.trim())) {
      alert('A preset with this name already exists!');
      return;
    }
    if ($presets.length >= 10) {
      alert('Maximum 10 presets allowed. Delete a preset first.');
      return;
    }

    try {
      const presetData = {
        name: newPresetName.trim(),
        win: $win,
        goal: $goal,
        show_goal: $showGoal,
        show_crown: $showCrown,
        hotkeys: $hotkeys
      };
      
      await invoke('save_preset', { preset: presetData });
      await loadPresetsList();
      await loadPresetToUI(newPresetName.trim());
      newPresetName = '';
      isCreatingPreset = false;
      showPresetManager = false;
      console.log('✅ Created new preset:', presetData.name);
    } catch (err) {
      console.error('❌ Failed to create preset:', err);
      alert('Failed to create preset');
    }
  }

  async function deletePreset(presetName: string) {
    if (presetName === 'Default') {
      alert('Cannot delete the Default preset!');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete preset "${presetName}"?`)) {
      return;
    }

    try {
      await invoke('delete_preset', { name: presetName });
      await loadPresetsList();
      
      // If deleted preset was active, switch to Default
      if ($currentPreset === presetName) {
        await loadPresetToUI('Default');
      }
      
      console.log('🗑️ Deleted preset:', presetName);
    } catch (err) {
      console.error('❌ Failed to delete preset:', err);
      alert('Failed to delete preset');
    }
  }

  // Sound Functions
  async function testSounds() {
    try {
      await invoke('play_test_sounds');
      console.log('🔊 Playing test sounds');
    } catch (err) {
      console.error('❌ Failed to play test sounds:', err);
    }
  }

  async function uploadCustomSound(type: 'increase' | 'decrease') {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.mp3';
    
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file && file.type === 'audio/mpeg') {
        try {
          const url = URL.createObjectURL(file);
          if (type === 'increase') {
            audioUp.src = url;
          } else {
            audioDown.src = url;
          }
          console.log(`🔊 Uploaded custom ${type} sound`);
          alert(`Custom ${type} sound uploaded successfully!`);
        } catch (err) {
          console.error('❌ Failed to upload sound:', err);
          alert('Failed to upload sound file');
        }
      } else {
        alert('Please select a valid MP3 file');
      }
    };
    
    input.click();
  }

  // Input handling
  let isTypingWin = false;
  let winInputValue = '5';

  function handleWinInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let rawValue = input.value;
    
    if (rawValue === '' || rawValue === '-') {
      winInputValue = rawValue;
      return;
    }
    
    let newValue = parseInt(rawValue) || 0;
    newValue = Math.max(-9999, Math.min(9999, newValue));
    
    winInputValue = newValue.toString();
    tauriSetWin(newValue);
  }

  function handleWinFocus(event: Event) {
    const input = event.target as HTMLInputElement;
    isTypingWin = true;
    input.select();
  }

  function handleWinBlur(event: Event) {
    const input = event.target as HTMLInputElement;
    isTypingWin = false;
    if (input.value === '' || input.value === '-') {
      const fallbackValue = 0;
      winInputValue = fallbackValue.toString();
      tauriSetWin(fallbackValue);
    }
  }

  function handleWinKeydown(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab'].includes(event.key)) {
      return;
    }
    
    if (['Backspace', 'Delete'].includes(event.key)) {
      return;
    }
    
    if (event.key === '-') {
      if (input.selectionStart !== 0 || input.value.includes('-')) {
        event.preventDefault();
      }
      return;
    }
    
    if (event.key >= '0' && event.key <= '9') {
      if (input.selectionStart === 0 && input.selectionEnd === input.value.length) {
        input.value = '';
        winInputValue = '';
      }
    }
  }

  $: if (!isTypingWin) {
    winInputValue = $win.toString();
  }

  let isTypingGoal = false;
  let goalInputValue = '10';

  function handleGoalInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let rawValue = input.value;
    
    if (rawValue === '' || rawValue === '-') {
      goalInputValue = rawValue;
      return;
    }
    
    let newValue = parseInt(rawValue) || 0;
    newValue = Math.max(-9999, Math.min(9999, newValue));
    
    goalInputValue = newValue.toString();
    tauriSetGoal(newValue);
  }

  function handleGoalFocus(event: Event) {
    const input = event.target as HTMLInputElement;
    isTypingGoal = true;
    input.select();
  }

  function handleGoalBlur(event: Event) {
    const input = event.target as HTMLInputElement;
    isTypingGoal = false;
    if (input.value === '') {
      const fallbackValue = 10;
      goalInputValue = fallbackValue.toString();
      tauriSetGoal(fallbackValue);
    }
  }

  function handleGoalKeydown(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab', 'Backspace', 'Delete'].includes(event.key)) {
      return;
    }
    
    if (event.key === '-') {
      if (input.selectionStart !== 0 || input.value.includes('-')) {
        event.preventDefault();
      }
      return;
    }
    
    if (event.key >= '0' && event.key <= '9') {
      if (input.selectionStart === 0 && input.selectionEnd === input.value.length) {
        input.value = '';
        goalInputValue = '';
      }
    }
  }

  $: if (!isTypingGoal) {
    goalInputValue = $goal.toString();
  }

  // BroadcastChannel for overlay communication
  let overlayChannel: BroadcastChannel | null = null;

  function initOverlayChannel() {
    if (!browser) return;
    try {
      overlayChannel = new BroadcastChannel('win-count-overlay');
      console.log('📻 BroadcastChannel initialized for overlay communication');
    } catch (err) {
      console.error('❌ Failed to initialize BroadcastChannel:', err);
    }
  }

  // Initialize everything on mount
  onMount(async () => {
    console.log('✅ App initializing...');
    
    // Initialize audio elements
    try {
      audioUp = new Audio('/assets/sfx/increase.mp3');
      audioDown = new Audio('/assets/sfx/decrease.mp3');
      console.log('🔊 Audio elements initialized');
    } catch (err) {
      console.error('❌ Failed to initialize audio:', err);
    }
    
    // Initialize BroadcastChannel
    initOverlayChannel();
    
    // Initialize Tauri connection
    await initializeTauri();
    
    // Load presets
    try {
      await ensureDefaultPreset();
      await loadPresetsList();
      
      // Load last used preset or default
      const lastPreset = await getLastUsedPreset();
      if (lastPreset && lastPreset !== 'Default') {
        await loadPresetToUI(lastPreset);
      } else {
        await loadPresetToUI('Default');
      }
    } catch (err) {
      console.error('❌ Failed to load presets:', err);
    }
    
    console.log('✅ App initialization complete');
  });

  onDestroy(() => {
    if (unlisten) {
      unlisten();
    }
    if (overlayChannel) {
      overlayChannel.close();
    }
  });

  // Keyboard shortcuts (as backup for when global shortcuts fail)
  function handleKeydown(event: KeyboardEvent) {
    if (event.target instanceof HTMLInputElement) return;
    
    if (event.altKey && (event.key === '=' || event.key === '+' || event.code === 'Equal')) {
      event.preventDefault();
      // No need for increase function since we removed the buttons
    } else if (event.altKey && (event.key === '-' || event.code === 'Minus')) {
      event.preventDefault();
      // No need for decrease function since we removed the buttons
    }
  }
</script>

<!-- Audio elements for sound effects -->
<audio bind:this={audioUp} preload="auto">
  <source src="/assets/sfx/increase.mp3" type="audio/mpeg" />
</audio>
<audio bind:this={audioDown} preload="auto">
  <source src="/assets/sfx/decrease.mp3" type="audio/mpeg" />
</audio>

<svelte:window on:keydown={handleKeydown} />

<div class="w-full h-full relative">
  <div class="w-full h-full relative">

      <!-- Window Controls -->
      <div class="absolute top-2 left-15 z-50">
        <button on:click={() => appWindow.minimize()} class="w-9 h-9 bg-red-600 text-white rounded-lg shadow-[0_0_8px_#0066ff] hover:shadow-[0_0_16px_#0066ff] hover:bg-blue-500 transition-all no-drag flex items-center justify-center" style="-webkit-app-region: no-drag; text-shadow: 0 0 4px #fff;">
          <span class="text-lg font-bold">−</span>
        </button>
      </div>
      <div class="absolute top-2 right-2 z-50">
        <button on:click={hide_to_tray} class="w-8 h-8 bg-red-600 text-white rounded-lg shadow-[0_0_8px_#ff3333] hover:shadow-[0_0_16px_#ff3333] hover:bg-red-500 transition-all no-drag flex items-center justify-center" style="-webkit-app-region: no-drag; text-shadow: 0 0 4px #fff;">
          <span class="text-lg font-bold">×</span>
        </button>
      </div>

      <!-- Header - "PRESET" -->
      <h1 class="absolute top-[45px] left-1/2 transform -translate-x-1/2 font-bold text-[80px]" style="-webkit-app-region: drag; color: #ff00cc !important;">
        PRESET
      </h1>

      <!-- Icon + Number Box Container -->
      <div class="absolute top-[210px] left-1/2 transform -translate-x-1/2 w-[420px] h-[180px] rounded-lg border border-blue-500 shadow-[0_0_12px_#0066ff44] p-4">
        <div class="flex gap-4 h-full">
          {#if $showCrown}
          <div class="w-[180px] h-full rounded-lg border border-yellow-400 shadow-[0_0_8px_#ffff0044] flex items-center justify-center">
            <img src="/assets/ui/app_crown.png" alt="Crown Icon" class="w-[160px] h-[160px] object-contain" />
          </div>
          {/if}
          <div class="flex-1 h-full rounded-lg border border-cyan-400 shadow-[0_0_8px_#00ffff44] flex items-center justify-center no-drag">
            <input 
              type="text" 
              bind:value={winInputValue}
              on:input={handleWinInput}
              on:focus={handleWinFocus}
              on:blur={handleWinBlur}
              on:keydown={handleWinKeydown}
              class="bg-transparent border-none outline-none text-center font-bold text-[50px] w-full h-full no-drag"
              style="color: #00ffff !important; text-shadow: 0 0 8px #00ffff, 0 0 16px #00ffff, 0 0 24px #00ffff !important;"
            />
          </div>
        </div>
      </div>

      <!-- GOAL Label + Input -->
      <div class="absolute top-[406px] left-1/2 transform -translate-x-1/2 w-[420px] h-[55px] rounded-lg border border-blue-500 shadow-[0_0_8px_#0066ff44] flex items-center px-6">
        <label for="goal-input" class="text-[32px] font-bold mr-6" style="color: #ff00cc !important; text-shadow: 0 0 8px #ff00cc, 0 0 16px #ff00cc !important;">GOAL:</label>
        <input 
          id="goal-input"
          bind:value={goalInputValue}
          on:input={handleGoalInput}
          on:focus={handleGoalFocus}
          on:blur={handleGoalBlur}
          on:keydown={handleGoalKeydown}
          class="flex-1 h-[40px] rounded-md bg-transparent border border-cyan-400 text-center text-[24px] no-drag outline-none shadow-[0_0_6px_#00ffff44] ml-auto"
          style="color: #00ffff !important; text-shadow: 0 0 8px #00ffff, 0 0 16px #00ffff !important; width: 100px;"
        />
      </div>

      <!-- PRESET Button -->
      <div class="absolute top-[479px] left-1/2 transform -translate-x-1/2">
        <button
          class="w-[420px] h-[70px] rounded-lg border border-pink-500 font-bold text-[48px] shadow-[0_0_12px_#ff00cc44] bg-transparent hover:bg-pink-500 hover:text-white transition-all no-drag"
          style="color: #ff00cc !important; text-shadow: 0 0 8px #ff00cc, 0 0 16px #ff00cc !important;"
          on:click={() => showPresetManager = !showPresetManager}
        >
          PRESET
        </button>
      </div>

      <!-- Switch Section (ICON + GOAL) -->
      <div class="absolute bottom-[86px] left-1/2 transform -translate-x-1/2 w-[420px] h-[146px] rounded-lg border border-purple-500 shadow-[0_0_12px_#8b5cf644] py-8 px-6 flex items-center">
        <div class="flex flex-col gap-10 w-full">
          <div class="flex justify-between items-center">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="text-[38px] font-bold" style="color: #ff00cc !important; text-shadow: 0 0 8px #ff00cc, 0 0 16px #ff00cc !important;">ICON</label>
            <button
              class="relative w-[80px] h-[40px] rounded-full border-2 transition-all duration-300 {$showCrown ? 'border-cyan-400 bg-cyan-400 shadow-[0_0_8px_#00ffff]' : 'border-gray-600 bg-gray-800'} no-drag"
              on:click={tauriToggleCrown}
              aria-label="Toggle crown icon display"
            >
              <div class="absolute w-[32px] h-[32px] rounded-full transition-all duration-300 top-[2px] {$showCrown ? 'left-[44px] bg-gray-800 shadow-[0_0_6px_#00ffff]' : 'left-[2px] bg-gray-600'}"></div>
            </button>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-[38px] font-bold" style="color: #ff00cc !important; text-shadow: 0 0 8px #ff00cc, 0 0 16px #ff00cc !important;">GOAL</span>
            <button
              class="relative w-[80px] h-[40px] rounded-full border-2 transition-all duration-300 {$showGoal ? 'border-cyan-400 bg-cyan-400 shadow-[0_0_8px_#00ffff]' : 'border-gray-600 bg-gray-800'} no-drag"
              on:click={tauriToggleGoal}
              aria-label="Toggle goal display"
            >
              <div class="absolute w-[32px] h-[32px] rounded-full transition-all duration-300 top-[2px] {$showGoal ? 'left-[44px] bg-gray-800 shadow-[0_0_6px_#00ffff]' : 'left-[2px] bg-gray-600'}"></div>
            </button>
          </div>
        </div>
      </div>

      <!-- HOTKEY Button (Bottom) -->
      <div class="absolute bottom-[15px] left-1/2 transform -translate-x-1/2">
        <button
          class="w-[250px] h-[55px] rounded-lg border border-[#8b5cf6] font-bold text-[20px] shadow-[0_0_8px_#8b5cf644] bg-transparent hover:bg-[#8b5cf6] hover:text-white transition-all no-drag"
          style="color: #8b5cf6 !important; text-shadow: 0 0 8px #8b5cf6, 0 0 16px #8b5cf6 !important;"
          on:click={() => showHotkeyConfig = !showHotkeyConfig}
        >
          HOTKEY
        </button>
      </div>

      <!-- Preset Manager Modal -->
  {#if showPresetManager}
    <!-- BACKUP: Glass-style backdrop layer -->
    <!-- <div class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"> -->
    <div class="fixed inset-0 flex items-center justify-center z-50">
      <div class="bg-[#0F0F2A] border-2 border-[#00FFE5] rounded-[16px] p-6 max-w-[350px] w-full mx-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-[#00FFE5] text-xl font-bold">Manage Presets</h3>
          <button
            class="text-[#FF3B3B] hover:text-white text-xl"
            on:click={() => showPresetManager = false}
          >
            ✕
          </button>
        </div>
        
        <div class="space-y-3 max-h-[200px] overflow-y-auto mb-4">
          {#each $presets as preset}
            <div class="flex items-center justify-between p-3 bg-[#1a1a3a] rounded-lg border border-[#333]">
              <span class="text-[#00FFE5] font-medium">{preset}</span>
              <div class="flex gap-2">
                <button
                  class="px-3 py-1 text-sm bg-[#00FFE5] text-black rounded hover:bg-[#00DD00] transition-all"
                  on:click={() => { loadPresetToUI(preset); showPresetManager = false; }}
                >
                  Load
                </button>
                {#if preset !== 'Default'}
                  <button
                    class="text-[#FF3B3B] hover:text-white text-sm px-2"
                    on:click={() => deletePreset(preset)}
                  >
                    🗑️
                  </button>
                {/if}
              </div>
            </div>
          {/each}
        </div>
        
        {#if $presets.length < 10}
          {#if !isCreatingPreset}
            <button
              class="w-full py-3 border-2 border-[#00FF00] text-[#00FF00] bg-transparent hover:bg-[#00FF00] hover:text-black transition-all rounded-lg font-bold"
              on:click={() => isCreatingPreset = true}
            >
              + New Preset
            </button>
          {:else}
            <div class="flex gap-2">
              <input
                type="text"
                bind:value={newPresetName}
                placeholder="Preset name"
                class="flex-1 px-3 py-2 bg-[#1a1a3a] border-2 border-[#00FFE5] text-[#00FFE5] rounded-lg outline-none focus:border-[#FF00CC] transition-all"
                maxlength="20"
              />
              <button
                class="px-4 py-2 bg-[#00FF00] text-black rounded-lg hover:bg-[#00DD00] font-bold"
                on:click={createNewPreset}
              >
                ✓
              </button>
              <button
                class="px-4 py-2 bg-[#FF3B3B] text-white rounded-lg hover:bg-[#DD3333] font-bold"
                on:click={() => { isCreatingPreset = false; newPresetName = ''; }}
              >
                ✕
              </button>
            </div>
          {/if}
        {:else}
          <p class="text-[#FFD600] text-sm text-center font-medium">Maximum 10 presets reached</p>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Hotkey Config Modal -->
  {#if showHotkeyConfig}
    <!-- BACKUP: Glass-style backdrop layer -->
    <!-- <div class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"> -->
    <div class="fixed inset-0 flex items-center justify-center z-50">
      <div class="bg-[#0F0F2A] border-2 border-[#6B46C1] rounded-[16px] p-6 max-w-[350px] w-full mx-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-[#6B46C1] text-xl font-bold">Hotkey Settings</h3>
          <button
            class="text-[#FF3B3B] hover:text-white text-xl"
            on:click={() => showHotkeyConfig = false}
          >
            ✕
          </button>
        </div>
        
        <div class="space-y-4">
          <div class="space-y-2">
            <div class="flex justify-between items-center p-3 bg-[#1a1a3a] rounded-lg">
              <span class="text-[#00FFE5] text-sm">Increase (+1):</span>
              <span class="text-[#FFD600] text-sm font-mono">Alt + =</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-[#1a1a3a] rounded-lg">
              <span class="text-[#00FFE5] text-sm">Decrease (-1):</span>
              <span class="text-[#FFD600] text-sm font-mono">Alt + -</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-[#1a1a3a] rounded-lg">
              <span class="text-[#00FFE5] text-sm">Increase (+10):</span>
              <span class="text-[#FFD600] text-sm font-mono">Shift + Alt + =</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-[#1a1a3a] rounded-lg">
              <span class="text-[#00FFE5] text-sm">Decrease (-10):</span>
              <span class="text-[#FFD600] text-sm font-mono">Shift + Alt + -</span>
            </div>
          </div>
          
          <div class="text-center text-xs text-gray-400 space-y-1">
            <p>Hotkeys work globally when app is running.</p>
            <p>Use Shift modifier for +10/-10 steps.</p>
            <button
              class="mt-2 px-4 py-1 border border-[#FFD600] text-[#FFD600] bg-transparent hover:bg-[#FFD600] hover:text-black transition-all rounded text-xs"
              on:click={() => { showHotkeyConfig = false; showSoundConfig = true; }}
            >
              🔊 Sound Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Sound Config Modal -->
  {#if showSoundConfig}
    <!-- BACKUP: Glass-style backdrop layer -->
    <!-- <div class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"> -->
    <div class="fixed inset-0 flex items-center justify-center z-50">
      <div class="bg-[#0F0F2A] border-2 border-[#FFD600] rounded-[16px] p-6 max-w-[350px] w-full mx-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-[#FFD600] text-xl font-bold">Sound Settings</h3>
          <button
            class="text-[#FF3B3B] hover:text-white text-xl"
            on:click={() => showSoundConfig = false}
          >
            ✕
          </button>
        </div>
        
        <div class="space-y-4">
          <button
            class="w-full py-3 border-2 border-[#00FF00] text-[#00FF00] bg-transparent hover:bg-[#00FF00] hover:text-black transition-all rounded-lg font-bold"
            on:click={testSounds}
          >
            🔊 Test Sounds
          </button>
          
          <div class="space-y-2">
            <button
              class="w-full py-2 border border-[#00FFE5] text-[#00FFE5] bg-transparent hover:bg-[#00FFE5] hover:text-black transition-all rounded-lg text-sm"
              on:click={() => uploadCustomSound('increase')}
            >
              📁 Upload Win Sound (.mp3)
            </button>
            <button
              class="w-full py-2 border border-[#FF3B3B] text-[#FF3B3B] bg-transparent hover:bg-[#FF3B3B] hover:text-white transition-all rounded-lg text-sm"
              on:click={() => uploadCustomSound('decrease')}
            >
              📁 Upload Lose Sound (.mp3)
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
  </div>
</div>

<style>
  .gradient-border {
    position: relative;
    box-shadow: 0 0 30px rgba(255, 0, 204, 0.6);
  }
  
  .gradient-border::before {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    background: linear-gradient(45deg, #ff00cc, #00ffff, #8b5cf6, #ff00cc);
    border-radius: inherit;
    z-index: -1;
  }

  @font-face {
    font-family: 'MiSansThai';
    src: url('/assets/fonts/MiSansThaiVF.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }
  :global(body) {
    font-family: 'MiSansThai', sans-serif;
  }
</style>

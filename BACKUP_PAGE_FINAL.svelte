<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import { browser } from '$app/environment';
  import { listen, type UnlistenFn } from '@tauri-apps/api/event';
  import { invoke } from '@tauri-apps/api/core';
  import { getCurrentWindow } from '@tauri-apps/api/window';

  // State stores - these will be updated by Tauri events
  const win = writable(0);
  const goal = writable(10);
  const showGoal = writable(true);
  const showCrown = writable(true);
  const presets = writable<string[]>([]);
  const currentPreset = writable('Default');

  // UI state
  let showSettingsModal = false;
  let showPresetModal = false;
  
  // Preset editing state
  let editingPreset = null;
  let newPresetName = '';

  let tauriAvailable = false;
  let unlisten: UnlistenFn | null = null;
  let audioUp: HTMLAudioElement;
  let audioDown: HTMLAudioElement;

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
          console.log('📻 Broadcasted state to overlay:', state);
        }
      });
      
      // Listen for hotkey events
      await listen('hotkey-increment', () => {
        console.log('🎯 Hotkey increment received');
        increaseWin(1);
      });
      
      await listen('hotkey-decrement', () => {
        console.log('🎯 Hotkey decrement received');
        decreaseWin(1);
      });
      
      await listen('hotkey-increment-10', () => {
        console.log('🎯 Hotkey increment +10 received');
        increaseWin(10);
      });
      
      await listen('hotkey-decrement-10', () => {
        console.log('🎯 Hotkey decrement -10 received');
        decreaseWin(10);
      });
      
      console.log('✅ Tauri connection established');
    } catch (err) {
      console.error('❌ Failed to initialize Tauri:', err);
      tauriAvailable = false;
    }
  }

  // Sound functions
  function playIncreaseSound() {
    if (audioUp) {
      audioUp.currentTime = 0;
      audioUp.play().catch(console.error);
    }
  }

  function playDecreaseSound() {
    if (audioDown) {
      audioDown.currentTime = 0;
      audioDown.play().catch(console.error);
    }
  }

  // Main win count functions
  async function increaseWin(amount: number = 1) {
    const newValue = Math.min(9999, $win + amount);
    if (newValue !== $win) {
      await tauriSetWin(newValue);
      playIncreaseSound();
    }
  }

  async function decreaseWin(amount: number = 1) {
    const newValue = Math.max(-9999, $win - amount);
    if (newValue !== $win) {
      await tauriSetWin(newValue);
      playDecreaseSound();
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
      await invoke('toggle_goal');
      console.log('🎯 Goal visibility toggled via Tauri');
    } catch (err) {
      console.error('❌ Failed to toggle goal visibility:', err);
    }
  }

  async function tauriToggleCrown() {
    if (!tauriAvailable) return;
    try {
      await invoke('toggle_crown');
      console.log('👑 Crown visibility toggled via Tauri');
    } catch (err) {
      console.error('❌ Failed to toggle crown visibility:', err);
    }
  }

  async function copyOverlayLink() {
    const overlayUrl = 'http://localhost:5173/overlay';
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(overlayUrl);
        alert(`Overlay link copied to clipboard:\n${overlayUrl}`);
      } catch (err) {
        alert(`Please copy this overlay link:\n${overlayUrl}`);
      }
    } else {
      alert(`Please copy this overlay link:\n${overlayUrl}`);
    }
  }

  // Preset management functions
  async function loadPresets() {
    try {
      // Load from presets directory
      const presetFiles = ['Default', 'REPO']; // For now, hardcoded list
      presets.set(presetFiles);
    } catch (err) {
      console.error('❌ Failed to load presets:', err);
      presets.set(['Default']);
    }
  }

  async function loadPreset(presetName: string) {
    try {
      // Here you would normally load from file, for now use hardcoded data
      let presetData;
      if (presetName === 'REPO') {
        presetData = { win: 0, goal: 50, showCrown: true, showGoal: true };
      } else {
        presetData = { win: 0, goal: 10, showCrown: true, showGoal: true };
      }
      
      // Apply preset data
      await tauriSetWin(presetData.win);
      await tauriSetGoal(presetData.goal);
      showCrown.set(presetData.showCrown);
      showGoal.set(presetData.showGoal);
      currentPreset.set(presetName);
      
      console.log(`✅ Loaded preset: ${presetName}`);
    } catch (err) {
      console.error('❌ Failed to load preset:', err);
    }
  }

  async function saveCurrentAsPreset() {
    if (!newPresetName.trim()) return;
    
    try {
      const presetData = {
        presetName: newPresetName,
        win: $win,
        goal: $goal,
        showCrown: $showCrown,
        showGoal: $showGoal
      };
      
      // Add to presets list if not already there
      const currentPresets = $presets;
      if (!currentPresets.includes(newPresetName)) {
        presets.set([...currentPresets, newPresetName]);
      }
      
      console.log(`✅ Saved preset: ${newPresetName}`);
      newPresetName = '';
      showPresetModal = false;
    } catch (err) {
      console.error('❌ Failed to save preset:', err);
    }
  }

  async function deletePreset(presetName: string) {
    if (presetName === 'Default') {
      alert('ไม่สามารถลบ Preset เริ่มต้นได้');
      return;
    }
    
    if (confirm(`คุณต้องการลบ Preset "${presetName}" หรือไม่?`)) {
      try {
        const currentPresets = $presets.filter(p => p !== presetName);
        presets.set(currentPresets);
        
        if ($currentPreset === presetName) {
          await loadPreset('Default');
        }
        
        console.log(`✅ Deleted preset: ${presetName}`);
      } catch (err) {
        console.error('❌ Failed to delete preset:', err);
      }
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
    await loadPresets();
    
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
</script>

<!-- Audio elements for sound effects -->
<audio bind:this={audioUp} preload="auto">
  <source src="/assets/sfx/increase.mp3" type="audio/mpeg" />
</audio>
<audio bind:this={audioDown} preload="auto">
  <source src="/assets/sfx/decrease.mp3" type="audio/mpeg" />
</audio>

<div class="control-app">
  <!-- Window Controls -->
  <div class="window-controls-left">
    <button on:click={minimize_app} class="window-btn minimize-btn" title="Minimize">−</button>
  </div>
  <div class="window-controls-right">
    <button on:click={hide_to_tray} class="window-btn close-btn" title="Hide to Tray">×</button>
  </div>

  <!-- Main Content -->
  <div class="main-content">
    <!-- App Title -->
    <h1 class="app-title">PRESET</h1>
    
    <!-- Win Counter Section -->
    <div class="counter-section">
      <div class="counter-display">
        <div class="counter-content">
          {#if $showCrown}
            <div class="crown-container">
              <img src="/assets/ui/app_crown.png" alt="Crown" class="crown-icon" />
            </div>
          {/if}
          <div class="win-number-container">
            <div class="win-number">{$win}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Goal Section -->
    {#if $showGoal}
      <div class="goal-container">
        <span class="goal-label">GOAL:</span>
        <div class="goal-number-box">
          <span class="goal-value">{$goal}</span>
        </div>
      </div>
    {/if}

    <!-- Action Buttons -->
    <div class="action-section">
      <!-- Preset Button -->
      <button class="preset-btn" on:click={() => showPresetModal = true}>
        PRESET
      </button>

      <!-- Donate Button -->
      <button class="donate-btn" on:click={() => console.log('Donate clicked - logic to be added later')}>
        DONATE
      </button>

      <!-- Toggle Controls -->
      <div class="toggle-container">
        <div class="toggle-controls">
          <!-- Icon Toggle -->
          <div class="toggle-row">
            <span class="toggle-label">ICON</span>
            <button 
              class="toggle-switch {$showCrown ? 'active' : ''}"
              on:click={toggleIcon}
              role="switch"
              aria-checked={$showCrown}
              tabindex="0"
            >
              <div class="toggle-knob"></div>
            </button>
          </div>

          <!-- Divider -->
          <div class="toggle-divider"></div>

          <!-- Goal Toggle -->
          <div class="toggle-row goal-toggle-row">
            <span class="toggle-label">GOAL</span>
            <button 
              class="toggle-switch {$showGoal ? 'active' : ''}"
              on:click={toggleGoal}
              role="switch"
              aria-checked={$showGoal}
              tabindex="0"
            >
              <div class="toggle-knob"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Bottom Action Buttons -->
  <div class="bottom-actions" style="margin-top: -69px;">
    <button class="action-btn secondary settings-btn" on:click={() => showSettingsModal = true}>
      Setting
    </button>
    <button class="action-btn secondary copy-btn" on:click={copyLink}>
      Copy Link
    </button>
  </div>

  <!-- Settings Modal (Combined Hotkeys + Sounds) -->
  {#if showSettingsModal}
    <div class="modal-backdrop" on:click={() => showSettingsModal = false} on:keydown={(e) => e.key === 'Escape' && (showSettingsModal = false)} role="button" tabindex="0">
      <div class="modal" on:click|stopPropagation role="dialog" aria-labelledby="settings-title">
        <div class="modal-header">
          <h3 id="settings-title">ตั้งค่า</h3>
          <button class="modal-close" on:click={() => showSettingsModal = false}>×</button>
        </div>
        <div class="modal-body">
          <!-- Hotkey Section -->
          <div class="settings-group">
            <h4 class="settings-group-title">⌨️ ปุ่มลัด</h4>
            <div class="hotkey-list">
              <div class="hotkey-row">
                <span>เพิ่ม (+1):</span>
                <kbd>Alt + =</kbd>
              </div>
              <div class="hotkey-row">
                <span>ลด (-1):</span>
                <kbd>Alt + -</kbd>
              </div>
              <div class="hotkey-row">
                <span>เพิ่ม (+10):</span>
                <kbd>Alt + Shift + =</kbd>
              </div>
              <div class="hotkey-row">
                <span>ลด (-10):</span>
                <kbd>Alt + Shift + -</kbd>
              </div>
            </div>
            <p class="settings-note">
              ปุ่มลัดจะทำงานแม้แอพจะถูกย่อหรือซ่อนไว้ใน System Tray
            </p>
          </div>

          <!-- Sound Section -->
          <div class="settings-group">
            <h4 class="settings-group-title">🔊 เสียงเอฟเฟกต์</h4>
            <div class="sound-controls">
              <button on:click={playIncreaseSound} class="sound-btn test">
                🔊 ทดสอบเสียงเพิ่ม
              </button>
              <button on:click={playDecreaseSound} class="sound-btn test">
                🔊 ทดสอบเสียงลด
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Preset Modal -->
  {#if showPresetModal}
    <div class="modal-backdrop" on:click={() => showPresetModal = false} on:keydown={(e) => e.key === 'Escape' && (showPresetModal = false)} role="button" tabindex="0">
      <div class="modal preset-modal" on:click|stopPropagation role="dialog" aria-labelledby="preset-title">
        <div class="modal-header">
          <h3 id="preset-title">📁 จัดการ PRESET</h3>
          <button class="modal-close" on:click={() => showPresetModal = false}>×</button>
        </div>
        <div class="modal-body">
          <!-- Current Preset -->
          <div class="settings-group">
            <h4 class="settings-group-title">Preset ปัจจุบัน: {$currentPreset}</h4>
          </div>

          <!-- Preset List -->
          <div class="settings-group">
            <h4 class="settings-group-title">📋 รายการ Preset</h4>
            <div class="preset-list">
              {#each $presets as preset}
                <div class="preset-item">
                  <div class="preset-info">
                    <span class="preset-name">{preset}</span>
                    {#if preset === $currentPreset}
                      <span class="preset-current">กำลังใช้</span>
                    {/if}
                  </div>
                  <div class="preset-actions">
                    <button 
                      on:click={() => loadPreset(preset)} 
                      class="preset-btn load"
                      disabled={preset === $currentPreset}
                    >
                      📂 โหลด
                    </button>
                    <button 
                      on:click={() => editingPreset = preset} 
                      class="preset-btn edit"
                    >
                      ✏️ แก้ไข
                    </button>
                    <button 
                      on:click={() => deletePreset(preset)} 
                      class="preset-btn delete"
                      disabled={preset === 'Default'}
                    >
                      🗑️ ลบ
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Create New Preset -->
          <div class="settings-group">
            <h4 class="settings-group-title">➕ สร้าง Preset ใหม่</h4>
            <div class="create-preset">
              <input 
                type="text" 
                bind:value={newPresetName} 
                placeholder="ชื่อ Preset ใหม่" 
                class="preset-name-input"
              />
              <button 
                on:click={saveCurrentAsPreset} 
                class="preset-btn create"
                disabled={!newPresetName.trim()}
              >
                💾 บันทึก
              </button>
            </div>
            <p class="settings-note">
              จะบันทึกค่าปัจจุบัน: Win = {$win}, Goal = {$goal}, มงกุฎ = {$showCrown ? 'เปิด' : 'ปิด'}, เป้าหมาย = {$showGoal ? 'เปิด' : 'ปิด'}
            </p>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .control-app {
    width: 496px;
    height: 796px;
    background: transparent;
    color: #ffffff;
    font-family: 'MiSansThai-Normal', sans-serif;
    overflow: visible;
    position: relative;
    -webkit-app-region: drag;
    border-radius: 32px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    padding: 0;
    box-sizing: border-box;
    border: none !important;
    box-shadow: none !important;
    outline: none !important;
    z-index: 0;
    margin: 0 auto;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'MiSansThai-Normal', sans-serif;
    color: #fff;
    overflow-x: hidden;
  }
  .main-content {
    width: 476px;
    height: 776px;
    background: #040319;
    border-radius: 28px;
    margin: 10px auto;
    position: relative;
    box-shadow: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    padding-top: calc(20px + 32px - 12px); /* เลื่อนขึ้น 12px */
    z-index: 1;
    justify-content: flex-start; /* เปลี่ยนจาก space-evenly เป็น flex-start */
    overflow: hidden;
    box-sizing: border-box;
    transform: translateX(-3px);
  }
  .app-title {
    font-size: calc(476px * 0.14); /* 14% of main-content width = ~67px */
    font-family: 'MiSansThai', sans-serif;
    font-weight: 400;
    color: #00e5ff;
    text-align: center;
    margin: 0;
    letter-spacing: 0.02em;
    flex-shrink: 0;
    width: 100%;
    line-height: 1.1;
  }
  .counter-section {
    margin: calc(476px * 0.01) 0 0 0; /* ลด margin-top */
    padding: 0; 
    width: calc(476px * 0.80); /* 80% กลับมาให้กล่องตัวเลขไม่โดนบีบ */
    max-width: 380px;
    display: flex; justify-content: center; flex-shrink: 0;
  }
  .counter-display {
    background: transparent;
    border-radius: calc(476px * 0.042); /* ~20px */
    backdrop-filter: none;
    border: 2px solid #00e5ff; /* ลดจาก 3px เป็น 2px */
    width: 100%;
    height: calc(776px * 0.20 - 15px); /* ลดอีก 6px รวม 15px */
    padding: calc(476px * 0.042); /* ~20px */
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    box-sizing: border-box;
  }
  .counter-content {
    display: flex; align-items: center; gap: calc(476px * 0.025); /* ~12px ลดระยะห่าง */
    width: 100%; justify-content: center;
  }
  .crown-container {
    display: flex; align-items: center; justify-content: center;
    width: calc(476px * 0.40); /* 40% = ~190px ลดขนาด container */
    height: calc(776px * 0.155); /* ~120px เพิ่มความสูง */
  }
  .crown-icon {
    width: calc(476px * 0.35 + 12px); /* เพิ่มอีก 6px รวม 12px */
    height: calc(476px * 0.35 + 12px);
    transform: translateX(-10px); /* เลื่อนไปทางซ้าย 10px (-18px + 8px) */
  }
  .win-number-container {
    display: flex; align-items: center; justify-content: center;
    width: calc(476px * 0.35); /* 35% = ~167px */
    height: calc(776px * 0.16 - 12px); /* ลดลง 12px */
    background: transparent; 
    border-radius: calc(476px * 0.042); /* ~20px */
    border: 3px solid #00e5ff;
  }
  .win-number {
    font-size: calc(476px * 0.12 + 32px); /* ~89px เพิ่ม 32px */
    font-family: 'MiSansThai-Bold', sans-serif;
    font-weight: 700; 
    color: #00e5ff; 
    text-align: center;
    width: 100%; 
  }
  .goal-container {
    display: flex; 
    align-items: center; 
    gap: calc(476px * 0.01 + 6px); /* เพิ่มระยะห่าง 6px */
    margin-top: calc(476px * 0.035 - 6px); /* ลดระยะห่าง 6px */
    margin-bottom: calc(476px * 0.025 - 6px); /* ลดระยะห่าง 6px */
    width: calc(476px * 0.92); /* 92% เท่ากับปุ่ม PRESET */
    max-width: 438px; /* เท่ากับปุ่ม PRESET */
    justify-content: space-between; /* แยกซ้ายขวา */
    flex-shrink: 0;
  }
  .goal-label {
    font-size: calc(476px * 0.055); /* ~26px ลดขนาดนิดหน่อย */
    font-family: 'MiSansThai-Bold', sans-serif;
    color: #00e5ff; 
    font-weight: 700; /* Bold */
    margin-bottom: 0;
    flex-shrink: 0; /* ไม่ให้หด */
  }
  .goal-number-box {
    background: transparent; 
    border-radius: calc(476px * 0.015); /* ~7px ความโค้งเล็กน้อย */
    padding: calc(476px * 0.01) calc(476px * 0.042); /* ~5px ~20px ลดความสูง */
    font-size: calc(476px * 0.063); /* ~30px */
    font-family: 'MiSansThai-Semibold', sans-serif;
    color: #00e5ff; 
    font-weight: 600;
    flex: 1; /* ขยายเต็มพื้ที่ที่เหลือ */
    text-align: center;
    border: 2px solid #00e5ff;
    margin-right: 12px; /* เพิ่มอีก 6px รวม 12px */
  }
  .action-section {
    width: 100%; 
    margin: calc(476px * 0.015) 0 0 0; /* ลด margin-top */
    gap: 0; /* ลบระยะห่างให้ชิดกัน */
    display: flex; flex-direction: column; align-items: center; flex-shrink: 0;
  }
  .preset-btn {
    background: transparent;
    border: 4px solid #00e5ff;
    outline: none;
    border-radius: calc(476px * 0.042); /* ~20px */
    color: #00e5ff;
    font-size: calc(476px * 0.084); /* ~40px */
    font-family: 'MiSansThai-Bold', sans-serif;
    font-weight: 700; /* Bold */
    padding: calc(776px * 0.019) calc(476px * 0.126); /* ~15px ~60px */
    cursor: pointer;
    transition: all 0.3s ease;
    -webkit-app-region: no-drag;
    width: calc(476px * 0.92); /* 92% */
    max-width: 438px;
    margin-bottom: calc(776px * 0.013); /* ~10px */
  }

  .preset-btn:hover {
    background: rgba(0, 229, 255, 0.15);
    color: #00e5ff;
    transform: translateY(-3px);
  }

  .donate-btn {
    background: transparent;
    border: 4px solid #00e5ff;
    outline: none;
    border-radius: calc(476px * 0.042); /* ~20px */
    color: #00e5ff;
    font-size: calc(476px * 0.084); /* ~40px */
    font-family: 'MiSansThai-Bold', sans-serif;
    font-weight: 700; /* Bold */
    padding: calc(776px * 0.019) calc(476px * 0.126); /* ~15px ~60px */
    cursor: pointer;
    transition: all 0.3s ease;
    -webkit-app-region: no-drag;
    width: calc(476px * 0.92); /* 92% */
    max-width: 438px;
    margin-bottom: calc(776px * 0.013); /* ~10px */
  }

  .donate-btn:hover {
    background: rgba(0, 229, 255, 0.15);
    color: #00e5ff;
    transform: translateY(-3px);
  }
  .toggle-container {
    width: calc(476px * 0.92 - 12px); /* ลดความยาว 12px */
    max-width: 426px; /* ลดตาม */
    background: transparent; 
    border: 2px solid #00e5ff; 
    border-radius: calc(476px * 0.042); /* ~20px */
    padding: calc(776px * 0.042) calc(476px * 0.042) calc(776px * 0.019) calc(476px * 0.042); /* ลดความสูงด้านล่างให้ชิดกับ GOAL */
    margin: calc(776px * 0.01) auto 0 auto; /* ลด margin-top */
    box-sizing: border-box;
    display: flex; flex-direction: column; align-items: center; position: relative;
    height: auto; 
    flex-shrink: 0;
  }
  .toggle-controls {
    display: flex; flex-direction: column; gap: calc(776px * 0.006); /* ~5px */
    width: 100%; max-width: calc(476px * 0.84); /* ~400px */
    align-items: flex-start; justify-content: center; margin: 0;
  }
  .toggle-row {
    display: flex; justify-content: space-between; align-items: center;
    width: 100%; min-height: calc(776px * 0.045); /* ~35px */
    padding: 0; /* ลบ padding เพื่อให้ชิดกับกล่อง */
    margin-top: -17px; /* เลื่อนขึ้นอีก 9px */
    padding-right: 6px; /* ลดลงเพื่อให้กล่องติดกับสวิต */
  }
  .toggle-label {
    font-size: calc(476px * 0.042 + 12px); /* ~32px เพิ่ม 12px */
    font-weight: 700; color: #00e5ff;
  }
  .toggle-switch {
    width: calc(476px * 0.15); /* เพิ่มความยาวจาก 0.126 เป็น 0.15 */
    height: calc(776px * 0.052); /* เพิ่มความสูงจาก 0.045 เป็น 0.052 */
    border-radius: calc(776px * 0.026); /* ปรับตามความสูงใหม่ */
    margin-left: 0; /* รีเซ็ต margin */
    background: #374151; border: none; position: relative; transition: background 0.3s;
    display: flex; align-items: center; cursor: pointer;
  }
  .toggle-switch.active {
    background: #00e5ff;
  }
  .toggle-knob {
    width: calc(776px * 0.038); /* เพิ่มขนาดจาก 0.032 เป็น 0.038 */
    height: calc(776px * 0.038); /* เพิ่มขนาดจาก 0.032 เป็น 0.038 */
    border-radius: 50%; background: #fff; position: absolute; 
    left: calc(776px * 0.007); /* ลดระยะห่างจากขอบ */
    top: calc(776px * 0.007); /* ลดระยะห่างจากขอบ */
    transition: left 0.3s, background 0.3s;
  }
  .toggle-switch.active .toggle-knob {
    left: calc(476px * 0.075); /* เลื่อนไปขวามากขึ้น */
    background: #fff;
  }
  .toggle-divider {
    height: 3px; background: rgba(0, 229, 255, 0.2); /* ลดความหนาจาก 4px เป็น 3px */
    margin: calc(776px * 0.013 + 3px) 0 calc(776px * 0.013) calc(476px * 0.05 - 6px); /* เลื่อนลง 3px */
    width: 90%; border-radius: 2px;
  }
  .goal-toggle-row { margin-top: 1px; } /* เลื่อนขึ้น 3px จาก 4px เป็น 1px */
  .bottom-actions {
    display: flex; justify-content: center; 
    gap: calc(476px * 0.042); /* ~20px */
    margin: -10px auto 0 auto; /* เลื่อนขึ้นมากๆให้ชิดกับ Toggle Section */
    width: calc(476px * 0.92); /* 92% เท่ากับปุ่ม PRESET */
    max-width: 438px;
    background: transparent !important; position: static; z-index: 10;
    flex-shrink: 0;
  }
  .action-btn {
    background: transparent; 
    border: 2px solid #00e5ff; 
    border-radius: calc(476px * 0.029); /* ~14px */
    color: #00e5ff;
    font-size: calc(476px * 0.029 + 9px); /* ลดจาก +12px เป็น +9px */
    font-weight: 700; 
    padding: calc(776px * 0.016) calc(476px * 0.021); /* ~12px ~10px */
    width: calc(476px * 0.40); /* 40% ของ main-content */
    max-width: 190px;
    transition: all 0.3s;
    display: flex; align-items: center; justify-content: center;
    height: calc(776px * 0.058); /* ~45px */
  }
  .action-btn:hover { 
    background: rgba(0, 229, 255, 0.15); 
    transform: translateY(-2px);
  }

  /* Modal Styles - already glassmorphism, keep as is */

  /* iOS style window controls */
  .window-controls-left, .window-controls-right {
    position: absolute; top: 20px; z-index: 30;
  }
  .window-controls-left { left: 19px; } /* เลื่อนซ้ายอีก 3px จาก 22px เป็น 19px */
  .window-controls-right { right: 28px; }
  .window-btn {
    width: 32px; height: 32px; border-radius: 6px; 
    border: 2px solid #1976d2; background: transparent;
    color: #1976d2; font-size: 1.2rem; font-weight: 600; 
    font-family: 'MiSansThai', sans-serif;
    display: flex; align-items: center; justify-content: center; 
    transition: all 0.2s ease;
    cursor: pointer;
  }
  .window-btn:hover { 
    background: #1976d2; color: #fff; 
    transform: translateY(-1px);
  }
</style>
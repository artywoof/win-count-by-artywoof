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
      <div class="goal-wrapper">
        <span class="goal-label">GOAL:</span>
        <div class="goal-section">
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
  <div class="bottom-actions">
    <button class="action-btn secondary settings-btn" on:click={() => showSettingsModal = true}>
      ตั้งค่า
    </button>
    <button class="action-btn secondary copy-btn" on:click={copyLink}>
      คัดลอกลิงก์
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
    font-family: 'MiSansThaiVF', sans-serif;
    overflow: hidden;
    position: relative;
    -webkit-app-region: drag;
    border-radius: 60px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 20px;
    box-sizing: border-box;
    /* Force remove any potential borders */
    border: none !important;
    box-shadow: none !important;
    outline: none !important;
    /* Create a mask to hide potential system borders */
    z-index: 1;
  }



  /* Window Controls */
  .window-controls-left {
    position: absolute;
    top: 19px;
    left: 21px;
    z-index: 110;
    -webkit-app-region: no-drag;
  }

  .window-controls-right {
    position: absolute;
    top: 19px;
    right: 29px;
    z-index: 110;
    -webkit-app-region: no-drag;
  }

  .window-btn {
    width: 48px;
    height: 48px;
    border: none;
    outline: none;
    border-radius: 8px;
    font-size: 56px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-app-region: no-drag;
  }

  .minimize-btn {
    background: transparent !important;
    border: 3px solid #ff00cc !important;
    color: #ff00cc;
    font-weight: 300;
  }

  .minimize-btn:hover {
    background: rgba(255, 0, 204, 0.1) !important;
    border: 3px solid #ff00cc !important;
    color: #ff00cc;
    font-weight: 300;
  }

  .close-btn {
    background: transparent !important;
    border: 3px solid #ff4757 !important;
    color: #ff4757;
    font-weight: 300;
  }

  .close-btn:hover {
    background: rgba(255, 71, 87, 0.1) !important;
    border: 3px solid #ff4757 !important;
    color: #ff4757;
    font-weight: 300;
  }

  /* Main Content */
  .main-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    flex: 1;
    padding: 0;
    gap: 20px;
    -webkit-app-region: drag;
    cursor: move;
  }

  .app-title {
    font-size: 74px;
    font-weight: bold;
    background: linear-gradient(45deg, #00f5ff, #ffffff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 10px 0 -10px 0;
    -webkit-app-region: drag;
    cursor: move;
    padding: 20px 40px;
    transform: translateX(-7px);
  }

  /* Counter Section */
  .counter-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    margin-bottom: 10px;
    margin-top: -50px;
    -webkit-app-region: drag;
    cursor: move;
    padding: 20px;
  }

  .counter-display {
    display: flex;
    align-items: center;
    gap: 0px;
    padding: 19px 20px 19px -12px;
    background: transparent;
    border: 3px solid rgba(0, 245, 255, 0.6);
    border-radius: 16px;
    -webkit-app-region: no-drag;
    width: fit-content;
    margin-left: 0px;
    position: relative;
    transform: translateX(-4px);
  }

  .counter-content {
    display: flex;
    align-items: center;
    gap: 0px;
    transform: translateX(0px);
  }

  .crown-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 220px;
    height: 160px;
    margin-right: 4px;
  }

  .crown-icon {
    width: 200px;
    height: 200px;
    -webkit-app-region: no-drag;
    cursor: default;
    transform: translateY(-4px);
  }

  .win-number-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 194px;
    height: 102px;
    padding: 10px;
    background: transparent;
    border: 3px solid rgba(0, 245, 255, 0.3);
    border-radius: 16px;
    overflow: hidden;
    transform: translateX(-9px);
  }

  .win-number {
    font-size: 120px;
    font-weight: bold;
    color: #00f5ff;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-app-region: no-drag;
    cursor: default;
    line-height: 1;
  }

  /* Goal Section */
  .goal-wrapper {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: -5px;
    margin-top: -39px;
    width: 100%;
    max-width: 300px;
    justify-content: center;
    -webkit-app-region: drag;
    cursor: move;
  }

  .goal-section {
    background: transparent;
    border: 3px solid rgba(0, 245, 255, 0.6);
    border-radius: 12px;
    padding: 1px 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-app-region: no-drag;
    cursor: default;
    min-width: 260px;
    transform: translateX(-4px);
  }

  .goal-label {
    font-size: 32px;
    font-weight: bold;
    color: #00f5ff;
    -webkit-app-region: no-drag;
    cursor: default;
  }

  .goal-value {
    font-size: 35px;
    font-weight: bold;
    color: #00f5ff;
    -webkit-app-region: no-drag;
    cursor: default;
  }

  /* Settings Section */
  .settings-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 40px;
    width: 100%;
    max-width: 300px;
  }

  .setting-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 10px;
  }

  .setting-label {
    font-size: 24px;
    font-weight: bold;
    color: #00f5ff;
  }

  /* Toggle Switch */
  .toggle-switch {
    width: 80px;
    height: 40px;
    background: transparent;
    border: none;
    outline: none;
    border-radius: 25px;
    position: relative;
    cursor: pointer;
    transition: all 0.3s ease;
    -webkit-app-region: no-drag;
    transform: translateX(-30px);
  }

  .toggle-switch.active {
    background: rgba(0, 245, 255, 0.3);
  }

  .toggle-knob {
    width: 32px;
    height: 32px;
    background: #00f5ff;
    border-radius: 50%;
    position: absolute;
    top: 2px;
    left: 2px;
    transition: all 0.3s ease;
  }

  .toggle-switch.active .toggle-knob {
    transform: translateX(40px);
  }



  /* Hotkey Main Button */
  .hotkey-main-btn {
    background: rgba(0, 0, 0, 0.4);
    border: 2px solid #4a9eff;
    border-radius: 12px;
    color: #4a9eff;
    font-size: 20px;
    font-weight: bold;
    padding: 12px 40px;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-bottom: 40px;
    -webkit-app-region: no-drag;
  }

  .hotkey-main-btn:hover {
    background: rgba(74, 158, 255, 0.2);
  }

  /* Actions Section */
  .actions-section {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: auto;
  }

  .action-btn {
    background: transparent;
    border: 2px solid #00f5ff;
    outline: none;
    border-radius: 16px;
    color: #00f5ff;
    font-size: 20px;
    font-weight: bold;
    padding: 8px 24px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'MiSansThaiVF', sans-serif;
    -webkit-app-region: no-drag;
  }

  .action-btn.primary {
    border-color: #00f5ff;
    color: #00f5ff;
  }

  .action-btn.primary:hover {
    background: #00f5ff;
    color: #000;
  }

  .action-btn.secondary {
    color: #00f5ff;
  }

  .action-btn.secondary:hover {
    background: rgba(0, 245, 255, 0.2);
    color: #00f5ff;
    transform: translateY(-2px);
  }

  /* Action Section */
  .action-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0px;
    width: 100%;
  }

  .preset-btn {
    background: transparent;
    border: 3px solid #00f5ff;
    outline: none;
    border-radius: 16px;
    color: #00f5ff;
    font-size: 48px;
    font-weight: bold;
    padding: 1px 48px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'MiSansThaiVF', sans-serif;
    -webkit-app-region: no-drag;
    width: 429px;
    transform: translateX(-5px);
  }

  .preset-btn:hover {
    background: rgba(0, 245, 255, 0.2);
    color: #00f5ff;
    transform: translateY(-2px);
  }

  .donate-btn {
    background: transparent;
    border: 3px solid #00f5ff;
    outline: none;
    border-radius: 16px;
    color: #00f5ff;
    font-size: 48px;
    font-weight: bold;
    padding: 1px 48px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'MiSansThaiVF', sans-serif;
    -webkit-app-region: no-drag;
    width: 429px;
    margin-top: 5px;
    transform: translateX(-5px) translateY(10px);
  }

  .donate-btn:hover {
    background: rgba(0, 245, 255, 0.2);
    color: #00f5ff;
    transform: translateY(-2px);
  }

  /* Toggle Container */
  .toggle-container {
    background: transparent;
    border: 3px solid rgba(0, 245, 255, 0.6);
    border-radius: 16px;
    padding: 4px 8px;
    margin-top: 24px;
    width: 380px;
    height: 130px;
    transform: translateX(-6px);
    box-sizing: border-box;
  }

  /* Toggle Controls */
  .toggle-controls {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    max-width: 450px;
  }

  .toggle-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 12px;
    width: 100%;
  }

  .toggle-divider {
    height: 3px;
    background: rgba(0, 245, 255, 0.6);
    margin: 4px 12px;
    transform: translateY(-6px);
  }

  .toggle-label {
    font-size: 36px;
    font-weight: bold;
    color: #00f5ff;
  }

  .goal-toggle-row {
    transform: translateY(-16px);
  }

  /* Bottom Actions */
  .bottom-actions {
    display: flex;
    justify-content: center;
    gap: 8px;
    width: 100%;
    margin-top: auto;
    padding-top: 4px;
    transform: translateY(-6px);
  }

  .bottom-actions .action-btn {
    flex: none;
    font-size: 26px;
    padding: 8px 24px;
    width: auto;
  }

  /* Settings Modal Additional Styles */
  .settings-btn {
    transform: translateX(-40px);
  }

  .copy-btn {
    transform: translateX(26px);
  }

  .settings-group {
    margin-bottom: 24px;
  }

  .settings-group:last-child {
    margin-bottom: 0;
  }

  .settings-group-title {
    margin: 0 0 12px 0;
    color: #00f5ff;
    font-size: 16px;
    font-weight: bold;
    border-bottom: 1px solid rgba(0, 245, 255, 0.3);
    padding-bottom: 6px;
  }

  .settings-note {
    font-size: 12px;
    color: #ccc;
    margin-top: 8px;
    margin-bottom: 0;
    line-height: 1.4;
  }

  kbd {
    background: #333;
    color: #fff;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 11px;
    border: 1px solid #555;
  }

  /* Modal Styles */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    -webkit-app-region: no-drag;
  }

  .modal {
    background: linear-gradient(135deg, #1a1a2e 0%, #0f0f23 100%);
    border: 2px solid #00f5ff;
    border-radius: 12px;
    padding: 20px;
    max-width: 400px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .modal-header h3 {
    margin: 0;
    color: #00f5ff;
    font-size: 20px;
  }

  .modal-close {
    background: none;
    border: none;
    color: #ff4757;
    font-size: 20px;
    cursor: pointer;
    padding: 4px;
    -webkit-app-region: no-drag;
  }

  .modal-close:hover {
    color: #ff3742;
  }

  .modal-body {
    color: #ffffff;
  }

  /* Hotkey List */
  .hotkey-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  .hotkey-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* Sound Controls */
  .sound-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .sound-btn {
    padding: 12px;
    border: 2px solid #2ed573;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.2);
    color: #2ed573;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    -webkit-app-region: no-drag;
  }

  .sound-btn:hover {
    background: #2ed573;
    color: white;
  }

  /* Preset Modal Specific Styles */
  .preset-modal {
    max-width: 500px;
  }

  .preset-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  .preset-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .preset-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .preset-name {
    font-weight: bold;
    color: #00f5ff;
  }

  .preset-current {
    background: #2ed573;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
  }

  .preset-actions {
    display: flex;
    gap: 6px;
  }

  .preset-btn.load,
  .preset-btn.edit,
  .preset-btn.delete,
  .preset-btn.create {
    padding: 6px 10px;
    border: 1px solid;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.2);
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    -webkit-app-region: no-drag;
  }

  .preset-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .preset-btn.load {
    border-color: #00f5ff;
    color: #00f5ff;
  }

  .preset-btn.load:hover:not(:disabled) {
    background: #00f5ff;
    color: black;
  }

  .preset-btn.edit {
    border-color: #ffa500;
    color: #ffa500;
  }

  .preset-btn.edit:hover:not(:disabled) {
    background: #ffa500;
    color: white;
  }

  .preset-btn.delete {
    border-color: #ff4757;
    color: #ff4757;
  }

  .preset-btn.delete:hover:not(:disabled) {
    background: #ff4757;
    color: white;
  }

  .preset-btn.create {
    border-color: #2ed573;
    color: #2ed573;
  }

  .preset-btn.create:hover:not(:disabled) {
    background: #2ed573;
    color: white;
  }

  .create-preset {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
  }

  .preset-name-input {
    flex: 1;
    padding: 8px 12px;
    border: 2px solid rgba(255, 165, 0, 0.5);
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.3);
    color: #ffa500;
    font-size: 14px;
    -webkit-app-region: no-drag;
  }

  .preset-name-input:focus {
    outline: none;
    border-color: #ffa500;
  }

  .preset-name-input::placeholder {
    color: rgba(255, 165, 0, 0.6);
  }

  /* Global drag settings */
  [style*="-webkit-app-region: no-drag"], 
  .-webkit-app-region-no-drag,
  button,
  input,
  select,
  textarea {
    -webkit-app-region: no-drag !important;
    cursor: default !important;
  }

  /* Global drag areas */
  [style*="-webkit-app-region: drag"],
  .-webkit-app-region-drag {
    cursor: move !important;
  }

  @font-face {
    font-family: 'MiSansThai';
    src: url('/assets/fonts/MiSansThaiVF.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }
</style>

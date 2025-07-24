<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import audioManager from '$lib/audioManager';
  import { hotkeySettings, keybindToString, type Keybind } from '$lib/stores';
  import { registerHotkeysFromSettings, getHotkeyConflicts } from '$lib/hotkeyManager';

  const dispatch = createEventDispatcher();

  let activeTab = 'hotkeys'; // Start with hotkeys tab
  let audioSettings = audioManager.getSettings();
  let customSoundFile: FileList | null = null;
  let uploadingSoundFor = '';
  let uploadMessage = '';

  // Volume debounce
  let volumeDebounceTimer: number | null = null;
  const VOLUME_DEBOUNCE_MS = 100;

  // Hotkey recording state
  let recordingHotkey = '';
  let recordingKeys: string[] = [];
  let recordingKeybind: Partial<Keybind> = {};
  let recordingTimeout: number | null = null;
  const RECORDING_TIMEOUT_MS = 5000;

  // General settings
  let generalSettings = {
    windowOnTop: false,
    minimizeToTray: true,
    startWithWindows: false,
    checkUpdatesOnStart: true
  };

  // Hotkey conflicts
  let hotkeyConflicts: string[] = [];

  // Hotkey action definitions
  const hotkeyActions = [
    { id: 'increment', label: '🔺 เพิ่มค่า (+1)', description: 'เพิ่มค่าชัยชนะทีละ 1' },
    { id: 'decrement', label: '🔻 ลดค่า (-1)', description: 'ลดค่าชัยชนะทีละ 1' },
    { id: 'increment10', label: '⬆️ เพิ่มค่า (+10)', description: 'เพิ่มค่าชัยชนะทีละ 10' },
    { id: 'decrement10', label: '⬇️ ลดค่า (-10)', description: 'ลดค่าชัยชนะทีละ 10' },
    { id: 'reset', label: '🔄 รีเซ็ตค่า', description: 'รีเซ็ตค่าชัยชนะเป็น 0' },
    { id: 'toggleGoal', label: '🎯 สลับเป้าหมาย', description: 'แสดง/ซ่อนเป้าหมาย' }
  ];

  // Load settings on component mount
  function loadSettings() {
    audioSettings = audioManager.getSettings();
    
    // Load general settings
    try {
      const savedGeneral = localStorage.getItem('generalSettings');
      if (savedGeneral) {
        generalSettings = { ...generalSettings, ...JSON.parse(savedGeneral) };
      }
    } catch (error) {
      console.warn('Failed to load general settings:', error);
    }
  }

  // Hotkey recording functions
  function startRecording(actionId: string) {
    recordingHotkey = actionId;
    recordingKeybind = {};
    recordingKeys = [];
    
    // Set timeout to stop recording automatically
    if (recordingTimeout) clearTimeout(recordingTimeout);
    recordingTimeout = setTimeout(stopRecording, RECORDING_TIMEOUT_MS);
  }

  function stopRecording() {
    if (recordingTimeout) {
      clearTimeout(recordingTimeout);
      recordingTimeout = null;
    }
    recordingHotkey = '';
    recordingKeybind = {};
    recordingKeys = [];
  }

  function handleHotkeyRecord(event: KeyboardEvent) {
    if (!recordingHotkey) return;
    
    event.preventDefault();
    event.stopPropagation();

    const keybind: Keybind = {
      code: event.code,
      alt: event.altKey,
      shift: event.shiftKey,
      ctrl: event.ctrlKey,
      meta: event.metaKey
    };
    
    // Don't allow only modifier keys
    if (["AltLeft","AltRight","ShiftLeft","ShiftRight","ControlLeft","ControlRight","MetaLeft","MetaRight"].includes(event.code)) return;
    
    recordingKeybind = keybind;
    recordingKeys = [keybindToString(keybind)];
    
    // Accept any key combination (including 3-key combos)
    hotkeySettings.updateAction(recordingHotkey, keybind);
    stopRecording();
  }
  
  // Save settings
  function saveGeneralSettings() {
    try {
      localStorage.setItem('generalSettings', JSON.stringify(generalSettings));
    } catch (error) {
      console.error('Failed to save general settings:', error);
    }
  }

  // Audio settings
  function toggleAudio() {
    const enabled = audioManager.toggleEnabled();
    audioSettings = { ...audioSettings, enabled };
  }

  function updateVolume(event: Event) {
    const target = event.target as HTMLInputElement;
    let volume = parseFloat(target.value);
    
    // Clamp volume between 0 and 1
    volume = Math.max(0, Math.min(1, volume));
    
    // Update UI immediately for smooth slider movement
    audioSettings = { ...audioSettings, volume };
    
    // Clear existing debounce timer
    if (volumeDebounceTimer) {
      clearTimeout(volumeDebounceTimer);
    }
    
    // Set new debounce timer
    volumeDebounceTimer = setTimeout(() => {
      audioManager.setVolume(volume);
      volumeDebounceTimer = null;
    }, VOLUME_DEBOUNCE_MS);
  }

  async function playTestSound(soundName: string) {
    try {
      await audioManager.play(soundName);
    } catch (error) {
      console.warn('Failed to play test sound:', error);
    }
  }

  async function uploadCustomSound(soundName: string) {
    if (!customSoundFile || customSoundFile.length === 0) {
      uploadMessage = 'กรุณาเลือกไฟล์เสียง ❌';
      setTimeout(() => { uploadMessage = ''; }, 3000);
      return;
    }
    
    const file = customSoundFile[0];
    
    // Validate file type - only MP3 and WAV allowed
    const allowedExtensions = ['.mp3', '.wav'];
    const fileName = file.name.toLowerCase();
    const isValidType = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValidType) {
      uploadMessage = 'ไฟล์ต้องเป็น MP3 หรือ WAV เท่านั้น ❌';
      setTimeout(() => { uploadMessage = ''; }, 3000);
      return;
    }
    
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      uploadMessage = `ไฟล์ใหญ่เกินไป (${Math.round(file.size / 1024 / 1024)}MB > 5MB) ❌`;
      setTimeout(() => { uploadMessage = ''; }, 3000);
      return;
    }
    
    uploadingSoundFor = soundName;
    uploadMessage = 'อัปโหลดไฟล์เสียง...';
    
    const success = await audioManager.uploadCustomSound(soundName, file);
    
    if (success) {
      uploadMessage = `อัปโหลดเสียง ${soundName} สำเร็จ! ✅`;
      audioSettings = audioManager.getSettings();
    } else {
      uploadMessage = 'อัปโหลดล้มเหลว ลองใหม่อีกครั้ง ❌';
    }
    
    uploadingSoundFor = '';
    customSoundFile = null;
    
    // Clear message after 3 seconds
    setTimeout(() => {
      uploadMessage = '';
    }, 3000);
  }

  function resetSounds() {
    audioManager.resetToDefaults();
    audioSettings = audioManager.getSettings();
    uploadMessage = 'รีเซ็ตเสียงเรียบร้อย! ✅';
    setTimeout(() => {
      uploadMessage = '';
    }, 2000);
  }

  function closeModal() {
    // Clean up debounce timer
    if (volumeDebounceTimer) {
      clearTimeout(volumeDebounceTimer);
      volumeDebounceTimer = null;
    }
    // Clean up recording timeout
    if (recordingTimeout) {
      clearTimeout(recordingTimeout);
      recordingTimeout = null;
    }
    // Stop any active recording
    stopRecording();
    dispatch('close');
  }

  // Reset hotkeys to defaults
  function resetHotkeys() {
    hotkeySettings.resetToDefaults();
    registerHotkeysFromSettings();
  }

  // Handle escape key and hotkey recording
  function handleKeydown(event: KeyboardEvent) {
    if (recordingHotkey) {
      handleHotkeyRecord(event);
    } else if (event.key === 'Escape') {
      closeModal();
    }
  }

  // Load settings when component is created
  loadSettings();

  // Watch hotkeySettings for changes and re-register hotkeys
  $:
    hotkeySettings.subscribe(settings => {
      hotkeyConflicts = getHotkeyConflicts(settings);
      registerHotkeysFromSettings();
    });
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Modal Backdrop -->
<div class="modal-backdrop" role="presentation" tabindex="0" on:click={closeModal} on:keydown={(e) => { if (e.key === 'Escape') closeModal(); }}>
  <div class="modal-container" role="dialog" aria-modal="true" tabindex="-1" on:click|stopPropagation>
    <!-- Modal Header -->
    <div class="modal-header">
      <h2>⚙️ ตั้งค่า</h2>
      <button class="close-btn" on:click={closeModal}>✕</button>
    </div>

    <!-- Tab Navigation -->
    <div class="tab-nav">
      <button 
        class="tab-btn" 
        class:active={activeTab === 'hotkeys'}
        on:click={() => activeTab = 'hotkeys'}
      >
        ⌨️ คีย์ลัด
      </button>
      <button 
        class="tab-btn" 
        class:active={activeTab === 'audio'}
        on:click={() => activeTab = 'audio'}
      >
        🔊 เสียง
      </button>
      <button 
        class="tab-btn" 
        class:active={activeTab === 'general'}
        on:click={() => activeTab = 'general'}
      >
        🎛️ ทั่วไป
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      {#if activeTab === 'hotkeys'}
        <div class="hotkey-settings">
          <div class="hotkey-header">
            <h3>⌨️ ตั้งค่าคีย์ลัด</h3>
            <p class="hotkey-description">กดคีย์ที่ต้องการเพื่อกำหนดคีย์ลัด (รองรับ 3 คีย์พร้อมกัน)</p>
          </div>

          {#if hotkeyConflicts.length > 0}
            <div class="hotkey-conflict-warning">
              ⚠️ มีคีย์ลัดซ้ำกัน: {hotkeyConflicts.join(', ')} กรุณาเปลี่ยนให้ไม่ซ้ำกัน
            </div>
          {/if}

          <div class="hotkey-list">
            {#each hotkeyActions as action}
              <div class="hotkey-item">
                <div class="hotkey-info">
                  <div class="hotkey-label">{action.label}</div>
                  <div class="hotkey-description">{action.description}</div>
                </div>
                <div class="hotkey-controls">
                  <div class="current-hotkey">
                    {#if recordingHotkey === action.id}
                      <span class="recording-indicator">🎤 กดคีย์...</span>
                    {:else}
                      <span class="hotkey-display">
                        {keybindToString($hotkeySettings.actions[action.id]?.currentKeybind || {})}
                      </span>
                    {/if}
                  </div>
                  <button 
                    class="change-hotkey-btn"
                    class:recording={recordingHotkey === action.id}
                    on:click={() => startRecording(action.id)}
                    disabled={recordingHotkey && recordingHotkey !== action.id}
                  >
                    {recordingHotkey === action.id ? '⏹️ หยุด' : '✏️ เปลี่ยน'}
                  </button>
                </div>
              </div>
            {/each}
          </div>

          <div class="hotkey-actions">
            <button class="reset-hotkeys-btn" on:click={resetHotkeys}>
              🔄 รีเซ็ตคีย์ลัดเป็นค่าเริ่มต้น
            </button>
          </div>
        </div>

      {:else if activeTab === 'audio'}
        <div class="audio-settings">
          <div class="audio-header">
            <h3>🔊 ตั้งค่าเสียง</h3>
            <p class="audio-description">ปรับแต่งเสียงเอฟเฟกต์และการแจ้งเตือน</p>
          </div>

          <div class="audio-main-settings">
          <div class="setting-row">
            <label class="setting-label">
              <input 
                type="checkbox" 
                checked={audioSettings.enabled} 
                on:change={toggleAudio}
              >
                🔊 เปิดใช้งานเสียง
            </label>
          </div>

          <div class="setting-row">
              <label class="setting-label" for="volume-slider">📊 ระดับเสียง</label>
            <div class="volume-control">
              <input 
                id="volume-slider"
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                bind:value={audioSettings.volume}
                on:input={updateVolume}
                disabled={!audioSettings.enabled}
                aria-label="ปรับระดับเสียง"
              >
              <span class="volume-value">{Math.round(audioSettings.volume * 100)}%</span>
              <button 
                class="test-volume-btn"
                on:click={() => playTestSound('increase')}
                disabled={!audioSettings.enabled}
                title="ทดสอบเสียง"
              >
                🔊
              </button>
              </div>
            </div>
          </div>

          <div class="sound-effects">
            <h4>🎵 เสียงเอฟเฟกต์</h4>
            
            {#if uploadMessage}
              <div class="upload-message" class:success={uploadMessage.includes('✅')} class:error={uploadMessage.includes('❌')}>
                {uploadMessage}
              </div>
            {/if}
            
            <div class="sound-grid">
            <div class="sound-item">
                <div class="sound-info">
                  <span class="sound-name">🔺 เพิ่มค่า (+1)</span>
                  <span class="sound-status">
                    {audioManager.hasCustomSound('increase') ? '🎵 Custom' : '🔊 Default'}
                  </span>
                </div>
              <div class="sound-controls">
                <button class="test-btn" on:click={() => playTestSound('increase')}>▶️ ทดสอบ</button>
                  <input type="file" accept=".mp3,.wav" bind:files={customSoundFile} style="display: none;" id="increase-upload">
                <button class="upload-btn" on:click={() => document.getElementById('increase-upload')?.click()}>📁 อัปโหลด</button>
                {#if customSoundFile && customSoundFile.length > 0}
                  <button class="apply-btn" on:click={() => uploadCustomSound('increase')} disabled={uploadingSoundFor === 'increase'}>
                    {uploadingSoundFor === 'increase' ? '⏳' : '✅'} ใช้งาน
                  </button>
                {/if}
                  {#if audioManager.hasCustomSound('increase')}
                    <button 
                      class="remove-btn"
                      on:click={() => {
                        audioManager.removeCustomSound('increase');
                        audioSettings = audioManager.getSettings();
                        uploadMessage = 'ลบเสียง increase แล้ว! ✅';
                        setTimeout(() => { uploadMessage = ''; }, 2000);
                      }}
                      title="ลบเสียงกำหนดเอง"
                    >
                      🗑️
                  </button>
                {/if}
              </div>
            </div>

            <div class="sound-item">
                <div class="sound-info">
                  <span class="sound-name">🔻 ลดค่า (-1)</span>
                  <span class="sound-status">
                    {audioManager.hasCustomSound('decrease') ? '🎵 Custom' : '🔊 Default'}
                  </span>
                </div>
              <div class="sound-controls">
                <button class="test-btn" on:click={() => playTestSound('decrease')}>▶️ ทดสอบ</button>
                  <input type="file" accept=".mp3,.wav" bind:files={customSoundFile} style="display: none;" id="decrease-upload">
                <button class="upload-btn" on:click={() => document.getElementById('decrease-upload')?.click()}>📁 อัปโหลด</button>
                  {#if customSoundFile && customSoundFile.length > 0}
                    <button class="apply-btn" on:click={() => uploadCustomSound('decrease')} disabled={uploadingSoundFor === 'decrease'}>
                      {uploadingSoundFor === 'decrease' ? '⏳' : '✅'} ใช้งาน
                    </button>
                  {/if}
                  {#if audioManager.hasCustomSound('decrease')}
                    <button 
                      class="remove-btn"
                      on:click={() => {
                        audioManager.removeCustomSound('decrease');
                        audioSettings = audioManager.getSettings();
                        uploadMessage = 'ลบเสียง decrease แล้ว! ✅';
                        setTimeout(() => { uploadMessage = ''; }, 2000);
                      }}
                      title="ลบเสียงกำหนดเอง"
                    >
                      🗑️
                    </button>
                  {/if}
              </div>
            </div>

            <div class="sound-item">
                <div class="sound-info">
                  <span class="sound-name">⬆️ เพิ่มค่า (+10)</span>
                  <span class="sound-status">
                    {audioManager.hasCustomSound('increment10') ? '🎵 Custom' : '🔊 Default'}
                  </span>
                </div>
              <div class="sound-controls">
                <button class="test-btn" on:click={() => playTestSound('increment10')}>▶️ ทดสอบ</button>
                  <input type="file" accept=".mp3,.wav" bind:files={customSoundFile} style="display: none;" id="increment10-upload">
                  <button class="upload-btn" on:click={() => document.getElementById('increment10-upload')?.click()}>📁 อัปโหลด</button>
                  {#if customSoundFile && customSoundFile.length > 0}
                    <button class="apply-btn" on:click={() => uploadCustomSound('increment10')} disabled={uploadingSoundFor === 'increment10'}>
                      {uploadingSoundFor === 'increment10' ? '⏳' : '✅'} ใช้งาน
                    </button>
                  {/if}
                  {#if audioManager.hasCustomSound('increment10')}
                    <button 
                      class="remove-btn"
                      on:click={() => {
                        audioManager.removeCustomSound('increment10');
                        audioSettings = audioManager.getSettings();
                        uploadMessage = 'ลบเสียง increment10 แล้ว! ✅';
                        setTimeout(() => { uploadMessage = ''; }, 2000);
                      }}
                      title="ลบเสียงกำหนดเอง"
                    >
                      🗑️
                    </button>
                  {/if}
              </div>
            </div>

            <div class="sound-item">
                <div class="sound-info">
                  <span class="sound-name">⬇️ ลดค่า (-10)</span>
                  <span class="sound-status">
                    {audioManager.hasCustomSound('decrement10') ? '🎵 Custom' : '🔊 Default'}
                  </span>
                </div>
              <div class="sound-controls">
                <button class="test-btn" on:click={() => playTestSound('decrement10')}>▶️ ทดสอบ</button>
                  <input type="file" accept=".mp3,.wav" bind:files={customSoundFile} style="display: none;" id="decrement10-upload">
                  <button class="upload-btn" on:click={() => document.getElementById('decrement10-upload')?.click()}>📁 อัปโหลด</button>
                  {#if customSoundFile && customSoundFile.length > 0}
                    <button class="apply-btn" on:click={() => uploadCustomSound('decrement10')} disabled={uploadingSoundFor === 'decrement10'}>
                      {uploadingSoundFor === 'decrement10' ? '⏳' : '✅'} ใช้งาน
                    </button>
                  {/if}
                  {#if audioManager.hasCustomSound('decrement10')}
                    <button 
                      class="remove-btn"
                      on:click={() => {
                        audioManager.removeCustomSound('decrement10');
                        audioSettings = audioManager.getSettings();
                        uploadMessage = 'ลบเสียง decrement10 แล้ว! ✅';
                        setTimeout(() => { uploadMessage = ''; }, 2000);
                      }}
                      title="ลบเสียงกำหนดเอง"
                    >
                      🗑️
                    </button>
                  {/if}
              </div>
              </div>
            </div>

            <div class="sound-actions">
              <button class="reset-sounds-btn" on:click={resetSounds}>
              🔄 รีเซ็ตเสียงเป็นค่าเริ่มต้น
            </button>
          </div>
          </div>
        </div>

      {:else if activeTab === 'general'}
        <div class="general-settings">
          <div class="general-header">
            <h3>🎛️ ตั้งค่าทั่วไป</h3>
            <p class="general-description">การตั้งค่าการทำงานของแอปพลิเคชัน</p>
          </div>
          
          <div class="general-options">
          <div class="setting-row">
              <label class="setting-label">
                <input 
                  type="checkbox" 
                  bind:checked={generalSettings.windowOnTop}
                  on:change={saveGeneralSettings}
                >
                📌 แสดงหน้าต่างอยู่ด้านบนเสมอ
              </label>
          </div>

          <div class="setting-row">
              <label class="setting-label">
                <input 
                  type="checkbox" 
                  bind:checked={generalSettings.minimizeToTray}
                  on:change={saveGeneralSettings}
                >
                🗂️ ย่อหน้าต่างไปที่ System Tray
              </label>
          </div>

          <div class="setting-row">
              <label class="setting-label">
                <input 
                  type="checkbox" 
                  bind:checked={generalSettings.startWithWindows}
                  on:change={saveGeneralSettings}
                >
                🚀 เปิดแอปพร้อม Windows
              </label>
          </div>

            <div class="setting-row">
              <label class="setting-label">
                <input 
                  type="checkbox" 
                  bind:checked={generalSettings.checkUpdatesOnStart}
                  on:change={saveGeneralSettings}
                >
                🔄 ตรวจสอบอัปเดตเมื่อเปิดแอป
              </label>
            </div>
          </div>

          <div class="app-info">
            <h4>📋 ข้อมูลแอปพลิเคชัน</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">เวอร์ชัน:</span>
                <span class="info-value">v1.0.0</span>
              </div>
              <div class="info-item">
                <span class="info-label">ผู้พัฒนา:</span>
                <span class="info-value">ArtYWoof</span>
              </div>
              <div class="info-item">
                <span class="info-label">อัปเดตล่าสุด:</span>
                <span class="info-value">2024-01-15</span>
              </div>
            </div>
          </div>

          <div class="general-actions">
            <button class="action-btn">🔄 ตรวจสอบอัปเดต</button>
            <button class="action-btn">📁 เปิดโฟลเดอร์ข้อมูล</button>
            <button class="action-btn">📋 คัดลอกข้อมูลระบบ</button>
          </div>
        </div>
      {/if}
    </div>

    <!-- Modal Footer -->
    <div class="modal-footer">
      <button class="primary-btn" on:click={closeModal}>✅ ตกลง</button>
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.03);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.2s ease-out;
  }

  .modal-container {
    background: linear-gradient(145deg, #1a1a1a, #2d2d2d);
    border: 1px solid #333;
    border-radius: 12px;
    width: 90%;
    max-width: 700px;
    max-height: 80vh;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    animation: slideIn 0.3s ease-out;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: linear-gradient(90deg, #007AFF, #00D4FF);
    color: white;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.2em;
    font-weight: bold;
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .tab-nav {
    display: flex;
    background: #2d2d2d;
    border-bottom: 1px solid #333;
  }

  .tab-btn {
    flex: 1;
    padding: 15px 10px;
    background: none;
    border: none;
    color: #ccc;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;
    border-bottom: 2px solid transparent;
  }

  .tab-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .tab-btn.active {
    color: #007AFF;
    border-bottom-color: #007AFF;
    background: rgba(0, 122, 255, 0.1);
  }

  .tab-content {
    padding: 20px;
    max-height: 500px;
    overflow-y: auto;
    color: white;
  }

  /* Hotkey Settings Styles */
  .hotkey-header, .audio-header, .general-header {
    margin-bottom: 20px;
  }

  .hotkey-header h3, .audio-header h3, .general-header h3 {
    margin: 0 0 8px 0;
    color: #007AFF;
    font-size: 1.1em;
  }

  .hotkey-description, .audio-description, .general-description {
    margin: 0;
    color: #ccc;
    font-size: 14px;
  }

  .hotkey-conflict-warning {
    background: linear-gradient(90deg, #ff6b6b, #ff8e8e);
    color: white;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 14px;
    font-weight: 500;
  }

  .hotkey-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }

  .hotkey-item {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #333;
    border-radius: 8px;
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.2s;
  }

  .hotkey-item:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: #007AFF;
  }

  .hotkey-info {
    flex: 1;
  }

  .hotkey-label {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 4px;
  }

  .hotkey-description {
    font-size: 12px;
    color: #ccc;
  }

  .hotkey-controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .current-hotkey {
    min-width: 120px;
    text-align: center;
  }

  .recording-indicator {
    color: #ff6b6b;
    font-weight: 600;
    animation: pulse 1s infinite;
  }

  .hotkey-display {
    background: rgba(0, 122, 255, 0.2);
    border: 1px solid #007AFF;
    border-radius: 4px;
    padding: 4px 8px;
    font-family: monospace;
    font-size: 12px;
    color: #007AFF;
  }

  .change-hotkey-btn {
    background: #007AFF;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
  }

  .change-hotkey-btn:hover {
    background: #0056b3;
  }

  .change-hotkey-btn.recording {
    background: #ff6b6b;
    animation: pulse 1s infinite;
  }

  .change-hotkey-btn.recording:hover {
    background: #ff5252;
  }

  .hotkey-actions {
    text-align: center;
  }

  .reset-hotkeys-btn, .reset-sounds-btn {
    background: linear-gradient(90deg, #dc3545, #ff6b6b);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.2s;
  }

  .reset-hotkeys-btn:hover, .reset-sounds-btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  /* Audio Settings Styles */
  .audio-main-settings {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #333;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 20px;
  }

  .setting-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #333;
  }

  .setting-row:last-child {
    border-bottom: none;
  }

  .setting-label {
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }

  .setting-label input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: #007AFF;
  }

  .volume-control {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .volume-control input[type="range"] {
    width: 120px;
    accent-color: #007AFF;
  }

  .volume-value {
    min-width: 40px;
    font-size: 12px;
    color: #ccc;
  }

  .test-volume-btn {
    background: #28a745;
    color: white;
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }

  .test-volume-btn:hover {
    background: #218838;
  }

  .sound-effects h4 {
    margin: 20px 0 15px 0;
    color: #007AFF;
    font-size: 1em;
  }

  .sound-grid {
    display: grid;
    gap: 12px;
    margin-bottom: 20px;
  }

  .sound-item {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #333;
    border-radius: 8px;
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.2s;
  }

  .sound-item:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: #007AFF;
  }

  .sound-info {
    flex: 1;
  }

  .sound-name {
    font-weight: 600;
    font-size: 14px;
    display: block;
    margin-bottom: 4px;
  }

  .sound-status {
    font-size: 12px;
    color: #ccc;
  }

  .sound-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .test-btn, .upload-btn, .apply-btn, .remove-btn {
    padding: 6px 10px;
    font-size: 11px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .test-btn {
    background: #28a745;
    color: white;
  }

  .test-btn:hover {
    background: #218838;
  }

  .upload-btn {
    background: #6c757d;
    color: white;
  }

  .upload-btn:hover {
    background: #5a6268;
  }

  .apply-btn {
    background: #007AFF;
    color: white;
  }

  .apply-btn:hover {
    background: #0056b3;
  }

  .remove-btn {
    background: #dc3545;
    color: white;
    padding: 6px 8px;
  }

  .remove-btn:hover {
    background: #c82333;
  }

  .upload-message {
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 15px;
    font-size: 14px;
    font-weight: 500;
  }

  .upload-message.success {
    background: rgba(40, 167, 69, 0.2);
    border: 1px solid #28a745;
    color: #28a745;
  }

  .upload-message.error {
    background: rgba(220, 53, 69, 0.2);
    border: 1px solid #dc3545;
    color: #dc3545;
  }

  .sound-actions {
    text-align: center;
  }

  /* General Settings Styles */
  .general-options {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #333;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 20px;
  }

  .app-info {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #333;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 20px;
  }

  .app-info h4 {
    margin: 0 0 12px 0;
    color: #007AFF;
    font-size: 1em;
  }

  .info-grid {
    display: grid;
    gap: 8px;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
  }

  .info-label {
    font-size: 14px;
    color: #ccc;
  }

  .info-value {
    font-size: 14px;
    font-weight: 600;
    color: white;
  }

  .general-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .action-btn {
    background: linear-gradient(90deg, #6c757d, #868e96);
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
  }

  .action-btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .modal-footer {
    padding: 15px 20px;
    background: #2d2d2d;
    border-top: 1px solid #333;
    display: flex;
    justify-content: flex-end;
  }

  .primary-btn {
    background: linear-gradient(90deg, #007AFF, #00D4FF);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    font-size: 14px;
  }

  .primary-btn:hover {
    opacity: 0.9;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideIn {
    from { 
      opacity: 0;
      transform: scale(0.9) translateY(-20px);
    }
    to { 
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  /* Scrollbar styling */
  .tab-content::-webkit-scrollbar {
    width: 8px;
  }

  .tab-content::-webkit-scrollbar-track {
    background: #1a1a1a;
  }

  .tab-content::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: 4px;
  }

  .tab-content::-webkit-scrollbar-thumb:hover {
    background: #777;
  }
</style>

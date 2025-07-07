<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import audioManager from '$lib/audioManager';
  import { hotkeySettings, keybindToString, type Keybind } from '$lib/stores';
  import { registerHotkeysFromSettings, getHotkeyConflicts } from '$lib/hotkeyManager';

  const dispatch = createEventDispatcher();

  let activeTab = 'audio';
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
    
    // Accept any key combination
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
    
    // Validate file type on frontend too
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];
    if (!allowedTypes.some(type => file.type.includes(type.split('/')[1]) || file.name.toLowerCase().endsWith('.' + type.split('/')[1]))) {
      uploadMessage = 'ไฟล์ต้องเป็น MP3, WAV, OGG หรือ M4A เท่านั้น ❌';
      setTimeout(() => { uploadMessage = ''; }, 3000);
      return;
    }
    
    // Check file size
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
        class:active={activeTab === 'audio'}
        on:click={() => activeTab = 'audio'}
      >
        🔊 เสียง
      </button>
      <button 
        class="tab-btn" 
        class:active={activeTab === 'hotkeys'}
        on:click={() => activeTab = 'hotkeys'}
      >
        ⌨️ คีย์ลัด
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
      {#if activeTab === 'audio'}
        <div class="audio-settings">
          <div class="setting-row">
            <label class="setting-label">
              <input 
                type="checkbox" 
                checked={audioSettings.enabled} 
                on:change={toggleAudio}
              >
              เปิดใช้งานเสียง
            </label>
          </div>

          <div class="setting-row">
            <label class="setting-label" for="volume-slider">ระดับเสียง</label>
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

          <div class="sound-effects">
            <h3>🔊 เสียงเอฟเฟกต์</h3>
            
            <!-- Custom sound status -->
            <div class="custom-sounds-status">
              <div class="sound-types">
                {#each ['increase', 'decrease', 'increment10', 'decrement10', 'error', 'success'] as soundType}
                  <div class="sound-type-item">
                    <span class="sound-name">{soundType}</span>
                    <span class="sound-status">
                      {audioManager.hasCustomSound(soundType) ? '🎵 Custom' : '🔊 Default'}
                    </span>
                    {#if audioManager.hasCustomSound(soundType)}
                      <button 
                        class="remove-custom-btn"
                        on:click={() => {
                          audioManager.removeCustomSound(soundType);
                          audioSettings = audioManager.getSettings();
                          uploadMessage = `ลบเสียง ${soundType} แล้ว! ✅`;
                          setTimeout(() => { uploadMessage = ''; }, 2000);
                        }}
                        title="ลบเสียงกำหนดเอง"
                      >
                        🗑️
                      </button>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
            
            {#if uploadMessage}
              <div class="upload-message" class:success={uploadMessage.includes('✅')} class:error={uploadMessage.includes('❌')}>
                {uploadMessage}
              </div>
            {/if}
            
            <div class="sound-item">
              <span>🔺 เพิ่มค่า (+1)</span>
              <div class="sound-controls">
                <button class="test-btn" on:click={() => playTestSound('increase')}>▶️ ทดสอบ</button>
                <input type="file" accept="audio/*" bind:files={customSoundFile} style="display: none;" id="increase-upload">
                <button class="upload-btn" on:click={() => document.getElementById('increase-upload')?.click()}>📁 อัปโหลด</button>
                {#if customSoundFile && customSoundFile.length > 0}
                  <button class="apply-btn" on:click={() => uploadCustomSound('increase')} disabled={uploadingSoundFor === 'increase'}>
                    {uploadingSoundFor === 'increase' ? '⏳' : '✅'} ใช้งาน
                  </button>
                {/if}
              </div>
            </div>

            <div class="sound-item">
              <span>🔻 ลดค่า (-1)</span>
              <div class="sound-controls">
                <button class="test-btn" on:click={() => playTestSound('decrease')}>▶️ ทดสอบ</button>
                <input type="file" accept="audio/*" bind:files={customSoundFile} style="display: none;" id="decrease-upload">
                <button class="upload-btn" on:click={() => document.getElementById('decrease-upload')?.click()}>📁 อัปโหลด</button>
              </div>
            </div>

            <div class="sound-item">
              <span>⬆️ เพิ่มค่า (+10)</span>
              <div class="sound-controls">
                <button class="test-btn" on:click={() => playTestSound('increment10')}>▶️ ทดสอบ</button>
              </div>
            </div>

            <div class="sound-item">
              <span>⬇️ ลดค่า (-10)</span>
              <div class="sound-controls">
                <button class="test-btn" on:click={() => playTestSound('decrement10')}>▶️ ทดสอบ</button>
              </div>
            </div>

            <div class="sound-item">
              <span>❌ ข้อผิดพลาด</span>
              <div class="sound-controls">
                <button class="test-btn" on:click={() => playTestSound('error')}>▶️ ทดสอบ</button>
              </div>
            </div>

            <div class="sound-item">
              <span>✅ สำเร็จ</span>
              <div class="sound-controls">
                <button class="test-btn" on:click={() => playTestSound('success')}>▶️ ทดสอบ</button>
              </div>
            </div>
          </div>

          <div class="audio-actions">
            <button class="action-btn" on:click={resetSounds}>
              🔄 รีเซ็ตเสียงเป็นค่าเริ่มต้น
            </button>
          </div>

          <div class="sound-actions">
            <button class="reset-btn" on:click={resetSounds}>🔄 รีเซ็ตเสียง</button>
          </div>
        </div>

      {:else if activeTab === 'hotkeys'}
        <div class="hotkey-settings">
          {#if hotkeyConflicts.length > 0}
            <div class="hotkey-conflict-warning">
              ⚠️ มีคีย์ลัดซ้ำกัน: {hotkeyConflicts.join(', ')} กรุณาเปลี่ยนให้ไม่ซ้ำกัน
            </div>
          {/if}
          <!-- Hotkey actions list -->
          {#each Object.values($hotkeySettings.actions) as action}
            <div class="hotkey-row">
              <span>{action.label}</span>
              <span>{keybindToString(action.currentKeybind)}</span>
              <button on:click={() => startRecording(action.id)}>เปลี่ยนคีย์ลัด</button>
            </div>
          {/each}
          <button class="reset-btn" on:click={resetHotkeys}>🔄 รีเซ็ตคีย์ลัด</button>
        </div>

      {:else if activeTab === 'general'}
        <div class="general-settings">
          <h3>🎛️ การตั้งค่าทั่วไป</h3>
          
          <div class="setting-row">
            <label class="setting-label" for="version-info">เวอร์ชัน</label>
            <span id="version-info" class="version">v1.0.0</span>
          </div>

          <div class="setting-row">
            <label class="setting-label" for="developer-info">ผู้พัฒนา</label>
            <span id="developer-info" class="developer">ArtYWoof</span>
          </div>

          <div class="setting-row">
            <label class="setting-label" for="auto-update-info">อัปเดตอัตโนมัติ</label>
            <span id="auto-update-info" class="auto-update">✅ เปิดใช้งาน</span>
          </div>

          <div class="actions">
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
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
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
    max-width: 600px;
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
    max-height: 400px;
    overflow-y: auto;
    color: white;
  }

  .setting-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #333;
  }

  .setting-label {
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .volume-control {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .volume-control input[type="range"] {
    width: 120px;
  }

  .volume-value {
    min-width: 40px;
    font-size: 12px;
    color: #ccc;
  }

  .sound-effects {
    margin-top: 20px;
  }

  .sound-effects h3 {
    margin-bottom: 15px;
    color: #007AFF;
    font-size: 1.1em;
  }

  .sound-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    font-size: 14px;
  }

  .sound-item span:first-child {
    flex: 1;
    min-width: 120px;
  }

  .test-btn, .upload-btn, .apply-btn {
    padding: 4px 8px;
    font-size: 12px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
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

  .reset-btn {
    background: #dc3545;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    margin-top: 15px;
  }

  .reset-btn:hover {
    background: #c82333;
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

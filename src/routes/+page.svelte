<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable, derived } from 'svelte/store';
  import { browser } from '$app/environment';
  import { listen, type UnlistenFn } from '@tauri-apps/api/event';
  import { invoke } from '@tauri-apps/api/core';
  // License system removed
  import { updateManager } from '$lib/updateManager';
  import LicenseModal from '$lib/components/LicenseModal.svelte';
  import licenseManager from '$lib/licenseManager';

  // State stores - these will be updated by Tauri events
  const win = writable(0);
  const goal = writable(10);
  const showGoal = writable(true);
  const showCrown = writable(true);
  const presets = writable<string[]>([]);
  const currentPreset = writable('Default');
  
  // Computed store that puts current preset at the top
  const sortedPresets = derived([presets, currentPreset], ([$presets, $currentPreset]: [string[], string]) => {
    if ($presets.length === 0) return [];
    
    const currentPresetIndex = $presets.indexOf($currentPreset);
    if (currentPresetIndex === -1) return $presets; // If current preset not found, return original order
    
    // Move current preset to the top
    const reordered = [...$presets];
    const [moved] = reordered.splice(currentPresetIndex, 1);
    reordered.unshift(moved);
    
    return reordered;
  });

  // Overlay state - separate from app state
  const overlayShowGoal = writable(true);
  const overlayShowCrown = writable(true);

  // App display state - always show in main app
  const appShowCrown = writable(true);
  const appShowGoal = writable(true);

  // UI state
  let showSettingsModal = false;
  let showPresetModal = false;
  let showCopyModal = false;
  let showResetConfirmModal = false;
  let settingsTab = 'general'; // 'general', 'hotkey', or 'sound'
  
  // Preset editing state
  let editingPreset: string | null = null;
  let newPresetName = '';
  let renameValue: string = '';

  // Settings state
  let customHotkeys: Record<string, string> = {
    increment: 'Alt+=',
    decrement: 'Alt+-',
    increment10: 'Alt+Shift+=',
    decrement10: 'Alt+Shift+-'
  };
  let soundEnabled = true;
  let customIncreaseSound: string | null = null;
  let customDecreaseSound: string | null = null;
  let customIncreaseFileName: string | null = null;
  let customDecreaseFileName: string | null = null;
  let audioUpCustom: HTMLAudioElement | null = null;
  let audioDownCustom: HTMLAudioElement | null = null;
  


  // Number editing state
  let editingWin = false;
  let editingGoal = false;
  let winEditValue = '';
  let goalEditValue = '';
  let winInputElement: HTMLInputElement;
  let goalInputElement: HTMLInputElement;

  let tauriAvailable = false;
  let unlisten: UnlistenFn | null = null;
  let audioUp: HTMLAudioElement;
  let audioDown: HTMLAudioElement;

  let overlayWebSocket: WebSocket | null = null;

  let showAddPreset = false;
  let addPresetValue = '';
  let addPresetInput: HTMLInputElement | null = null;

  // ... state อื่นๆ ...
  let showDeleteModal = false;
  let presetToDelete: string | null = null;

  // Auto Update state
  let hasUpdate = false;
  let updateInfo: any = null;
  let isCheckingUpdate = false;
  
  // Payment Selection state
  let selectedPaymentMethod = 'promptpay'; // default
  let showPaymentMethods = false;
  let customerPhone = '';
  let isProcessingPayment = false;

  // Payment method options
  const paymentMethods = [
    {
      id: 'promptpay',
      name: 'PromptPay',
      icon: '📱',
      description: 'สแกน QR Code ผ่านแอป Banking',
      fees: 'ฟรี',
      processing_time: 'ทันที'
    },
    {
      id: 'truewallet',
      name: 'True Wallet',
      icon: '💳',
      description: 'จ่ายผ่าน True Wallet App',
      fees: 'ฟรี',
      processing_time: 'ทันที'
    },
    {
      id: 'card',
      name: 'บัตรเครดิต/เดบิต',
      icon: '💳',
      description: 'Visa, Mastercard, JCB',
      fees: '+3%',
      processing_time: 'ทันที'
    }
  ];
  
  // Upload message state
  let uploadMessage = '';
  
  // Settings state
  let recordingHotkey: string | null = null;
  let recordingTimeout: number | null = null;

  // Donate state
  let showDonateModal = false;
  let donateAmount = '';
  let donateWinCondition = '';
  let donateTargetAmount = '';
  let donateOperation = ''; // 'add' or 'subtract'
  let missingFields: string[] = [];
  let operationError = false;
  let showResultModal = false;
  let resultMessage = '';
  
  // Anti-tampering protection
  let isTampered = false;
  let appIntegrity = true;
  
  // Anti-tampering check function
  async function checkAppIntegrity() {
    try {
      // Check if running in Tauri environment
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        // Additional checks can be added here
        appIntegrity = true;
        console.log('✅ App integrity check passed');
      } else {
        appIntegrity = false;
        isTampered = true;
        console.warn('⚠️ App integrity check failed - not running in Tauri');
      }
    } catch (error) {
      console.error('❌ App integrity check error:', error);
      appIntegrity = false;
      isTampered = true;
    }
  }

  // Sound confirmation modals
  let showDeleteSoundModal = false;
  let soundToDelete: 'increase' | 'decrease' | null = null;
  let showResetSoundModal = false;
  let showResetHotkeyModal = false;

  // Settings functions
  function startHotkeyRecording(action: string) {
    recordingHotkey = action;
    console.log(`🎹 Recording hotkey for ${action}...`);
    
    // Clear any existing timeout
    if (recordingTimeout) {
      clearTimeout(recordingTimeout);
    }
    
    // Set timeout to stop recording after 5 seconds
    recordingTimeout = setTimeout(() => {
      stopHotkeyRecording();
    }, 5000);
  }

  // Donate functions
  function saveDonateValues() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('donateAmount', donateAmount);
      localStorage.setItem('donateWinCondition', donateWinCondition);
      localStorage.setItem('donateOperation', donateOperation);
      console.log('💰 Saved donate values to localStorage:', { donateAmount, donateWinCondition, donateOperation });
    }
  }

  function openDonateModal() {
    showDonateModal = true;
    // ไม่รีเซ็ตค่าเดิม เพื่อให้ใช้ค่าที่บันทึกไว้
    donateTargetAmount = '';
    donateOperation = ''; // ไม่เริ่มต้นที่ปุ่มบวก
  }

  function closeDonateModal() {
    showDonateModal = false;
  }

  async function processDonate() {
    // ตรวจสอบว่ากรอกครบทุกช่องหรือไม่
    missingFields = [];
    operationError = false;
    if (!donateAmount) missingFields.push('จำนวนกี่บาท');
    if (!donateWinCondition) missingFields.push('เท่ากับกี่วิน');
    if (!donateTargetAmount) missingFields.push('จำนวนบาท');
    if (donateOperation !== 'add' && donateOperation !== 'subtract') {
      operationError = true;
    }

    if (missingFields.length > 0 || operationError) {
      // ไม่ต้องแจ้งเตือน alert ใดๆ
      return;
    }

    const amount = parseInt(donateAmount);
    const winCondition = parseInt(donateWinCondition);
    const targetAmount = parseInt(donateTargetAmount);

    if (isNaN(amount) || isNaN(winCondition) || isNaN(targetAmount)) {
      alert('กรุณากรอกตัวเลขที่ถูกต้องในทุกช่อง');
      return;
    }

    if (amount <= 0 || winCondition <= 0 || targetAmount <= 0) {
      alert('กรุณากรอกตัวเลขที่มากกว่า 0 ในทุกช่อง');
      return;
    }

    // คำนวณจำนวนวินที่จะเพิ่ม/ลด
    const winChange = Math.floor(targetAmount / amount) * winCondition;
    const finalWinChange = donateOperation === 'add' ? winChange : -winChange;
    const currentWin = $win;
    const newWinValue = currentWin + finalWinChange;

    // สร้างข้อความผลลัพธ์
    const operationSymbol = donateOperation === 'add' ? '+' : '-';
    const operationText = donateOperation === 'add' ? 'บวก' : 'ลบ';
    
    resultMessage = `${currentWin} ${operationSymbol} ${Math.abs(winChange)} = ${newWinValue}`;

    // อัปเดตค่า Win
    await tauriSetWin(newWinValue);

    // แสดงหน้าต่างแจ้งเตือนผลลัพธ์
    showResultModal = true;

    // ปิด modal โดเนท
    closeDonateModal();

    // ปิดหน้าต่างผลลัพธ์หลังจาก 1.5 วินาที
    setTimeout(() => {
      closeResultModal();
    }, 1500);
  }

  function closeResultModal() {
    showResultModal = false;
    resultMessage = '';
  }



  // Reset hotkeys to defaults
  async function resetHotkeys() {
    console.log('🔄 RESET HOTKEYS BUTTON CLICKED!');
    
    try {
      // 1. สั่งให้ Backend ล้างไฟล์ Hotkey เก่าทิ้ง
      await invoke('clear_hotkeys');
      console.log('✅ Backend hotkeys file cleared.');
      
      // 2. รีเซ็ตค่าใน Frontend
      customHotkeys = {
        increment: 'Alt+=',
        decrement: 'Alt+-',
        increment10: 'Alt+Shift+=',
        decrement10: 'Alt+Shift+-'
      };
      console.log('✅ Frontend settings reset.');

      // 3. บันทึกค่าเริ่มต้นที่ถูกต้องลงในไฟล์ backend
      console.log('💾 Saving default hotkeys to backend...');
      await invoke('save_default_hotkeys');
      console.log('✅ Default hotkeys saved to backend');
      
      // 4. Reload hotkeys ใน backend
      try {
        await invoke('reload_hotkeys_command');
        console.log('✅ Backend hotkeys reloaded with defaults');
      } catch (error) {
        console.error('❌ Failed to reload backend hotkeys:', error);
      }
      
      console.log('✅ Reset completed successfully');
      
    } catch (error) {
      console.error('❌ Failed to reset hotkeys:', error);
    }
  }
  
  function stopHotkeyRecording() {
    recordingHotkey = null;
    if (recordingTimeout) {
      clearTimeout(recordingTimeout);
      recordingTimeout = null;
    }
    console.log('🎹 Stopped hotkey recording');
  }
  
  async function updateHotkey(action: string, newKey: string) {
    customHotkeys[action] = newKey;
    
    // Save to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('customHotkeys', JSON.stringify(customHotkeys));
    }
    
    // Send to Tauri backend
    try {
      await invoke('update_hotkey', { action, hotkey: newKey });
      console.log(`🎹 Updated hotkey for ${action}: ${newKey} (saved to backend)`);
      
      // Reload hotkeys from backend to apply changes immediately
      await invoke('reload_hotkeys_command');
      console.log(`✅ Hotkeys reloaded for ${action}: ${newKey}`);
      
      // Show notification to user (optional - can be removed if not needed)
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Win Count', {
            body: `Hotkey updated: ${action} -> ${newKey}\nHotkey is now active - no restart needed!`,
            icon: '/assets/ui/app_icon.png'
          });
        }
      }
      
      // Log success (no alert to avoid interruption)
      console.log(`✅ Hotkey updated: ${action} -> ${newKey} - Hotkey is now active`);
      
    } catch (error) {
      console.error(`❌ Failed to update hotkey for ${action}:`, error);
      alert(`❌ Failed to update hotkey: ${error}`);
    }
  }
  
  async function handleSoundUpload(event: Event, type: 'increase' | 'decrease') {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      console.log(`🔊 Sound upload: ${type} - ${file.name}`);
      
      try {
        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const fileData = new Uint8Array(arrayBuffer);
        
        // Save file to backend using Tauri
        await invoke('save_custom_sound', { 
          fileData: Array.from(fileData), 
          filename: file.name, 
          soundType: type 
        });
        
        // Create URL for the uploaded file
        const fileUrl = URL.createObjectURL(file);
        
        if (type === 'increase') {
          customIncreaseSound = fileUrl;
          customIncreaseFileName = file.name;
          
          // Create new Audio object for custom increase sound
          audioUpCustom = new Audio(fileUrl);
          audioUpCustom.load();
          
          // Test the sound immediately
          setTimeout(() => {
            audioUpCustom?.play().catch(err => console.error('🔊 Error playing uploaded increase sound:', err));
          }, 100);
          
          // Test the sound immediately
          setTimeout(() => {
            audioUpCustom?.play().catch(err => console.error('🔊 Error playing uploaded increase sound:', err));
          }, 100);
        } else if (type === 'decrease') {
          customDecreaseSound = fileUrl;
          customDecreaseFileName = file.name;
          
          // Create new Audio object for custom decrease sound
          audioDownCustom = new Audio(fileUrl);
          audioDownCustom.load();
          
          // Test the sound immediately
          setTimeout(() => {
            audioDownCustom?.play().catch(err => console.error('🔊 Error playing uploaded decrease sound:', err));
          }, 100);
        }
        
        // Clear the input for future uploads
        target.value = '';
        
              } catch (error) {
          console.error('❌ Failed to save sound file:', error);
        }
    }
  }
  
  // License state
  let isLicenseValid = false;
  let showLicenseModal = false;
  let isCheckingLicense = true;
  
  // Purchase Modal State
  let showPurchaseModal = false;
  let showQRCode = false;
  let customerEmail = '';
  let qrCodeData = '';
  let countdownMinutes = 15;
  let countdownSeconds = 0;
  let paymentRef = '';
  let pendingLicenseKey = '';
  let paymentTimer: number | null = null;
  let paymentCheckInterval: number | null = null;
  
  // App ready state
  let isAppReady = false; // ควบคุมการแสดงแอพหลัก - ต้องตรวจสอบ License ก่อน
  
  async function checkLicenseStatus() {
    try {
      console.log('🔑 ตรวจสอบ License...');
      
      // ดึง License Key จาก localStorage
      const savedLicenseKey = localStorage.getItem('win_count_license_key');
      
      if (!savedLicenseKey) {
        console.log('❌ ไม่พบ License Key - แสดง License Modal');
        isLicenseValid = false;
        isAppReady = true; // ให้แสดงแอพได้ แต่ยังไม่ valid
        showLicenseModal = true;
        return;
      }
      
      // ตรวจสอบ License ผ่าน Backend
      const isValid = await invoke('validate_license_key', { license_key: savedLicenseKey });
      
      if (isValid) {
        isLicenseValid = true;
        isAppReady = true;
        console.log('✅ License ถูกต้อง');
      } else {
        console.log('❌ License ไม่ถูกต้อง - แสดง License Modal');
        isLicenseValid = false;
        isAppReady = true; // ให้แสดงแอพได้ แต่ยังไม่ valid
        showLicenseModal = true;
      }
    } catch (error) {
      console.error('❌ License check failed:', error);
      // ในกรณีที่เกิดข้อผิดพลาด ให้แสดง License Modal
      isLicenseValid = false;
      isAppReady = true;
      showLicenseModal = true;
    } finally {
      isCheckingLicense = false;
    }
  }

  function onLicenseValid() {
    isLicenseValid = true;
    showLicenseModal = false;
    isAppReady = true;
    console.log('✅ License validated successfully - เข้าใช้งานแอพได้แล้ว');
  }



  // บันทึก License Key เมื่อจ่ายเงินสำเร็จ
  async function saveLicenseKey(licenseKey: string) {
    try {
      // บันทึกใน Backend
      await invoke('save_license_key', { key: licenseKey });
      
      // บันทึกใน localStorage
      localStorage.setItem('win_count_license_key', licenseKey);
      
      console.log('💾 License key saved successfully');
    } catch (error) {
      console.error('❌ Failed to save license key:', error);
    }
  }

  // Purchase functions
  function openPurchaseModal() {
    showPurchaseModal = true;
    showQRCode = false;
    customerEmail = '';
    qrCodeData = '';
    countdownMinutes = 15;
    countdownSeconds = 0;
  }

  function closePurchaseModal() {
    showPurchaseModal = false;
    showQRCode = false;
    if (paymentTimer !== null) clearInterval(paymentTimer);
    if (paymentCheckInterval !== null) clearInterval(paymentCheckInterval);
  }

  async function startPurchase() {
    if (!customerEmail || !customerEmail.includes('@')) {
      alert('กรุณากรอกอีเมลที่ถูกต้อง');
      return;
    }

    try {
      console.log('🛒 Starting purchase process...');
      
      // ดึง Machine ID
      const machineId = await invoke('get_machine_id');
      
      // สร้าง Purchase Request
      const response = await fetch('https://win-count-by-artywoof-miy1mgiyx-artywoofs-projects.vercel.app/api/create-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machine_id: machineId,
          customer_email: customerEmail
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // เก็บข้อมูลสำคัญ
        paymentRef = result.payment_ref;
        pendingLicenseKey = result.license_key;
        qrCodeData = result.qr_code_data;
        
        // แสดง QR Code
        showQRCode = true;
        
        // เริ่มนับถอยหลัง 15 นาที
        startCountdown();
        
        // เริ่มเช็คการจ่ายเงิน
        startPaymentMonitoring();
        
        console.log('✅ Purchase request created:', result);
      } else {
        alert('เกิดข้อผิดพลาด: ' + result.message);
      }
    } catch (error) {
      console.error('❌ Purchase failed:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  }

  function startCountdown() {
    paymentTimer = setInterval(() => {
      if (countdownSeconds > 0) {
        countdownSeconds--;
      } else if (countdownMinutes > 0) {
        countdownMinutes--;
        countdownSeconds = 59;
      } else {
        // หมดเวลา
        if (paymentTimer !== null) clearInterval(paymentTimer);
        if (paymentCheckInterval !== null) clearInterval(paymentCheckInterval);
        alert('หมดเวลาการชำระเงิน กรุณาลองใหม่');
        closePurchaseModal();
      }
    }, 1000);
  }

  // Enhanced payment functions
  function selectPaymentMethod(methodId: string) {
    selectedPaymentMethod = methodId;
    showPaymentMethods = false;
  }

  function validateEmail(email: string) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  async function startPaymentMonitoring() {
    const checkPayment = async () => {
      try {
        const response = await fetch('https://win-count-by-artywoof-miy1mgiyx-artywoofs-projects.vercel.app/api/check-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_ref: paymentRef })
        });

        const result = await response.json();
        
        if (result.status === 'PAID') {
          // จ่ายเงินสำเร็จ!
          if (paymentTimer !== null) clearInterval(paymentTimer);
          if (paymentCheckInterval !== null) clearInterval(paymentCheckInterval);
          
          // บันทึก License Key
          await saveLicenseKey(pendingLicenseKey);
          
          // แสดงข้อความสำเร็จ
          alert('🎉 ชำระเงินสำเร็จ! สามารถใช้งานได้แล้ว');
          
          // ปิด Modal และรีเฟรช
          closePurchaseModal();
          location.reload();
          
        } else if (result.status === 'EXPIRED') {
          if (paymentTimer !== null) clearInterval(paymentTimer);
          if (paymentCheckInterval !== null) clearInterval(paymentCheckInterval);
          alert('QR Code หมดอายุ กรุณาลองใหม่');
          closePurchaseModal();
        }
        // ถ้า PENDING ให้เช็คต่อไป
      } catch (error) {
        console.error('❌ Payment check failed:', error);
      }
    };
    
    // เช็คทุก 10 วินาที
    paymentCheckInterval = setInterval(checkPayment, 10000);
    
    // เช็คครั้งแรกทันที
    checkPayment();
  }

  function openAddPreset() {
    showAddPreset = true;
    addPresetValue = '';
    setTimeout(() => { addPresetInput?.focus(); }, 10);
  }
  function cancelAddPreset() {
    showAddPreset = false;
    addPresetValue = '';
  }
  async function confirmAddPreset() {
    const name = addPresetValue.trim();
    if (!name || $presets.includes(name)) return;
    
    try {
      console.log(`➕ Creating new preset: ${name}`);
      
      // สร้าง Preset ใหม่ด้วยค่าเริ่มต้น
      const newPresetData: PresetData = {
        name: name,
        win: 0,
        goal: 10,
        show_goal: true,
        show_crown: true,
        hotkeys: {
          increase: customHotkeys.increment,
          decrease: customHotkeys.decrement,
          step_size: 1
        }
      };

      // บันทึก Preset ใหม่ไปยัง Backend
      await invoke('save_preset', { preset: newPresetData });
      console.log(`✅ Created new preset: ${name}`);

      // โหลดรายการ preset ใหม่จาก backend
      const presetList: any = await invoke('load_presets');
      presets.set(presetList.map((p: any) => p.name));
      
      // ปิด Modal และรีเซ็ตค่า
      showAddPreset = false;
      addPresetValue = '';
      
      console.log(`✅ Successfully created preset: ${name}`);
    } catch (err) {
      console.error('❌ Failed to create preset:', err);
      alert(`ไม่สามารถสร้าง Preset "${name}" ได้: ${err}`);
    }
  }

  function requestDeletePreset(presetName: string) {
    presetToDelete = presetName;
    showDeleteModal = true;
  }

  async function confirmDeletePreset() {
    if (!presetToDelete) return;
    await deletePreset(presetToDelete);
    showDeleteModal = false;
    presetToDelete = null;
  }

  function cancelDeletePreset() {
    showDeleteModal = false;
    presetToDelete = null;
  }

  async function deletePreset(presetName: string) {
    try {
      console.log(`🗑️ Attempting to delete preset: ${presetName}`);
      
      // โหลดรายการ preset ก่อนลบ
      const beforeDeleteList: any = await invoke('load_presets');
      console.log('📋 Presets before deletion:', beforeDeleteList.map((p: any) => p.name));
      
      await invoke('delete_preset', { name: presetName });
      console.log(`✅ Backend confirmed deletion of: ${presetName}`);
      
      // รอสักครู่ให้ backend บันทึกไฟล์
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // โหลดรายการ preset ใหม่จาก backend
      const presetList: any = await invoke('load_presets');
      console.log('📋 Presets after deletion:', presetList.map((p: any) => p.name));
      
      // อัปเดต presets store
      const presetNames = presetList.map((p: any) => p.name);
      presets.set(presetNames);
      console.log('🔄 Updated presets store:', presetNames);
      

      
      // ถ้าลบ preset ที่ใช้งานอยู่ ให้กลับไป preset แรกที่มี
      if ($currentPreset === presetName) {
        if (presetList.length > 0) {
          const firstPreset = presetList[0].name;
          console.log(`🔄 Switching to first available preset: ${firstPreset}`);
          currentPreset.set(firstPreset);
          await loadPreset(firstPreset, false);
        }
      }
      
      console.log(`✅ Successfully deleted preset: ${presetName}`);
      showNotification(`✅ ลบ Preset "${presetName}" สำเร็จ`);
      
      // ปิด modal ถ้ามี
      showDeleteModal = false;
      presetToDelete = null;
    } catch (err) {
      console.error('❌ Failed to delete preset:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      showNotification(`❌ ไม่สามารถลบ Preset "${presetName}" ได้: ${errorMessage}`);
    }
  }



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
      currentPreset.set(state.current_preset || 'Default');
      
      // Load the current preset data
      if (state.current_preset && state.current_preset !== 'Default') {
        try {
          console.log(`🔄 Loading current preset: ${state.current_preset}`);
          await loadPreset(state.current_preset, false);
        } catch (err) {
          console.error(`❌ Failed to load preset ${state.current_preset}:`, err);
          // Fallback to Default preset
          currentPreset.set('Default');
        }
      }
      
      tauriAvailable = true;
      
      // Listen for state updates from Tauri
      unlisten = await listen('state-updated', (event) => {
        console.log('🎯 Received state update from Tauri:', event.payload);
        const state = event.payload as any;
        win.set(state.win || 0);
        goal.set(state.goal || 10);
        showGoal.set(state.show_goal !== false);
        showCrown.set(state.show_crown !== false);
        
        // Send the update to overlay with overlay-specific state
        sendToOverlay({
          win: state.win || 0,
          goal: state.goal || 10,
          show_crown: $overlayShowCrown,
          show_goal: $overlayShowGoal,
          current_preset: state.current_preset || 'Default'
        });
      });
      
      // Listen for sound events from Rust backend
      const unlistenIncreaseSound = await listen('play-increase-sound', () => {
        console.log('🔊 Received play-increase-sound event from Rust');
        playIncreaseSound();
      });
      
      const unlistenDecreaseSound = await listen('play-decrease-sound', () => {
        console.log('🔊 Received play-decrease-sound event from Rust');
        playDecreaseSound();
      });
      
      // Store all unlisten functions for cleanup
      const originalUnlisten = unlisten;
      unlisten = () => {
        originalUnlisten?.();
        unlistenIncreaseSound?.();
        unlistenDecreaseSound?.();
      };
      
      // NOTE: Hotkey events are handled directly by Rust backend
      // No need to listen for hotkey events here since Rust calls change_win() directly
      // and emits 'state-updated' events that we already listen to above
      
      console.log('✅ Tauri connection established');
    } catch (err) {
      console.error('❌ Failed to initialize Tauri:', err);
      tauriAvailable = false;
    }
  }

  function initOverlayWebSocket() {
    try {
      overlayWebSocket = new WebSocket('ws://localhost:779');
      overlayWebSocket.onopen = () => {
        console.log('🔗 WebSocket connected to overlay bridge');
        // Send current state immediately
        sendToOverlay({
          win: $win,
          goal: $goal,
          show_crown: $overlayShowCrown,
          show_goal: $overlayShowGoal,
          current_preset: $currentPreset
        });
      };
      overlayWebSocket.onclose = () => {
        console.log('🔗 WebSocket disconnected from overlay bridge');
        setTimeout(() => {
          if (browser) {
            initOverlayWebSocket();
          }
        }, 3000);
      };
      overlayWebSocket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };
    } catch (err) {
      console.error('❌ Failed to initialize WebSocket:', err);
    }
  }

  function sendToOverlay(state: any) {
    // Send via WebSocket to bridge server (for cross-process communication)
    if (overlayWebSocket && overlayWebSocket.readyState === WebSocket.OPEN) {
      overlayWebSocket.send(JSON.stringify({
        type: 'update',
        ...state
      }));
      console.log('🔗 Sent state to overlay bridge:', state);
    }
  }

  // Sound functions
  function playIncreaseSound() {
    console.log('🔊 playIncreaseSound called - soundEnabled:', soundEnabled, 'audioUp:', !!audioUp, 'audioUpCustom:', !!audioUpCustom);
    if (soundEnabled) {
      if (audioUpCustom) {
        console.log('🔊 Playing custom increase sound');
        audioUpCustom.currentTime = 0;
        audioUpCustom.play().catch(err => console.error('🔊 Error playing custom increase sound:', err));
      } else if (audioUp) {
        console.log('🔊 Playing default increase sound');
        audioUp.currentTime = 0;
        audioUp.play().catch(err => console.error('🔊 Error playing default increase sound:', err));
      } else {
        console.warn('🔊 No audio element available for increase sound');
      }
    } else {
      console.log('🔊 Sound is disabled');
    }
  }

  function playDecreaseSound() {
    console.log('🔊 playDecreaseSound called - soundEnabled:', soundEnabled, 'audioDown:', !!audioDown, 'audioDownCustom:', !!audioDownCustom);
    if (soundEnabled) {
      if (audioDownCustom) {
        console.log('🔊 Playing custom decrease sound');
        audioDownCustom.currentTime = 0;
        audioDownCustom.play().catch(err => console.error('🔊 Error playing custom decrease sound:', err));
      } else if (audioDown) {
        console.log('🔊 Playing default decrease sound');
        audioDown.currentTime = 0;
        audioDown.play().catch(err => console.error('🔊 Error playing default decrease sound:', err));
      } else {
        console.warn('🔊 No audio element available for decrease sound');
      }
    } else {
      console.log('🔊 Sound is disabled');
    }
  }

  // Main win count functions
  async function increaseWin(amount: number = 1) {
    const newValue = Math.min(10000, $win + amount);
    if (newValue !== $win) {
      await tauriSetWin(newValue);
      playIncreaseSound();
    }
  }

  async function decreaseWin(amount: number = 1) {
    const newValue = Math.max(-10000, $win - amount);
    if (newValue !== $win) {
      await tauriSetWin(newValue);
      playDecreaseSound();
    }
  }

  // Tauri command wrappers
  async function tauriSetWin(value: number) {
    if (!tauriAvailable) return;
    try {
      const clampedValue = Math.max(-10000, Math.min(10000, value));
      await invoke('set_win', { value: clampedValue });
      console.log('🎯 Win set via Tauri:', clampedValue);
    } catch (err) {
      console.error('❌ Failed to set win:', err);
    }
  }

  async function tauriSetGoal(value: number) {
    if (!tauriAvailable) return;
    try {
      const clampedValue = Math.max(-10000, Math.min(10000, value));
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
    // ใช้ localhost สำหรับเครื่องเดียวกัน
    const overlayUrl = 'http://localhost:777/overlay.html';
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(overlayUrl);
        showCopyModal = true;
      } catch (err) {
        showCopyModal = true;
      }
    } else {
      showCopyModal = true;
    }
  }

  // Auto Update functions using Tauri invoke
  async function checkForUpdates() {
    if (isCheckingUpdate) return;
    
    isCheckingUpdate = true;
    console.log('🔄 Starting update check...');
    
    try {
      // Use our custom check_for_updates command
      console.log('📡 Invoking check_for_updates...');
      const updateResult = await invoke('check_for_updates') as any;
      
      console.log('✅ Update check completed successfully:', updateResult);
      
      if (updateResult.available) {
        showNotification(`🔄 พบเวอร์ชันใหม่ ${updateResult.version}!`);
        hasUpdate = true;
        updateInfo = updateResult;
      } else {
        showNotification('✅ คุณใช้เวอร์ชันล่าสุดแล้ว!');
      }
    } catch (error) {
      console.error('❌ Update check failed:', error);
      showNotification('❌ เกิดข้อผิดพลาดในการตรวจสอบอัปเดต');
    } finally {
      isCheckingUpdate = false;
    }
  }

  async function downloadUpdate() {
    if (!hasUpdate) return;
    
    try {
      console.log('📥 Installing update...');
      showNotification('กำลังดาวน์โหลดอัปเดต...');
      
      // Use Tauri's built-in updater
      await invoke('tauri', { cmd: 'updater', action: 'install' });
      
      console.log('✅ Update installation initiated');
      showNotification('การติดตั้งอัปเดตเริ่มต้นแล้ว');
    } catch (error) {
      console.error('❌ Failed to install update:', error);
      showNotification('❌ เกิดข้อผิดพลาดในการติดตั้งอัปเดต');
    }
  }

  async function restartAndInstall() {
    try {
      console.log('🔄 Restarting app...');
      await invoke('tauri', { cmd: 'relaunch' });
    } catch (error) {
      console.error('❌ Failed to restart:', error);
      showNotification('❌ เกิดข้อผิดพลาดในการรีสตาร์ท');
    }
  }

  function dismissUpdate() {
    hasUpdate = false;
    updateInfo = null;
  }

  // Show notification function
  function showNotification(message: string, duration: number = 3000) {
    // Create custom notification instead of using copy modal
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <span>${message}</span>
      </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .custom-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(145deg, #1a1a1a, #2d2d2d);
        border: 1px solid #007AFF;
        border-radius: 12px;
        padding: 15px 20px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        animation: slideInRight 0.3s ease-out;
      }
      
      .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `;
    
    // Add to document
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    // Auto-remove after duration
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
      if (style.parentElement) {
        style.remove();
      }
    }, duration);
  }

  // Handle update check result
  function handleUpdateCheck(result: any) {
    if (result.hasUpdate && result.updateInfo) {
      hasUpdate = true;
      updateInfo = result.updateInfo;
      console.log('🔄 Update available:', result.updateInfo.version);
    } else {
      console.log('✅ No updates available');
      showNotification('✅ ไม่มีอัปเดตใหม่');
    }
  }

  // Toggle functions
  async function toggleIcon() {
    // Toggle overlay crown state only
    overlayShowCrown.set(!$overlayShowCrown);
  }

  async function toggleGoal() {
    // Toggle overlay goal state only
    overlayShowGoal.set(!$overlayShowGoal);
  }

  async function copyLink() {
    await copyOverlayLink();
  }


  
  function handleKeyPress(event: KeyboardEvent) {
    // Don't handle global keys if we're in a modal
    if (showSettingsModal || showPresetModal) {
      return;
    }

    // Handle number editing with hotkeys (when not already editing)
    if (!editingWin && !editingGoal) {
      if (event.key === 'Enter') {
        event.preventDefault();
        // If goal is visible, start editing goal, otherwise start editing win
        if ($showGoal) {
          startEditGoal();
        } else {
          startEditWin();
        }
        return;
      }
    }

    // Don't interfere with editing mode - let the input handlers deal with it
    if (editingWin || editingGoal) {
      return;
    }
  }

  // Number editing functions
  function startEditWin() {
    if (editingGoal) return; // Prevent editing both at same time
    editingWin = true;
    winEditValue = $win.toString();
    setTimeout(() => {
      if (winInputElement) {
        winInputElement.focus();
        // Place cursor at end without selecting all text
        const length = winInputElement.value.length;
        winInputElement.setSelectionRange(length, length);
      }
    }, 10);
  }

  function startEditGoal() {
    if (editingWin) return; // Prevent editing both at same time
    editingGoal = true;
    goalEditValue = $goal.toString();
    setTimeout(() => {
      if (goalInputElement) {
        goalInputElement.focus();
        // Place cursor at end
        const length = goalInputElement.value.length;
        goalInputElement.setSelectionRange(length, length);
      }
    }, 0);
  }

  function saveWinEdit() {
    if (!editingWin) return;
    
    // Handle empty or invalid input
    if (winEditValue === '' || winEditValue === '-') {
      cancelWinEdit();
      return;
    }
    
    const newValue = parseInt(winEditValue);
    if (!isNaN(newValue) && newValue >= -10000 && newValue <= 10000) {
      tauriSetWin(newValue);
      editingWin = false;
      winEditValue = '';
      } else {
      // Show warning effect
      console.log('⚠️ Win value out of range (-10000 to 10000)');
      if (winInputElement) {
        winInputElement.classList.add('warning');
        setTimeout(() => {
          winInputElement?.classList.remove('warning');
        }, 500);
      }
      // Don't exit edit mode, let user fix the value
    }
  }

  function saveGoalEdit() {
    if (!editingGoal) return;
    
    // Handle empty or invalid input
    if (goalEditValue === '' || goalEditValue === '-') {
      cancelGoalEdit();
      return;
    }
    
    const newValue = parseInt(goalEditValue);
    if (!isNaN(newValue) && newValue >= -10000 && newValue <= 10000) {
      tauriSetGoal(newValue);
      editingGoal = false;
      goalEditValue = '';
    } else {
      // Show warning effect
      console.log('⚠️ Goal value out of range (-10000 to 10000)');
      if (winInputElement) {
        winInputElement.classList.add('warning');
        setTimeout(() => {
          winInputElement?.classList.remove('warning');
        }, 500);
      }
      // Don't exit edit mode, let user fix the value
    }
  }

  function cancelWinEdit() {
    editingWin = false;
    winEditValue = '';
  }

  function cancelGoalEdit() {
    editingGoal = false;
    goalEditValue = '';
  }

  function handleWinInputKeydown(event: KeyboardEvent) {
    // Prevent hotkey interference while editing
    if (editingWin) {
      // Allow these keys for editing
      if (['Enter', 'Escape', 'Tab', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        if (event.key === 'Enter') {
          event.preventDefault();
          saveWinEdit();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          cancelWinEdit();
        }
        return;
      }
      
      // Allow control keys
      if (event.ctrlKey || event.metaKey) {
        return;
      }
      
      // Check if it's a valid number key or minus sign
      if (/^[0-9-]$/.test(event.key)) {
        const target = event.target as HTMLInputElement;
        const currentValue = target.value;
        const cursorPos = target.selectionStart || 0;
        
        // Simulate what the value would be after this keypress
        const newValue = currentValue.slice(0, cursorPos) + event.key + currentValue.slice(target.selectionEnd || cursorPos);
        
        // Check if the new value would be valid
        if (newValue === '' || newValue === '-' || /^-?\d*$/.test(newValue)) {
          if (newValue !== '' && newValue !== '-') {
            const numValue = parseInt(newValue);
            if (!isNaN(numValue) && (numValue < -10000 || numValue > 10000)) {
              // Show warning effect
              target.classList.add('warning');
              setTimeout(() => {
                target.classList.remove('warning');
              }, 300);
              console.log('⚠️ Cannot enter value outside range -10000 to 10000');
              event.preventDefault();
              return;
            }
          }
        } else {
          event.preventDefault();
          return;
        }
        
        return;
      }
      
      // Block all other keys while editing
      event.preventDefault();
      return;
    }
  }

  function handleGoalInputKeydown(event: KeyboardEvent) {
    // Prevent hotkey interference while editing
    if (editingGoal) {
      // Allow these keys for editing
      if (['Enter', 'Escape', 'Tab', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        if (event.key === 'Enter') {
          event.preventDefault();
          saveGoalEdit();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          cancelGoalEdit();
        }
        return;
      }
      
      // Allow control keys
      if (event.ctrlKey || event.metaKey) {
        return;
      }
      
      // Check if it's a valid number key or minus sign
      if (/^[0-9-]$/.test(event.key)) {
        const target = event.target as HTMLInputElement;
        const currentValue = target.value;
        const cursorPos = target.selectionStart || 0;
        
        // Simulate what the value would be after this keypress
        const newValue = currentValue.slice(0, cursorPos) + event.key + currentValue.slice(target.selectionEnd || cursorPos);
        
        // Check if the new value would be valid
        if (newValue === '' || newValue === '-' || /^-?\d*$/.test(newValue)) {
          if (newValue !== '' && newValue !== '-') {
            const numValue = parseInt(newValue);
            if (!isNaN(numValue) && (numValue < -10000 || numValue > 10000)) {
              // Show warning effect
              target.classList.add('warning');
              setTimeout(() => {
                target.classList.remove('warning');
              }, 300);
              console.log('⚠️ Cannot enter value outside range -10000 to 10000');
              event.preventDefault();
              return;
            }
          }
        } else {
          event.preventDefault();
          return;
        }
        
      return;
    }
    
      // Block all other keys while editing
      event.preventDefault();
      return;
    }
  }

  function handleWinInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    
    // Allow only numbers, minus sign, and empty string
    if (value === '' || value === '-' || /^-?\d*$/.test(value)) {
      // Check if the value would be within range
      if (value === '' || value === '-') {
        winEditValue = value;
        } else {
        const numValue = parseInt(value);
        if (!isNaN(numValue) && numValue >= -10000 && numValue <= 10000) {
          winEditValue = value;
        } else {
          // Show warning effect
          target.classList.add('warning');
          setTimeout(() => {
            target.classList.remove('warning');
          }, 300);
          
          // Revert to previous valid value immediately
          target.value = winEditValue;
          // Also reset cursor position to end
          setTimeout(() => {
            const length = target.value.length;
            target.setSelectionRange(length, length);
          }, 0);
          console.log('⚠️ Cannot enter value outside range -10000 to 10000');
        }
      }
    } else {
      // Revert to previous valid value for invalid characters
      target.value = winEditValue;
      // Reset cursor position to end
      setTimeout(() => {
        const length = target.value.length;
        target.setSelectionRange(length, length);
      }, 0);
    }
  }

  function handleGoalInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    
    // Allow only numbers, minus sign, and empty string
    if (value === '' || value === '-' || /^-?\d*$/.test(value)) {
      // Check if the value would be within range
      if (value === '' || value === '-') {
        goalEditValue = value;
    } else {
        const numValue = parseInt(value);
        if (!isNaN(numValue) && numValue >= -10000 && numValue <= 10000) {
          goalEditValue = value;
        } else {
          // Show warning effect
          target.classList.add('warning');
          setTimeout(() => {
            target.classList.remove('warning');
          }, 300);
          
          // Revert to previous valid value immediately
          target.value = goalEditValue;
          // Also reset cursor position to end
          setTimeout(() => {
            const length = target.value.length;
            target.setSelectionRange(length, length);
          }, 0);
          console.log('⚠️ Cannot enter value outside range -10000 to 10000');
        }
      }
    } else {
      // Revert to previous valid value for invalid characters
      target.value = goalEditValue;
      // Reset cursor position to end
      setTimeout(() => {
        const length = target.value.length;
        target.setSelectionRange(length, length);
      }, 0);
    }
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    console.log(`🔊 Sound ${soundEnabled ? 'enabled' : 'disabled'}`);
  }

  function resetSoundDefaults() {
    soundEnabled = true;
    customIncreaseSound = null;
    customDecreaseSound = null;
    audioUpCustom = null;
    audioDownCustom = null;
    console.log('🔊 Sound settings reset to defaults');
  }

  function playCustomIncreaseSound() {
    if (soundEnabled && audioUpCustom) {
      audioUpCustom.currentTime = 0;
      audioUpCustom.play().catch(console.error);
    } else if (soundEnabled && audioUp) {
      audioUp.currentTime = 0;
      audioUp.play().catch(console.error);
    }
  }

  function playCustomDecreaseSound() {
    if (soundEnabled && audioDownCustom) {
      audioDownCustom.currentTime = 0;
      audioDownCustom.play().catch(console.error);
    } else if (soundEnabled && audioDown) {
      audioDown.currentTime = 0;
      audioDown.play().catch(console.error);
    }
  }

  // Preset management functions
  async function loadPresets() {
    try {
      console.log('📋 Loading presets from backend...');
      // โหลดจาก Backend จริงๆ
      const presetList: any = await invoke('load_presets');
      const presetNames = presetList.map((p: any) => p.name);
      presets.set(presetNames);
      console.log('✅ Loaded presets from backend:', presetNames);
    } catch (err) {
      console.error('❌ Failed to load presets:', err);
      // Fallback to default preset
      presets.set(['Default']);
    }
  }

  async function savePresetByName(presetName: string) {
    try {
      console.log(`💾 Attempting to save preset: ${presetName}`);
      console.log(`Current win/goal: ${$win}/${$goal}`);

      // สร้าง PresetData จากสเตทปัจจุบัน
      const presetData = {
          name: presetName,
          win: $win,
          goal: $goal,
          show_goal: $showGoal,
          show_crown: $showCrown,
          hotkeys: {
            increase: customHotkeys.increment,
            decrease: customHotkeys.decrement,
          step_size: 1
        }
      };

      // เรียก Backend เพื่อบันทึก Preset
      await invoke('save_preset', { preset: presetData });
      console.log(`✅ Saved preset: ${presetName}`);
    } catch (err) {
      console.error(`❌ Failed to save preset: ${presetName}`, err);
    }
  }

  async function loadPreset(presetName: string, skipAutoSave: boolean = false) {
    // ก่อนเปลี่ยน preset ให้ auto-save preset ปัจจุบันก่อน (ยกเว้นเมื่อ skipAutoSave = true)
    if ($currentPreset && !skipAutoSave) {
      await savePresetByName($currentPreset);
    }
    try {
      // เรียก backend load_preset (ต้องส่ง { name: presetName })
      const presetData: any = await invoke('load_preset', { name: presetName });
      console.log('🔍 Loaded preset data:', presetData);
      
      // Apply preset data (ปรับตามโครงสร้างจริง)
      win.set(presetData.win);  // ลบ || 0 ออก
      goal.set(presetData.goal);  // ลบ || 10 ออก
      showCrown.set(presetData.show_crown !== false);
      showGoal.set(presetData.show_goal !== false);
      currentPreset.set(presetName);
      
      // Save the current preset to backend state
      try {
        await invoke('set_win_state', {
          new_state: {
            win: presetData.win,
            goal: presetData.goal,
            show_goal: presetData.show_goal !== false,
            show_crown: presetData.show_crown !== false,
            current_preset: presetName
          }
        });
        console.log(`✅ Saved current preset to backend: ${presetName}`);
      } catch (err) {
        console.error('❌ Failed to save current preset to backend:', err);
      }
      
      // Sync hotkeys with preset
      if (presetData.hotkeys) {
        console.log('🎹 Syncing hotkeys with preset:', presetData.hotkeys);
        customHotkeys = {
          increment: presetData.hotkeys.increase || 'Alt+=',
          decrement: presetData.hotkeys.decrease || 'Alt+-',
          increment10: `Shift+${presetData.hotkeys.increase || 'Alt+='}`,
          decrement10: `Shift+${presetData.hotkeys.decrease || 'Alt+-'}`
        };
        console.log('✅ Hotkeys synced with preset:', customHotkeys);
      }
      
      console.log(`✅ Loaded preset: ${presetName}`);
    } catch (err) {
      console.error('❌ Failed to load preset:', err);
      // Fallback to default values if loading fails
      win.set(0);
      goal.set(10);
    }
  }

  async function hide_to_tray() {
    if (!browser) {
      console.log('❌ Cannot hide to tray: browser not available');
      return;
    }
    try {
      await invoke('hide_to_tray');
      console.log('🫥 App hidden to tray');
    } catch (err) {
      console.error('❌ Failed to hide to tray:', err);
    }
  }

  // Window control functions
  async function minimize_app() {
    if (!browser) {
      console.log('❌ Cannot minimize: browser not available');
      return;
    }
    try {
      await invoke('minimize_app');
      console.log('🔽 Window minimized');
    } catch (err) {
      console.error('❌ Failed to minimize window:', err);
    }
  }

  // Global keydown handler for hotkey recording
  function handleGlobalKeydown(event: KeyboardEvent) {
    if (recordingHotkey) {
      event.preventDefault();
      event.stopPropagation();
      
      const mods = [];
      if (event.ctrlKey) mods.push('Ctrl');
      if (event.altKey) mods.push('Alt');
      if (event.shiftKey) mods.push('Shift');
      if (event.metaKey) mods.push('Meta');
      
      const key = event.key === ' ' ? 'Space' : event.key;
      const hotkey = [...mods, key].join('+');
      
      console.log(`🎹 Recording hotkey: ${recordingHotkey} Event: ${hotkey}`);
      updateHotkey(recordingHotkey, hotkey);
      stopHotkeyRecording();
    }
  }

  // Initialize everything on mount
  onMount(async () => {
    console.log('🚀 App initializing...');
    
    // Check license status first
    await checkLicenseStatus();
    
    // Load custom hotkeys from localStorage
    if (typeof localStorage !== 'undefined') {
      const savedHotkeys = localStorage.getItem('customHotkeys');
      if (savedHotkeys) {
        try {
          const parsed = JSON.parse(savedHotkeys);
          customHotkeys = { ...customHotkeys, ...parsed };
          console.log('🎹 Loaded custom hotkeys from localStorage:', customHotkeys);
        } catch (error) {
          console.warn('⚠️ Failed to load custom hotkeys:', error);
        }
      }
    }
    
    // Sync hotkeys with backend on app start
    console.log('🔄 Syncing hotkeys with backend on app start...');
    try {
      const testResult = await invoke('test_hotkeys') as string;
      console.log('🧪 Backend hotkeys on app start:', testResult);
      
      // Parse the hotkeys from the test result and update frontend
      if (testResult.includes('Hotkeys loaded:')) {
        const hotkeysMatch = testResult.match(/Hotkeys loaded: \{([^}]+)\}/);
        if (hotkeysMatch) {
          const hotkeysStr = hotkeysMatch[1];
          console.log('🎹 Parsed hotkeys string on app start:', hotkeysStr);
          
          // Update frontend customHotkeys to match backend
          // This ensures the UI shows the correct hotkeys
          const backendHotkeys = JSON.parse(`{${hotkeysStr}}`);
          customHotkeys = { ...customHotkeys, ...backendHotkeys };
          console.log('✅ Frontend hotkeys synced with backend on app start:', customHotkeys);
        }
      }
    } catch (error) {
      console.error('❌ Failed to sync hotkeys on app start:', error);
    }
    
    // Add global keydown listener for hotkey recording
    document.addEventListener('keydown', handleGlobalKeydown, true);
    
    // Initialize audio elements with correct paths for dev mode
    try {
      audioUp = new Audio('/assets/sfx/increase.mp3');
      audioDown = new Audio('/assets/sfx/decrease.mp3');
      
      // Add event listeners to check if audio loads successfully
      audioUp.addEventListener('canplaythrough', () => {
        console.log('🔊 Increase audio loaded successfully');
      });
      audioUp.addEventListener('error', (e) => {
        console.error('❌ Failed to load increase audio:', e);
      });
      
      audioDown.addEventListener('canplaythrough', () => {
        console.log('🔊 Decrease audio loaded successfully');
      });
      audioDown.addEventListener('error', (e) => {
        console.error('❌ Failed to load decrease audio:', e);
      });
      
      console.log('🔊 Audio elements initialized');
      } catch (err) {
      console.error('❌ Failed to initialize audio:', err);
    }
    
    // Initialize Tauri connection
    await initializeTauri();
    
    // Load presets
    await loadPresets();
    
    // Add global key event listener for hotkey recording
    if (browser) {
      document.addEventListener('keydown', handleKeyPress, true);
    }
    
    initOverlayWebSocket();
    
    // Initialize Auto Update
    await checkForUpdates();
    
    // Initialize Update Manager
    updateManager.checkForUpdates();
    
    // License system removed
    
    // Anti-tampering check
    await checkAppIntegrity();
    
    // Load donate values from localStorage
    if (typeof localStorage !== 'undefined') {
      const savedDonateAmount = localStorage.getItem('donateAmount');
      const savedDonateWinCondition = localStorage.getItem('donateWinCondition');
      const savedDonateOperation = localStorage.getItem('donateOperation');
      if (savedDonateAmount) {
        donateAmount = savedDonateAmount;
        console.log('💰 Loaded donate amount from localStorage:', donateAmount);
      
      // Load custom sounds from backend
      try {
        const increasePath = await invoke('get_custom_sound_path', { soundType: 'increase' });
        const decreasePath = await invoke('get_custom_sound_path', { soundType: 'decrease' });
        
        if (increasePath) {
          try {
            // Get the actual filename
            const filename = await invoke('get_custom_sound_filename', { soundType: 'increase' }) as string;
            
            // Try to load the file using Tauri's invoke
            const fileData = await invoke('read_sound_file', { filePath: increasePath }) as number[];
            const blob = new Blob([new Uint8Array(fileData)], { type: 'audio/mpeg' });
            const fileUrl = URL.createObjectURL(blob);
            
            customIncreaseSound = fileUrl;
            customIncreaseFileName = filename;
            audioUpCustom = new Audio(fileUrl);
            audioUpCustom.load();
            console.log('🔊 Custom increase sound loaded:', increasePath, 'filename:', filename);
          } catch (loadError) {
            console.error('❌ Failed to load custom increase sound:', loadError);
            // Set filename to indicate custom sound exists but failed to load
            customIncreaseFileName = 'เสียงเพิ่มที่กำหนดเอง (โหลดไม่สำเร็จ)';
          }
        }
        if (decreasePath) {
          try {
            // Get the actual filename
            const filename = await invoke('get_custom_sound_filename', { soundType: 'decrease' }) as string;
            
            // Try to load the file using Tauri's invoke
            const fileData = await invoke('read_sound_file', { filePath: decreasePath }) as number[];
            const blob = new Blob([new Uint8Array(fileData)], { type: 'audio/mpeg' });
            const fileUrl = URL.createObjectURL(blob);
            
            customDecreaseSound = fileUrl;
            customDecreaseFileName = filename;
            audioDownCustom = new Audio(fileUrl);
            audioDownCustom.load();
            console.log('🔊 Custom decrease sound loaded:', decreasePath, 'filename:', filename);
          } catch (loadError) {
            console.error('❌ Failed to load custom decrease sound:', loadError);
            // Set filename to indicate custom sound exists but failed to load
            customDecreaseFileName = 'เสียงลดที่กำหนดเอง (โหลดไม่สำเร็จ)';
          }
        }
      } catch (error) {
        console.log('ℹ️ No custom sounds found:', error);
      }
      }
      if (savedDonateWinCondition) {
        donateWinCondition = savedDonateWinCondition;
        console.log('💰 Loaded donate win condition from localStorage:', donateWinCondition);
      }
      if (savedDonateOperation) {
        donateOperation = savedDonateOperation;
        console.log('💰 Loaded donate operation from localStorage:', donateOperation);
      }
    }
    
    console.log('✅ App initialization complete');
  });

  onDestroy(() => {
    if (unlisten) {
      unlisten();
    }
    if (overlayWebSocket) {
      overlayWebSocket.close();
    }
    if (recordingTimeout) {
      clearTimeout(recordingTimeout);
    }
    // Remove global keydown listener
    document.removeEventListener('keydown', handleGlobalKeydown, true);
  });

  // ... existing code ...
  $: winLength = Math.abs($win).toString().length; // ใช้ Math.abs เพื่อไม่นับเครื่องหมาย -
  $: winSizeClass =
    winLength <= 2 ? 'win-size-2' :
    winLength === 3 ? 'win-size-3' :
    winLength === 4 ? 'win-size-4' :
    winLength === 5 ? 'win-size-5' :
    'win-size-6';
  
  // Real-time size calculation for input field
  $: inputLength = winEditValue ? Math.abs(parseInt(winEditValue) || 0).toString().length : winLength;
  $: inputSizeClass =
    inputLength <= 2 ? 'win-size-2' :
    inputLength === 3 ? 'win-size-3' :
    inputLength === 4 ? 'win-size-4' :
    inputLength === 5 ? 'win-size-5' :
    'win-size-6';
  
  // Debug logging
  $: console.log(`Win: ${$win}, Abs: ${Math.abs($win)}, Length: ${winLength}, Class: ${winSizeClass}`);
  $: console.log(`Input: ${winEditValue}, InputLength: ${inputLength}, InputClass: ${inputSizeClass}`);
  // ... existing code ...





  // Send updates to overlay when overlay state changes
  $: if (overlayWebSocket && overlayWebSocket.readyState === WebSocket.OPEN) {
            sendToOverlay({
          win: $win,
          goal: $goal,
          show_crown: $overlayShowCrown,
          show_goal: $overlayShowGoal,
          current_preset: $currentPreset
        });
  }

  function startEditPreset(preset: string) {
    editingPreset = preset;
    renameValue = preset;
    console.log(`✏️ Started editing preset: ${preset}`);
    // ให้ focus ที่ input ทันที
    setTimeout(() => {
      const input = document.querySelector('.rename-input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 10);
  }

  function cancelEditPreset() {
    editingPreset = null;
    renameValue = '';
    console.log('❌ Cancelled editing preset');
  }

  async function confirmRenamePreset(oldName: string, newName: string) {
    if (!newName.trim() || newName === oldName) {
      cancelEditPreset();
      return;
    }

    try {
      console.log(`🔄 Renaming preset from "${oldName}" to "${newName}"`);
      
      // ใช้ฟังก์ชัน rename_preset ของ backend
      await invoke('rename_preset', { oldName: oldName, newName: newName });
      console.log('✅ Backend confirmed rename');
      
      // โหลดรายการ preset ใหม่
      const updatedPresetList: any = await invoke('load_presets');
      console.log('📋 Loaded presets after rename:', updatedPresetList);
      
      // อัปเดต presets store
      const presetNames = updatedPresetList.map((p: any) => p.name);
      presets.set(presetNames);
      console.log('🔄 Updated presets store:', presetNames);
      
      // อัปเดต currentPreset ถ้าเป็น preset ที่กำลังใช้งานอยู่
      if ($currentPreset === oldName) {
        currentPreset.set(newName);
        console.log(`🔄 Updated currentPreset from "${oldName}" to "${newName}"`);
      }
      
      // ปิดการแก้ไข
      editingPreset = null;
      renameValue = '';
      
      showNotification(`✅ เปลี่ยนชื่อ Preset จาก "${oldName}" เป็น "${newName}" สำเร็จ`);
      console.log(`✅ Successfully renamed preset from "${oldName}" to "${newName}"`);
    } catch (err) {
      console.error('❌ Failed to rename preset:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      showNotification(`❌ ไม่สามารถเปลี่ยนชื่อ Preset ได้: ${errorMessage}`);
    }
  }

  // Type definition สำหรับ PresetData
  type PresetData = {
    name: string;
    win: number;
    goal: number;
    show_goal: boolean;
    show_crown: boolean;
    hotkeys: {
      increase: string;
      decrease: string;
      step_size: number;
    };
  };

  // ลบฟังก์ชัน saveCurrentPreset เดิม
  async function selectPreset(preset: string) {
    try {
      console.log(`🔄 Selecting preset: ${preset}`);
      console.log(`Current preset: ${$currentPreset}, Current win/goal: ${$win}/${$goal}`);

      // บันทึก Preset ปัจจุบันก่อน
      const currentPresetData: PresetData = {
        name: $currentPreset,
        win: $win,
        goal: $goal,
        show_goal: $showGoal,
        show_crown: $showCrown,
        hotkeys: {
          increase: customHotkeys.increment,
          decrease: customHotkeys.decrement,
          step_size: 1
        }
      };

      await invoke('save_preset', { preset: currentPresetData });
      console.log(`✅ Saved current preset: ${$currentPreset}`);

      // โหลด Preset ใหม่
      const loadedPreset: PresetData = await invoke('load_preset', { name: preset });
      console.log('📂 Loaded preset data:', loadedPreset);

      // อัปเดต Stores
      win.set(loadedPreset.win);
      goal.set(loadedPreset.goal);
      showGoal.set(loadedPreset.show_goal);
      showCrown.set(loadedPreset.show_crown);
      currentPreset.set(preset);

      // ปิด Modal
      showPresetModal = false;

      console.log(`✅ Successfully switched to preset: ${preset}`);
    } catch (err) {
      console.error('❌ Failed to select preset:', err);
      alert(`ไม่สามารถเปลี่ยน Preset ได้: ${err}`);
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

{#if isCheckingLicense}
  <div class="loading-screen">
    <div class="spinner"></div>
    <h2>🔍 ตรวจสอบ License...</h2>
  </div>
{:else}
  <!-- แสดงเนื้อหาแอพหลักเสมอ -->
  <div class="control-app">
    <!-- Window Controls -->
    <div class="window-controls-left">
      <button on:click={minimize_app} class="window-btn minimize-btn" title="Minimize">−</button>
    </div>
    <div class="window-controls-right">
      <button on:click={hide_to_tray} class="window-btn close-btn" title="Hide to Tray">×</button>
    </div>

    <!-- Main Content -->
    {#if isAppReady}
  <div class="main-content">
    <!-- App Title -->
    <div class="app-title-container">
      <h1 class="app-title">{$currentPreset}</h1>
      {#if hasUpdate}
        <button 
          class="auto-update-btn"
          on:click={downloadUpdate}
          title="อัปเดตใหม่พร้อมใช้งาน! คลิกเพื่อดาวน์โหลด"
        >
          AUTO
        </button>
      {/if}
    </div>
    
    <!-- Win Counter Section -->
    <div class="counter-section">
      <div class="counter-display">
        <div class="counter-content">
          {#if $appShowCrown}
            <div class="crown-container">
              <img src="/assets/ui/app_crown.png" alt="Crown" class="crown-icon" />
            </div>
          {/if}
          <div class="win-number-container">
            {#if editingWin}
              <input 
                bind:this={winInputElement}
                bind:value={winEditValue}
                on:keydown={handleWinInputKeydown}
                on:input={handleWinInputChange}
                on:blur={saveWinEdit}
                class="win-number-input {inputSizeClass}"
                type="text"
                inputmode="numeric"
                maxlength="6"
                autocomplete="off"
                spellcheck="false"
                aria-label="Edit win count"
                placeholder=""
              />
            {:else}
              <div 
                class="win-number {winSizeClass}"
                on:click={startEditWin} 
                on:keydown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    startEditWin();
                  }
                }}
                role="button" 
                tabindex="0"
                aria-label="Win count: {$win}. Click to edit or press Enter"
              >
                {$win}
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- Goal Section -->
    <div class="goal-container">
      <span class="goal-label">เป้าหมาย:</span>
      <div class="goal-number-box" on:click={() => { if (!editingGoal) { startEditGoal(); } }} tabindex="0">
        {#if editingGoal}
          <input
            bind:this={goalInputElement}
            bind:value={goalEditValue}
            on:keydown={handleGoalInputKeydown}
            on:input={handleGoalInputChange}
            on:blur={saveGoalEdit}
            class="{inputSizeClass}"
            type="text"
            inputmode="numeric"
            maxlength="6"
            autocomplete="off"
            spellcheck="false"
            aria-label="Edit goal"
            placeholder=""
          />
        {:else}
          <span>{goalEditValue || $goal}</span>
        {/if}
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-section">
      <!-- Preset Button -->
      <button class="donate-btn" on:click={() => showPresetModal = true}>
        โปรไฟล์
      </button>

      <!-- Donate Button -->
      <button class="donate-btn" on:click={() => openDonateModal()}>
        โดเนท
      </button>

      <!-- Toggle Controls -->
      <div class="toggle-container">
        <div class="toggle-controls">
          <!-- Icon Toggle -->
          <div class="toggle-row">
            <span class="toggle-label">ไอคอน</span>
            <button 
              class="toggle-switch {$overlayShowCrown ? 'active' : ''}"
              on:click={toggleIcon}
              role="switch"
              aria-checked={$overlayShowCrown}
              tabindex="0"
            >
              <div class="toggle-knob"></div>
            </button>
          </div>

          <!-- Divider -->
          <div class="toggle-divider"></div>

          <!-- Goal Toggle -->
          <div class="toggle-row goal-toggle-row">
            <span class="toggle-label">เป้าหมาย</span>
            <button 
              class="toggle-switch {$overlayShowGoal ? 'active' : ''}"
              on:click={toggleGoal}
              role="switch"
              aria-checked={$overlayShowGoal}
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
    <button class="action-btn secondary copy-btn" on:click={() => showSettingsModal = true}>
      ⚙️ ตั้งค่า
    </button>
    <button class="action-btn secondary copy-btn" on:click={copyLink}>
      📋 คัดลอก
    </button>
    
  </div>
  {/if}
  </div>
  
  <!-- แสดง LicenseModal ซ้อนทับเมื่อยังไม่ได้ซื้อ License -->
  {#if !isLicenseValid}
    <LicenseModal 
      isOpen={true} 
      onLicenseValid={onLicenseValid}
    />

  {/if}
{/if}



  <!-- Settings Modal -->
  {#if showSettingsModal}
    <div class="modal-backdrop" on:click={() => showSettingsModal = false} on:keydown={(e) => e.key === 'Escape' && (showSettingsModal = false)} role="button" tabindex="0">
      <div class="modal settings-modal {settingsTab === 'sound' ? 'sound-active' : ''} {settingsTab === 'general' ? 'general-active' : ''} {settingsTab === 'hotkey' ? 'hotkey-active' : ''}" on:click|stopPropagation role="dialog" aria-labelledby="settings-title">
        <div class="modal-header">
          <h3 id="settings-title">⚙️ ตั้งค่า</h3>
          <button class="modal-close" on:click={() => showSettingsModal = false}>×</button>
        </div>
        
        <!-- Settings Tabs -->
        <div class="settings-tabs">
          <button 
            class="settings-tab {settingsTab === 'general' ? 'active' : ''}"
            on:click={() => settingsTab = 'general'}
          >
            ⚙️ ทั่วไป
          </button>
          <button 
            class="settings-tab {settingsTab === 'hotkey' ? 'active' : ''}"
            on:click={() => settingsTab = 'hotkey'}
          >
            ⌨️ ปุ่มลัด
          </button>
          <button 
            class="settings-tab {settingsTab === 'sound' ? 'active' : ''}"
            on:click={() => settingsTab = 'sound'}
          >
            🔊 เสียง
          </button>
        </div>

        <div class="modal-body {settingsTab === 'sound' ? 'sound-modal-body' : ''}">
          {#if settingsTab === 'general'}
            <!-- General Settings -->
            <div class="settings-group">
              <h4 class="settings-group-title">⚙️ การตั้งค่าทั่วไป</h4>
              
              <!-- Auto Update Section -->
              <div class="settings-section">
                <h5 class="settings-section-title">🔄 อัปเดตอัตโนมัติ</h5>
                <p class="settings-note">
                  ตรวจสอบและติดตั้งอัปเดตใหม่อัตโนมัติ
                </p>
                
                <div class="settings-actions">
                  <button class="settings-btn update" on:click={() => updateManager.checkForUpdates()} disabled={isCheckingUpdate}>
                    {isCheckingUpdate ? '🔄 กำลังตรวจสอบ...' : '🔄 ตรวจสอบอัปเดต'}
                  </button>
                </div>
              </div>
              
              <!-- App Information -->
              <div class="settings-section">
                <h5 class="settings-section-title">ℹ️ ข้อมูลแอป</h5>
                <div class="app-info">
                  <p><strong>เวอร์ชัน:</strong> 1.0.0</p>
                  <p><strong>ผู้พัฒนา:</strong> ArtYWoof</p>
                </div>
              </div>
            </div>
          {:else if settingsTab === 'hotkey'}
            <!-- Hotkey Customization -->
          <div class="settings-group">
              <h4 class="settings-group-title">🎹 ปรับแต่งปุ่มลัด</h4>
              <p class="settings-note">
                คลิกที่ปุ่มลัดเพื่อเปลี่ยน
              </p>
              
              <div class="hotkey-customization">
                <div class="hotkey-item">
                  <span class="hotkey-label">เพิ่ม (+1):</span>
                  <button 
                    class="hotkey-input {recordingHotkey === 'increment' ? 'recording' : ''}"
                    on:click={() => startHotkeyRecording('increment')}
                  >
                    {recordingHotkey === 'increment' ? 'กดปุ่ม...' : customHotkeys.increment}
                  </button>
              </div>
                
                <div class="hotkey-item">
                  <span class="hotkey-label">ลด (-1):</span>
                  <button 
                    class="hotkey-input {recordingHotkey === 'decrement' ? 'recording' : ''}"
                    on:click={() => startHotkeyRecording('decrement')}
                  >
                    {recordingHotkey === 'decrement' ? 'กดปุ่ม...' : customHotkeys.decrement}
                  </button>
              </div>
                
                <div class="hotkey-item">
                  <span class="hotkey-label">เพิ่ม (+10):</span>
                  <button 
                    class="hotkey-input {recordingHotkey === 'increment10' ? 'recording' : ''}"
                    on:click={() => startHotkeyRecording('increment10')}
                  >
                    {recordingHotkey === 'increment10' ? 'กดปุ่ม...' : customHotkeys.increment10}
                  </button>
              </div>
                
                <div class="hotkey-item">
                  <span class="hotkey-label">ลด (-10):</span>
                  <button 
                    class="hotkey-input {recordingHotkey === 'decrement10' ? 'recording' : ''}"
                    on:click={() => startHotkeyRecording('decrement10')}
                  >
                    {recordingHotkey === 'decrement10' ? 'กดปุ่ม...' : customHotkeys.decrement10}
                  </button>
              </div>
          </div>

              <div class="settings-actions">
                    <button class="settings-btn reset" on:click={() => showResetConfirmModal = true}>
                      🔄 รีเซ็ตปุ่มลัด
                    </button>
              </div>
            </div>
          {:else if settingsTab === 'sound'}
            <!-- Sound Customization -->
          <div class="settings-group sound-tab-content">
              <h4 class="settings-group-title">🔊 ปรับแต่งเสียง</h4>
              
              <!-- Sound Toggle -->
              <div class="sound-toggle">
                <span class="sound-toggle-label">เปิด/ปิดเสียง:</span>
                <button 
                  class="toggle-switch {soundEnabled ? 'active' : ''}"
                      on:click={() => soundEnabled = !soundEnabled}
                  role="switch"
                  aria-checked={soundEnabled}
                >
                  <div class="toggle-knob"></div>
                </button>
              </div>
              
              <!-- Custom Sound Upload -->
              <div class="sound-upload-section">
                <h5 class="sound-section-title">📁 อัพโหลดเสียงใหม่</h5>
                
                <div class="sound-upload-item">
                  <span class="sound-upload-label">เสียงเพิ่ม:</span>
                  <input 
                    type="file" 
                    accept="audio/mp3,audio/wav"
                    on:change={(e) => handleSoundUpload(e, 'increase')}
                    class="sound-file-input"
                    id="increase-sound-input"
                  />
                  <label for="increase-sound-input" class="sound-upload-btn">
                    📂 เลือกไฟล์
                  </label>
                  {#if customIncreaseSound}
                    <button class="sound-btn delete" on:click={() => {
                      soundToDelete = 'increase';
                      showDeleteSoundModal = true;
                    }} title="ลบเสียงกำหนดเอง">ลบ</button>
                  {/if}
                  {#if customIncreaseFileName}
                    <div class="file-name">📄 {customIncreaseFileName}</div>
                  {/if}
                </div>
                
                <div class="sound-upload-item">
                  <span class="sound-upload-label">เสียงลด:</span>
                  <input 
                    type="file" 
                    accept="audio/mp3,audio/wav"
                    on:change={(e) => handleSoundUpload(e, 'decrease')}
                    class="sound-file-input"
                    id="decrease-sound-input"
                  />
                  <label for="decrease-sound-input" class="sound-upload-btn">
                    📂 เลือกไฟล์
                  </label>
                  {#if customDecreaseSound}
                    <button class="sound-btn delete" on:click={() => {
                      soundToDelete = 'decrease';
                      showDeleteSoundModal = true;
                    }} title="ลบเสียงกำหนดเอง">ลบ</button>
                  {/if}
                  {#if customDecreaseFileName}
                    <div class="file-name">📄 {customDecreaseFileName}</div>
                  {/if}
                </div>
              </div>
              
                  <!-- Sound Test Controls -->
              <div class="sound-test-section">
                    <h5 class="sound-section-title">🎵 ทดสอบเสียง</h5>
                <div class="sound-test-controls">
                      <button class="sound-btn test" on:click={() => {
                        if (audioUpCustom) {
                          audioUpCustom.play();
                        } else {
                          audioUp?.play();
                        }
                      }}>🔊 เพิ่ม</button>
                      <button class="sound-btn test" on:click={() => {
                        if (audioDownCustom) {
                          audioDownCustom.play();
                        } else {
                          audioDown?.play();
                        }
                      }}>🔊 ลด</button>
            </div>
          </div>
              
              <!-- Sound Reset Controls -->
              <div class="sound-reset-section">
                <div class="sound-reset-controls">
                  <button class="sound-btn reset" on:click={() => {
                    showResetSoundModal = true;
                  }} title="รีเซ็ตเสียงทั้งหมด">🔄 รีเซ็ตเสียง</button>
                </div>
              </div>
              

            </div>
          {/if}
        </div>

            <!-- Modal Footer -->
            <div class="modal-footer">
  
            </div>
      </div>
    </div>
  {/if}

  <!-- Modal ยืนยันลบเสียง -->
  {#if showDeleteSoundModal}
    <div class="modal-backdrop" on:click={() => showDeleteSoundModal = false} on:keydown={(e) => e.key === 'Escape' && (showDeleteSoundModal = false)} role="button" tabindex="0">
      <div class="modal delete-sound-modal" on:click|stopPropagation role="dialog" tabindex="0">
        <div class="modal-header">
          <h3>ยืนยันการลบเสียง</h3>
        </div>
        <div class="modal-body">
          <div class="confirm-message">
            <p>คุณแน่ใจหรือไม่ว่าต้องการลบเสียง{soundToDelete === 'increase' ? 'เพิ่ม' : 'ลด'}?</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="action-btn confirm" on:click={async () => {
            try {
              await invoke('delete_custom_sound', { soundType: soundToDelete });
              if (soundToDelete === 'increase') {
                customIncreaseSound = null;
                customIncreaseFileName = null;
                audioUpCustom = null;
              } else {
                customDecreaseSound = null;
                customDecreaseFileName = null;
                audioDownCustom = null;
              }
              showDeleteSoundModal = false;
              soundToDelete = null;
            } catch (error) {
              console.error('❌ Failed to delete sound file:', error);
            }
          }}>ยืนยัน</button>
          <button class="action-btn cancel" on:click={() => showDeleteSoundModal = false}>ยกเลิก</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Modal ยืนยันรีเซ็ตเสียง -->
  {#if showResetSoundModal}
    <div class="modal-backdrop" on:click={() => showResetSoundModal = false} on:keydown={(e) => e.key === 'Escape' && (showResetSoundModal = false)} role="button" tabindex="0">
      <div class="modal reset-sound-modal" on:click|stopPropagation role="dialog" tabindex="0">
        <div class="modal-header">
          <h3>ยืนยันการรีเซ็ตเสียง</h3>
        </div>
        <div class="modal-body">
          <div class="confirm-message">
            <p>คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตเสียงทั้งหมด?</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="action-btn confirm" on:click={async () => {
            try {
              // Delete both sound files
              await invoke('delete_custom_sound', { soundType: 'increase' });
              await invoke('delete_custom_sound', { soundType: 'decrease' });
              
              customIncreaseSound = null;
              customDecreaseSound = null;
              customIncreaseFileName = null;
              customDecreaseFileName = null;
              audioUpCustom = null;
              audioDownCustom = null;
              
              showResetSoundModal = false;
            } catch (error) {
              console.error('❌ Failed to reset sound files:', error);
            }
          }}>ยืนยัน</button>
          <button class="action-btn cancel" on:click={() => showResetSoundModal = false}>ยกเลิก</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Modal ยืนยันรีเซ็ตคืนค่า -->
  {#if showResetConfirmModal}
    <div class="modal-backdrop" on:click={() => showResetConfirmModal = false} on:keydown={(e) => e.key === 'Escape' && (showResetConfirmModal = false)} role="button" tabindex="0">
      <div class="modal reset-hotkey-modal" on:click|stopPropagation role="dialog" tabindex="0">
        <div class="modal-header">
          <h3>ยืนยันการรีเซ็ตคืนค่าคีย์ลัดทั้งหมด?</h3>
        </div>
        <div class="modal-body">
          <div class="confirm-message">
            <p>คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตคืนค่าคีย์ลัดทั้งหมด?</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="action-btn confirm" on:click={async () => {
            try {
              await invoke('clear_hotkeys');
              await invoke('save_default_hotkeys');
              await invoke('reload_hotkeys_command');
              showResetConfirmModal = false;
            } catch (error) {
              console.error('❌ Failed to reset hotkeys:', error);
            }
          }}>ยืนยัน</button>
          <button class="action-btn cancel" on:click={() => showResetConfirmModal = false}>ยกเลิก</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Modal PRESET -->
  {#if showPresetModal}
    <div class="modal-backdrop" on:click={() => showPresetModal = false} on:keydown={(e) => e.key === 'Escape' && (showPresetModal = false)} role="button" tabindex="0">
      <div class="modal settings-modal" on:click|stopPropagation role="dialog" tabindex="0">
        <div class="modal-header">
          <h3>โปรไฟล์เกมส์</h3>
          <button class="modal-close" on:click={() => showPresetModal = false}>×</button>
        </div>
        <div class="modal-body">
          <div class="preset-list">
            {#each $sortedPresets as preset}
              <div class="preset-item-btn {preset === $currentPreset ? 'active' : ''}" on:click={() => selectPreset(preset)} on:keydown={(e) => e.key === 'Enter' && selectPreset(preset)} role="button" tabindex="0">
                {#if editingPreset === preset}
                  <input class="rename-input" bind:value={renameValue} on:keydown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                      confirmRenamePreset(preset, renameValue);
                    }
                  }} on:click|stopPropagation on:input|stopPropagation on:focus|stopPropagation on:blur|stopPropagation placeholder="ตั้งชื่อ Preset (กด Enter)" />
                  <div class="preset-inline-actions">
                    <button class="preset-btn confirm" on:click={(e) => {
                      e.stopPropagation();
                      confirmRenamePreset(preset, renameValue);
                    }} title="ยืนยัน">✓</button>
                    <button class="preset-btn delete" on:click={(e) => {
                      e.stopPropagation();
                      cancelEditPreset();
                    }} title="ยกเลิก">×</button>
                  </div>
                {:else}
                  <span class="preset-name">{preset}</span>
                  <div class="preset-inline-actions">
                    <button class="preset-btn edit" on:click|stopPropagation={() => startEditPreset(preset)} title="เปลี่ยนชื่อ">เปลี่ยนชื่อ</button>
                    <button class="preset-btn delete" on:click|stopPropagation={() => {
                      console.log(`🔴 Delete button clicked for preset: ${preset}`);
                      requestDeletePreset(preset);
                    }} title="ลบ">ลบ</button>
                  </div>
                {/if}
              </div>
            {/each}
            <!-- ปุ่มเพิ่ม Preset อยู่ล่างสุดเสมอ -->
            {#if showAddPreset}
              <div class="preset-item-btn add-preset-row">
                <input class="add-preset-input" bind:this={addPresetInput} bind:value={addPresetValue} on:keydown|stopPropagation={(e) => e.key === 'Enter' && confirmAddPreset()} on:click|stopPropagation on:input|stopPropagation on:focus|stopPropagation on:blur|stopPropagation placeholder="ตั้งชื่อ Preset (กด Enter)" />
                <button class="preset-btn delete small" on:click|stopPropagation={cancelAddPreset}>ยกเลิก</button>
              </div>
            {:else}
              <button class="preset-item-btn add" on:click|stopPropagation={openAddPreset}>+</button>
            {/if}
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Copy Success Modal -->
  {#if showCopyModal}
    <div class="modal-backdrop" role="button" tabindex="0">
      <div class="modal copy-modal" on:click|stopPropagation role="dialog" tabindex="0">
        <div class="modal-body" style="max-height: calc(85vh - 120px); overflow-y: auto; padding-bottom: 20px;">
          <div class="copy-success">
            <h3>คัดลอกลิงก์แล้ว ✅</h3>
            <div class="copy-url-container">
              <p class="copy-url">http://localhost:777/overlay.html</p>
              <button class="copy-btn" on:click={copyOverlayLink} title="คัดลอกลิงก์">📋</button>
            </div>
            
            <div class="overlay-instructions">
              <h4>🔧 วิธีการเพิ่ม Overlay</h4>
              <ol>
                <li>🎬 เปิด TikTok LIVE Studio</li>
                <li>🔍 หาปุ่ม "ที่มา (Source)" → กด `+`</li>
                <li>🔗 เลือก "ลิงก์ (Link)" → กด "เพิ่ม (Add)"</li>
                <li>📝 วางลิงก์: กด `Ctrl + V`</li>
                <li>✨ กด "เพิ่มที่มา (Add Source)"</li>
              </ol>
              
              <hr>
              
              <h4>⚠️ คำเตือนสำคัญ!</h4>
              <ul>
                <li>🚨 <strong>เปิด Win Count ก่อนเปิด TikTok LIVE Studio ทุกครั้ง</strong></li>
                <li>🔄 หากเปิด TikTok LIVE Studio ก่อน → ลบลิงก์เก่า(กดคลิกขวาและลบ) แล้วเพิ่มลิงก์ใหม่</li>
              </ul>
              

            </div>
          </div>
        </div>
        <div class="modal-footer" style="padding: 10px 20px; margin-top: -26px;">
          <button class="action-btn secondary" on:click={() => showCopyModal = false} style="background: rgba(0, 229, 255, 0.1); border: 2px solid #00e5ff; color: #00e5ff; padding: 12px 24px; font-size: 18px; font-weight: 600; border-radius: 8px; transition: all 0.3s ease;">ตกลง</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Delete Confirmation Modal -->
  {#if showDeleteModal}
    <div class="modal-backdrop" on:click={() => showDeleteModal = false} on:keydown={(e) => e.key === 'Escape' && (showDeleteModal = false)} role="button" tabindex="0">
      <div class="modal reset-hotkey-modal" on:click|stopPropagation role="dialog" tabindex="0">
        <div class="modal-header">
          <h3>ยืนยันการลบ Preset</h3>
        </div>
        <div class="modal-body">
          <div class="confirm-message">
            <p style="white-space: nowrap;">คุณแน่ใจหรือไม่ว่าต้องการลบ Preset "{presetToDelete}"?</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="action-btn confirm" on:click={confirmDeletePreset}>ยืนยัน</button>
          <button class="action-btn cancel" on:click={cancelDeletePreset}>ยกเลิก</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Donate Modal -->
  {#if showDonateModal}
    <div class="modal-backdrop" on:click={closeDonateModal} on:keydown={(e) => e.key === 'Escape' && closeDonateModal()} role="button" tabindex="0">
      <div class="modal donate-modal" on:click|stopPropagation role="dialog" tabindex="0">
        <div class="modal-header">
          <h3>💰 โดเนท</h3>
          <button class="modal-close" on:click={closeDonateModal}>×</button>
        </div>
        <div class="modal-body">
          <div class="donate-form">
            <div class="donate-input-group">
              <label for="donate-amount">จำนวนกี่บาท?:</label>
              <input 
                id="donate-amount"
                type="number" 
                bind:value={donateAmount}
                on:input={saveDonateValues}
                placeholder="เช่น 25"
                min="1"
                class="donate-input {!donateAmount && missingFields.includes('จำนวนกี่บาท') ? 'error' : ''}"
              />
            </div>
            
            <div class="donate-input-group">
              <label for="donate-win-condition">เท่ากับกี่วิน?:</label>
              <input 
                id="donate-win-condition"
                type="number" 
                bind:value={donateWinCondition}
                on:input={saveDonateValues}
                placeholder="เช่น 1"
                min="1"
                class="donate-input {!donateWinCondition && missingFields.includes('เท่ากับกี่วิน') ? 'error' : ''}"
              />
            </div>
            
            <div class="donate-input-group">
              <label for="donate-target-amount">จำนวนบาท:</label>
              <input 
                id="donate-target-amount"
                type="number" 
                bind:value={donateTargetAmount}
                placeholder="คนโดเนทมากี่บาท?"
                min="1"
                class="donate-input {!donateTargetAmount && missingFields.includes('จำนวนบาท') ? 'error' : ''}"
              />
            </div>
            
            <div class="donate-operation-group">
              <label for="operation-buttons">บวกหรือลบ?:</label>
              <div class="operation-buttons" id="operation-buttons" role="group" aria-labelledby="operation-label">
                <button 
                  class="operation-btn {donateOperation === 'add' ? 'active' : ''} {operationError ? 'error' : ''}" 
                  on:click={() => {
                    donateOperation = 'add';
                    saveDonateValues();
                  }}
                >
                  +
                </button>
                <button 
                  class="operation-btn {donateOperation === 'subtract' ? 'active' : ''} {operationError ? 'error' : ''}" 
                  on:click={() => {
                    donateOperation = 'subtract';
                    saveDonateValues();
                  }}
                >
                  -
                </button>
              </div>
            </div>
            
            <div class="donate-preview">
              <p style="text-align: center;">เท่ากับ: {donateOperation === 'add' ? '+' : '-'}{donateTargetAmount && donateAmount && donateWinCondition ? Math.floor(parseInt(donateTargetAmount) / parseInt(donateAmount)) * parseInt(donateWinCondition) : '0'} วิน</p>
            </div>
            

          </div>
        </div>
        <div class="modal-footer">
          <button class="donate-btn confirm" on:click={processDonate}>
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  {/if}
  
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
    -webkit-app-region: drag;
  }
  .app-title-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: 100%;
    flex-shrink: 0;
    -webkit-app-region: drag;
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
    line-height: 1.1;
    -webkit-app-region: drag;
  }

  .auto-update-btn {
    background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 0.9rem;
    font-weight: 700;
    font-family: 'MiSansThai-Bold', sans-serif;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
    animation: pulse-glow 2s ease-in-out infinite;
    text-transform: uppercase;
    letter-spacing: 1px;
    flex-shrink: 0;
    -webkit-app-region: drag;
  }

  .auto-update-btn:hover {
    background: linear-gradient(45deg, #ff5252, #ff7676);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
  }

  .auto-update-btn:active {
    transform: translateY(0);
  }

  @keyframes pulse-glow {
    0%, 100% {
      box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
    }
    50% {
      box-shadow: 0 2px 12px rgba(255, 107, 107, 0.6);
    }
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
    display: flex;
    align-items: center;
    justify-content: center;
    width: calc(476px * 0.35);
    height: calc(776px * 0.16 - 12px);
    background: transparent;
    border-radius: calc(476px * 0.042);
    border: 3px solid #00e5ff;
    overflow: hidden;
    padding: 0 6px;
    flex-shrink: 0;
    cursor: pointer;
    transition: border 0.2s, background 0.2s;
  }
  .win-number-container:hover {
    border-color: #00e5ff;
    background: rgba(0,229,255,0.08);
  }
  .win-number {
    font-size: 100px;
    font-family: 'MiSansThai-Bold', sans-serif;
    font-weight: 700;
    color: #00e5ff;
    text-align: center;
    width: 100%;
    line-height: 1.1;
    transition: font-size 0.2s, color 0.2s, background 0.2s;
    letter-spacing: 0.5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
  }
  .win-size-2 { font-size: 100px; }
  .win-size-3 { font-size: 68px; }
  .win-size-4 { font-size: 55px; }
  .win-size-5 { font-size: 45px; }
  .win-size-6 { font-size: 38px; }
  @media (max-width: 500px) {
    .win-size-2 { font-size: 100px; }
    .win-size-3 { font-size: 68px; }
    .win-size-4 { font-size: 55px; }
    .win-size-5 { font-size: 45px; }
    .win-size-6 { font-size: 38px; }
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
    border-radius: calc(476px * 0.015);
    padding: calc(476px * 0.01) calc(476px * 0.042);
    font-size: calc(476px * 0.063);
    font-family: 'MiSansThai-Semibold', sans-serif;
    color: #00e5ff;
    font-weight: 600;
    flex: 1;
    text-align: center;
    border: 2px solid #00e5ff;
    margin-right: 12px;
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
    height: calc(776px * 0.038); /* เพิ่มขนาดจาก 0.038 */
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
    font-family: 'MiSansThai', sans-serif;
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
  
  .action-btn.secondary {
    background: transparent; 
    border: 2px solid #00e5ff; 
    border-radius: calc(476px * 0.029); /* ~14px */
    color: #00e5ff;
    font-size: calc(476px * 0.029 + 9px); /* ลดจาก +12px เป็น +9px */
    font-weight: 700; 
    font-family: 'MiSansThai', sans-serif;
    padding: calc(776px * 0.016) calc(476px * 0.021); /* ~12px ~10px */
    width: calc(476px * 0.40); /* 40% ของ main-content */
    max-width: 190px;
    transition: all 0.3s;
    display: flex; align-items: center; justify-content: center;
    height: calc(776px * 0.058); /* ~45px */
  }
  
  .action-btn.secondary:hover { 
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
    border: 2px solid rgba(0, 229, 255, 0.3); background: transparent;
    color: #00e5ff; font-size: 1.2rem; font-weight: 600; 
    font-family: 'MiSansThai', sans-serif;
    display: flex; align-items: center; justify-content: center; 
    transition: all 0.2s ease;
    cursor: pointer;
    box-shadow: 0 2px 8px 0 rgba(0,229,255,0.08);
  }
  .window-btn:hover { 
    background: rgba(0, 229, 255, 0.15); 
    border-color: #00e5ff;
    color: #fff; 
    transform: translateY(-1px);
    box-shadow: 0 4px 16px 0 rgba(0,229,255,0.2);
  }

  /* Settings Modal Styles */
  .settings-modal {
    width: 450px !important;
    max-width: 450px !important;
    max-height: calc(80vh - 88px);
    overflow-y: auto;
  }

  /* แท็บเสียง - เพิ่มความสูง 48px */
  .settings-modal.sound-active {
    max-height: calc(80vh - -26px) !important;
  }

  /* แท็บทั่วไป - ลดความสูงลง 12px */
  .settings-modal.general-active {
    max-height: calc(80vh - 88px) !important;
  }

  /* แท็บปุ่มลัด - ลดความสูงลง 26px */
  .settings-modal.hotkey-active {
    max-height: calc(80vh - 114px) !important;
  }



  .settings-tabs {
    display: flex;
    border-bottom: 2px solid rgba(0, 229, 255, 0.3);
    margin-bottom: 20px;
  }

  .settings-tab {
    flex: 1;
    background: transparent;
    border: none;
    color: #00e5ff;
    font-size: 20px;
    font-weight: 600;
    font-family: 'MiSansThai', sans-serif;
    padding: 12px 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    border-bottom: 3px solid transparent;
  }

  .settings-tab:hover {
    background: rgba(0, 229, 255, 0.1);
  }

  .settings-tab.active {
    border-bottom-color: #00e5ff;
    background: rgba(0, 229, 255, 0.1);
  }

  .settings-group {
    margin-bottom: 24px;
  }

  .settings-group-title {
    font-size: 22px;
    font-weight: 700;
    font-family: 'MiSansThai', sans-serif;
    color: #00e5ff;
    margin-bottom: 12px;
  }

  .settings-note {
    font-size: 18px;
    font-family: 'MiSansThai', sans-serif;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 16px;
    line-height: 1.4;
  }

  /* Hotkey Customization */
  .hotkey-customization {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }

  .hotkey-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .hotkey-label {
    font-size: 20px;
    color: #ffffff;
    font-weight: 500;
    min-width: 120px;
  }

  .hotkey-input {
    background: transparent;
    border: 2px solid #00e5ff;
    border-radius: 8px;
    color: #00e5ff;
    font-size: 18px;
    font-weight: 600;
    padding: 8px 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 120px;
    text-align: center;
  }

  .hotkey-input:hover {
    background: rgba(0, 229, 255, 0.1);
    transform: translateY(-1px);
  }

  .hotkey-input.recording {
    background: rgba(255, 107, 107, 0.2);
    border-color: #ff6b6b;
    color: #ff6b6b;
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }

  /* Sound Customization */
  .sound-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding: 12px 0;
  }

  .sound-toggle-label {
    font-size: 20px;
    color: #ffffff;
    font-weight: 500;
  }

  .sound-upload-section {
    margin-bottom: 24px;
    margin-top: -22px !important;
  }

  .sound-section-title {
    font-size: 20px;
    font-weight: 600;
    color: #00e5ff;
    margin-bottom: 12px;
  }

  .sound-upload-item {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }

  .sound-upload-label {
    font-size: 18px;
    color: #ffffff;
    font-weight: 500;
    min-width: 80px;
  }

  .sound-file-input {
    display: none;
  }

  .sound-upload-btn {
    background: transparent;
    border: 2px solid #00e5ff;
    border-radius: 6px;
    color: #00e5ff;
    font-size: 16px;
    font-weight: 600;
    padding: 6px 12px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .sound-upload-btn:hover {
    background: rgba(0, 229, 255, 0.1);
    transform: translateY(-1px);
  }

  .sound-test-btn {
    background: transparent;
    border: 2px solid #00e5ff;
    border-radius: 6px;
    color: #00e5ff;
    font-size: 16px;
    font-weight: 600;
    padding: 6px 12px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .sound-test-btn:hover {
    background: rgba(0, 229, 255, 0.1);
    transform: translateY(-1px);
  }

  .sound-test-section {
    margin-bottom: 20px;
  }

  .sound-test-controls {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .sound-btn.test {
    background: transparent;
    border: 2px solid #00e5ff;
    border-radius: 6px;
    color: #00e5ff;
    font-size: 18px;
    font-weight: 600;
    font-family: 'MiSansThai', sans-serif;
    padding: 6px 12px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .sound-btn.test:hover {
    background: rgba(0, 229, 255, 0.1);
    transform: translateY(-1px);
  }

  /* Confirmation modals */
  .delete-sound-modal,
  .reset-sound-modal {
    background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
    border: 2px solid #00e5ff;
    border-radius: 16px;
    box-shadow: 0 12px 40px rgba(0, 229, 255, 0.4), 0 0 0 1px rgba(0, 229, 255, 0.1);
    backdrop-filter: blur(20px);
    max-width: 420px;
    width: 90%;
    position: relative;
    overflow: hidden;
  }

  .delete-sound-modal::before,
  .reset-sound-modal::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(0, 229, 255, 0.05) 50%, transparent 70%);
    pointer-events: none;
  }

  .delete-sound-modal .modal-header,
  .reset-sound-modal .modal-header {
    background: linear-gradient(135deg, #00e5ff 0%, #0099cc 50%, #0077aa 100%);
    color: #0f0f23;
    border-radius: 14px 14px 0 0;
    padding: 20px 24px;
    border-bottom: 2px solid #00e5ff;
    position: relative;
    z-index: 1;
  }

  .delete-sound-modal .modal-header h3,
  .reset-sound-modal .modal-header h3 {
    font-family: 'MiSansThai', sans-serif;
    font-size: 20px;
    font-weight: 700;
    margin: 0;
    color: #0f0f23;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .delete-sound-modal .modal-body,
  .reset-sound-modal .modal-body {
    padding: 32px 24px;
    text-align: center;
    position: relative;
    z-index: 1;
  }

  .confirm-message {
    margin-top: 24px;
  }

  .confirm-message p {
    font-family: 'MiSansThai', sans-serif;
    font-size: 18px;
    color: #ffffff;
    margin: 0;
    line-height: 1.6;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .delete-sound-modal .modal-footer,
  .reset-sound-modal .modal-footer {
    padding: 20px 24px;
    display: flex;
    gap: 16px;
    justify-content: space-between;
    border-top: 1px solid rgba(0, 229, 255, 0.2);
    position: relative;
    z-index: 1;
  }

  .delete-sound-modal .action-btn,
  .reset-sound-modal .action-btn {
    font-family: 'MiSansThai', sans-serif;
    font-size: 16px;
    font-weight: 600;
    padding: 12px 24px;
    border-radius: 8px;
    border: 2px solid;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    min-width: 100px;
    position: relative;
    overflow: hidden;
  }

  .delete-sound-modal .action-btn::before,
  .reset-sound-modal .action-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  .delete-sound-modal .action-btn:hover::before,
  .reset-sound-modal .action-btn:hover::before {
    left: 100%;
  }

  .delete-sound-modal .action-btn.cancel,
  .reset-sound-modal .action-btn.cancel {
    background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%);
    border-color: #ff6b6b;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
  }

  .delete-sound-modal .action-btn.cancel:hover,
  .reset-sound-modal .action-btn.cancel:hover {
    background: linear-gradient(135deg, #ff5252 0%, #ff4444 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(255, 107, 107, 0.4);
  }

  .delete-sound-modal .action-btn.confirm,
  .reset-sound-modal .action-btn.confirm {
    background: linear-gradient(135deg, #00e5ff 0%, #0099cc 100%);
    border-color: #00e5ff;
    color: #0f0f23;
    box-shadow: 0 4px 12px rgba(0, 229, 255, 0.3);
  }

  .delete-sound-modal .action-btn.confirm:hover,
  .reset-sound-modal .action-btn.confirm:hover {
    background: linear-gradient(135deg, #00ccff 0%, #0088bb 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 229, 255, 0.4);
  }

  /* Reset hotkey modal */
  .reset-hotkey-modal {
    background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
    border: 2px solid #00e5ff;
    border-radius: 16px;
    box-shadow: 0 12px 40px rgba(0, 229, 255, 0.4), 0 0 0 1px rgba(0, 229, 255, 0.1);
    backdrop-filter: blur(20px);
    max-width: 420px;
    width: 90%;
    position: relative;
    overflow: hidden;
  }

  .reset-hotkey-modal::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(0, 229, 255, 0.05) 50%, transparent 70%);
    pointer-events: none;
  }

  .reset-hotkey-modal .modal-header {
    background: linear-gradient(135deg, #00e5ff 0%, #0099cc 50%, #0077aa 100%);
    color: #0f0f23;
    border-radius: 14px 14px 0 0;
    padding: 20px 24px;
    border-bottom: 2px solid #00e5ff;
    position: relative;
    z-index: 1;
  }

  .reset-hotkey-modal .modal-header h3 {
    font-family: 'MiSansThai', sans-serif;
    font-size: 20px;
    font-weight: 700;
    margin: 0;
    color: #0f0f23;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .reset-hotkey-modal .modal-body {
    padding: 32px 24px;
    text-align: center;
    position: relative;
    z-index: 1;
  }

  .reset-hotkey-modal .modal-footer {
    padding: 20px 24px;
    display: flex;
    gap: 16px;
    justify-content: space-between;
    border-top: 1px solid rgba(0, 229, 255, 0.2);
    position: relative;
    z-index: 1;
  }

  .reset-hotkey-modal .action-btn {
    font-family: 'MiSansThai', sans-serif;
    font-size: 16px;
    font-weight: 600;
    padding: 12px 24px;
    border-radius: 8px;
    border: 2px solid;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    min-width: 100px;
    position: relative;
    overflow: hidden;
  }

  .reset-hotkey-modal .action-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  .reset-hotkey-modal .action-btn:hover::before {
    left: 100%;
  }

  .reset-hotkey-modal .action-btn.cancel {
    background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%);
    border-color: #ff6b6b;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
  }

  .reset-hotkey-modal .action-btn.cancel:hover {
    background: linear-gradient(135deg, #ff5252 0%, #ff4444 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(255, 107, 107, 0.4);
  }

  .reset-hotkey-modal .action-btn.confirm {
    background: linear-gradient(135deg, #00e5ff 0%, #0099cc 100%);
    border-color: #00e5ff;
    color: #0f0f23;
    box-shadow: 0 4px 12px rgba(0, 229, 255, 0.3);
  }

  .reset-hotkey-modal .action-btn.confirm:hover {
    background: linear-gradient(135deg, #00ccff 0%, #0088bb 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 229, 255, 0.4);
  }

  /* Update Modal Styles */
  .update-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
  }

  .update-modal-content {
    background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
    border: 2px solid #00e5ff;
    border-radius: 16px;
    box-shadow: 0 12px 40px rgba(0, 229, 255, 0.4);
    backdrop-filter: blur(20px);
    max-width: 500px;
    width: 90%;
    padding: 32px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .update-modal-content::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(0, 229, 255, 0.05) 50%, transparent 70%);
    pointer-events: none;
  }

  .update-modal-content h3 {
    font-family: 'MiSansThai', sans-serif;
    font-size: 24px;
    font-weight: 700;
    color: #00e5ff;
    margin: 0 0 20px 0;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .update-modal-content p {
    font-family: 'MiSansThai', sans-serif;
    font-size: 16px;
    color: #ffffff;
    margin: 8px 0;
    line-height: 1.5;
  }



  .update-body {
    background: rgba(0, 229, 255, 0.1);
    border: 1px solid rgba(0, 229, 255, 0.3);
    border-radius: 8px;
    padding: 16px;
    margin: 20px 0;
    font-family: 'MiSansThai', sans-serif;
    font-size: 14px;
    color: #ffffff;
    line-height: 1.4;
    max-height: 200px;
    overflow-y: auto;
  }

  .update-actions {
    display: flex;
    gap: 16px;
    justify-content: center;
    margin-top: 24px;
  }

  .update-btn-download,
  .update-btn-later {
    font-family: 'MiSansThai', sans-serif;
    font-size: 16px;
    font-weight: 600;
    padding: 12px 24px;
    border-radius: 8px;
    border: 2px solid;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    min-width: 120px;
  }

  .update-btn-download {
    background: linear-gradient(135deg, #00e5ff 0%, #0099cc 100%);
    border-color: #00e5ff;
    color: #0f0f23;
    box-shadow: 0 4px 12px rgba(0, 229, 255, 0.3);
  }

  .update-btn-download:hover {
    background: linear-gradient(135deg, #00ccff 0%, #0088bb 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 229, 255, 0.4);
  }

  .update-btn-later {
    background: transparent;
    border-color: #ff6b6b;
    color: #ff6b6b;
  }

  .update-btn-later:hover {
    background: rgba(255, 107, 107, 0.1);
    transform: translateY(-2px);
  }

  /* Restart Modal */
  .restart-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
  }

  .restart-modal-content {
    background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
    border: 2px solid #00e5ff;
    border-radius: 16px;
    box-shadow: 0 12px 40px rgba(0, 229, 255, 0.4);
    backdrop-filter: blur(20px);
    max-width: 400px;
    width: 90%;
    padding: 32px;
    text-align: center;
  }



  /* Toast Notifications */
  .toast {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    font-family: 'MiSansThai', sans-serif;
    font-size: 14px;
    max-width: 300px;
    animation: slideIn 0.3s ease-out;
  }

  .toast-success {
    background-color: #28a745;
    color: white;
  }

  .toast-error {
    background-color: #dc3545;
    color: white;
  }

  .toast-info {
    background-color: #007AFF;
    color: white;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  /* Progress Bar */
  .update-progress-bar {
    width: 0%;
    height: 4px;
    background: linear-gradient(90deg, #00e5ff 0%, #0099cc 100%);
    border-radius: 2px;
    transition: width 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .update-progress-bar::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: shimmer 2s infinite;
  }

  @keyframes shimmer {
    0% { left: -100%; }
    100% { left: 100%; }
  }



  .sound-reset-section {
    margin-top: 20px;
  }

  .sound-reset-controls {
    display: flex;
    justify-content: center;
  }

  .sound-btn.reset {
    background: transparent;
    border: 2px solid #ff6b6b;
    border-radius: 6px;
    color: #ff6b6b;
    font-size: 20px;
    font-weight: 600;
    font-family: 'MiSansThai', sans-serif;
    padding: 8px 16px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .sound-btn.reset:hover {
    background: rgba(255, 107, 107, 0.1);
    transform: translateY(-1px);
  }

  .sound-btn.delete {
    background: transparent;
    border: 2px solid #ff6b6b;
    border-radius: 6px;
    color: #ff6b6b;
    font-size: 20px;
    font-weight: 600;
    font-family: 'MiSansThai', sans-serif;
    padding: 4px 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-left: 8px;
  }

  .sound-btn.delete:hover {
    background: rgba(255, 107, 107, 0.1);
    transform: translateY(-1px);
  }

  .file-name {
    font-size: 16px;
    color: #00e5ff;
    font-family: 'MiSansThai', sans-serif;
    margin-top: 0px;
    padding: 6px 20px;
    background: rgba(0, 229, 255, 0.1);
    border-radius: 4px;
    border: 1px solid rgba(0, 229, 255, 0.3);
  }

  .upload-message {
    background: rgba(0, 229, 255, 0.1);
    border: 1px solid #00e5ff;
    border-radius: 8px;
    color: #00e5ff;
    padding: 12px 16px;
    margin-top: 16px;
    text-align: center;
    font-family: 'MiSansThai', sans-serif;
    font-size: 16px;
    font-weight: 600;
  }

  .settings-actions {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }

  .settings-btn.reset {
    background: transparent;
    border: 2px solid #ff6b6b;
    border-radius: 6px;
    color: #ff6b6b;
    font-size: 20px;
    font-weight: 600;
    font-family: 'MiSansThai', sans-serif;
    padding: 8px 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 6px;
  }

  .settings-btn.reset:hover {
    background: rgba(255, 107, 107, 0.1);
    transform: translateY(-1px);
  }

  .settings-btn.update {
    background: transparent;
    border: 2px solid #00e5ff;
    border-radius: 8px;
    color: #00e5ff;
    font-size: 20px;
    font-weight: 600;
    font-family: 'MiSansThai', sans-serif;
    padding: 10px 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-left: 10px;
  }

  .settings-btn.update:hover {
    background: rgba(0, 229, 255, 0.1);
    transform: translateY(-1px);
  }

  .settings-btn.update:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .settings-btn.secondary {
    background: transparent;
    border: 2px solid #00e5ff;
    border-radius: 8px;
    color: #00e5ff;
    font-size: 14px;
    font-weight: 600;
    font-family: 'MiSansThai', sans-serif;
    padding: 10px 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-left: 10px;
  }

  .settings-btn.secondary:hover {
    background: rgba(0, 229, 255, 0.1);
    transform: translateY(-1px);
  }

  .settings-btn {
    background: transparent;
    border: 2px solid #00e5ff;
    border-radius: 8px;
    color: #00e5ff;
    font-size: 14px;
    font-weight: 600;
    font-family: 'MiSansThai', sans-serif;
    padding: 10px 20px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .settings-btn:hover {
    background: rgba(0, 229, 255, 0.1);
    transform: translateY(-1px);
  }

  /* Modal Styles */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10005;
    padding: 20px;
    border-radius: 24px;
    margin: 10px;
  }
  .modal-backdrop::before {
    content: none;
  }

  .modal {
    background: rgba(4, 3, 25, 0.95);
    border: 2px solid #00e5ff;
    border-radius: 16px;
    padding: 0;
    max-width: 90vw;
    max-height: calc(90vh - 140px);
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 229, 255, 0.3);
    backdrop-filter: blur(16px);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px 0 24px;
    border-bottom: 1px solid rgba(0, 229, 255, 0.2);
  }

  .modal-header h3 {
    font-size: 34px !important;
    font-weight: 700;
    color: #00e5ff;
    margin: 0;
    font-family: 'MiSansThai-Bold', sans-serif;
    letter-spacing: 0.5px;
  }

  .modal-close {
    background: transparent;
    border: none;
    color: #00e5ff;
    font-size: 24px;
    font-weight: 600;
    font-family: 'MiSansThai', sans-serif;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: all 0.3s ease;
  }

  .modal-close:hover {
    background: rgba(0, 229, 255, 0.1);
    transform: scale(1.1);
  }

  .modal-body {
    padding: 20px 24px 24px 24px;
    margin-top: -24px;
  }

  /* แท็บเสียง - ลดความสูงลง 32px */
  .sound-modal-body {
    max-height: calc(100% - 32px) !important;
  }

  /* Preset Modal Styles - ใช้โครงสร้างเหมือน Settings Modal */
  .preset-current-display {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: rgba(0, 229, 255, 0.05);
    border: 1px solid rgba(0, 229, 255, 0.12);
    border-radius: 8px;
    margin-bottom: 8px;
  }
  .current-preset-name {
    font-size: 16px;
    font-weight: 600;
    color: #00e5ff;
  }
  .current-preset-badge {
    font-size: 12px;
    color: #00e5ff;
    background: rgba(0, 229, 255, 0.1);
    padding: 4px 8px;
    border-radius: 4px;
  }
  .settings-modal .preset-list {
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 20px 0 0 0;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .preset-item-wrapper {
    display: flex;
    width: 100%;
    max-width: 100%;
    align-items: stretch;
    margin: 0 0 12px 0;
    padding: 0;
    gap: 0;
  }
  .preset-item-btn,
  .preset-item-btn.add,
  .add-preset-row {
    border-radius: 18px;
  }
  .preset-item-btn {
    padding: 14px 28px;
    font-size: 18px;
    font-weight: 600;
    background: rgba(0, 229, 255, 0.05);
    border: 2px solid rgba(0, 229, 255, 0.18);
    border-radius: 8px;
    color: #fff;
    cursor: pointer;
    transition: box-shadow 0.2s, background 0.2s, border 0.2s;
    outline: none;
    box-shadow: 0 1px 4px 0 rgba(0,229,255,0.04);
    position: relative;
    min-height: 60px;
  }
  .preset-item-btn.add {
    padding: 14px 28px;
    font-size: 24px;
    font-weight: 700;
    background: rgba(0, 229, 255, 0.1);
    border: 2px dashed rgba(0, 229, 255, 0.3);
    color: #00e5ff;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .preset-item-btn.add:hover {
    background: rgba(0, 229, 255, 0.2);
    border-color: #00e5ff;
    transform: translateY(-1px);
  }
  .add-preset-row {
    padding: 14px 28px;
    min-height: unset;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .add-preset-input {
    flex: 1;
    padding: 8px 12px;
    font-size: 16px;
    border: 1px solid #00e5ff;
    border-radius: 6px;
    background: transparent;
    color: #fff;
    outline: none;
  }
  .add-preset-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  .preset-item-btn:hover,
  .preset-item-btn.active {
    background: linear-gradient(135deg, #00e5ff 0%, #00b8cc 100%);
    border-color: #00e5ff;
    box-shadow: 0 4px 20px 0 rgba(0,229,255,0.3);
    transform: translateY(-1px);
  }
  .preset-actions {
    display: flex;
    flex-direction: row;
    gap: 0;
    align-items: stretch;
    flex-shrink: 0;
    height: 100%;
  }

  .preset-name {
    font-size: inherit;
    font-family: 'MiSansThai', sans-serif;
    font-weight: inherit;
    color: inherit;
    letter-spacing: 0.5px;
    pointer-events: none;
    user-select: none;
    transition: none;
  }

  .preset-btn.small {
    min-width: 36px;
    width: 36px;
    padding: 6px 0;
    font-size: 18px;
    border-radius: 6px;
    margin-left: 2px;
  }
  .preset-btn.delete.small {
    color: #ff6b6b;
    border: 1.5px solid #ff6b6b;
    background: rgba(255, 107, 107, 0.1);
    box-shadow: 0 2px 8px 0 rgba(255, 107, 107, 0.2);
    font-size: 14px;
    padding: 4px 46px;
    min-width: 72px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all 0.2s ease;
    margin-left: 8px;
    margin-top: 6px;
  }
  .preset-btn.edit.small {
    color: #00e5ff;
    border: 1.5px solid #00e5ff;
    background: transparent;
  }
  .preset-btn.edit.small:hover {
    background: rgba(0,229,255,0.08);
  }
  .preset-btn.delete.small:hover {
    background: rgba(255, 107, 107, 0.2);
    box-shadow: 0 4px 12px 0 rgba(255, 107, 107, 0.3);
    transform: translateY(-1px);
    margin-left: 8px;
    margin-top: 6px;
  }

  /* CSS: ปรับปุ่ม preset-item-btn ให้ดู clickable, active, และ Default เป็นปุ่มยาวเหมือนกัน */
  .preset-item-btn {
    flex: 1;
    min-width: 0;
    width: calc(100% + 4px);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 28px;
    font-size: 18px;
    font-weight: 600;
    background: rgba(0, 229, 255, 0.05);
    border: 2px solid rgba(0, 229, 255, 0.18);
    border-radius: 8px;
    color: #fff;
    cursor: pointer;
    transition: box-shadow 0.2s, background 0.2s, border 0.2s;
    outline: none;
    box-shadow: 0 1px 4px 0 rgba(0,229,255,0.04);
    position: relative;
    margin-bottom: 12px;
  }
  .preset-item-btn:hover {
    background: rgba(0, 229, 255, 0.15);
    border-color: #00e5ff;
    box-shadow: 0 4px 20px 0 rgba(0,229,255,0.2);
    transform: translateY(-1px);
  }
  .preset-item-btn:hover .preset-name {
    color: #00e5ff;
  }
  .preset-item-btn.active {
    background: linear-gradient(135deg, #00e5ff 0%, #00b8cc 100%);
    border-color: #00e5ff;
    box-shadow: 0 4px 20px 0 rgba(0,229,255,0.3);
    transform: translateY(-1px);
  }
  .preset-item-btn.active .preset-name {
    color: #000;
    font-weight: 700;
    text-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
  }
  .preset-name {
    font-size: 22px;
    font-family: 'MiSansThai', sans-serif;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: inherit;
  }
  .settings-modal .preset-inline-actions {
    display: flex;
    gap: 8px;
    align-items: center;
    position: absolute;
    right: 24px;
    top: calc(50% + 6px);
    transform: translateY(-50%);
  }
  .preset-btn {
    padding: 6px 12px;
    font-size: 14px;
    font-family: 'MiSansThai', sans-serif;
    font-weight: 600;
    border-radius: 6px;
    border: 1px solid;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 50px;
    max-width: 80px;
    text-align: center;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .preset-btn.edit {
    background: rgba(0, 229, 255, 0.1);
    border-color: #00e5ff;
    color: #00e5ff;
    box-shadow: 0 2px 8px 0 rgba(0, 229, 255, 0.2);
  }
  .preset-btn.edit:hover {
    background: rgba(0, 229, 255, 0.2);
    box-shadow: 0 4px 12px 0 rgba(0, 229, 255, 0.3);
    transform: translateY(-1px);
  }
  .preset-btn.delete {
    background: rgba(255, 107, 107, 0.1);
    border-color: #ff6b6b;
    color: #ff6b6b;
    box-shadow: 0 2px 8px 0 rgba(255, 107, 107, 0.2);
    font-size: 14px;
    padding: 4px 8px;
    min-width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    border: 1.5px solid #ff6b6b;
    transition: all 0.2s ease;
  }
  .preset-btn.delete:hover {
    background: rgba(255, 107, 107, 0.2);
    box-shadow: 0 4px 12px 0 rgba(255, 107, 107, 0.3);
    transform: translateY(-1px);
  }
  .preset-btn.confirm {
    background: rgba(76, 175, 80, 0.2);
    border-color: #4caf50;
    color: #4caf50;
    box-shadow: 0 2px 8px 0 rgba(76, 175, 80, 0.3);
    font-size: 14px;
    padding: 4px 8px;
    min-width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .preset-btn.confirm:hover {
    background: rgba(76, 175, 80, 0.3);
    box-shadow: 0 4px 12px 0 rgba(76, 175, 80, 0.4);
    transform: translateY(-1px);
  }
  .preset-btn.cancel {
    background: rgba(255, 107, 107, 0.1);
    border-color: #ff6b6b;
    color: #ff6b6b;
    box-shadow: 0 2px 8px 0 rgba(255, 107, 107, 0.2);
    font-size: 14px;
    padding: 4px 8px;
    min-width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    border: 1.5px solid #ff6b6b;
    transition: all 0.2s ease;
  }
  .preset-btn.cancel:hover {
    background: rgba(255, 107, 107, 0.2);
    box-shadow: 0 4px 12px 0 rgba(255, 107, 107, 0.3);
    transform: translateY(-1px);
  }
  .rename-input {
    flex: 1;
    max-width: calc(100% - 80px); /* ให้พื้นที่สำหรับปุ่ม ติ๊กถูก และ X ที่มีขนาดที่กำหนดแล้ว */
    padding: 0;
    font-size: 22px;
    font-family: 'MiSansThai', sans-serif;
    font-weight: 600;
    border: none;
    border-radius: 0;
    background: transparent;
    color: inherit;
    outline: none;
    transition: all 0.2s;
    box-shadow: none;
    min-width: 0; /* ให้ flex item หดตัวได้ */
  }
  .rename-input:focus {
    background: rgba(0, 229, 255, 0.1);
    border-radius: 4px;
    padding: 2px 8px;
  }
  .rename-input::placeholder {
    color: rgba(0, 229, 255, 0.5);
    font-weight: 500;
  }

  /* RESET WIN NUMBER INPUT STYLE ให้เหมือนเดิม 100% */
  .win-number-input {
    width: 100%;
    font-size: 100px;
    font-family: 'MiSansThai-Bold', sans-serif;
    font-weight: 700;
    color: #00e5ff;
    background: transparent;
    border: none;
    outline: none;
    text-align: center;
    line-height: 1.1;
    letter-spacing: 0.5px;
    padding: 0;
    margin: 0;
    transition: font-size 0.2s;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  @media (max-width: 500px) {
    .win-number-input.win-size-2 { font-size: 100px; }
    .win-number-input.win-size-3 { font-size: 68px; }
    .win-number-input.win-size-4 { font-size: 55px; }
    .win-number-input.win-size-5 { font-size: 45px; }
    .win-number-input.win-size-6 { font-size: 38px; }
  }
  /* END RESET */

  /* RESET GOAL NUMBER INPUT STYLE ให้เหมือนเดิม 100% */
  .goal-number-box input {
    width: 100%;
    height: 100%;
    min-width: 0;
    max-width: 100%;
    font-size: calc(476px * 0.063) !important;
    font-family: 'MiSansThai-Bold', sans-serif;
    font-weight: 700;
    color: #00e5ff;
    background: transparent;
    border: none;
    outline: none;
    text-align: center;
    line-height: 1.1;
    letter-spacing: 0.5px;
    padding: 0;
    margin: 0;
    transition: border 0.2s, background 0.2s;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    box-sizing: border-box;
  }
  .goal-number-box input.win-size-2,
  .goal-number-box input.win-size-3,
  .goal-number-box input.win-size-4,
  .goal-number-box input.win-size-5,
  .goal-number-box input.win-size-6 {
    font-size: calc(476px * 0.063) !important;
  }
  .goal-number-box {
    cursor: pointer;
    transition: border 0.2s, background 0.2s;
  }
  .goal-number-box:hover {
    border-color: #00e5ff;
    background: rgba(0,229,255,0.08);
  }
  .goal-number-box input:focus {
    outline: none;
    border: none;
    background: transparent;
  }
  @media (max-width: 500px) {
    .goal-number-box input.win-size-2 { font-size: 100px; }
    .goal-number-box input.win-size-3 { font-size: 68px; }
    .goal-number-box input.win-size-4 { font-size: 55px; }
    .goal-number-box input.win-size-5 { font-size: 45px; }
    .goal-number-box input.win-size-6 { font-size: 38px; }
  }
  /* END RESET */







  .preset-btn.add {
    color: #00e5ff;
    border: 1.5px solid #00e5ff;
    background: #10101a;
    border-radius: 6px;
    padding: 0 12px;
    font-size: 15px;
    font-family: 'MiSansThai-Bold', sans-serif;
    font-weight: 600;
    cursor: pointer;
    height: 32px;
    margin-bottom: 10px;
    margin-right: 0;
    transition: background 0.2s, color 0.2s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .preset-btn.add:hover {
    background: rgba(0,229,255,0.08);
  }
  .preset-add-row {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    gap: 6px;
  }
  .add-preset-input {
    flex: 1;
    font-size: 16px;
    font-family: 'MiSansThai', sans-serif;
    font-weight: 600;
    color: #00e5ff;
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 0;
    outline: none;
    transition: all 0.2s;
    box-shadow: none;
  }
  .add-preset-input:focus {
    background: transparent;
    border: none;
    box-shadow: none;
  }
  .add-preset-input::placeholder {
    color: rgba(0, 229, 255, 0.5);
    font-weight: 500;
  }

  .preset-item-btn.add {
    justify-content: center;
    font-size: 36px;
    font-weight: 600;
    color: #00e5ff;
    background: rgba(0, 229, 255, 0.05);
    border: 2px solid rgba(0, 229, 255, 0.18);
    border-radius: 8px;
    padding: 0px 28px;
    margin-bottom: 12px;
    width: calc(100% + 4px); /* เท่ากับปุ่มรายการ */
    max-width: none; /* เท่ากับปุ่มรายการ */
    display: flex;
    align-items: center;
    transition: box-shadow 0.2s, background 0.2s, border 0.2s;
    box-shadow: 0 1px 4px 0 rgba(0,229,255,0.04);
    outline: none;
    cursor: pointer;
  }
  .preset-item-btn.add:hover {
    background: rgba(0, 229, 255, 0.15);
    border-color: #00e5ff;
    box-shadow: 0 4px 20px 0 rgba(0,229,255,0.2);
    transform: translateY(-1px);
    color: #00e5ff;
  }
  .add-preset-row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: calc(100% + 4px); /* เท่ากับปุ่มรายการ */
    max-width: none; /* เท่ากับปุ่มรายการ */
    padding: 8px 16px;
    background: rgba(0, 229, 255, 0.05);
    border: 2px solid rgba(0, 229, 255, 0.3);
    border-radius: 8px;
    margin-bottom: 12px;
    min-height: unset;
    transition: all 0.2s ease;
  }
  .add-preset-row:hover {
    background: rgba(0, 229, 255, 0.1);
    border-color: #00e5ff;
  }
  /* ลบ CSS ที่ซ้ำซ้อนออก */
  .preset-inline-actions {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px; /* ลด gap จาก 100px เป็น 8px */
    margin-left: auto;
    margin-right: -16px;
    flex-shrink: 0;
    height: 100%;
    align-self: center;
    transform: translateY(44px);
  }
  .preset-name {
    flex: 1 1 0%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: left;
    line-height: 1;
    display: flex;
    align-items: center;
  }

  /* ลบ CSS ที่ซ้ำซ้อนออก */

  .modal-actions {
    display: flex;
    flex-direction: row;
    gap: 16px;
    justify-content: center;
    margin-top: 24px;
  }
  .action-btn.confirm {
    background: #ff3b3b;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 8px 24px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  .action-btn.confirm:hover {
    background: #e60000;
  }
  .action-btn.cancel {
    background: #eee;
    color: #222;
    border: none;
    border-radius: 8px;
    padding: 8px 24px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  .action-btn.cancel:hover {
    background: #ccc;
  }

  .update-notice {
    margin-top: 15px;
    padding: 10px;
    background: rgba(255, 107, 107, 0.1);
    border: 1px solid rgba(255, 107, 107, 0.3);
    border-radius: 8px;
    text-align: center;
  }



  .update-btn {
    background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
    color: white;
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .update-btn:hover {
    background: linear-gradient(45deg, #ff5252, #ff7676);
    transform: translateY(-1px);
  }



  /* License Test Modal Styles */
  .license-test-modal {
    max-width: 500px;
    width: 90vw;
    min-height: 300px;
  }

  .license-input-container {
    text-align: center;
    margin: 20px 0;
  }



  .license-key-input {
    width: 100%;
    padding: 15px 20px;
    font-size: 18px;
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    border: 2px solid transparent;
    border-radius: 12px;
    text-align: center;
    letter-spacing: 2px;
    font-family: 'MiSansThai', sans-serif;
    color: #ffffff;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    position: relative;
  }

  .license-key-input::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57, #ff9ff3, #54a0ff);
    border-radius: 14px;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .license-key-input:focus {
    outline: none;
    border-color: transparent;
    box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.3);
    transform: translateY(-2px);
  }

  .license-key-input:focus::before {
    opacity: 1;
  }

  .license-key-input::placeholder {
    color: #6c757d;
    letter-spacing: 1px;
    opacity: 0.7;
  }

  .modal-actions {
    display: flex;
    justify-content: center;
    margin-top: 30px;
  }

  .confirm-btn {
    background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
    color: white;
    border: none;
    padding: 15px 40px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
    position: relative;
    overflow: hidden;
  }

  .confirm-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }

  .confirm-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
  }

  .confirm-btn:hover::before {
    left: 100%;
  }

  .license-error {
    margin-top: 10px;
    padding: 10px;
    background: linear-gradient(135deg, #ff6b6b, #ee5a52);
    color: white;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    text-align: center;
    animation: shake 0.5s ease-in-out;
  }

  .license-success {
    margin-top: 10px;
    padding: 10px;
    background: linear-gradient(135deg, #4ecdc4, #44a08d);
    color: white;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    text-align: center;
    animation: bounce 0.5s ease-in-out;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    60% { transform: translateY(-5px); }
  }

  .skip-btn {
    background: linear-gradient(135deg, #6c757d, #495057);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-left: 10px;
    position: relative;
    overflow: hidden;
  }

  .skip-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(108, 117, 125, 0.4);
  }

  .skip-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }

  .skip-btn:hover::before {
    left: 100%;
  }

  /* General Settings Styles */
  .settings-section {
    margin-bottom: 25px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .settings-section-title {
    margin: 0 0 15px 0;
    color: #007AFF;
    font-size: 16px;
    font-weight: 600;
  }

  .app-info {
    color: #fff;
    font-size: 14px;
    line-height: 1.6;
  }

  .app-info p {
    margin: 8px 0;
  }

  .app-link {
    color: #007AFF;
    text-decoration: none;
    transition: color 0.3s ease;
  }

  .app-link:hover {
    color: #00D4FF;
    text-decoration: underline;
  }

  .action-btn.cancel:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.5);
  }

  /* Donate Modal Styles */
  .donate-modal {
    max-width: 416px !important;
    min-width: 416px !important;
    width: 416px !important;
    min-height: calc(100% - 76px) !important;
    height: calc(100% - 76px) !important;
  }
  
  .donate-modal .modal-body {
    padding: 8px 24px 19px 24px;
    margin-top: 0px;
  }
  
  /* Copy Modal Styles */
  .copy-modal {
    max-width: 450px !important;
    min-width: 450px !important;
    width: 450px !important;
    max-height: calc(90vh + 8px) !important;
    min-height: auto !important;
    height: auto !important;
    overflow-y: auto;
  }
  
  .copy-success {
    text-align: center;
    padding: 20px 0;
    max-height: calc(85vh - 160px);
    overflow-y: auto;
    margin-bottom: 20px;
  }
  

  
  .copy-success h3 {
    font-size: 32px;
    font-weight: 700;
    color: #00e5ff;
    margin-bottom: 16px;
  }
  
  .copy-url-container {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 24px;
  }
  
  .copy-url {
    flex: 1;
    background: rgba(0, 229, 255, 0.1);
    border: 2px solid rgba(0, 229, 255, 0.3);
    border-radius: 8px;
    padding: 14px;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    color: #00e5ff;
    word-break: break-all;
    margin: 0;
  }
  
  .copy-btn {
    background: rgba(0, 229, 255, 0.1);
    border: 2px solid rgba(0, 229, 255, 0.3);
    border-radius: 8px;
    padding: 12px;
    font-size: 22px;
    color: #00e5ff;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .copy-btn:hover {
    background: rgba(0, 229, 255, 0.2);
    border-color: #00e5ff;
    transform: translateY(-1px);
  }
  
  .overlay-instructions {
    text-align: left;
    max-width: 100%;
  }
  
  .overlay-instructions h4 {
    font-size: 18px;
    font-weight: 700;
    color: #00e5ff;
    margin-bottom: 12px;
    margin-top: 20px;
  }
  
  .overlay-instructions ol {
    margin-left: 20px;
    margin-bottom: 20px;
  }
  
  .overlay-instructions li {
    font-size: 16px;
    color: #ffffff;
    margin-bottom: 8px;
    line-height: 1.4;
  }
  
  .overlay-instructions ul {
    margin-left: 20px;
    margin-bottom: 20px;
  }
  
  .overlay-instructions hr {
    border: none;
    border-top: 1px solid rgba(0, 229, 255, 0.3);
    margin: 20px 0;
  }
  
  .overlay-instructions strong {
    color: #ff6b6b;
  }

  .donate-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .donate-input-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .donate-input-group label {
    font-weight: 600;
    color: #00e5ff;
    font-size: 16px;
  }

  .donate-input {
    padding: 12px;
    border: 2px solid rgba(0, 229, 255, 0.3);
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.4);
    color: #fff;
    font-size: 17px;
    transition: all 0.3s ease;
  }

  .donate-input::-webkit-outer-spin-button,
  .donate-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .donate-input[type=number] {
    -moz-appearance: textfield;
  }

  .donate-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
    font-family: 'MiSansThai', sans-serif;
    font-style: italic;
  }

  .donate-operation-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .donate-operation-group label {
    font-weight: 600;
    color: #00e5ff;
    font-size: 16px;
  }

  .operation-buttons {
    display: flex;
    gap: 10px;
  }

  .operation-btn {
    flex: 1;
    padding: 1px 16px;
    border: 2px solid rgba(0, 229, 255, 0.3);
    border-radius: 8px;
    background: transparent;
    color: #00e5ff;
    font-size: 44px;
    font-weight: 400;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
    box-shadow: 0 2px 8px 0 rgba(0,229,255,0.08);
    outline: none;
    user-select: none;
  }
  .operation-btn:hover {
    background: rgba(0, 229, 255, 0.12);
    border-color: #00e5ff;
    color: #fff;
    box-shadow: 0 4px 18px 0 rgba(0,229,255,0.18);
    transform: translateY(-2px) scale(1.04);
  }
  .operation-btn:active {
    background: #00e5ff;
    color: #000;
    border-color: #00e5ff;
    box-shadow: 0 2px 8px 0 rgba(0,229,255,0.18);
    transform: scale(0.98);
  }
  .operation-btn.active {
    background: linear-gradient(45deg, #00e5ff, #00bcd4);
    color: #000;
    border: 2.5px solid #00e5ff;
    box-shadow: 0 4px 18px 0 rgba(0,229,255,0.18);
    z-index: 2;
    transform: scale(1.06);
    font-weight: 700;
  }
  .operation-btn.error {
    border-color: #ff6b6b !important;
    background: rgba(255, 107, 107, 0.12) !important;
    color: #ff6b6b !important;
    animation: shake 0.5s ease-in-out;
  }

  .donate-preview {
    background: rgba(0, 229, 255, 0.1);
    border: 1px solid rgba(0, 229, 255, 0.3);
    border-radius: 8px;
    padding: 16px;
    margin-top: 6px;
  }

  .donate-preview p {
    margin: 4px 0;
    font-size: 24px;
    color: #fff;
  }

  .donate-btn.confirm {
    background: linear-gradient(45deg, #00e5ff, #00bcd4);
    color: #000;
    font-weight: 700;
    border: none;
    padding: 13px 16px;
    font-size: 50px;
    width: calc(100% - 72px);
    margin: -22px auto 0 auto;
    display: block;
  }

  .donate-btn.confirm:hover {
    background: linear-gradient(45deg, #00bcd4, #00e5ff);
    transform: translateY(-2px);
  }

  .donate-btn.cancel {
    background: transparent;
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: #fff;
    padding: 8px 12px;
    font-size: 14px;
    width: calc(50% - 8px);
  }

  .donate-btn.cancel:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.5);
  }

  .modal-footer {
    background: transparent !important;
    border-top: none !important;
    padding: 15px 20px;
    display: flex;
    justify-content: center;
  }

  .donate-preview p {
    margin: 4px 0;
    font-size: 24px;
    color: #fff;
  }

  .donate-error {
    background: rgba(255, 0, 0, 0.1);
    border: 1px solid rgba(255, 0, 0, 0.3);
    border-radius: 8px;
    padding: 12px;
    margin-top: 8px;
    animation: shake 0.5s ease-in-out;
  }

  .donate-error p {
    margin: 0;
    font-size: 14px;
    color: #ff6b6b;
    white-space: pre-line;
    text-align: center;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }

  .donate-input.error {
    border-color: #ff6b6b;
    background: rgba(255, 107, 107, 0.1);
    animation: shake 0.5s ease-in-out;
  }

  .loading-screen {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background: linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%);
  }
  
  .loading-screen .spinner {
    width: 50px;
    height: 50px;
    border: 5px solid #334155;
    border-top: 5px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  }
  
  .loading-screen h2 {
    color: #e2e8f0;
    margin: 0;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .license-check-screen {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background: linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%);
  }

  .license-check-content {
    text-align: center;
    padding: 40px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 20px;
    border: 2px solid #00ffff;
    box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
  }

  .license-check-content h2 {
    color: #00ffff;
    font-size: 2rem;
    margin-bottom: 20px;
  }

  .license-check-content p {
    color: #ffffff;
    font-size: 1.2rem;
    margin-bottom: 30px;
  }

  .buy-license-btn {
    background: linear-gradient(45deg, #00ffff, #0080ff);
    border: none;
    color: #000000;
    padding: 15px 30px;
    font-size: 1.2rem;
    font-weight: bold;
    border-radius: 25px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .buy-license-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
  }

  .test-license-btn {
    background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
    border: none;
    color: #ffffff;
    padding: 12px 20px;
    font-size: 1rem;
    font-weight: bold;
    border-radius: 15px;
    cursor: pointer;
    margin-top: 15px;
    transition: all 0.3s ease;
  }

  .test-license-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(255, 107, 107, 0.5);
  }

  /* Purchase Modal Styles */
  .purchase-modal {
    max-width: 480px !important;
    min-width: 480px !important;
    width: 480px !important;
    max-height: calc(90vh) !important;
  }

  .purchase-info {
    text-align: center;
    padding: 20px 0;
  }

  .app-preview {
    margin-bottom: 30px;
  }

  .app-icon-large {
    width: 80px;
    height: 80px;
    margin-bottom: 16px;
    filter: drop-shadow(0 0 12px #00e5ff40);
  }

  .app-preview h4 {
    font-size: 28px;
    font-weight: 700;
    color: #00e5ff;
    margin: 12px 0 8px 0;
  }

  .tagline {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.8);
    margin: 0 0 20px 0;
    line-height: 1.4;
  }

  .price-box {
    background: linear-gradient(135deg, #00e5ff 0%, #0099cc 100%);
    border-radius: 16px;
    padding: 20px;
    margin: 20px 0 30px 0;
    color: #000;
  }

  .price {
    font-size: 42px;
    font-weight: 700;
    font-family: 'MiSansThai-Bold', sans-serif;
  }

  .period {
    font-size: 22px;
    font-weight: 600;
    opacity: 0.8;
    margin-left: 8px;
  }

  .features-list {
    text-align: left;
    margin: 20px 0 30px 0;
    padding: 0;
    list-style: none;
  }

  .features-list li {
    font-size: 18px;
    color: #ffffff;
    margin: 12px 0;
    padding-left: 0;
    line-height: 1.4;
  }

  .email-input-group {
    margin: 20px 0 30px 0;
    text-align: left;
  }

  .email-input-group label {
    display: block;
    font-size: 16px;
    font-weight: 600;
    color: #00e5ff;
    margin-bottom: 8px;
  }

  .customer-email-input {
    width: 100%;
    padding: 16px;
    font-size: 16px;
    border: 2px solid rgba(0, 229, 255, 0.3);
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.4);
    color: #fff;
    transition: all 0.3s ease;
  }

  .customer-email-input:focus {
    outline: none;
    border-color: #00e5ff;
    background: rgba(0, 229, 255, 0.1);
  }

  .customer-email-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  .purchase-btn {
    width: 100%;
    background: linear-gradient(135deg, #00e5ff 0%, #0099cc 100%);
    color: #000;
    border: none;
    border-radius: 16px;
    padding: 20px;
    font-size: 20px;
    font-weight: 700;
    font-family: 'MiSansThai-Bold', sans-serif;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-bottom: 20px;
  }

  .purchase-btn:hover {
    background: linear-gradient(135deg, #00ccff 0%, #0088bb 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 229, 255, 0.4);
  }

  .terms-text {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
    line-height: 1.4;
  }

  .terms-link {
    color: #00e5ff;
    text-decoration: none;
  }

  .terms-link:hover {
    text-decoration: underline;
  }

  /* QR Payment Styles */
  .qr-payment {
    text-align: center;
    padding: 20px 0;
  }

  .qr-payment h4 {
    font-size: 24px;
    font-weight: 700;
    color: #00e5ff;
    margin: 0 0 30px 0;
  }

  .qr-container {
    margin: 30px 0;
  }

  .qr-code-box {
    width: 200px;
    height: 200px;
    margin: 0 auto 20px auto;
    border: 3px solid #00e5ff;
    border-radius: 16px;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .qr-placeholder {
    text-align: center;
    color: #000;
    font-weight: 600;
  }

  .qr-placeholder p {
    margin: 8px 0;
    font-size: 18px;
  }

  .qr-placeholder small {
    font-size: 12px;
    opacity: 0.7;
    word-break: break-all;
  }

  .qr-loading {
    color: #666;
  }

  .payment-details {
    margin: 20px 0 30px 0;
  }

  .payment-details p {
    font-size: 18px;
    color: #ffffff;
    margin: 12px 0;
  }

  .payment-details strong {
    color: #00e5ff;
  }

  .payment-status {
    background: rgba(0, 229, 255, 0.1);
    border: 1px solid rgba(0, 229, 255, 0.3);
    border-radius: 12px;
    padding: 20px;
    margin: 20px 0;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 20px;
  }

  .spinner-small {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(0, 229, 255, 0.3);
    border-top: 2px solid #00e5ff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .payment-instructions {
    text-align: left;
  }

  .payment-instructions h5 {
    font-size: 16px;
    font-weight: 600;
    color: #00e5ff;
    margin: 0 0 12px 0;
  }

  .payment-instructions ol {
    margin: 0;
    padding-left: 20px;
  }

  .payment-instructions li {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
    margin: 8px 0;
    line-height: 1.4;
  }

  /* License Check Screen Styles */
  .loading-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #040319 0%, #0a0a2a 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 9998;
    color: #ffffff;
  }

  .loading-screen .spinner {
    width: 60px;
    height: 60px;
    border: 4px solid rgba(0, 229, 255, 0.3);
    border-top: 4px solid #00e5ff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  }

  .loading-screen h2 {
    font-size: 24px;
    font-weight: 600;
    color: #00e5ff;
    margin: 0;
  }

  .license-check-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #040319 0%, #0a0a2a 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9998;
  }

  .license-check-content {
    background: linear-gradient(135deg, #1a0f3a 0%, #2a1f4a 100%);
    border: 2px solid #00e5ff;
    border-radius: 20px;
    padding: 40px;
    text-align: center;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 0 50px rgba(0, 229, 255, 0.3);
  }

  .license-check-content h2 {
    font-size: 28px;
    font-weight: 700;
    color: #00e5ff;
    margin: 0 0 20px 0;
  }

  .license-check-content p {
    font-size: 16px;
    color: #cccccc;
    margin: 0 0 30px 0;
    line-height: 1.5;
  }

  .buy-license-btn {
    background: linear-gradient(45deg, #00e5ff, #0080ff);
    border: none;
    color: #000000;
    padding: 15px 30px;
    font-size: 18px;
    font-weight: 700;
    border-radius: 25px;
    cursor: pointer;
    transition: all 0.3s ease;
    margin: 0 10px 15px 0;
    display: inline-block;
  }

  .buy-license-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(0, 229, 255, 0.5);
  }

  .test-license-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid #00e5ff;
    color: #00e5ff;
    padding: 12px 25px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    margin: 0 10px 0 0;
    display: inline-block;
  }

  .test-license-btn:hover {
    background: rgba(0, 229, 255, 0.1);
    transform: scale(1.05);
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Development Test Button */
  .dev-test-overlay {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9997;
  }

  .dev-test-btn {
    background: rgba(255, 193, 7, 0.9);
    border: 2px solid #ffc107;
    color: #000000;
    padding: 8px 16px;
    font-size: 12px;
    font-weight: 600;
    border-radius: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 10px rgba(255, 193, 7, 0.3);
  }

  .dev-test-btn:hover {
    background: rgba(255, 193, 7, 1);
    transform: scale(1.05);
    box-shadow: 0 4px 15px rgba(255, 193, 7, 0.5);
  }

</style>

<!-- Purchase Modal -->
{#if showPurchaseModal}
  <div class="modal-backdrop" on:click={closePurchaseModal}>
          <div class="modal purchase-modal" on:click|stopPropagation role="dialog" tabindex="0">
      <div class="modal-header">
        <h3>🚀 เริ่มใช้งาน Win Count</h3>
        {#if showQRCode}
          <button class="modal-close" on:click={closePurchaseModal}>×</button>
        {/if}
      </div>
      <div class="modal-body">
        
        {#if !showQRCode}
          <!-- Step 1: Purchase Info -->
          <div class="purchase-info">
            <div class="app-preview">
              <img src="/assets/ui/app_crown.png" alt="Win Count" class="app-icon-large" />
              <h4>💎 Win Count Pro</h4>
              <p class="tagline">เครื่องมือนับวินสำหรับสตรีมเมอร์ระดับโปร</p>
            </div>
            
            <div class="price-box">
                              <span class="price">149 บาท</span>
              <span class="period">/เดือน</span>
            </div>
            
            <ul class="features-list">
              <li>✅ ใช้งานได้ไม่จำกัด</li>
              <li>✅ Hotkey ครบทุกฟีเจอร์</li>
              <li>✅ Overlay สำหรับ TikTok Live</li>
              <li>✅ อัพเดทฟรีตลอดชีพ</li>
              <li>✅ ซัพพอร์ตจากผู้พัฒนา</li>
            </ul>
            
            <div class="email-input-group">
              <label for="customer-email">อีเมลของคุณ:</label>
              <input 
                id="customer-email"
                type="email" 
                placeholder="example@email.com" 
                bind:value={customerEmail}
                class="customer-email-input"
              />
            </div>
            
            <button class="purchase-btn" on:click={startPurchase}>
                              💳 ซื้อด้วย PromptPay - 149 บาท
            </button>
            
            <p class="terms-text">
              การซื้อหมายถึงคุณยอมรับ<br>
              <a href="javascript:void(0)" class="terms-link">เงื่อนไขการใช้งาน</a>
            </p>
          </div>
          
        {:else}
          <!-- Step 2: QR Code Payment -->
          <div class="qr-payment">
            <h4>📱 สแกนเพื่อจ่ายเงิน</h4>
            
            <div class="qr-container">
              <div class="qr-code-box">
                {#if qrCodeData}
                  <!-- QR Code จะแสดงตรงนี้ - ตอนนี้ใช้ placeholder -->
                  <div class="qr-placeholder">
                    <p>QR Code</p>
                    <p>PromptPay</p>
                    <small>{qrCodeData}</small>
                  </div>
                {:else}
                  <div class="qr-loading">
                    <div class="spinner"></div>
                    <p>กำลังสร้าง QR Code...</p>
                  </div>
                {/if}
              </div>
            </div>
            
            <div class="payment-details">
                              <p class="amount">💰 จำนวน: <strong>149 บาท</strong></p>
              <p class="timer">⏰ เหลือเวลา: <strong>{countdownMinutes.toString().padStart(2, '0')}:{countdownSeconds.toString().padStart(2, '0')}</strong></p>
            </div>
            
            <div class="payment-status">
              <div class="status-indicator">
                <div class="spinner-small"></div>
                <p>รอการชำระเงิน...</p>
              </div>
              
              <div class="payment-instructions">
                <h5>วิธีการจ่ายเงิน:</h5>
                <ol>
                  <li>เปิดแอป Banking ในมือถือ</li>
                  <li>เลือก "สแกน QR" หรือ "PromptPay"</li>
                  <li>สแกน QR Code ด้านบน</li>
                  <li>ยืนยันการจ่ายเงิน 149 บาท</li>
                  <li>รอสักครู่ License จะเปิดใช้งานอัตโนมัติ</li>
                </ol>
              </div>
            </div>
          </div>
        {/if}
        
      </div>
    </div>
  </div>
{/if}



<!-- Result Modal -->
  {#if showResultModal}
    <div class="modal-backdrop" on:click={closeResultModal}>
      <div class="modal result-modal" on:click|stopPropagation role="dialog" tabindex="0">
        <div class="modal-header">
          <h3 style="text-align: center; width: 100%;">ผลลัพธ์</h3>
        </div>
        <div class="modal-body">
          <p style="white-space: pre-line; text-align: center; font-size: 48px; line-height: 1.6; font-weight: 700; color: #00e5ff;">{resultMessage}</p>
        </div>
      </div>
    </div>
  {/if}
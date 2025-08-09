<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { writable } from 'svelte/store';

  export let isOpen: boolean = false;
  export let onLicenseValid: () => void = () => {};
  export let isLicenseValid: boolean = false; // เพิ่ม prop สำหรับตรวจสอบ License

  // --- 🔥 State หลักสำหรับ Quest Log ของเรา! ---
  const modalStep = writable(0); // 0: Main, 1: QR, 2: MachineID, 3: Enter Key

  // --- State สำหรับแต่ละขั้นตอน ---
  let vipLicenseKey = '';
  let step3LicenseKey = ''; // แยกตัวแปรสำหรับขั้นตอนที่ 3
  let inputError = '';
  let inputSuccess = '';
  let machineIdForDisplay = 'กำลังโหลด...';
  let machineIdCopied = false;

  // --- 🔥 ฟังก์ชันควบคุม Quest Log ---
  function goToQrStep() {
    $modalStep = 1;
  }

  function goToMachineIdStep() {
    $modalStep = 2;
    fetchMachineId(); // ดึง Machine ID เมื่อมาถึงหน้านี้
  }

     function goToVipPremiumStep() {
     $modalStep = 4; // หน้า VIP Premium Popup
     // Focus ที่ input ทันที
    setTimeout(() => {
       const input = document.querySelector('.vip-popup-input') as HTMLInputElement;
       if (input) {
         input.focus();
         input.select();
         // เปลี่ยนภาษา keyboard เป็นภาษาอังกฤษ
         if ('setInputMethod' in navigator) {
           (navigator as any).setInputMethod('en');
         }
       }
     }, 100);
   }

  function goToLicenseKeyStep() {
    $modalStep = 3;
    // Focus ที่ input ทันที
    setTimeout(() => {
      const input = document.querySelector('.vip-input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
        // เปลี่ยนภาษา keyboard เป็นภาษาอังกฤษ
        if ('setInputMethod' in navigator) {
          (navigator as any).setInputMethod('en');
        }
      }
    }, 100);
  }

  function goBackToStep(step: number) {
    $modalStep = step;
  }
  
  // ฟังก์ชันที่ถูกเรียกเมื่อ Modal ถูกปิด - ป้องกันการปิดโดยไม่กรอก License
  function closeModal() {
      // ไม่ให้ปิด Modal ได้ถ้ายังไม่ได้กรอก License ที่ถูกต้อง
      if (!isLicenseValid) {
          console.log('🔒 Cannot close modal - license not valid');
          return;
      }
      
      isOpen = false;
      // รอให้ animation ปิดจบ ค่อย reset state
      setTimeout(() => {
          $modalStep = 0;
          vipLicenseKey = '';
          inputError = '';
          inputSuccess = '';
      }, 300);
  }

  // Security: Prevent any escape from license modal
  function preventEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isLicenseValid) {
          event.preventDefault();
          event.stopPropagation();
          console.log('🔒 Escape key blocked - license not valid');
          return false;
      }
  }

  // Security: Prevent right-click context menu
  function preventContextMenu(event: MouseEvent) {
      if (!isLicenseValid) {
          event.preventDefault();
          event.stopPropagation();
          console.log('🔒 Right-click blocked - license not valid');
          return false;
      }
  }

  // Security: Prevent developer tools access
  function preventDevTools(event: KeyboardEvent) {
      // Block F12, Ctrl+Shift+I, Ctrl+U
      if (event.key === 'F12' || 
          (event.ctrlKey && event.shiftKey && event.key === 'I') ||
          (event.ctrlKey && event.key === 'u')) {
          event.preventDefault();
          event.stopPropagation();
          console.log('🔒 Developer tools access blocked');
          return false;
      }
  }


  // --- ฟังก์ชัน Helper (เหมือนเดิม) ---
  async function fetchMachineId() {
    try {
      const id = await invoke('m4c5h6n');
      machineIdForDisplay = id as string;
      console.log('🖥️ Machine ID loaded:', machineIdForDisplay);
    } catch (e) {
      machineIdForDisplay = 'เกิดข้อผิดพลาด';
      console.error("Failed to get machine ID", e);
    }
  }

  // โหลด Machine ID ทันทีเมื่อ component โหลด
  onMount(() => {
    fetchMachineId();
  });

  function copyMachineId() {
    if (machineIdForDisplay && !machineIdForDisplay.includes('...')) {
      navigator.clipboard.writeText(machineIdForDisplay).then(() => {
        machineIdCopied = true;
        setTimeout(() => (machineIdCopied = false), 2000);
      });
    }
  }
  
  function showInputMessage(message: string, type: 'success' | 'error' = 'error') {
    if (type === 'success') {
      inputSuccess = message;
      inputError = '';
    } else {
      inputError = message;
      inputSuccess = '';
    }
    
    setTimeout(() => {
        inputSuccess = '';
        inputError = '';
    }, 3000);
  }

  async function validateVipLicense() {
    // ตรวจสอบว่าอยู่ใน step ไหน
    const currentKey = $modalStep === 3 ? step3LicenseKey : vipLicenseKey;
    
    if (!currentKey.trim()) {
      showInputMessage('กรุณากรอก License Key', 'error');
      return;
    }
    try {
      const machineId = await invoke('m4c5h6n');
      const ok = await invoke('a1b2c3d4', { licenseKey: currentKey.trim(), machineId });
      if (ok) {
        await invoke('s4v3k3y', { key: currentKey.trim() });
        showInputMessage('🎉 License Key ถูกต้อง! ยินดีต้อนรับ!', 'success');
        setTimeout(() => {
          closeModal();
          onLicenseValid();
        }, 1500);
      } else {
        showInputMessage('❌ License ไม่ถูกต้อง', 'error');
      }
    } catch (error) {
      console.error('❌ License validation failed:', error);
      showInputMessage('การเชื่อมต่อล้มเหลว โปรดลองอีกครั้ง', 'error');
    }
  }
</script>

{#if isOpen}
    <div 
      class="modal-backdrop" 
      on:click={() => {}} 
      on:keydown={preventEscape}
      on:contextmenu={preventContextMenu}
      role="dialog" 
      tabindex="0"
    >
      <div 
        class="modal license-modal" 
        on:click={(e) => e.stopPropagation()} 
        on:keydown={preventDevTools}
        role="dialog" 
        aria-labelledby="license-modal-title"
      >
        <div class="modal-body">

        {#if $modalStep === 0}
          <div class="payment-intro">
            <div class="app-title">
              <h2 style="font-size: 3.5rem; font-weight: bold; color: #00ffff; margin: 0;">PRO</h2>
              <p class="tagline">เครื่องมือนับวินสำหรับสตรีมเมอร์ระดับโปร</p>
        </div>
            
                         <div class="price-display">
               <div>
                 <span class="price-amount" style="color: #00ffff; font-size: 48px; font-weight: bold;">฿149</span>
                 <span class="price-period" style="color: #00ffff; font-size: 1.6rem; font-weight: bold;">/เดือน</span>
               </div>
               <div style="margin-top: 8px;">
                 <span class="price-amount" style="text-decoration: line-through; color: #ffffff; font-size: 1.8rem; opacity: 0.7;">฿199</span>
                 <span class="price-period" style="color: #ffffff; font-size: 1.4rem;">/เดือน</span>
               </div>
                         </div>

            <div class="promotion-banner-compact">
              <div class="promo-content">
                <span class="promo-title">โปรโมชั่นพิเศษ!</span>
                <span class="promo-savings">ประหยัด ฿50</span>
                <div class="timer-compact">⏰ หมดเขต: {new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('th-TH')}</div>
              </div>
            </div>
            
            <div class="discord-info">
              <div class="discord-text">
                <p>ดูรายละเอียดฟีเจอร์ทั้งหมดได้ที่ Discord</p>
              </div>
              <div class="discord-icon">
                <button 
                  class="discord-link-btn" 
                  on:click={() => {
                    // ลองเปิด Discord app ก่อน
                    const discordUrl = 'discord://discord.gg/eQT7DyxAG6';
                    const webUrl = 'https://discord.gg/eQT7DyxAG6';
                    
                    // สร้าง iframe เพื่อทดสอบว่า Discord app เปิดได้หรือไม่
                    const iframe = document.createElement('iframe');
                    iframe.style.display = 'none';
                    iframe.src = discordUrl;
                    document.body.appendChild(iframe);
                    
                    // รอสักครู่แล้วตรวจสอบ
                    setTimeout(() => {
                      // ลบ iframe
                      document.body.removeChild(iframe);
                      
                      // เปิดในเบราว์เซอร์แทน
                      window.open(webUrl, '_blank');
                    }, 500);
                  }}
                >
                  <img src="/assets/logo/Discord-Logo-Blurple.svg" alt="Discord" />
                </button>
              </div>
            </div>
           
            <div class="button-container">
              <button class="buy-button" on:click={goToQrStep}>
                 เปย์
              </button>
                             <button class="vip-button-floating" on:click={goToVipPremiumStep}>
                <div class="vip-text-vertical">VIP</div>
              </button>
            </div>
          </div>
        {/if}

        {#if $modalStep === 1}
          <div class="quest-step-container">
            <button class="back-button" on:click={() => goBackToStep(0)}>← กลับ</button>
            <h3>ขั้นตอนที่ 1: ชำระเงิน</h3>
                         <p class="step-instruction">สแกน QR Code ด้านล่างเพื่อชำระเงิน อย่าลืม **เก็บสลิป** ไว้ด้วยนะครับ</p>
                                    <div class="qr-image-container">
              <img src="/assets/logo/promptpay.png" alt="PromptPay Logo" class="promptpay-logo" />
              <img src="https://promptpay.io/0909783454/149.png" alt="PromptPay QR Code" class="qr-image-style" />
              <div class="qr-footer">
                090-978-3454 | ฿149
              </div>
                                    </div>
            <button class="next-step-button" on:click={() => {
              // ลองเปิด Discord app ก่อน
              const discordUrl = 'discord://discord.gg/eQT7DyxAG6';
              const webUrl = 'https://discord.gg/eQT7DyxAG6';
              
              // สร้าง iframe เพื่อทดสอบว่า Discord app เปิดได้หรือไม่
              const iframe = document.createElement('iframe');
              iframe.style.display = 'none';
              iframe.src = discordUrl;
              document.body.appendChild(iframe);
              
              // รอสักครู่แล้วตรวจสอบ
              setTimeout(() => {
                // ลบ iframe
                document.body.removeChild(iframe);
                
                // เปิดในเบราว์เซอร์แทน
                window.open(webUrl, '_blank');
              }, 500);
              
              goToMachineIdStep();
            }}>
              ส่งหลักฐาน & ไปที่ Discord 🚀
                  </button>
                </div>
              {/if}
       
        {#if $modalStep === 2}
          <div class="quest-step-container">
            <button class="back-button" on:click={() => goBackToStep(1)}>← กลับ</button>
            <h3>ขั้นตอนที่ 2: ส่งข้อมูล</h3>
            <p class="step-instruction">คัดลอก "Machine ID" ด้านล่างนี้ แล้วส่งไปที่ DM ของ ArtYWoof ใน Discord พร้อมกับสลิปที่เก็บไว้</p>
            <div class="machine-id-display quest-machine-id">
              <div class="machine-id-box">
                <span>{machineIdForDisplay}</span>
                <button on:click={copyMachineId} title="คัดลอก">
                  {#if machineIdCopied}✅{:else}📋{/if}
                </button>
              </div>
            </div>
            <button class="next-step-button" on:click={goToLicenseKeyStep}>
              ได้รับ Key แล้ว (ขั้นตอนสุดท้าย) →
            </button>
          </div>
        {/if}
        
        {#if $modalStep === 3}
          <div class="quest-step-container">
             <button class="back-button" on:click={() => goBackToStep(2)}>← กลับ</button>
                         <h3>ขั้นตอนสุดท้าย</h3>
            <p class="step-instruction">นำ License Key ที่ได้รับจาก ArtYWoof มากรอกในช่องด้านล่างเพื่อเปิดใช้งาน PRO</p>
          <div class="license-input-display">
            <div class="license-input-box">
              <input 
                type="text" 
                bind:value={step3LicenseKey}
                class="license-input {inputError ? 'error' : ''} {inputSuccess ? 'success' : ''}"
                on:keydown={(e) => {
                  if (e.key === 'Enter') {
                    validateVipLicense();
                  } else if (e.key === 'Backspace') {
                    step3LicenseKey = '';
                    setTimeout(() => {
                      const target = e.target as HTMLInputElement;
                      target.setSelectionRange(0, 0);
                    }, 0);
                  }
                }}
                on:focus={() => {
                  // เปลี่ยนภาษา keyboard เป็นภาษาอังกฤษเมื่อ focus
                  if ('setInputMethod' in navigator) {
                    (navigator as any).setInputMethod('en');
                  }
                }}
                                              on:input={(e) => {
                  const target = e.target as HTMLInputElement;
                  let value = target.value;
                  
                  // อนุญาตเฉพาะตัวอักษรภาษาอังกฤษ ตัวเลข และเครื่องหมาย -
                  value = value.replace(/[^A-Za-z0-9-]/g, '');
                  // แปลงเป็นตัวใหญ่
                  value = value.toUpperCase();
                  
                  step3LicenseKey = value;
                }}
              required
              autocomplete="off"
              spellcheck="false"
                              maxlength="35"
              />
            {#if inputError}
                <div class="input-error">{inputError}</div>
            {/if}
            {#if inputSuccess}
                <div class="input-success">{inputSuccess}</div>
            {/if}
            </div>
          </div>
          <div class="vip-button-group">
            <button class="vip-validate-btn" on:click={validateVipLicense}>
                ตรวจสอบ Key
            </button>
          </div>
        </div>
      {/if}
    </div>

    {#if $modalStep === 4}
      <div class="vip-popup-overlay" on:click={() => {}} on:keydown={(e) => e.key === 'Escape' && goBackToStep(0)}>
        <div class="vip-popup" on:click|stopPropagation on:keydown|stopPropagation>
          <button class="vip-popup-close-btn" on:click={() => goBackToStep(0)}>×</button>
          
          <div class="vip-popup-header">
            <h3 class="vip-popup-title">VIP Premium</h3>
            <p class="vip-popup-subtitle">License Key จาก ArtYWoof</p>
                      </div>
          
          <div class="vip-popup-content">
            <div class="vip-popup-input-container">
              <input 
                type="text" 
                bind:value={vipLicenseKey}
                class="vip-popup-input {inputError ? 'error' : ''} {inputSuccess ? 'success' : ''}"
                on:keydown={(e) => {
                  if (e.key === 'Enter') {
                    validateVipLicense();
                  } else if (e.key === 'Backspace') {
                    vipLicenseKey = '';
                    setTimeout(() => {
                      const target = e.target as HTMLInputElement;
                      target.setSelectionRange(0, 0);
                    }, 0);
                  }
                }}
                on:focus={() => {
                  // เปลี่ยนภาษา keyboard เป็นภาษาอังกฤษเมื่อ focus
                  if ('setInputMethod' in navigator) {
                    (navigator as any).setInputMethod('en');
                  }
                }}
                on:input={(e) => {
                  const target = e.target as HTMLInputElement;
                  let value = target.value;
                  
                  // ไม่ต้องจัดการ cursor position
                  

                  
                  // อนุญาตเฉพาะตัวอักษรภาษาอังกฤษ ตัวเลข และเครื่องหมาย -
                  value = value.replace(/[^A-Za-z0-9-]/g, '');
                  // แปลงเป็นตัวใหญ่
                  value = value.toUpperCase();
                  
                  // ไม่ต้อง format อัตโนมัติ - ให้กรอกได้ 32 ตัวอักษร
                  
                  vipLicenseKey = value;
                  
                  // ไม่ต้องจัดการ cursor position
                }}
                required
                autocomplete="off"
                spellcheck="false"
                maxlength="35"
              />
              {#if inputError}
                  <div class="vip-popup-error-msg">{inputError}</div>
                    {/if}
              {#if inputSuccess}
                  <div class="vip-popup-success-msg">{inputSuccess}</div>
            {/if}
            </div>
            
            <button class="vip-popup-check-btn" on:click={validateVipLicense}>
              <span class="popup-btn-icon">🔐</span>
              <span class="popup-btn-text">ตรวจสอบ License Key</span>
          </button>
        </div>
      </div>
    </div>
  {/if}
  </div>
  </div>
  {/if}

<style>
  @font-face {
    font-family: 'MiSansThai-Bold';
    src: url('/assets/fonts/MiSansThai-Bold.ttf') format('truetype');
    font-weight: 700;
    font-style: normal;
  }

  @font-face {
    font-family: 'MiSansThai';
    src: url('/assets/fonts/MiSansThai.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
  }

  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10005;
    padding: 20px;
    border-radius: 35px;
    margin: 10px;
    pointer-events: all;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: transparent;
    z-index: 10004;
    pointer-events: none;
  }

  .license-modal {
    background: #040319;
    border: 4px solid #00ffff !important;
    border-radius: 35px;
    width: 440px !important;
    height: 740px !important;
    overflow-y: auto;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10001;
    pointer-events: auto;
    isolation: isolate;
    outline: none !important;
    backdrop-filter: none;
  }

  .modal-body {
    padding: 15px;
    height: calc(100% - 30px);
    display: flex;
    flex-direction: column;
  }

  .payment-intro {
    text-align: center;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: -5px 20px;
    gap: 6px;
  }

  .app-title {
    margin-bottom: 8px;
  }

  .app-title h2 {
    font-size: 48px;
    font-weight: 700;
    color: #00ffff;
    margin: 0;
    font-family: 'MiSansThai-Bold', 'MiSansThai', sans-serif;
  }

  .tagline {
    font-size: 1.1rem;
    color: #cccccc;
    margin: 0;
    font-style: italic;
    font-family: 'MiSansThai', sans-serif;
    line-height: 1.3;
  }

  .price-display {
    margin: 2px auto;
    background: rgba(0, 255, 255, 0.1);
    padding: 10px 15px;
    border-radius: 12px;
    border: 2px solid #00ffff;
    width: 70%;
    box-shadow: 0 4px 12px rgba(0, 255, 255, 0.15);
  }

  .price-amount {
    font-size: 48px;
    font-weight: bold;
    color: #00ffff;
    position: relative;
    z-index: 1;
    font-family: 'MiSansThai-Bold', 'MiSansThai', sans-serif;
  }

  .price-period {
    font-size: 1.4rem;
    color: #cccccc;
    position: relative;
    z-index: 1;
    font-family: 'MiSansThai', sans-serif;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .promotion-banner-compact {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 15px;
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 140, 0, 0.15) 100%);
    border: 2px solid rgba(255, 215, 0, 0.4);
    border-radius: 12px;
    margin: 18px 0 10px 0;
    width: 92%;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .promo-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    text-align: center;
    position: relative;
    z-index: 1;
  }

  .promo-title {
    font-size: 32px;
    font-weight: bold;
    color: #ffd700;
    letter-spacing: 1px;
  }

  .promo-savings {
    font-size: 18px;
    color: #ffffff;
    font-weight: 600;
    background: linear-gradient(45deg, #ff6b35, #f7931e);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .timer-compact {
    font-size: 14px;
    color: #ffffff;
    opacity: 0.9;
    background: rgba(255, 255, 255, 0.1);
    padding: 6px 12px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .discord-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    padding: 26px;
    padding-top: 30px;
    background: rgba(114, 137, 218, 0.1);
    border: 2px solid rgba(114, 137, 218, 0.3);
    border-radius: 12px;
    margin: px 0 10px 0;
    transition: all 0.3s ease;
    min-height: 0px;
  }

  .discord-text {
    text-align: center;
  }

  .discord-text p {
    margin: 0;
    color: #ffffff;
    font-size: 18px;
    opacity: 0.9;
  }

  .discord-icon {
    flex-shrink: 0;
  }

  .discord-link-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: all 0.3s ease;
  }

  .discord-link-btn:hover {
    transform: scale(1.1);
  }

  .discord-icon img {
    width: 300px;
    height: 60px;
    transition: all 0.3s ease;
  }

  .discord-icon img:hover {
    transform: scale(1.1);
    filter: brightness(1.2);
  }

  .button-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    margin-top: auto;
    padding-top: 4px;
    position: relative;
    width: 100%;
  }

  .buy-button {
    background: rgba(0, 255, 255, 0.1);
    border: 1px solid rgba(0, 255, 255, 0.3);
    color: #00ffff;
    padding: 15px 30px;
    font-size: 2.5rem;
    font-weight: bold;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 0;
    position: relative;
    overflow: hidden;
    font-family: 'MiSansThai-Bold', 'MiSansThai', sans-serif;
    min-width: 150px;
    display: inline-block;
    margin: 0;
  }

  .buy-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s;
  }

  .buy-button:hover::before {
    left: 100%;
  }

  .vip-button-floating {
    position: relative;
    background: rgba(255, 215, 0, 0.1);
    border: 1px solid rgba(255, 215, 0, 0.3);
    color: #ffd700;
    padding: 18px 30px;
    overflow: hidden;
    font-weight: bold;
    font-size: 2.2rem;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'MiSansThai-Bold', 'MiSansThai', sans-serif;
    min-width: 140px;
    min-height: 55px;
    display: inline-block;
    margin: 0;
    text-align: center;
    line-height: 1.2;
    z-index: 10004;
  }

  .vip-button-floating::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s;
  }

  .vip-button-floating:hover::before {
    left: 100%;
  }

  .vip-text-vertical {
    font-size: 2.5rem;
    font-weight: bold;
    color: #ffd700;
    white-space: nowrap;
    text-align: center;
    transition: all 0.3s ease;
  }

  .vip-button-floating:hover .vip-text-vertical {
    font-size: 2.5rem;
    color: #ffd700;
  }

  .vip-button-floating:hover {
    padding: 18px 30px;
    font-size: 2.5rem;
    min-width: 140px;
    min-height: 55px;
    background: rgba(255, 215, 0, 0.2);
    border-color: rgba(255, 215, 0, 0.6);
  }

  /* --- 🔥 CSS ใหม่สำหรับ Quest Log Flow --- */

  .quest-step-container {
    padding: 10px;
    text-align: center;
    display: flex;
    flex-direction: column;
    margin-top: 10px;
  }
  
  .back-button {
    position: absolute;
    top: 16px;
    left: 16px;
    background: rgba(0, 255, 255, 0.1);
    border: 1px solid rgba(0, 255, 255, 0.3);
    color: #00ffff;
    font-size: 1rem;
    cursor: pointer;
    opacity: 0.8;
    transition: all 0.3s ease;
    padding: 8px 12px;
    border-radius: 8px;
    font-family: 'MiSansThai-Bold', sans-serif;
  }
  .back-button:hover {
    opacity: 1;
    background: rgba(0, 255, 255, 0.2);
  }

  .quest-step-container h3 {
    color: #00ffff;
    font-size: 2.5rem;
    font-family: 'MiSansThai-Bold', sans-serif;
    margin-bottom: 0px;
    text-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
  }
  
  .step-instruction {
    color: #ffffff;
    font-size: 1.3rem;
    line-height: 1.5;
    margin-top: 10px;
    margin-bottom: 14px;
    max-width: 100%;
    margin-left: auto;
    margin-right: auto;
    background: rgba(0, 255, 255, 0.1);
    padding: 15px 20px;
    border-radius: 12px;
    border: 1px solid rgba(0, 255, 255, 0.2);
    font-family: 'MiSansThai', sans-serif;
  }

    .qr-image-container {
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }

  .promptpay-logo {
    width: 240px;
    height: 80px;
  }
  
  .qr-image-style {
    width: 240px;
    height: 240px;
    border-radius: 10px;
    border: 2px solid #00ffff;
  }

    .qr-footer {
    text-align: center;
    color: #00ffff;
    font-size: 1.4rem;
    font-weight: bold;
    font-family: 'MiSansThai-Bold', sans-serif;
    margin-top: -6px;
  }

  .quest-machine-id {
    margin-bottom: 30px !important;
  }

  .next-step-button {
    background: rgba(0, 255, 255, 0.1);
    border: 2px solid rgba(0, 255, 255, 0.5);
    color: #00ffff;
    font-size: 1.4rem;
    font-weight: 600;
    cursor: pointer;
    opacity: 0.9;
    transition: all 0.3s ease;
    padding: 16px 24px;
    border-radius: 12px;
    font-family: 'MiSansThai-Bold', sans-serif;
    margin-top: auto; /* ดันปุ่มไปล่างสุด */
    width: 100%;
  }

  .next-step-button:hover {
    opacity: 1;
    background: rgba(0, 255, 255, 0.2);
    border-color: rgba(0, 255, 255, 0.8);
  }
  
  /* Machine ID Display */
  .machine-id-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(0, 0, 0, 0.3);
      border-radius: 12px;
    padding: 15px 20px;
    border: 1px solid rgba(0, 255, 255, 0.2);
  }

  .machine-id-box span {
    font-family: 'Courier New', Courier, monospace;
    font-size: 1.4rem;
    color: #00ffff;
    word-break: break-all;
     font-weight: bold;
   }
   
  .machine-id-box button {
    background: rgba(0, 255, 255, 0.1);
    border: 1px solid rgba(0, 255, 255, 0.3);
    color: #00ffff;
    font-size: 1.3rem;
    cursor: pointer;
    opacity: 1;
    transition: all 0.3s ease;
    padding: 10px 16px;
    border-radius: 8px;
  }

  .machine-id-box button:hover {
    opacity: 1;
    background: rgba(0, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  /* License Input Display */
  .license-input-display {
    margin-bottom: 20px;
  }

  .license-input-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    padding: 15px 20px;
    border: 1px solid rgba(0, 255, 255, 0.2);
  }

  .license-input {
    flex: 1;
    background: transparent;
    border: none;
    color: #00ffff;
    font-family: 'Courier New', Courier, monospace;
    font-size: 1.4rem;
    font-weight: bold;
    text-align: center;
    outline: none;
    letter-spacing: 1px;
  }

  .license-input::placeholder {
    color: rgba(0, 255, 255, 0.5);
  }

  .license-input.error {
    color: #ff0000;
  }

  .license-input.success {
    color: #00ff00;
  }

  /* VIP Input */
  .input-container {
    position: relative;
    margin-bottom: 0px;
  }

  .vip-input {
    width: 90%;
    padding: 18px 25px;
    border: 2px solid rgba(0, 255, 255, 0.3);
    border-radius: 15px;
    background: rgba(0, 255, 255, 0.1);
    color: #ffffff;
    font-size: 1.4rem;
    font-family: 'MiSansThai-Bold', sans-serif;
    margin-bottom: 8px;
    margin-left: auto;
    margin-right: auto;
    display: block;
    text-align: center;
    letter-spacing: 0px;
    transition: all 0.3s ease;
  }

  .vip-input:focus {
    outline: none;
    border-color: #00ffff;
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.4);
    background: rgba(0, 255, 255, 0.15);
  }

  .vip-input::placeholder {
    color: rgba(126, 126, 126, 0.8);
  }

  .vip-input.error {
    border-color: #ff0000 !important;
    box-shadow: 0 0 15px rgba(255, 0, 0, 0.4) !important;
  }

  .vip-input.success {
    border-color: #00ff00 !important;
    box-shadow: 0 0 15px rgba(0, 255, 0, 0.4) !important;
  }

  .input-error {
    color: #ff0000;
    font-size: 1rem;
    margin-top: 10px;
    padding: 12px 15px;
    background: rgba(255, 0, 0, 0.1);
    border: 1px solid rgba(255, 0, 0, 0.3);
    border-radius: 10px;
    font-family: 'MiSansThai-Bold', sans-serif;
    animation: slideInDown 0.3s ease-out;
  }

  .input-success {
    color: #00ff00;
    font-size: 1rem;
    margin-top: 10px;
    padding: 12px 15px;
    background: rgba(0, 255, 0, 0.1);
    border: 1px solid rgba(0, 255, 0, 0.3);
    border-radius: 10px;
    font-family: 'MiSansThai-Bold', sans-serif;
    animation: slideInDown 0.3s ease-out;
  }

  @keyframes slideInDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .vip-button-group {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-top: 10px;
  }

  .vip-validate-btn {
    background: rgba(0, 255, 255, 0.1);
    border: 2px solid rgba(0, 255, 255, 0.3);
    color: #00ffff;
    padding: 15px 30px;
    font-size: 1.2rem;
    font-weight: bold;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'MiSansThai-Bold', sans-serif;
  }

  .vip-validate-btn:hover {
    transform: translateY(-3px);
     box-shadow: 0 8px 25px rgba(0, 255, 255, 0.4);
    background: rgba(0, 255, 255, 0.2);
     border-color: rgba(0, 255, 255, 0.5);
   }

   /* VIP Premium Page Styles */
   .vip-premium {
     background: rgba(255, 215, 0, 0.05);
     border: 2px solid rgba(255, 215, 0, 0.2);
    border-radius: 20px;
     padding: 20px;
   }

   .vip-back {
     background: rgba(178, 175, 155, 0.1) !important;
     border: 1px solid rgba(255, 215, 0, 0.3) !important;
     color: #ffd700 !important;
   }

   .vip-back:hover {
     background: rgba(255, 215, 0, 0.2) !important;
   }

   .vip-title {
     color: #ffd700 !important;
     text-shadow: 0 0 10px rgba(255, 215, 0, 0.3) !important;
   }

   .vip-instruction {
     background: rgba(255, 215, 0, 0.1) !important;
     border: 1px solid rgba(255, 215, 0, 0.2) !important;
     color: #ffffff !important;
   }

   .vip-input-style {
     border: 2px solid rgba(255, 215, 0, 0.3) !important;
     background: rgba(255, 215, 0, 0.1) !important;
     color: #ffffff !important;
   }

   .vip-input-style:focus {
     border-color: #ffd700 !important;
     box-shadow: 0 0 20px rgba(255, 215, 0, 0.4) !important;
     background: rgba(255, 215, 0, 0.15) !important;
   }

   .vip-input-style::placeholder {
     color: rgba(255, 215, 0, 0.6) !important;
   }

   .vip-error {
     background: rgba(255, 0, 0, 0.1) !important;
     border: 1px solid rgba(255, 0, 0, 0.3) !important;
   }

   .vip-success {
     background: rgba(0, 255, 0, 0.1) !important;
     border: 1px solid rgba(0, 255, 0, 0.3) !important;
   }

   .vip-btn {
     background: rgba(255, 215, 0, 0.1) !important;
     border: 2px solid rgba(255, 215, 0, 0.3) !important;
     color: #ffd700 !important;
   }

   .vip-btn:hover {
     transform: translateY(-3px) !important;
     box-shadow: 0 8px 25px rgba(255, 215, 0, 0.4) !important;
     background: rgba(255, 215, 0, 0.2) !important;
     border-color: rgba(255, 215, 0, 0.5) !important;
   }

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               /* VIP Popup Styles */
                                                                                                                                                                                                                                                                                                                                                                                                                .vip-popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    pointer-events: auto;
  }

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               .vip-popup {
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 20, 40, 0.95) 100%);
    border: 2px solid #ffd700;
    border-radius: 12px;
    padding: 25px;
    width: 320px;
    max-width: 85%;
    text-align: center;
    position: relative;
    z-index: 100000;
    animation: popupSlideIn 0.3s ease-out;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    margin: 0 auto;
  }

          @keyframes popupSlideIn {
    from {
      opacity: 0;
      transform: scale(0.8) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

       .vip-popup-close-btn {
      position: absolute;
      top: 15px;
      right: 20px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid #ffd700;
     color: #ffd700;
     font-size: 1.5rem;
    cursor: pointer;
      opacity: 0.8;
    transition: all 0.3s ease;
      padding: 8px 12px;
      border-radius: 6px;
      font-family: 'MiSansThai-Bold', sans-serif;
      width: 35px;
      height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

        .vip-popup-close-btn:hover {
       opacity: 1;
       background: rgba(255, 215, 0, 0.1);
       border-color: #ffd700;
      transform: scale(1.1);
    }

          /* VIP Popup Header Styles */
      .vip-popup-header {
        margin-bottom: 25px;
    text-align: center;
      }

     .vip-popup-title {
        color: #ffd700 !important;
        font-size: 2.2rem !important;
        font-family: 'MiSansThai-Bold', sans-serif;
        margin-bottom: 8px !important;
      }

     .vip-popup-subtitle {
       color: #ffffff !important;
       font-size: 1rem !important;
    font-family: 'MiSansThai', sans-serif;
       opacity: 0.9;
    margin: 0;
     }

          /* VIP Popup Content Styles */
      .vip-popup-content {
    display: flex;
    flex-direction: column;
        gap: 20px;
      }

        .vip-popup-input-container {
       margin-bottom: 15px;
     }

                                .vip-popup-input {
         width: 100% !important;
         padding: 12px 16px !important;
         border: 1px solid #ffd700 !important;
         border-radius: 6px !important;
         background: rgba(0, 0, 0, 0.8) !important;
         color: #ffd700 !important;
         font-size: 1.1rem !important;
         font-family: 'MiSansThai-Bold', sans-serif !important;
         text-align: center !important;
         transition: all 0.3s ease !important;
         margin-bottom: 8px !important;
         box-sizing: border-box !important;
         letter-spacing: 1px !important;
       }

    .vip-popup-input:focus {
      border-color: #ffd700 !important;
      background: rgba(0, 0, 0, 0.9) !important;
      outline: none !important;
    }

    .vip-popup-input.error {
      border-color: #ff0000 !important;
    }

    .vip-popup-input.success {
      border-color: #00ff00 !important;
    }

    .vip-popup-error-msg {
      color: #ff0000;
      font-size: 0.9rem;
      margin-top: 8px;
      padding: 8px 12px;
      background: rgba(255, 0, 0, 0.1);
      border: 1px solid rgba(255, 0, 0, 0.3);
    border-radius: 6px;
      font-family: 'MiSansThai-Bold', sans-serif;
      animation: slideInDown 0.3s ease-out;
    }

    .vip-popup-success-msg {
      color: #00ff00;
    font-size: 0.9rem;
      margin-top: 8px;
      padding: 8px 12px;
      background: rgba(0, 255, 0, 0.1);
      border: 1px solid rgba(0, 255, 0, 0.3);
      border-radius: 6px;
      font-family: 'MiSansThai-Bold', sans-serif;
      animation: slideInDown 0.3s ease-out;
    }

                                .vip-popup-check-btn {
         background: rgba(255, 215, 0, 0.1) !important;
         border: 2px solid rgba(255, 215, 0, 0.5) !important;
         color: #ffd700 !important;
         padding: 16px 24px !important;
         font-size: 1.4rem !important;
         font-weight: 600 !important;
         border-radius: 12px !important;
         cursor: pointer !important;
         transition: all 0.3s ease !important;
         font-family: 'MiSansThai-Bold', sans-serif !important;
         width: 100% !important;
         box-sizing: border-box !important;
         display: flex !important;
         align-items: center !important;
         justify-content: center !important;
         gap: 10px !important;
         position: relative !important;
         overflow: hidden !important;
         opacity: 0.9 !important;
       }

       .popup-btn-icon {
         font-size: 1.3rem !important;
       }

       .popup-btn-text {
         font-size: 1.4rem !important;
       }

    .vip-popup-check-btn:hover {
      opacity: 1 !important;
      background: rgba(255, 215, 0, 0.2) !important;
      border-color: rgba(255, 215, 0, 0.8) !important;
  }
</style> 
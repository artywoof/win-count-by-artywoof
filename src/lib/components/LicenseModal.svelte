<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import licenseManager from '$lib/licenseManager';

  export interface PaymentInfo {
    qr_code_url: string;
    qr_code_data: string;
    qr_code_fallbacks: string[];
    amount: number;
    payment_reference: string;
    expires_at: string;
  }

  export let isOpen: boolean = false;
  export let onLicenseValid: () => void = () => {};

  let paymentInfo: PaymentInfo | null = null;
  let isLoading = false;
  let errorMessage = '';
  let successMessage = '';
  let paymentStatus: 'idle' | 'creating' | 'waiting' | 'completed' | 'failed' = 'idle';
  let timeRemaining = 900; // 15 นาที
  let showQRCode = false;
  let showVipModal = false;
  let vipLicenseKey = '';

  let countdownInterval: number | null = null;
  
  // QR Code fallback system
  let qrImageLoaded = false;
  let qrImageError = false;
  let currentQRIndex = 0;
  
  // Input validation state
  let inputError = '';
  let inputSuccess = '';
  let isInputValid = false;

  onMount(() => {
    // ฟัง events จาก license manager
    window.addEventListener('license-activated', handleLicenseActivated);
    window.addEventListener('payment-failed', handlePaymentFailed);
  });

  onDestroy(() => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
    window.removeEventListener('license-activated', handleLicenseActivated);
    window.removeEventListener('payment-failed', handlePaymentFailed);
  });

  async function createPayment() {
    try {
      isLoading = true;
      errorMessage = '';
      paymentStatus = 'creating';
      qrImageLoaded = false;
      qrImageError = false;
      currentQRIndex = 0;
      
      // ดึง Machine ID
      const machineId = await invoke('get_machine_id');
      
      // สร้าง Purchase Request
      const response = await fetch('https://win-count-by-artywoof-miy1mgiyx-artywoofs-projects.vercel.app/api/create-purchase', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          machine_id: machineId,
          customer_email: 'customer@example.com'
        })
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('📡 Response data:', result);
      
      if (result.success) {
        paymentInfo = {
          qr_code_url: result.qr_code_data,
          qr_code_data: result.qr_code_data,
          qr_code_fallbacks: result.qr_code_fallbacks || [],
          amount: result.amount,
          payment_reference: result.payment_ref,
          expires_at: result.expires_at
        };
      
        paymentStatus = 'waiting';
        showQRCode = true;
        
        // เริ่ม countdown
        startCountdown();
        
        console.log('✅ QR Code generated successfully');
      } else {
        throw new Error(result.message || 'Failed to create payment');
      }

    } catch (error: unknown) {
      console.error('❌ Create payment failed:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
        } else if (error.message.includes('HTTP')) {
          errorMessage = 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง';
        } else {
          errorMessage = `เกิดข้อผิดพลาด: ${error.message}`;
        }
      } else {
        errorMessage = 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
      }
      
      paymentStatus = 'failed';
    } finally {
      isLoading = false;
    }
  }

  // ฟังก์ชันเปิด VIP Modal
  function openVipModal() {
    showVipModal = true;
    // Focus ที่ input และเลือกข้อความทั้งหมด
    setTimeout(() => {
      const input = document.querySelector('.vip-input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 100);
  }

  // ฟังก์ชันปิด VIP Modal
  function closeVipModal() {
    showVipModal = false;
    vipLicenseKey = '';
  }

  // ฟังก์ชันแสดงข้อความใน input
  function showInputMessage(message: string, type: 'success' | 'error' = 'error') {
    if (type === 'success') {
      inputSuccess = message;
      inputError = '';
      isInputValid = true;
    } else {
      inputError = message;
      inputSuccess = '';
      isInputValid = false;
    }
    
    // ล้างข้อความหลังจาก 3 วินาที
    setTimeout(() => {
      if (type === 'success') {
        inputSuccess = '';
      } else {
        inputError = '';
      }
    }, 3000);
  }

  // ฟังก์ชันตรวจสอบ VIP License
  async function validateVipLicense() {
    if (!vipLicenseKey.trim()) {
      showInputMessage('กรุณากรอก License Key', 'error');
      return;
    }

    try {
      console.log('🔑 ตรวจสอบ VIP License:', vipLicenseKey);
      
      // ดึง Machine ID
      const machineId = await invoke('get_machine_id');
      
      // ส่ง request ไปยัง API
      const response = await fetch('https://win-count-by-artywoof-miy1mgiyx-artywoofs-projects.vercel.app/api/verify-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          license_key: vipLicenseKey.trim(),
          machine_id: machineId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // บันทึก License Key
        await invoke('save_license_key', { key: vipLicenseKey.trim() });
        
        // แสดงข้อความสำเร็จ
        showInputMessage('🎉 License Key ถูกต้อง! ยินดีต้อนรับสู่ Win Count Pro', 'success');
        
        // ปิด Modal และรีเฟรช
        setTimeout(() => {
          closeVipModal();
          onLicenseValid();
        }, 1500);
        
      } else {
        showInputMessage('❌ License Key ไม่ถูกต้อง: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('❌ License validation failed:', error);
      showInputMessage('License Key ไม่ถูกต้อง โปรดตรวจสอบอีกครั้ง', 'error');
    }
  }

  function startCountdown() {
    timeRemaining = 900; // 15 นาที
    
    countdownInterval = setInterval(() => {
      timeRemaining--;
      
      if (timeRemaining <= 0) {
        if (countdownInterval) {
          clearInterval(countdownInterval);
        }
        paymentStatus = 'failed';
        errorMessage = 'QR Code หมดอายุแล้ว กรุณาสร้างใหม่';
      }
    }, 1000);
  }

  function handleLicenseActivated() {
    paymentStatus = 'completed';
    successMessage = '✅ การชำระเงินสำเร็จ! License ถูกเปิดใช้งานแล้ว';
    
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
    
    // ปิด modal หลังจาก 2 วินาที
    setTimeout(() => {
      onLicenseValid();
    }, 2000);
  }

  function handlePaymentFailed() {
    paymentStatus = 'failed';
    errorMessage = '❌ การชำระเงินล้มเหลวหรือหมดอายุ';
    
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
  }

  function closeModal() {
    // ป้องกันการปิด modal โดยไม่ตั้งใจ
    if (paymentStatus === 'waiting' || paymentStatus === 'creating') {
      return;
    }
    
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
    isOpen = false;
    paymentStatus = 'idle';
    paymentInfo = null;
    errorMessage = '';
    successMessage = '';
    timeRemaining = 900;
    showQRCode = false;
    
    // ไม่เรียก onLicenseValid() เมื่อปิด modal (ให้ผู้ใช้ซื้อ License จริงๆ)
    // onLicenseValid();
  }

  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  function getStatusColor(): string {
    switch (paymentStatus) {
      case 'creating': return 'text-blue-500';
      case 'waiting': return 'text-yellow-500';
      case 'completed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  }

  function getStatusIcon(): string {
    switch (paymentStatus) {
      case 'creating': return '🔄';
      case 'waiting': return '⏳';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '💳';
    }
  }

  // ฟังก์ชันสำหรับ fallback QR Code
  function handleQRImageError() {
    console.log('❌ QR Image failed to load, trying fallback...');
    qrImageError = true;
    
    if (paymentInfo?.qr_code_fallbacks && currentQRIndex < paymentInfo.qr_code_fallbacks.length - 1) {
      currentQRIndex++;
      paymentInfo.qr_code_data = paymentInfo.qr_code_fallbacks[currentQRIndex];
      qrImageError = false;
      console.log(`🔄 Trying fallback QR service ${currentQRIndex + 1}`);
    } else {
      console.log('❌ All QR services failed');
      errorMessage = 'ไม่สามารถโหลด QR Code ได้ กรุณาลองใหม่';
    }
  }

  function handleQRImageLoad() {
    console.log('✅ QR Image loaded successfully');
    qrImageLoaded = true;
    qrImageError = false;
  }
</script>

{#if isOpen}
  <div class="modal-backdrop" on:click={(e) => e.target === e.currentTarget && closeModal()} on:keydown={(e) => e.key === 'Escape' && closeModal()} role="dialog" tabindex="0">
    <div class="modal-overlay" on:click|stopPropagation role="presentation"></div>
    <div class="modal license-modal" on:click|stopPropagation on:mousedown|stopPropagation on:mouseup|stopPropagation role="dialog" aria-labelledby="license-modal-title" tabindex="0" on:focus|preventDefault on:blur|preventDefault>
      <div class="modal-body">
        {#if paymentStatus === 'idle'}
          <!-- หน้าหลัก - เรียบง่าย -->
          <div class="payment-intro">
            <div class="app-title">
              <h2>PRO</h2>
              <p class="tagline">เครื่องมือนับวินสำหรับสตรีมเมอร์ระดับโปร</p>
            </div>
            
                         <div class="price-display">
               <span class="price-amount">฿149</span>
               <span class="price-period">/เดือน</span>
             </div>
            
            <div class="content-with-vip">
              <div class="features-list">
                <h4>✨ ฟีเจอร์ที่ได้รับ:</h4>
                <ul>
                  <li>✅ กดปุ่มคีย์ลัด บวก/ลบ ทีละ 1 และ ทีละ 10</li>
                  <li>✅ พิมพ์ บวก/ลบ/เป้าหมาย</li>
                  <li>✅ สร้างโปรไฟล์บันทึกค่า วิน ของแต่ละเกม</li>
                  <li>✅ ระบบ โดเนท บวก/ลบวิน</li>
                  <li>✅ เลือกธีมได้</li>
                  <li>✅ กล่องข้อความ ชาเลนจ์</li>
                  <li>✅ เปิด/ปิด ไอคอน เป้าหมาย ขอบ กล่อง</li>
                  <li>✅ ตั้งค่า คีย์ลัด</li>
                  <li>✅ ตั้งค่า เสียง</li>
                  <li>✅ อัพเดทอัตโนมัติ</li>
                </ul>
              </div>
            </div>
           
            <div class="button-container">
              <button 
                class="buy-button" 
                on:click={createPayment}
                disabled={isLoading}
              >
                {isLoading ? 'กำลังสร้าง QR Code...' : 'เปย์'}
              </button>
              
              <button 
                class="vip-button-floating" 
                on:click={openVipModal}
              >
                <div class="vip-text-vertical">VIP</div>
              </button>
              
              <!-- Test License Button for Development -->
              <button 
                class="test-license-btn" 
                on:click={() => { 
                  window.dispatchEvent(new CustomEvent('license-activated'));
                }}
                title="สำหรับ Developer เท่านั้น"
              >
                🧪 ทดสอบ License
              </button>
            </div>
          </div>
        {:else if paymentStatus === 'creating'}
          <!-- กำลังสร้าง QR Code -->
          <div class="loading-section">
            <div class="spinner"></div>
            <p>🔄 กำลังสร้าง QR Code...</p>
          </div>
        {:else if paymentStatus === 'waiting' && paymentInfo}
          <!-- แสดง QR Code -->
          <div class="qr-section">
            <div class="qr-container">
              {#if paymentInfo.qr_code_data && !qrImageError}
                <img 
                  src={paymentInfo.qr_code_data} 
                  alt="PromptPay QR Code"
                  class="qr-code {qrImageLoaded ? 'loaded' : 'loading'}"
                  on:load={handleQRImageLoad}
                  on:error={handleQRImageError}
                />
                {#if !qrImageLoaded}
                  <div class="qr-loading-overlay">
                    <div class="spinner-small"></div>
                    <p>กำลังโหลด QR Code...</p>
                  </div>
                {/if}
              {:else if qrImageError}
                <div class="qr-error">
                  <p>❌ ไม่สามารถโหลด QR Code ได้</p>
                  <button class="retry-qr-btn" on:click={() => {
                    currentQRIndex = 0;
                    qrImageError = false;
                    if (paymentInfo?.qr_code_fallbacks?.[0]) {
                      paymentInfo.qr_code_data = paymentInfo.qr_code_fallbacks[0];
                    }
                  }}>
                    🔄 ลองใหม่
                  </button>
                </div>
              {:else}
                <div class="qr-loading">
                  <div class="spinner"></div>
                  <p>กำลังสร้าง QR Code...</p>
                </div>
              {/if}
            </div>
            
            <div class="payment-info">
              <p class="amount">฿149</p>
              <p class="reference">Ref: {paymentInfo.payment_reference}</p>
              <p class="timer {getStatusColor()}">
                {getStatusIcon()} เหลือเวลา: {formatTime(timeRemaining)}
              </p>
            </div>
            
                         <div class="payment-instructions">
               <h4>📱 วิธีชำระเงิน:</h4>
               <ol>
                 <li>เปิด Banking App (เช่น SCB, KBank, BBL)</li>
                 <li>เลือก "สแกน QR Code" หรือ "PromptPay"</li>
                 <li>สแกน QR Code ข้างบน (หากสแกนไม่ได้ ให้ลองขยายหน้าจอหรือนำโทรศัพท์เข้าใกล้)</li>
                 <li>ตรวจสอบข้อมูล: จำนวนเงิน ฿149 และหมายเลขอ้างอิง</li>
                 <li>ยืนยันการชำระเงิน</li>
                 <li>รอสักครู่ License จะเปิดใช้งานอัตโนมัติ</li>
               </ol>
               <div class="qr-tips">
                 <p><strong>💡 เคล็ดลับ:</strong></p>
                 <ul>
                   <li>หากสแกนไม่ได้ ลองขยายหน้าจอหรือปรับความสว่าง</li>
                   <li>QR Code นี้เป็น PromptPay ที่รองรับทุกธนาคาร</li>
                   <li>หากมีปัญหา ให้ลองกดปุ่ม "ลองใหม่" ด้านล่าง</li>
                 </ul>
               </div>
             </div>
          </div>
        {:else if paymentStatus === 'completed'}
          <!-- ชำระเงินสำเร็จ -->
          <div class="success-section">
            <div class="success-icon">✅</div>
            <h3>การชำระเงินสำเร็จ!</h3>
            <p>License ของคุณถูกเปิดใช้งานแล้ว</p>
            <p class="expires-info">
              หมดอายุ: {paymentInfo ? new Date(paymentInfo.expires_at).toLocaleDateString('th-TH') : ''}
            </p>
          </div>
        {:else if paymentStatus === 'failed'}
          <!-- ชำระเงินล้มเหลว -->
          <div class="error-section">
            <div class="error-icon">❌</div>
            <h3>การชำระเงินล้มเหลว</h3>
            <p>{errorMessage}</p>
            <button class="retry-button" on:click={createPayment}>
              🔄 ลองใหม่
            </button>
          </div>
        {/if}
        
        {#if errorMessage}
          <div class="error-message">
            {errorMessage}
          </div>
        {/if}
        
        {#if successMessage}
          <div class="success-message">
            {successMessage}
          </div>
        {/if}
      </div>
      
      <!-- ไม่มีปุ่มปิดเพื่อป้องกันการปิดโดยไม่ตั้งใจ -->
    </div>
  </div>

  <!-- VIP Modal -->
  {#if showVipModal}
    <div class="vip-modal-backdrop" on:click={closeVipModal} on:keydown={(e) => e.key === 'Escape' && closeVipModal()} role="dialog" tabindex="0">
      <div class="vip-modal" on:click|stopPropagation role="dialog">
        <div class="vip-modal-header">
          <h3>🔑 VIP License</h3>
        </div>
        
        <div class="vip-modal-body">
          <p>กรุณากรอก License Key ของคุณ:</p>
          <div class="input-container">
            <input 
              type="text" 
              bind:value={vipLicenseKey}
              placeholder="ใส่ License Key ที่นี่..."
              class="vip-input {inputError ? 'error' : ''} {inputSuccess ? 'success' : ''}"
              on:keydown={(e) => e.key === 'Enter' && validateVipLicense()}
              on:focus={(e) => {
                const target = e.target as HTMLInputElement;
                if (target) target.placeholder = '';
              }}
              on:blur={(e) => {
                const target = e.target as HTMLInputElement;
                if (target) target.placeholder = 'ใส่ License Key ที่นี่...';
              }}
            />
            {#if inputError}
              <div class="input-error">
                ❌ {inputError}
              </div>
            {/if}
            {#if inputSuccess}
              <div class="input-success">
                ✅ {inputSuccess}
              </div>
            {/if}
          </div>
          
          <div class="vip-button-group">
            <button class="vip-validate-btn" on:click={validateVipLicense}>
              ตรวจสอบ
            </button>
            <button class="vip-cancel-btn" on:click={closeVipModal}>
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
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
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 486px;
    height: 786px;
    background: rgba(4, 3, 25, 0.3);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    backdrop-filter: blur(2px);
    pointer-events: auto;
    isolation: isolate;
    outline: none !important;
    border: none !important;
    overflow: visible;
    border-radius: 34px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }

  .modal-overlay {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 496px;
    height: 796px;
    background: transparent;
    z-index: 9998;
    pointer-events: auto;
    overflow: visible;
    border-radius: 12px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }

  .license-modal {
    background: #040319;
    border: 2px solid #00ffff !important;
    border-radius: 12px;
    max-width: 480px;
    width: 92%;
    max-height: 85vh;
    height: auto;
    overflow-y: auto;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10001;
    pointer-events: auto;
    isolation: isolate;
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
    outline: none !important;
    backdrop-filter: none;
    border: 2px solid #00ffff !important;
  }

  .vip-button-small {
    background: linear-gradient(45deg, #ffd700, #ffed4e);
    border: none;
    color: #000000;
    padding: 8px 16px;
    font-size: 0.9rem;
    font-weight: bold;
    border-radius: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'MiSansThai-Bold', 'MiSansThai', sans-serif;
    min-width: 60px;
  }

  .vip-button-small:hover {
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
  }

  .content-with-vip {
    position: relative;
    margin-bottom: 2px;
    width: 100%;
    max-width: 100%;
  }

  .button-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    margin-top: 22px;
    position: relative;
  }

  .vip-button-floating {
    position: absolute;
    top: 50%;
    right: -30px;
    transform: translateY(-34%);
    background: rgba(255, 215, 0, 0.1);
    border: 1px solid rgba(255, 215, 0, 0.3);
    color: #ffd700;
    padding: 20px 0 20px 0;
    overflow: hidden;
    font-weight: bold;
    font-size: 1.4rem;
    border-radius: 12px 0 0 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'MiSansThai-Bold', 'MiSansThai', sans-serif;
    min-width: 55px;
    min-height: 80px;
    box-shadow: -2px 0 8px rgba(255, 215, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding-left: 0;
    align-items: flex-start;
    text-align: left;
    line-height: 1.2;
    z-index: 10004;
    text-shadow: 0 2px 4px rgba(255, 215, 0, 0.3);
  }

  .vip-text-vertical {
    font-size: 2.2rem;
    font-weight: bold;
    color: #ffd700;
    transform: rotate(-90deg);
    white-space: nowrap;
    text-align: left;
    padding-left: 0;
    margin-left: 0;
    text-shadow: 0 2px 4px rgba(255, 215, 0, 0.3);
    position: absolute;
    left: -10px;
  }

  .vip-button-floating:hover {
    transform: translateY(-50%) scale(1.02);
    box-shadow: -4px 0 20px rgba(255, 215, 0, 0.3);
    background: rgba(255, 215, 0, 0.2);
    border-color: rgba(255, 215, 0, 0.5);
    box-shadow: inset 0 0 20px rgba(255, 215, 0, 0.4), -4px 0 20px rgba(255, 215, 0, 0.3);
  }

  .modal-body {
    padding: 20px;
  }

  .payment-intro {
    text-align: center;
  }

  .app-title {
    margin-bottom: 2px;
  }

  .app-title h2 {
    font-size: 4.5rem;
    font-weight: 700;
    color: #00ffff;
    margin: -16px 0 0px 0;
    font-family: 'MiSansThai-Bold', 'MiSansThai', sans-serif;
    text-shadow: 0 2px 4px rgba(0, 255, 255, 0.3);
  }

  .tagline {
    font-size: 1.4rem;
    color: #cccccc;
    margin: 0 0 2px 0;
    font-style: italic;
    font-family: 'MiSansThai', sans-serif;
  }

  .price-display {
    margin-bottom: 5px;
    background: rgba(0, 255, 255, 0.1);
    padding: 12px;
    border-radius: 15px;
    border: 1px solid rgba(0, 255, 255, 0.3);
    width: 60%;
    margin-left: auto;
    margin-right: auto;
  }

  .price-amount {
    font-size: 3rem;
    font-weight: bold;
    color: #00ffff;
    position: relative;
    z-index: 1;
    font-family: 'MiSansThai-Bold', 'MiSansThai', sans-serif;
    text-shadow: 0 2px 4px rgba(0, 255, 255, 0.3);
  }

  .price-period {
    font-size: 1.8rem;
    color: #cccccc;
    position: relative;
    z-index: 1;
    font-family: 'MiSansThai', sans-serif;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .features-list {
    text-align: center;
    margin: -18px 0;
    max-height: 50vh;
    overflow-y: auto;
    width: 100%;
  }

  .features-list h4 {
    color: #00ffff;
    margin-bottom: 10px;
    text-align: center;
    font-size: 1.2rem;
  }

  .features-list ul {
    list-style: none;
    padding: 0;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    max-width: 80%;
  }

  .features-list li {
    color: #ffffff;
    margin: 0;
    font-size: 1rem;
    line-height: 1.2;
    padding: 2px 4px;
    background: transparent;
    border-radius: 0;
    border: none;
    transition: all 0.3s ease;
    text-align: left;
    word-wrap: break-word;
    white-space: normal;
    overflow-wrap: break-word;
    hyphens: auto;
    width: 100%;
  }

  .features-list li:hover {
    background: transparent;
    border-color: transparent;
    transform: none;
  }

  .buy-button {
    background: rgba(0, 255, 255, 0.1);
    border: 1px solid rgba(0, 255, 255, 0.3);
    color: #00ffff;
    padding: 12px 30px;
    font-size: 2.5rem;
    font-weight: bold;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 22px;
    position: relative;
    overflow: hidden;
    font-family: 'MiSansThai-Bold', 'MiSansThai', sans-serif;
    min-width: 150px;
    box-shadow: 0 3px 12px rgba(0, 255, 255, 0.2);
    text-shadow: 0 2px 4px rgba(0, 255, 255, 0.3);
    display: block;
    margin-left: auto;
    margin-right: auto;
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

  .buy-button:hover:not(:disabled) {
    /* ไม่มี hover effect */
  }

  .buy-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .loading-section {
    text-align: center;
    padding: 40px 20px;
  }

  .spinner {
    width: 50px;
    height: 50px;
    border: 5px solid rgba(0, 255, 255, 0.3);
    border-top: 5px solid #00ffff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .qr-section {
    text-align: center;
  }

  .qr-container {
    margin: 20px 0;
    padding: 25px;
    background: linear-gradient(135deg, rgba(0, 255, 255, 0.05) 0%, rgba(0, 255, 255, 0.1) 100%);
    border-radius: 20px;
    display: inline-block;
    border: 2px solid rgba(0, 255, 255, 0.3);
    box-shadow: 0 8px 32px rgba(0, 255, 255, 0.15);
    backdrop-filter: blur(10px);
  }

  .qr-code {
    width: 280px;
    height: 280px;
    border-radius: 8px;
    object-fit: contain;
    transition: opacity 0.3s ease;
    box-shadow: 0 4px 20px rgba(0, 255, 255, 0.2);
  }

  .qr-code.loading {
    opacity: 0.5;
  }

  .qr-code.loaded {
    opacity: 1;
  }

  .qr-loading-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.9) 100%);
    padding: 25px;
    border-radius: 15px;
    text-align: center;
    border: 1px solid rgba(0, 255, 255, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px);
  }

  .spinner-small {
    width: 35px;
    height: 35px;
    border: 3px solid rgba(0, 255, 255, 0.2);
    border-top: 3px solid #00ffff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 12px;
    box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
  }

  .qr-error {
    width: 280px;
    height: 280px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(255, 0, 0, 0.05) 0%, rgba(255, 0, 0, 0.1) 100%);
    border: 2px dashed #ff0000;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 4px 20px rgba(255, 0, 0, 0.2);
  }

  .retry-qr-btn {
    background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
    border: none;
    color: white;
    padding: 10px 20px;
    border-radius: 12px;
    cursor: pointer;
    margin-top: 15px;
    font-weight: bold;
    font-family: 'MiSansThai-Bold', 'MiSansThai', sans-serif;
    box-shadow: 0 4px 16px rgba(255, 107, 107, 0.3);
    transition: all 0.3s ease;
  }

  .retry-qr-btn:hover {
    background: linear-gradient(135deg, #ff5252 0%, #ff6b6b 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
  }

  .qr-loading {
    width: 280px;
    height: 280px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(0, 255, 255, 0.05) 0%, rgba(0, 255, 255, 0.1) 100%);
    border-radius: 8px;
    border: 2px solid rgba(0, 255, 255, 0.3);
    box-shadow: 0 4px 20px rgba(0, 255, 255, 0.2);
  }

  .qr-loading p {
    color: #00ffff;
    margin-top: 10px;
    font-size: 0.9rem;
  }

  .payment-info {
    margin: 5px 0;
    padding: 10px;
    text-align: center;
  }

  .amount {
    font-size: 2rem;
    font-weight: bold;
    color: #00ffff;
    margin: 5px 0;
  }

  .reference {
    font-size: 0.9rem;
    color: #cccccc;
    margin: 3px 0;
  }

  .timer {
    font-size: 1.1rem;
    font-weight: bold;
    margin: 5px 0;
  }

  .payment-instructions {
    text-align: left;
    margin: 15px 0 0 0;
    padding: 20px;
    background: linear-gradient(135deg, rgba(0, 255, 255, 0.08) 0%, rgba(0, 255, 255, 0.12) 100%);
    border-radius: 18px;
    border: 2px solid rgba(0, 255, 255, 0.3);
    box-shadow: 0 6px 24px rgba(0, 255, 255, 0.15);
    backdrop-filter: blur(8px);
  }

  .payment-instructions h4 {
    color: #00ffff;
    margin-bottom: 10px;
  }

  .payment-instructions ol {
    color: #ffffff;
    padding-left: 20px;
  }

     .payment-instructions li {
     margin: 8px 0;
   }
   
       .qr-tips {
      margin-top: 15px;
      padding: 15px;
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(255, 215, 0, 0.12) 100%);
      border: 2px solid rgba(255, 215, 0, 0.3);
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(255, 215, 0, 0.15);
      backdrop-filter: blur(6px);
    }
   
   .qr-tips p {
     color: #ffd700;
     margin: 0 0 8px 0;
     font-weight: bold;
   }
   
   .qr-tips ul {
     margin: 0;
     padding-left: 20px;
   }
   
   .qr-tips li {
     color: #ffffff;
     margin: 4px 0;
     font-size: 0.9rem;
   }

  .success-section, .error-section {
    text-align: center;
    padding: 40px 20px;
  }

  .success-icon, .error-icon {
    font-size: 4rem;
    margin-bottom: 20px;
  }

  .success-section h3 {
    color: #00ff00;
    margin: 10px 0;
  }

  .error-section h3 {
    color: #ff0000;
    margin: 10px 0;
  }

  .expires-info {
    color: #cccccc;
    font-size: 0.9rem;
    margin-top: 10px;
  }

  .retry-button {
    background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
    border: none;
    color: #ffffff;
    padding: 12px 25px;
    font-size: 1rem;
    border-radius: 20px;
    cursor: pointer;
    margin-top: 20px;
    transition: all 0.3s ease;
  }

  .retry-button:hover {
    transform: scale(1.05);
  }

  .error-message {
    background: rgba(255, 0, 0, 0.1);
    border: 1px solid #ff0000;
    color: #ff0000;
    padding: 10px;
    border-radius: 8px;
    margin: 10px 0;
  }

  .success-message {
    background: rgba(0, 255, 0, 0.1);
    border: 1px solid #00ff00;
    color: #00ff00;
    padding: 10px;
    border-radius: 8px;
    margin: 10px 0;
  }

  /* VIP Modal Styles */
  .vip-modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(4, 3, 25, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10001;
    backdrop-filter: blur(5px);
  }

  .vip-modal {
    background: linear-gradient(135deg, #040319 0%, #0a0a2a 100%);
    border: 2px solid #ffd700;
    border-radius: 18px;
    max-width: 450px;
    width: 85%;
    position: relative;
    z-index: 10002;
    box-shadow: 0 20px 60px rgba(255, 215, 0, 0.2);
  }

  .vip-modal-header {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 14px 25px;
    border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  }

  .vip-modal-header h3 {
    margin: 0;
    color: #ffd700;
    font-size: 1.8rem;
    font-family: 'MiSansThai-Bold', 'MiSansThai', sans-serif;
  }

  .vip-modal-body {
    padding: 0px 25px 16px 25px;
  }

  .vip-modal-body p {
    color: #ffffff;
    margin-bottom: 10px;
    font-size: 1.1rem;
    font-family: 'MiSansThai', sans-serif;
  }

  .vip-input {
    width: 90%;
    padding: 15px 22px;
    border: 2px solid rgba(255, 215, 0, 0.3);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    font-size: 1.2rem;
    font-family: 'MiSansThai', sans-serif;
    margin-bottom: 15px;
    margin-left: auto;
    margin-right: auto;
    display: block;
    text-align: center;
    letter-spacing: 1px;
  }

  .vip-input:focus {
    outline: none;
    border-color: #ffd700;
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
  }

  .vip-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  .input-container {
    position: relative;
    margin-bottom: 15px;
  }

  .vip-input.error {
    border-color: #ff0000 !important;
    box-shadow: 0 0 10px rgba(255, 0, 0, 0.3) !important;
  }

  .vip-input.success {
    border-color: #00ff00 !important;
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.3) !important;
  }

  .input-error {
    color: #ff0000;
    font-size: 0.9rem;
    margin-top: 8px;
    padding: 8px 12px;
    background: rgba(255, 0, 0, 0.1);
    border: 1px solid rgba(255, 0, 0, 0.3);
    border-radius: 8px;
    font-family: 'MiSansThai', sans-serif;
    animation: slideInDown 0.3s ease-out;
  }

  .input-success {
    color: #00ff00;
    font-size: 0.9rem;
    margin-top: 8px;
    padding: 8px 12px;
    background: rgba(0, 255, 0, 0.1);
    border: 1px solid rgba(0, 255, 0, 0.3);
    border-radius: 8px;
    font-family: 'MiSansThai', sans-serif;
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
    margin-top: 0px;
  }

  .vip-validate-btn {
    background: rgba(255, 215, 0, 0.1);
    border: 1px solid rgba(255, 215, 0, 0.3);
    color: #ffd700;
    padding: 12px 25px;
    font-size: 1.1rem;
    font-weight: bold;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'MiSansThai-Bold', 'MiSansThai', sans-serif;
  }

  .vip-validate-btn:hover {
    transform: scale(1.02);
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
    background: rgba(255, 215, 0, 0.2);
    border-color: rgba(255, 215, 0, 0.5);
  }

  .vip-cancel-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #ffffff;
    padding: 12px 25px;
    font-size: 1.1rem;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'MiSansThai', sans-serif;
  }

  .vip-cancel-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  /* Test License Button */
  .test-license-btn {
    background: rgba(255, 0, 255, 0.1);
    border: 1px solid rgba(255, 0, 255, 0.3);
    color: #ff00ff;
    padding: 8px 16px;
    font-size: 1rem;
    font-weight: bold;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'MiSansThai-Bold', 'MiSansThai', sans-serif;
    margin-top: 10px;
    position: absolute;
    top: 50%;
    left: -80px;
    transform: translateY(calc(-50% + 8px));
    z-index: 10006;
  }

  .test-license-btn:hover {
    transform: translateY(calc(-50% + 8px)) scale(1.02);
    box-shadow: 0 0 15px rgba(255, 0, 255, 0.3);
    background: rgba(255, 0, 255, 0.2);
    border-color: rgba(255, 0, 255, 0.5);
  }
</style> 
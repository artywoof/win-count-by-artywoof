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

  // Payment Selection state
  let selectedPaymentMethod = 'promptpay'; // default to PromptPay (ฟรี)
  let customerPhone = '';
  let customerEmail = '';
  let isProcessingPayment = false;
  let omisePaymentData: any = null;
  let showPaymentSelection = false; // หน้าต่างเลือกวิธีชำระเงิน
  let showPaymentPage = false; // หน้าชำระเงินแต่ละวิธี
  let currentPaymentStep = 'selection'; // 'selection' หรือ 'payment'
  let showSuccessModal = false; // หน้าต่างแจ้งเตือนสำเร็จ

  // Payment Methods พร้อมโลโก้
  const paymentMethods = [
    {
      id: 'promptpay',
      name: 'PromptPay',
      logo: '/assets/logo/promptpay.png',
      description: 'สแกน QR Code ผ่านแอป Banking ทุกธนาคาร',
      fees: 'ฟรี (0%)',
      processing_time: 'ทันที',
      popular: true
    },
    {
      id: 'truewallet',
      name: 'True Wallet',
      logo: '/assets/logo/truemoneywallet.png',
      description: 'จ่ายผ่าน True Wallet App',
      fees: '1.65%',
      processing_time: 'ทันที',
      popular: true
    }
  ];

  function selectPaymentMethod(methodId: string) {
    selectedPaymentMethod = methodId;
  }

  function goToPaymentPage() {
    currentPaymentStep = 'payment';
    showPaymentPage = true;
  }

  function goBackToSelection() {
    currentPaymentStep = 'selection';
    showPaymentPage = false;
  }

  function getSelectedMethod() {
    return paymentMethods.find(method => method.id === selectedPaymentMethod);
  }

  function calculateFinalAmount() {
    const selectedMethod = getSelectedMethod();
    if (!selectedMethod) return 149;
    
    if (selectedMethod.id === 'promptpay') return 149; // ฟรี
    if (selectedMethod.id === 'truewallet') return Math.ceil(149 * 1.0165); // 1.65%
    
    return 149;
  }

  // New payment functions for PromptPay and True Wallet
  async function createPromptPayPayment() {
    try {
      isProcessingPayment = true;
      
      const payment: any = await invoke('create_promptpay_payment', { 
        amount: 149 
      });
      
      // แสดง QR Code ในแอป
      omisePaymentData = {
        qr_code_data: `data:image/svg+xml;base64,${payment.qr_code_base64}`,
        payment_reference: payment.payment_ref,
        amount: payment.amount,
        phone_number: payment.phone_number
      };
      
      showQRCode = true;
      startCountdown();
      startPromptPayStatusCheck();
      
    } catch (error) {
      console.error('❌ PromptPay payment error:', error);
      errorMessage = 'ไม่สามารถสร้าง QR Code ได้';
    } finally {
      isProcessingPayment = false;
    }
  }

  async function startTrueWalletPayment() {
    isProcessingPayment = true;

    try {
      console.log('💙 Starting True Wallet payment...');
      
      // Call True Wallet API
      const response = await fetch('https://win-count-by-artywoof-miy1mgiyx-artywoofs-projects.vercel.app/api/create-truewallet-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: calculateFinalAmount(),
          customer_phone: customerPhone || '0800000000',
          customer_email: customerEmail || 'customer@example.com'
        })
      });

      if (!response.ok) {
        throw new Error(`True Wallet API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        omisePaymentData = result;
        
        // Open True Wallet App
        if (result.deep_link) {
          window.open(result.deep_link, '_blank');
        }
        
        startCountdown();
        startTrueWalletStatusCheck();
        
      } else {
        throw new Error(result.message || 'True Wallet payment creation failed');
      }

    } catch (error) {
      console.error('❌ True Wallet payment error:', error);
      alert(`เกิดข้อผิดพลาดในการชำระเงิน: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      isProcessingPayment = false;
    }
  }

  // PromptPay Status Check
  async function startPromptPayStatusCheck() {
    if (!omisePaymentData) return;

    const checkStatus = async () => {
      try {
        const status = await invoke('check_payment_status', {
          payment_ref: String(omisePaymentData.payment_reference)
        });

        const result = JSON.parse(status);

        if (result.status === 'completed') {
          console.log('🎉 PromptPay payment successful!');
          
          // Save license key
          if (result.license_key) {
            await invoke('save_license_key', { key: result.license_key });
          }
          
          // Close payment window
          showPaymentPage = false;
          showPaymentSelection = false;
          
          // Show success modal
          showSuccessModal = true;
          
          return true; // Stop checking
        } else if (result.status === 'failed' || result.status === 'expired') {
          console.log('❌ PromptPay payment failed or expired');
          alert('การชำระเงินล้มเหลวหรือหมดอายุ กรุณาลองใหม่อีกครั้ง');
          showQRCode = false;
          return true; // Stop checking
        }

        return false; // Continue checking
      } catch (error) {
        console.error('❌ PromptPay status check error:', error);
        return false; // Continue checking
      }
    };

    // Check every 3 seconds
    const interval = setInterval(async () => {
      const shouldStop = await checkStatus();
      if (shouldStop) {
        clearInterval(interval);
      }
    }, 3000);

    // Stop checking after 15 minutes
    setTimeout(() => {
      clearInterval(interval);
    }, 900000);
  }

  // True Wallet Status Check
  async function startTrueWalletStatusCheck() {
    if (!omisePaymentData) return;

    const checkStatus = async () => {
      try {
        const response = await fetch('https://win-count-by-artywoof-miy1mgiyx-artywoofs-projects.vercel.app/api/check-payment-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            charge_id: omisePaymentData.charge_id,
            payment_reference: omisePaymentData.payment_reference
          })
        });

        const status = await response.json();

        if (status.success && status.payment_status === 'COMPLETED') {
          console.log('🎉 True Wallet payment successful!');
          
          // Save license key
          await invoke('save_license_key', { key: status.license_key });
          
          // Close payment window
          showPaymentPage = false;
          showPaymentSelection = false;
          
          // Show success modal
          showSuccessModal = true;
          
          return true; // Stop checking
        } else if (status.payment_status === 'FAILED') {
          console.log('❌ True Wallet payment failed');
          alert('การชำระเงินล้มเหลว กรุณาลองใหม่อีกครั้ง');
          return true; // Stop checking
        }

        return false; // Continue checking
      } catch (error) {
        console.error('❌ True Wallet status check error:', error);
        return false; // Continue checking
      }
    };

    // Check every 3 seconds
    const interval = setInterval(async () => {
      const shouldStop = await checkStatus();
      if (shouldStop) {
        clearInterval(interval);
      }
    }, 3000);

    // Stop checking after 15 minutes
    setTimeout(() => {
      clearInterval(interval);
    }, 900000);
  }

  // Enhanced startPurchase function สำหรับ Omise
  async function startOmisePurchase() {
    isProcessingPayment = true;

    try {
      const machineId = await invoke('get_machine_id');
      
      console.log(`🔄 Starting Omise ${selectedPaymentMethod} payment...`);
      
      const response = await fetch('https://win-count-by-artywoof-5np9kh6ry-artywoofs-projects.vercel.app/api/create-omise-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machine_id: machineId,
          customer_email: 'customer@example.com',
          payment_method: selectedPaymentMethod
        })
      });

      if (!response.ok) {
        throw new Error(`Omise API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        omisePaymentData = result;
        showQRCode = true;
        
        // Handle different payment methods
        if (selectedPaymentMethod === 'truewallet' && result.deep_link) {
          // เปิด True Wallet App
          window.open(result.deep_link, '_blank');
        } else if (selectedPaymentMethod === 'card' && result.card_form_url) {
          // เปิดหน้าฟอร์มบัตรเครดิต
          window.open(result.card_form_url, '_blank');
        } else if (selectedPaymentMethod === 'rabbit_linepay' && result.linepay_url) {
          // เปิด LINE Pay
          window.open(result.linepay_url, '_blank');
        }
        
        startCountdown();
        startOmisePaymentStatusCheck();
        
      } else {
        throw new Error(result.message || 'Omise payment creation failed');
      }

          } catch (error) {
        console.error('❌ Omise payment error:', error);
        alert(`เกิดข้อผิดพลาดในการชำระเงิน: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
      isProcessingPayment = false;
    }
  }

  // Omise Payment Status Check
  async function startOmisePaymentStatusCheck() {
    if (!omisePaymentData) return;

    const checkStatus = async () => {
      try {
        const response = await fetch('https://win-count-by-artywoof-5np9kh6ry-artywoofs-projects.vercel.app/api/check-payment-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            charge_id: omisePaymentData.charge_id,
            payment_reference: omisePaymentData.payment_reference
          })
        });

        const status = await response.json();

        if (status.success && status.payment_status === 'COMPLETED') {
          console.log('🎉 Omise payment successful!');
          
          // บันทึก License Key
          await invoke('save_license_key', { key: omisePaymentData.license_key });
          
          // ปิดหน้าต่างจ่ายเงินทันที
          showPaymentPage = false;
          showPaymentSelection = false;
          
          // แสดงหน้าต่างแจ้งเตือนสำเร็จ
          showSuccessModal = true;
          
          return true; // Stop checking
        } else if (status.payment_status === 'FAILED') {
          console.log('❌ Omise payment failed');
          alert('การชำระเงินล้มเหลว กรุณาลองใหม่อีกครั้ง');
          showQRCode = false;
          return true; // Stop checking
        }

        return false; // Continue checking
      } catch (error) {
        console.error('❌ Status check error:', error);
        return false; // Continue checking
      }
    };

    // Check every 3 seconds for 15 minutes
    const maxChecks = 300; // 15 minutes * 60 seconds / 3 seconds
    let checkCount = 0;

    const statusInterval = setInterval(async () => {
      checkCount++;
      
      const shouldStop = await checkStatus();
      
      if (shouldStop || checkCount >= maxChecks) {
        clearInterval(statusInterval);
        
        if (checkCount >= maxChecks) {
          console.log('⏰ Payment status check timeout');
          alert('หมดเวลาการตรวจสอบการชำระเงิน กรุณาติดต่อฝ่ายสนับสนุน');
        }
      }
    }, 3000);
  }

  function validateEmail(email: string) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

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
  <div class="modal-backdrop" on:click={(e) => e.preventDefault()} on:keydown={(e) => e.key === 'Escape' && closeModal()} role="dialog" tabindex="0">
    <div class="modal-overlay" on:click|stopPropagation role="presentation"></div>
    <div class="modal license-modal" on:click|stopPropagation on:mousedown|stopPropagation on:mouseup|stopPropagation role="dialog" aria-labelledby="license-modal-title" tabindex="0" on:focus|preventDefault on:blur|preventDefault>
      <div class="modal-body">
        {#if paymentStatus === 'idle'}
          <!-- หน้าหลัก - เรียบง่าย -->
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

            <!-- โปรโมชั่น Banner - Compact -->
            <div class="promotion-banner-compact">
              <div class="promo-content">
                <span class="promo-title">โปรโมชั่นพิเศษ!</span>
                <span class="promo-savings">ประหยัด ฿50</span>
                <div class="timer-compact">⏰ หมดเขต: 6 ส.ค. 68</div>
              </div>
            </div>
            
            <div class="discord-info">
              <div class="discord-text">
                <p>ดูรายละเอียดฟีเจอร์ทั้งหมดได้ที่ Discord</p>
              </div>
              <div class="discord-icon">
                <a href="https://discord.gg/eQT7DyxAG6" target="_blank" rel="noopener noreferrer">
                  <img src="/assets/logo/Discord-Logo-Blurple.svg" alt="Discord" />
                </a>
              </div>
            </div>
            

           
            <div class="button-container">
              <button 
                class="buy-button" 
                on:click={() => showPaymentSelection = true}
              >
                เปย์
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

  <!-- Payment Selection Modal -->
  {#if showPaymentSelection}
    <div class="payment-modal-backdrop" on:click={() => showPaymentSelection = false} on:keydown={(e) => e.key === 'Escape' && (showPaymentSelection = false)} role="dialog" tabindex="0">
      <div class="payment-modal" on:click|stopPropagation role="dialog">
        <div class="payment-modal-header">
        </div>
        
        <div class="payment-modal-body">
          <div class="payment-methods-grid">
            {#each paymentMethods as method}
              <button 
                class="payment-method-btn {selectedPaymentMethod === method.id ? 'selected' : ''}"
                on:click={() => selectPaymentMethod(method.id)}
              >
                <div class="method-logo">
                  <img 
                    src={method.logo} 
                    alt="{method.name}" 
                    class="method-logo-img {method.id}-logo"
                    style={method.id === 'promptpay' ? 'width: 320px !important; height: 320px !important; max-width: 320px !important; max-height: 320px !important;' : (method.id === 'truewallet' ? 'width: 200px !important; height: 200px !important; max-width: 200px !important; max-height: 200px !important;' : '')}
                    on:load={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (img) {
                        if (method.id === 'promptpay') {
                          img.style.width = '320px';
                          img.style.height = '320px';
                          img.style.maxWidth = '320px';
                          img.style.maxHeight = '320px';
                        } else if (method.id === 'truewallet') {
                          img.style.width = '200px';
                          img.style.height = '200px';
                          img.style.maxWidth = '200px';
                          img.style.maxHeight = '200px';
                        } else {
                          // ล้าง style สำหรับ PromptPay
                          img.style.width = '';
                          img.style.height = '';
                          img.style.maxWidth = '';
                          img.style.maxHeight = '';
                        }
                      }
                    }}
                  />
                </div>
                {#if selectedPaymentMethod === method.id}
                  <div class="selected-indicator">✓</div>
                {/if}
              </button>
            {/each}
          </div>
          
          <div class="payment-action-buttons">
            <button 
              class="confirm-payment-btn" 
              on:click={goToPaymentPage}
            >
              ยืนยัน
            </button>
            
            <button 
              class="cancel-payment-btn" 
              on:click={() => showPaymentSelection = false}
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Page Modal -->
    {#if showPaymentPage}
      <div class="payment-page-backdrop" on:click={(e) => e.preventDefault()} role="dialog" tabindex="0">
        <div class="payment-page-modal" on:click|stopPropagation role="dialog" style="border: 4px solid #00ffff !important; border-width: 4px !important;">
          <div class="payment-page-header">
          </div>
          
          <div class="payment-page-body">
            {#if selectedPaymentMethod === 'promptpay'}
              <!-- PromptPay Payment Page -->
              <div class="promptpay-section">
                <div class="qr-section">
                  <h3>📱 PromptPay QR Code</h3>
                  <div class="qr-container">
                    {#if isProcessingPayment}
                      <div class="qr-loading">
                        <div class="spinner"></div>
                        <p>กำลังสร้าง QR Code...</p>
                      </div>
                    {:else if omisePaymentData?.qr_code_data}
                      <!-- แสดง QR Code -->
                      <div class="qr-container">
                        <img 
                          src={omisePaymentData.qr_code_data} 
                          alt="PromptPay QR Code"
                          class="qr-image"
                        />
                        <p>สแกนด้วยแอป Banking</p>
                        <p>฿149 → 090-978-3454</p>
                      </div>
                    {:else}
                      <div class="qr-placeholder">
                        <p>กดปุ่ม "เปย์" เพื่อสร้าง QR Code</p>
                      </div>
                    {/if}
                  </div>
                  <div class="qr-info">
                    <p class="qr-amount">฿{calculateFinalAmount()}</p>
                    <p class="qr-instruction">สแกน QR Code ผ่านแอป Banking ทุกธนาคาร</p>
                  </div>
                </div>
              </div>
            {:else if selectedPaymentMethod === 'truewallet'}
              <!-- True Wallet Payment Page -->
              <div class="truewallet-section">
                <div class="truewallet-display">
                  <h3>💙 True Wallet</h3>
                  <div class="truewallet-container">
                    <div class="truewallet-icon">💙</div>
                    <div class="truewallet-info">
                      <p class="truewallet-amount">฿{calculateFinalAmount()}</p>
                      <p class="truewallet-instruction">จ่ายผ่าน True Wallet App</p>
                    </div>
                  </div>
                </div>
              </div>
            {/if}
            
            <div class="payment-action-buttons">
              <button 
                class="confirm-payment-btn {isProcessingPayment ? 'processing' : ''}" 
                on:click={() => {
                  if (selectedPaymentMethod === 'promptpay') {
                    createPromptPayPayment();
                  } else if (selectedPaymentMethod === 'truewallet') {
                    startTrueWalletPayment();
                  } else {
                    startOmisePurchase();
                  }
                }}
                disabled={isProcessingPayment}
              >
                {#if isProcessingPayment}
                  <div class="spinner-small"></div>
                  กำลังสร้างการชำระเงิน...
                {:else}
                  เปย์
                {/if}
              </button>
              
              <button 
                class="cancel-payment-btn" 
                on:click={() => showPaymentPage = false}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}
  {/if}

  <!-- Success Modal -->
  {#if showSuccessModal}
    <div class="success-modal-backdrop" on:click={() => showSuccessModal = false} on:keydown={(e) => e.key === 'Escape' && (showSuccessModal = false)} role="dialog" tabindex="0">
      <div class="success-modal" on:click|stopPropagation role="dialog">
        <div class="success-modal-content">
          <div class="success-icon">🎉</div>
          <h3>การชำระเงินสำเร็จ!</h3>
          <p>ยินดีต้อนรับสู่ Win Count Pro</p>
          <p class="success-details">License ของคุณถูกเปิดใช้งานแล้ว</p>
          <button 
            class="success-close-btn" 
            on:click={() => {
              showSuccessModal = false;
              closeModal();
              onLicenseValid();
            }}
          >
            ตกลง
          </button>
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
    border-radius: 24px;
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
    margin-bottom: 0px;
    width: 100%;
    max-width: 100%;
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

  .features-list {
    text-align: center;
    margin: 2px 0;
    width: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .features-list h4 {
    color: #00ffff;
    margin-bottom: 4px;
    text-align: center;
    font-size: 1.1rem;
    font-weight: 600;
  }

  /* Discord Info */
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

  .discord-text h4 {
    margin: 0 0 5px 0;
    color: #7289da;
    font-size: 1.1rem;
    font-weight: bold;
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

  .discord-icon a {
    display: block;
  }



  .discord-icon img {
    width: 300px;
    height: 60px;
    transition: all 0.3s ease;
  }

  .discord-icon a:hover img {
    transform: scale(1.1);
    filter: brightness(1.2);
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
  }

  .qr-code {
    width: 280px;
    height: 280px;
    border-radius: 25px;
    object-fit: contain;
    transition: opacity 0.3s ease;
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
    border-radius: 15px;
    text-align: center;
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
    border-radius: 15px;
    border: 2px solid rgba(0, 255, 255, 0.3);
  }

  .qr-code-image {
    width: 320px;
    height: 320px;
    max-width: 320px;
    max-height: 320px;
    border-radius: 15px;
    object-fit: contain;
    transition: all 0.3s ease;
    box-shadow: 0 8px 32px rgba(0, 255, 255, 0.2);
  }

  .qr-placeholder {
    width: 280px;
    height: 280px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(0, 255, 255, 0.05) 0%, rgba(0, 255, 255, 0.1) 100%);
    border-radius: 15px;
    border: 2px dashed rgba(0, 255, 255, 0.3);
    color: rgba(0, 255, 255, 0.7);
    font-family: 'MiSansThai', sans-serif;
    font-size: 14px;
    text-align: center;
  }

  .qr-image {
    width: 320px;
    height: 320px;
    max-width: 320px;
    max-height: 320px;
    border-radius: 15px;
    object-fit: contain;
    transition: all 0.3s ease;
    box-shadow: 0 8px 32px rgba(0, 255, 255, 0.2);
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
    backdrop-filter: blur(0px);
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
    z-index: 10005;

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

  /* Payment Method Selection Styles */
  .payment-method-section {
    margin: 20px 0;
  }

  .payment-methods-grid {
    display: grid;
    gap: 12px;
    margin-top: 12px;
  }

  .payment-method-btn {
    display: flex;
    align-items: center;
    padding: 16px;
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  }

  .payment-method-btn:hover {
    border-color: #00e5ff;
    background: #f0fcff;
  }

  .payment-method-btn.selected {
    border-color: #00e5ff;
    background: linear-gradient(135deg, #f0fcff 0%, #e0f7ff 100%);
    box-shadow: 0 4px 12px rgba(0, 229, 255, 0.2);
  }

  .method-icon {
    font-size: 32px;
    margin-right: 16px;
  }

  .method-info {
    flex: 1;
    text-align: left;
  }

  .method-name {
    font-weight: bold;
    font-size: 16px;
    color: #333;
  }

  .method-desc {
    font-size: 14px;
    color: #666;
    margin: 4px 0;
  }

  .method-fees {
    font-size: 12px;
    color: #00a86b;
    font-weight: 500;
  }

  .selected-indicator {
    color: #00e5ff;
    font-size: 20px;
    font-weight: bold;
  }

  .customer-info-section {
    margin: 20px 0;
  }

  .phone-input-group {
    margin-top: 16px;
  }

  .customer-phone-input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 16px;
    transition: border-color 0.2s ease;
  }

  .customer-phone-input:focus {
    outline: none;
    border-color: #00e5ff;
  }

  .customer-email-input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 16px;
    transition: border-color 0.2s ease;
  }

  .customer-email-input:focus {
    outline: none;
    border-color: #00e5ff;
  }

  /* Omise Payment Selection Styles */
  .omise-payment-section {
    margin: 20px 0;
  }

  .payment-label {
    display: block;
    font-size: 16px;
    font-weight: 600;
    color: #00e5ff;
    margin-bottom: 16px;
  }

  .omise-methods-grid {
    display: grid;
    gap: 12px;
    margin-bottom: 20px;
  }

  .omise-method-btn {
    display: flex;
    flex-direction: column;
    padding: 16px;
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    text-align: left;
  }

  .omise-method-btn:hover {
    border-color: #00e5ff;
    background: #f0fcff;
  }

  .omise-method-btn.selected {
    border-color: #00e5ff;
    background: linear-gradient(135deg, #f0fcff 0%, #e0f7ff 100%);
    box-shadow: 0 4px 12px rgba(0, 229, 255, 0.2);
  }

  .method-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }

  .method-icon {
    font-size: 24px;
  }

  .method-name {
    font-weight: bold;
    font-size: 16px;
    color: #333;
    flex: 1;
  }

  .popular-badge {
    background: linear-gradient(135deg, #ff6b6b, #ff8e53);
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
  }

  .method-details {
    margin-left: 36px;
  }

  .method-desc {
    font-size: 14px;
    color: #666;
    margin-bottom: 4px;
  }

  .method-fees {
    font-size: 13px;
    color: #00a86b;
    font-weight: 500;
  }

  .selected-indicator {
    position: absolute;
    top: 16px;
    right: 16px;
    color: #00e5ff;
    font-size: 20px;
    font-weight: bold;
  }

  .price-breakdown {
    background: rgba(0, 229, 255, 0.1);
    padding: 12px;
    border-radius: 8px;
    border: 1px solid rgba(0, 229, 255, 0.3);
    margin-bottom: 20px;
  }

  .base-price, .fee-price {
    font-size: 14px;
    color: #666;
    margin: 2px 0;
  }

  .total-price {
    font-size: 16px;
    color: #00e5ff;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(0, 229, 255, 0.2);
  }

  .free-notice {
    background: linear-gradient(135deg, #00e5ff, #0099cc);
    color: white;
    padding: 12px;
    border-radius: 8px;
    text-align: center;
    margin-bottom: 20px;
    font-size: 14px;
  }

  .omise-purchase-btn {
    width: 100%;
    background: linear-gradient(135deg, #00e5ff 0%, #0099cc 100%);
    color: #000;
    border: none;
    border-radius: 16px;
    padding: 20px;
    font-size: 18px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .omise-purchase-btn:hover:not(.processing) {
    background: linear-gradient(135deg, #00ccff 0%, #0088bb 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 229, 255, 0.4);
  }

  .omise-purchase-btn.processing {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .spinner-small {
    width: 20px;
    height: 20px;
    border: 2px solid transparent;
    border-top: 2px solid #00e5ff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Payment Selection Modal Styles */
  .payment-modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10005;
    padding: 20px;
    border-radius: 24px;
    margin: 10px;
    pointer-events: all;
  }

  .payment-modal {
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
    z-index: 10004;
    pointer-events: auto;
    isolation: isolate;
    outline: none !important;
    backdrop-filter: none;
  }

  /* Responsive Design */
  @media (max-width: 480px) {
    .payment-modal {
      width: 95vw !important;
      height: 90vh !important;
      border-radius: 25px;
    }
    
    .payment-method-btn {
      max-width: 280px;
      padding: 15px;
    }
    
    .method-logo {
      width: 100px;
      height: 75px;
    }
    
    .truewallet-logo {
      width: 150px !important;
      height: 150px !important;
      max-width: 150px !important;
      max-height: 150px !important;
    }
    
    .promptpay-logo {
      width: auto !important;
      height: auto !important;
      max-width: 240% !important;
      max-height: 240% !important;
    }
  }

  @media (max-width: 360px) {
    .payment-modal {
      width: 98vw !important;
      height: 95vh !important;
      border-radius: 20px;
    }
    
    .payment-method-btn {
      max-width: 250px;
      padding: 25px;
    }
    
    .method-logo {
      width: 80px;
      height: 0px;
    }
    
    .truewallet-logo {
      width: 120px !important;
      height: 120px !important;
      max-width: 120px !important;
      max-height: 120px !important;
    }
    
    .promptpay-logo {
      width: 150px !important;
      height: 150px !important;
      max-width: 150px !important;
      max-height: 150px !important;
    }
  }

  .payment-modal-header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 20px 25px;
  }



  .payment-modal-body {
    padding: 15px 20px;
    height: calc(100% - 80px);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .payment-methods-grid {
    display: flex;
    flex-direction: column;
    gap: 25px;
    margin-bottom: 30px;
    flex: 1;
    align-items: center;
    justify-content: flex-start;
    padding-top: 20px;
  }

  .payment-method-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px;
    border: 3px solid rgba(0, 255, 255, 0.3);
    border-radius: 25px;
    background: rgba(0, 255, 255, 0.05);
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    width: 100%;
    max-width: 350px;
    min-height: 200px;
  }

  .payment-method-btn:hover {
    border-color: #00ffff;
    background: rgba(0, 255, 255, 0.1);
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 255, 255, 0.2);
  }

  .payment-method-btn.selected {
    border-color: #00ffff;
    background: linear-gradient(135deg, rgba(0, 255, 255, 0.15) 0%, rgba(0, 255, 255, 0.25) 100%);
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
  }

  .method-logo {
    width: 120px;
    height: 90px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0;
  }

  .method-logo img {
    max-width: 300%;
    max-height: 300%;
    object-fit: contain;
  }

  /* ปรับขนาดเฉพาะ True Wallet */
  .truewallet-logo {
    width: 200px !important;
    height: 200px !important;
    max-width: 200px !important;
    max-height: 200px !important;
  }

  /* กำหนดขนาดสำหรับ PromptPay */
  .promptpay-logo {
    width: 320px !important;
    height: 320px !important;
    max-width: 320px !important;
    max-height: 320px !important;
  }

  .selected-indicator {
    position: absolute;
    top: 20px;
    right: 20px;
    color: #00ffff;
    font-size: 24px;
    font-weight: bold;
    background: rgba(0, 255, 255, 0.2);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .price-breakdown {
    background: rgba(0, 255, 255, 0.1);
    padding: 12px;
    border-radius: 12px;
    border: 1px solid rgba(0, 255, 255, 0.3);
    margin-bottom: 15px;
  }

  .base-price, .fee-price {
    font-size: 14px;
    color: #cccccc;
    margin: 3px 0;
  }

  .total-price {
    font-size: 18px;
    color: #00ffff;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid rgba(0, 255, 255, 0.2);
    font-weight: bold;
  }

  .free-notice {
    background: linear-gradient(135deg, #00ffff, #0099cc);
    color: #000000;
    padding: 12px;
    border-radius: 12px;
    text-align: center;
    margin-bottom: 15px;
    font-size: 16px;
    font-weight: bold;
  }

  .email-input-group {
    margin-bottom: 15px;
  }

  .email-input-group label {
    display: block;
    color: #ffffff;
    margin-bottom: 8px;
    font-weight: bold;
  }

  .customer-email-input {
    width: 100%;
    padding: 15px;
    border: 2px solid rgba(0, 255, 255, 0.3);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    font-size: 16px;
    font-family: 'MiSansThai', sans-serif;
  }

  .customer-email-input:focus {
    outline: none;
    border-color: #00ffff;
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
  }

  .customer-email-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  .payment-action-buttons {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 10px;
    position: relative;
    background: transparent;
    padding: 10px 0;
  }

  .confirm-payment-btn {
    flex: 1;
    background: rgba(0, 255, 255, 0.1);
    border: 1px solid rgba(0, 255, 255, 0.3);
    color: #00ffff;
    padding: 12px 25px;
    font-size: 1.8rem;
    font-weight: bold;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'MiSansThai-Bold', 'MiSansThai', sans-serif;
    position: relative;
    overflow: hidden;
    min-width: 120px;
  }

  .confirm-payment-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s;
  }

  .confirm-payment-btn:hover::before {
    left: 100%;
  }

  .confirm-payment-btn:hover {
    background: rgba(0, 255, 255, 0.2);
    border-color: rgba(0, 255, 255, 0.6);
    transform: translateY(-2px);
    box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
  }

  .confirm-payment-btn.processing {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .cancel-payment-btn {
    flex: 1;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #ffffff;
    padding: 15px 25px;
    font-size: 1.2rem;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'MiSansThai', sans-serif;
  }

  .cancel-payment-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.6);
    transform: translateY(-2px);
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
  }

  /* Success Modal Styles */
  .success-modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10010;
    backdrop-filter: blur(10px);
  }

  .success-modal {
    background: #040319;
    border: 3px solid #00ff00;
    border-radius: 25px;
    width: 400px;
    max-width: 90vw;
    position: relative;
    z-index: 10011;
    box-shadow: 0 0 30px rgba(0, 255, 0, 0.3);
    animation: successModalIn 0.5s ease-out;
  }

  @keyframes successModalIn {
    from {
      opacity: 0;
      transform: scale(0.8) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .success-modal-content {
    padding: 40px 30px;
    text-align: center;
  }

  .success-icon {
    font-size: 4rem;
    margin-bottom: 20px;
    animation: successBounce 1s ease-in-out;
  }

  @keyframes successBounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-10px);
    }
    60% {
      transform: translateY(-5px);
    }
  }

  .success-modal-content h3 {
    color: #00ff00;
    font-size: 1.8rem;
    font-weight: bold;
    margin-bottom: 15px;
    font-family: 'MiSansThai-Bold', 'MiSansThai', sans-serif;
  }

  .success-modal-content p {
    color: #ffffff;
    font-size: 1.1rem;
    margin-bottom: 10px;
    font-family: 'MiSansThai', sans-serif;
  }

  .success-details {
    color: #cccccc;
    font-size: 1rem;
    margin-bottom: 25px;
  }

  .success-close-btn {
    background: rgba(0, 255, 0, 0.1);
    border: 2px solid rgba(0, 255, 0, 0.3);
    color: #00ff00;
    padding: 15px 30px;
    font-size: 1.2rem;
    font-weight: bold;
    border-radius: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'MiSansThai-Bold', 'MiSansThai', sans-serif;
  }

  .success-close-btn:hover {
    background: rgba(0, 255, 0, 0.2);
    border-color: rgba(0, 255, 0, 0.6);
    transform: translateY(-2px);
    box-shadow: 0 0 20px rgba(0, 255, 0, 0.4);
  }

  /* QR Code Section Styles */
  .qr-section {
    text-align: center;
    padding: 0px;
  }

  .qr-section h3 {
    color: #00ffff;
    font-size: 1.8rem;
    margin-bottom: 10px;
    font-family: 'MiSansThai-Bold', 'MiSansThai', sans-serif;
  }

  .qr-container {
    width: 250px;
    height: 250px;
    margin: 0 auto 10px;
    background: linear-gradient(135deg, rgba(0, 255, 255, 0.05) 0%, rgba(0, 255, 255, 0.1) 100%);
    border: 2px solid rgba(0, 255, 255, 0.3);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .qr-info {
    text-align: center;
  }

  .qr-amount {
    font-size: 2rem;
    font-weight: bold;
    color: #00ffff;
    margin-bottom: 10px;
    font-family: 'MiSansThai-Bold', 'MiSansThai', sans-serif;
  }

  .qr-instruction {
    color: #cccccc;
    font-size: 1.1rem;
    font-family: 'MiSansThai', sans-serif;
  }

  /* True Wallet Section Styles */
  .truewallet-display {
    text-align: center;
    padding: 60px;
  }

  .truewallet-display h3 {
    color: #ff6b6b;
    font-size: 1.8rem;
    margin-bottom: 0px;
    font-family: 'MiSansThai-Bold', 'MiSansThai', sans-serif;
  }

  .truewallet-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0px;
  }

  .truewallet-icon {
    font-size: 4rem;
    margin-bottom: 10px;
  }

  .truewallet-info {
    text-align: center;
  }

  .truewallet-amount {
    font-size: 2rem;
    font-weight: bold;
    color: #ff6b6b;
    margin-bottom: 10px;
    font-family: 'MiSansThai-Bold', 'MiSansThai', sans-serif;
  }

  .truewallet-instruction {
    color: #cccccc;
    font-size: 1.1rem;
    font-family: 'MiSansThai', sans-serif;
  }



  /* Pay Button Styles */
  .pay-button {
    background: linear-gradient(135deg, #00ffff 0%, #0099cc 100%);
    color: #000000;
    border: none;
    border-radius: 15px;
    padding: 18px 30px;
    font-size: 18px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'MiSansThai-Bold', 'MiSansThai', sans-serif;
  }

  .pay-button:hover {
    background: linear-gradient(135deg, #00ccff 0%, #0088bb 100%);
    transform: translateY(-2px);
  }

  /* Payment Page Modal Styles */
  .payment-page-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10007;
    padding: 20px;
    border-radius: 24px;
    margin: 10px;
    pointer-events: all;
  }

  .payment-page-modal {
    background: #040319;
    border: 4px solid #00ffff !important;
    border-radius: 35px;
    width: 440px;
    height: 740px;
    overflow-y: auto;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10008;
  }

  /* Override any other CSS */
  div[class*="payment-page-modal"] {
    border: 4px solid #00ffff !important;
  }

  .payment-page-header {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 15px 25px;
    padding-bottom: 10px;
  }

  .cancel-payment-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #ffffff;
    padding: 12px 25px;
    font-size: 1.8rem;
    font-weight: bold;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'MiSansThai-Bold', 'MiSansThai', sans-serif;
    min-width: 120px;
  }

  .cancel-payment-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
  }

  .back-btn:hover {
    background: rgba(0, 255, 255, 0.1);
    transform: scale(1.1);
  }

  .payment-page-header h3 {
    margin: 0;
    color: #00ffff;
    font-size: 2rem;
    font-family: 'MiSansThai-Bold', 'MiSansThai', sans-serif;
  }

  .amount-display {
    font-size: 1.8rem;
    font-weight: bold;
    color: #00ffff;
    font-family: 'MiSansThai-Bold', 'MiSansThai', sans-serif;
  }

  .payment-page-body {
    padding: 20px 25px;
    height: calc(100% - 50px);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 15px;
    justify-content: center;
    align-items: center;
    padding-top: 0;
  }

  /* โปรโมชั่น Banner - Compact */
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

  /* โปรโมชั่น Banner หลัก */
  .promotion-banner {
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 140, 0, 0.15) 100%);
    border: 2px solid rgba(255, 215, 0, 0.4);
    border-radius: 12px;
    padding: 15px;
    margin: 10px 0;
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

  .promo-icon {
    font-size: 2rem;
    margin-bottom: 4px;
  }

  .promo-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 8px;
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

  .promo-price {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 8px 0;
  }

  .old-price {
    font-size: 16px;
    color: #cccccc;
    text-decoration: line-through;
    opacity: 0.8;
  }

  .new-price {
    font-size: 20px;
    font-weight: bold;
    color: #ffd700;
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



  .promotion-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
  }

  .promotion-icon {
    font-size: 1.2rem;
  }

  .promotion-title {
    color: #ffd700;
    font-size: 32px;
    font-weight: bold;
    font-family: 'MiSansThai-Bold', 'MiSansThai', sans-serif;
    letter-spacing: 1px;
  }

  .promotion-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
  }

  .price-comparison {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .original-price {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .promotion-price {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .price-label {
    color: #ffffff;
    font-size: 20px;
    opacity: 0.9;
  }

  .price-value {
    font-weight: bold;
    font-size: 24px;
    font-family: 'MiSansThai-Bold', 'MiSansThai', sans-serif;
  }

  .original-price .price-value {
    color: #ffffff;
    text-decoration: line-through;
    opacity: 0.7;
  }

  .promotion-price .price-value {
    color: #ffd700;
    font-size: 38px;
  }

  .discount-badge {
    background: #ffd700;
    color: #000000;
    padding: 3px 6px;
    border-radius: 6px;
    font-size: 20px;
    font-weight: bold;
    font-family: 'MiSansThai-Bold', 'MiSansThai', sans-serif;
  }

  .promotion-timer {
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(255, 255, 255, 0.2);
    padding: 4px 8px;
    border-radius: 8px;
  }

  .timer-icon {
    font-size: 0.9rem;
  }

  .timer-text {
    color: #ffffff;
    font-size: 20px;
    font-weight: bold;
  }

  .payment-info {
    text-align: center;
    margin-bottom: 15px;
  }

  .payment-info h4 {
    color: #00ffff;
    font-size: 1.5rem;
    margin-bottom: 10px;
  }

  .payment-info p {
    color: #cccccc;
    font-size: 1.1rem;
    margin-bottom: 20px;
  }

  .qr-placeholder, .app-placeholder, .card-placeholder {
    width: 200px;
    height: 200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(0, 255, 255, 0.05) 0%, rgba(0, 255, 255, 0.1) 100%);
    border: 2px solid rgba(0, 255, 255, 0.3);
    border-radius: 15px;
  }

  .qr-loading {
    text-align: center;
  }

  .qr-loading p {
    color: #00ffff;
    margin-top: 15px;
  }

  .app-icon, .card-icon {
    font-size: 60px;
    margin-bottom: 15px;
  }

  .payment-instructions {
    background: rgba(0, 255, 255, 0.05);
    padding: 12px;
    border-radius: 15px;
    border: 1px solid rgba(0, 255, 255, 0.3);
    margin-bottom: 15px;
    flex: 1;
  }

  .payment-instructions h4 {
    color: #00ffff;
    margin-bottom: 8px;
    font-size: 1.1rem;
  }

  .payment-instructions ol {
    color: #ffffff;
    padding-left: 20px;
  }

  .payment-instructions li {
    margin: 4px 0;
    line-height: 1.2;
    font-size: 0.9rem;
  }

  .next-payment-btn {
    width: 100%;
    background: linear-gradient(135deg, #00ffff 0%, #0099cc 100%);
    color: #000000;
    border: none;
    border-radius: 15px;
    padding: 18px;
    font-size: 18px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-family: 'MiSansThai-Bold', 'MiSansThai', sans-serif;
  }

  .next-payment-btn:hover {
    background: linear-gradient(135deg, #00ccff 0%, #0088bb 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 255, 255, 0.4);
  }
</style> 
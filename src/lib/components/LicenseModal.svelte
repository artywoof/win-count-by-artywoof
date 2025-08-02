<!-- src/lib/components/LicenseModal.svelte -->
<script>
  import { invoke } from '@tauri-apps/api/core';
  import { onMount } from 'svelte';
  
  export let isOpen = true;
  export let onLicenseValid = () => {};
  
  let licenseKey = '';
  let machineId = '';
  let isActivating = false;
  let errorMessage = '';
  let step = 'input'; // 'input', 'activating', 'success', 'error'
  
  onMount(async () => {
    try {
      machineId = await invoke('get_machine_id_command');
    } catch (error) {
      console.error('Failed to get machine ID:', error);
    }
  });
  
  async function activateLicense() {
    if (!licenseKey.trim()) {
      errorMessage = 'กรุณาใส่ License Key';
      return;
    }
    
    isActivating = true;
    errorMessage = '';
    step = 'activating';
    
    try {
      const result = await invoke('activate_license_command', { 
        licenseKey: licenseKey.trim() 
      });
      
      step = 'success';
      setTimeout(() => {
        isOpen = false;
        onLicenseValid();
      }, 2000);
      
    } catch (error) {
      step = 'error';
      errorMessage = error;
      isActivating = false;
    }
  }
  
  function handleKeyPress(event) {
    if (event.key === 'Enter') {
      activateLicense();
    }
  }
</script>

{#if isOpen}
  <div class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h2>🔑 เปิดใช้งาน Win Count Pro</h2>
      </div>
      
      <div class="modal-body">
        {#if step === 'input'}
          <div class="license-form">
            <p class="description">
              ใส่ License Key เพื่อเปิดใช้งาน Win Count Pro
            </p>
            
            <div class="form-group">
              <label>License Key:</label>
              <input 
                type="text" 
                bind:value={licenseKey}
                placeholder="WC-2025-XXXXX-XXXX"
                on:keypress={handleKeyPress}
                disabled={isActivating}
              />
            </div>
            
            <div class="form-group">
              <label>Machine ID:</label>
              <input 
                type="text" 
                value={machineId}
                readonly 
                class="readonly"
              />
              <p class="hint">Machine ID ใช้สำหรับผูก License กับเครื่องนี้</p>
            </div>
            
            {#if errorMessage}
              <div class="error-message">
                ❌ {errorMessage}
              </div>
            {/if}
            
            <button 
              class="activate-btn"
              on:click={activateLicense}
              disabled={isActivating}
            >
              {isActivating ? '⏳ กำลังเปิดใช้งาน...' : '🚀 เปิดใช้งาน'}
            </button>
          </div>
          
        {:else if step === 'activating'}
          <div class="loading-state">
            <div class="spinner"></div>
            <h3>⏳ กำลังตรวจสอบ License...</h3>
            <p>กรุณารอสักครู่</p>
          </div>
          
        {:else if step === 'success'}
          <div class="success-state">
            <h3>🎉 เปิดใช้งานสำเร็จ!</h3>
            <p>Win Count Pro พร้อมใช้งานแล้ว</p>
            <div class="checkmark">✅</div>
          </div>
          
        {:else if step === 'error'}
          <div class="error-state">
            <h3>❌ เปิดใช้งานไม่สำเร็จ</h3>
            <p class="error-detail">{errorMessage}</p>
            <button 
              class="retry-btn"
              on:click={() => { step = 'input'; errorMessage = ''; }}
            >
              🔄 ลองใหม่
            </button>
          </div>
        {/if}
      </div>
      
      <div class="modal-footer">
        <div class="help-links">
          <a href="#" class="help-link">🛒 ซื้อ License</a>
          <a href="#" class="help-link">❓ ต้องการความช่วยเหลือ</a>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal {
    background: linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%);
    border-radius: 16px;
    width: 90%;
    max-width: 500px;
    border: 2px solid #3b82f6;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  }
  
  .modal-header {
    padding: 24px 24px 0;
    text-align: center;
  }
  
  .modal-header h2 {
    color: #3b82f6;
    margin: 0;
    font-size: 24px;
    font-weight: 600;
  }
  
  .modal-body {
    padding: 24px;
  }
  
  .license-form .description {
    text-align: center;
    color: #94a3b8;
    margin-bottom: 24px;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  .form-group label {
    display: block;
    color: #e2e8f0;
    margin-bottom: 8px;
    font-weight: 500;
  }
  
  .form-group input {
    width: 100%;
    padding: 12px 16px;
    background: rgba(15, 23, 42, 0.8);
    border: 2px solid #334155;
    border-radius: 8px;
    color: #e2e8f0;
    font-size: 16px;
    transition: border-color 0.3s;
  }
  
  .form-group input:focus {
    outline: none;
    border-color: #3b82f6;
  }
  
  .form-group input.readonly {
    background: rgba(15, 23, 42, 0.4);
    color: #64748b;
  }
  
  .hint {
    font-size: 12px;
    color: #64748b;
    margin-top: 4px;
  }
  
  .activate-btn {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .activate-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
  }
  
  .activate-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .error-message {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid #ef4444;
    border-radius: 8px;
    padding: 12px;
    color: #fca5a5;
    margin-bottom: 16px;
  }
  
  .loading-state,
  .success-state,
  .error-state {
    text-align: center;
    padding: 20px;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #334155;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .checkmark {
    font-size: 48px;
    margin: 16px 0;
  }
  
  .retry-btn {
    padding: 10px 20px;
    background: #ef4444;
    border: none;
    border-radius: 6px;
    color: white;
    cursor: pointer;
    margin-top: 16px;
  }
  
  .modal-footer {
    padding: 0 24px 24px;
    border-top: 1px solid #334155;
    margin-top: 16px;
    padding-top: 16px;
  }
  
  .help-links {
    display: flex;
    justify-content: center;
    gap: 24px;
  }
  
  .help-link {
    color: #3b82f6;
    text-decoration: none;
    font-size: 14px;
  }
  
  .help-link:hover {
    text-decoration: underline;
  }
</style> 
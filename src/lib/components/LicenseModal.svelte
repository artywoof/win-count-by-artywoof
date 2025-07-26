<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import licenseManager, { type LicenseInfo } from '$lib/licenseManager';
  
  const dispatch = createEventDispatcher();
  
  export let isOpen = false;
  
  let licenseKey = '';
  let isActivating = false;
  let activationMessage = '';
  let activationSuccess = false;
  let currentLicense: LicenseInfo | null = null;
  
  // Load current license when modal opens
  $: if (isOpen) {
    currentLicense = licenseManager.getLicenseInfo();
    console.log('🔑 License Modal opened, currentLicense:', currentLicense);
  }
  
  async function activateLicense() {
    if (!licenseKey.trim()) {
      activationMessage = 'กรุณากรอก License Key';
      activationSuccess = false;
      return;
    }
    
    isActivating = true;
    activationMessage = 'กำลังตรวจสอบ License...';
    activationSuccess = false;
    
    try {
      const result = await licenseManager.activateLicense(licenseKey);
      
      if (result.isValid) {
        activationMessage = result.message;
        activationSuccess = true;
        currentLicense = result.licenseInfo || null;
        licenseKey = '';
        
        // Close modal after 2 seconds
        setTimeout(() => {
          dispatch('close');
        }, 2000);
      } else {
        activationMessage = result.message;
        activationSuccess = false;
      }
    } catch (error) {
      activationMessage = 'เกิดข้อผิดพลาดในการเปิดใช้งาน License';
      activationSuccess = false;
    } finally {
      isActivating = false;
    }
  }
  
  async function deactivateLicense() {
    try {
      await licenseManager.deactivateLicense();
      currentLicense = null;
      activationMessage = 'ยกเลิก License สำเร็จ';
      activationSuccess = true;
      
      setTimeout(() => {
        dispatch('close');
      }, 2000);
    } catch (error) {
      activationMessage = 'เกิดข้อผิดพลาดในการยกเลิก License';
      activationSuccess = false;
    }
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !isActivating) {
      activateLicense();
    }
  }
  
  function formatLicenseKey(key: string): string {
    // Format: XXXX-XXXX-XXXX-XXXX
    const clean = key.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    const parts = [];
    for (let i = 0; i < clean.length && i < 16; i += 4) {
      parts.push(clean.slice(i, i + 4));
    }
    return parts.join('-');
  }
  
  function handleLicenseInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const formatted = formatLicenseKey(target.value);
    licenseKey = formatted;
  }
  
  function getStatusColor(): string {
    if (!currentLicense) return '#ff6b6b';
    if (!licenseManager.isLicenseValid()) return '#ff6b6b';
    if (currentLicense.isTrial) return '#ffa726';
    return '#4caf50';
  }
  
  function getStatusIcon(): string {
    if (!currentLicense) return '❌';
    if (!licenseManager.isLicenseValid()) return '❌';
    if (currentLicense.isTrial) return '⏰';
    return '✅';
  }
</script>

{#if isOpen}
  <div class="modal-backdrop" on:click={() => dispatch('close')} on:keydown={(e) => e.key === 'Escape' && dispatch('close')} role="button" tabindex="0">
    <div class="modal license-modal" on:click|stopPropagation role="dialog">
      <div class="modal-header">
        <h3>🔑 License Management</h3>
        <button class="modal-close" on:click={() => dispatch('close')}>×</button>
      </div>
      
      <div class="modal-body">
        <!-- Current License Status -->
        {#if currentLicense && licenseManager.isLicenseValid()}
          <div class="license-status">
            <div class="status-header">
              <span class="status-icon" style="color: {getStatusColor()}">{getStatusIcon()}</span>
              <h4>สถานะ License ปัจจุบัน</h4>
            </div>
            
            <div class="license-details">
              <div class="detail-row">
                <span class="detail-label">License Key:</span>
                <span class="detail-value">{currentLicense.key}</span>
              </div>
              
              {#if currentLicense.customerName}
                <div class="detail-row">
                  <span class="detail-label">ลูกค้า:</span>
                  <span class="detail-value">{currentLicense.customerName}</span>
                </div>
              {/if}
              
              {#if currentLicense.customerEmail}
                <div class="detail-row">
                  <span class="detail-label">อีเมล:</span>
                  <span class="detail-value">{currentLicense.customerEmail}</span>
                </div>
              {/if}
              
              {#if currentLicense.expiresAt}
                <div class="detail-row">
                  <span class="detail-label">หมดอายุ:</span>
                  <span class="detail-value">{new Date(currentLicense.expiresAt).toLocaleDateString('th-TH')}</span>
                </div>
              {/if}
              
              {#if currentLicense.isTrial}
                <div class="detail-row">
                  <span class="detail-label">Trial:</span>
                  <span class="detail-value trial-warning">เหลือ {licenseManager.getTrialInfo().daysLeft} วัน</span>
                </div>
              {/if}
              
              <div class="detail-row">
                <span class="detail-label">ฟีเจอร์:</span>
                <span class="detail-value">
                  {currentLicense.features.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(', ')}
                </span>
              </div>
            </div>
            
            <div class="license-actions">
              <button class="action-btn deactivate" on:click={deactivateLicense}>
                🔄 ยกเลิก License
              </button>
            </div>
          </div>
        {:else}
          <!-- License Activation -->
          <div class="license-activation">
            <div class="activation-header">
              <h4>🔑 เปิดใช้งาน License</h4>
              <p class="activation-note">
                กรุณากรอก License Key เพื่อเปิดใช้งานแอพพลิเคชัน
              </p>
            </div>
            
            <div class="license-input-group">
              <label for="license-key-input">License Key:</label>
              <input
                id="license-key-input"
                type="text"
                bind:value={licenseKey}
                on:input={handleLicenseInput}
                on:keydown={handleKeydown}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                maxlength="19"
                class="license-input"
                disabled={isActivating}
              />
            </div>
            
            <!-- Demo Keys -->
            <div class="demo-keys">
              <h5>🔑 Demo Keys สำหรับทดสอบ:</h5>
              <div class="demo-key-list">
                <div class="demo-key-item">
                  <span class="demo-key">DEMO-1234-5678-9ABC</span>
                  <span class="demo-desc">Trial License (30 วัน)</span>
                </div>
                <div class="demo-key-item">
                  <span class="demo-key">PRO-2024-ARTY-WOOF</span>
                  <span class="demo-desc">Pro License (1 ปี)</span>
                </div>
              </div>
            </div>
            
            <div class="activation-actions">
              <button 
                class="action-btn activate" 
                on:click={activateLicense}
                disabled={isActivating || !licenseKey.trim()}
              >
                {isActivating ? '🔄 กำลังตรวจสอบ...' : '✅ เปิดใช้งาน'}
              </button>
            </div>
          </div>
        {/if}
        
        <!-- Activation Message -->
        {#if activationMessage}
          <div class="activation-message {activationSuccess ? 'success' : 'error'}">
            {activationMessage}
          </div>
        {/if}
      </div>
      
      <div class="modal-footer">
        <button class="primary-btn" on:click={() => dispatch('close')}>
          {currentLicense ? 'ปิด' : 'ยกเลิก'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .license-modal {
    max-width: 600px;
    width: 90vw;
  }
  
  .license-status {
    margin-bottom: 24px;
  }
  
  .status-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  
  .status-icon {
    font-size: 24px;
  }
  
  .status-header h4 {
    margin: 0;
    color: #333;
    font-size: 1.2em;
  }
  
  .license-details {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
  }
  
  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #e9ecef;
  }
  
  .detail-row:last-child {
    border-bottom: none;
  }
  
  .detail-label {
    font-weight: 600;
    color: #495057;
  }
  
  .detail-value {
    color: #212529;
    font-family: 'Courier New', monospace;
  }
  
  .trial-warning {
    color: #ff6b6b;
    font-weight: 600;
  }
  
  .license-actions {
    display: flex;
    justify-content: center;
  }
  
  .license-activation {
    text-align: center;
  }
  
  .activation-header {
    margin-bottom: 24px;
  }
  
  .activation-header h4 {
    margin: 0 0 8px 0;
    color: #333;
    font-size: 1.3em;
  }
  
  .activation-note {
    margin: 0;
    color: #6c757d;
    font-size: 0.95em;
  }
  
  .license-input-group {
    margin-bottom: 24px;
  }
  
  .license-input-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #495057;
  }
  
  .license-input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #dee2e6;
    border-radius: 8px;
    font-size: 16px;
    font-family: 'Courier New', monospace;
    text-align: center;
    letter-spacing: 2px;
    transition: all 0.3s ease;
  }
  
  .license-input:focus {
    outline: none;
    border-color: #007AFF;
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
  }
  
  .license-input:disabled {
    background-color: #f8f9fa;
    color: #6c757d;
  }
  
  .demo-keys {
    margin-bottom: 24px;
    text-align: left;
  }
  
  .demo-keys h5 {
    margin: 0 0 12px 0;
    color: #495057;
    font-size: 1em;
  }
  
  .demo-key-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .demo-key-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #e9ecef;
    border-radius: 6px;
    font-size: 0.9em;
  }
  
  .demo-key {
    font-family: 'Courier New', monospace;
    font-weight: 600;
    color: #495057;
  }
  
  .demo-desc {
    color: #6c757d;
    font-size: 0.85em;
  }
  
  .activation-actions {
    display: flex;
    justify-content: center;
  }
  
  .activation-message {
    margin-top: 16px;
    padding: 12px 16px;
    border-radius: 6px;
    font-weight: 500;
    text-align: center;
  }
  
  .activation-message.success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }
  
  .activation-message.error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
  
  .action-btn {
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .action-btn.activate {
    background: linear-gradient(135deg, #007AFF, #00D4FF);
    color: white;
  }
  
  .action-btn.activate:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
  }
  
  .action-btn.activate:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  .action-btn.deactivate {
    background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
    color: white;
  }
  
  .action-btn.deactivate:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
  }
  
  .primary-btn {
    background: linear-gradient(135deg, #007AFF, #00D4FF);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .primary-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
  }
</style> 
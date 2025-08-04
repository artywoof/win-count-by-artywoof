import { invoke } from '@tauri-apps/api/core';

export interface LicenseData {
  key: string;
  machine_id: string;
  activated_at: string;
  expires_at: string;
  is_valid: boolean;
  payment_status: 'pending' | 'completed' | 'failed';
  payment_amount: number;
  payment_reference: string;
}

export class LicenseManager {
  private static instance: LicenseManager;
  private licenseData: LicenseData | null = null;

  private constructor() {}

  static getInstance(): LicenseManager {
    if (!LicenseManager.instance) {
      LicenseManager.instance = new LicenseManager();
    }
    return LicenseManager.instance;
  }

  // ตรวจสอบ License ปัจจุบัน
  async verifyLicense(): Promise<boolean> {
    try {
      console.log('🔍 Verifying license...');

      const licenseKey = await invoke<string>('get_license_key').catch(() => null);
      if (!licenseKey) {
        console.log('❌ No license key found');
        return false;
      }

      const machineId = await invoke<string>('get_machine_id').catch(() => this.generateMachineId());
      const isValid = await invoke<boolean>('validate_license_key', { 
        licenseKey, 
        machineId 
      }).catch(() => false);

      if (isValid) {
        console.log('✅ License verified');
        return true;
      } else {
        console.log('❌ License verification failed');
        return false;
      }

    } catch (error) {
      console.error('❌ License verification error:', error);
      return false;
    }
  }

  // สร้าง Payment (ไม่ใช้ Stripe แล้ว - ใช้ QR Code)
  async createPayment(): Promise<any> {
    throw new Error('Payment creation moved to QR Code system');
  }

  // บันทึก License Key
  async saveLicense(licenseKey: string): Promise<void> {
    try {
      await invoke('save_license_key', { key: licenseKey });
      console.log('✅ License key saved locally');
    } catch (error) {
      console.error('❌ Failed to save license key:', error);
      // Fallback to localStorage if Tauri fails
      localStorage.setItem('win_count_license_key', licenseKey);
      console.log('✅ License key saved to localStorage');
    }
  }

  // สร้าง Machine ID (สำรองในกรณี Tauri ไม่มี)
  private generateMachineId(): string {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;
    const screenInfo = `${window.screen.width}x${window.screen.height}`;
    
    const machineData = `${userAgent}|${platform}|${language}|${screenInfo}`;
    
    // Simple hash function for machine ID
    let hash = 0;
    for (let i = 0; i < machineData.length; i++) {
      const char = machineData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  }

  // ลบ License
  async removeLicense(): Promise<void> {
    try {
      await invoke('remove_license_key').catch(() => {
        localStorage.removeItem('win_count_license_key');
      });
      
      this.licenseData = null;
      console.log('🗑️ License removed');
    } catch (error) {
      console.error('❌ Remove license failed:', error);
      throw error;
    }
  }

  // รับ License Data ปัจจุบัน
  getCurrentLicense(): LicenseData | null {
    return this.licenseData;
  }
}

export default LicenseManager.getInstance(); 
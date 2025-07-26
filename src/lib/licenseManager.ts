import { invoke } from '@tauri-apps/api/core';

export interface LicenseInfo {
  key: string;
  isValid: boolean;
  expiresAt?: string;
  maxUses?: number;
  currentUses?: number;
  customerName?: string;
  customerEmail?: string;
  features: string[];
  isTrial: boolean;
  trialDaysLeft?: number;
}

export interface LicenseValidationResult {
  isValid: boolean;
  message: string;
  licenseInfo?: LicenseInfo;
  error?: string;
}

class LicenseManager {
  private licenseKey: string = '';
  private licenseInfo: LicenseInfo | null = null;
  private isInitialized: boolean = false;
  private validationInterval: number | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Load saved license key from local storage
      try {
        this.licenseKey = await invoke('get_license_key') || '';
        
        if (this.licenseKey) {
          await this.validateLicense(this.licenseKey);
        }
      } catch (error) {
        console.log('No saved license key found, starting fresh');
        this.licenseKey = '';
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize license manager:', error);
      this.isInitialized = true;
    }
  }

  /**
   * Activate license with key
   */
  async activateLicense(key: string): Promise<LicenseValidationResult> {
    try {
      // Clean the key
      const cleanKey = key.trim().replace(/\s+/g, '');
      
      if (!cleanKey) {
        return {
          isValid: false,
          message: 'กรุณากรอก License Key'
        };
      }

      // Validate license format
      if (!this.isValidLicenseFormat(cleanKey)) {
        return {
          isValid: false,
          message: 'รูปแบบ License Key ไม่ถูกต้อง'
        };
      }

      // Validate with server
      const result = await this.validateLicense(cleanKey);
      
      if (result.isValid && result.licenseInfo) {
        // Save license key locally
        await invoke('save_license_key', { key: cleanKey });
        this.licenseKey = cleanKey;
        this.licenseInfo = result.licenseInfo;
        
        // Start periodic validation
        this.startPeriodicValidation();
        
        return {
          isValid: true,
          message: 'เปิดใช้งาน License สำเร็จ!',
          licenseInfo: result.licenseInfo
        };
      } else {
        return result;
      }
    } catch (error) {
      console.error('License activation failed:', error);
      return {
        isValid: false,
        message: 'เกิดข้อผิดพลาดในการเปิดใช้งาน License',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate license key
   */
  private async validateLicense(key: string): Promise<LicenseValidationResult> {
    try {
      // For demo purposes, we'll use a simple validation
      // In production, this should call your license server
      
      if (key === 'DEMO-1234-5678-9ABC') {
        // Demo license (30 days trial)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        
        const licenseInfo: LicenseInfo = {
          key,
          isValid: true,
          expiresAt: expiresAt.toISOString(),
          maxUses: 1000,
          currentUses: 1,
          customerName: 'Demo User',
          customerEmail: 'demo@example.com',
          features: ['basic', 'premium'],
          isTrial: true,
          trialDaysLeft: 30
        };
        
        this.licenseInfo = licenseInfo;
        
        return {
          isValid: true,
          message: 'License ถูกต้อง',
          licenseInfo
        };
      }
      
      if (key === 'PRO-2024-ARTY-WOOF') {
        // Pro license (1 year)
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        
        const licenseInfo: LicenseInfo = {
          key,
          isValid: true,
          expiresAt: expiresAt.toISOString(),
          maxUses: 999999,
          currentUses: 1,
          customerName: 'ArtYWoof',
          customerEmail: 'artywoof@example.com',
          features: ['basic', 'premium', 'enterprise'],
          isTrial: false
        };
        
        this.licenseInfo = licenseInfo;
        
        return {
          isValid: true,
          message: 'License ถูกต้อง',
          licenseInfo
        };
      }
      
      // Invalid key
      return {
        isValid: false,
        message: 'License Key ไม่ถูกต้องหรือหมดอายุ'
      };
      
    } catch (error) {
      console.error('License validation failed:', error);
      return {
        isValid: false,
        message: 'เกิดข้อผิดพลาดในการตรวจสอบ License',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if license format is valid
   */
  private isValidLicenseFormat(key: string): boolean {
    // Format: XXXX-XXXX-XXXX-XXXX (alphanumeric)
    const licensePattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return licensePattern.test(key);
  }

  /**
   * Get current license info
   */
  getLicenseInfo(): LicenseInfo | null {
    return this.licenseInfo;
  }

  /**
   * Check if license is valid
   */
  isLicenseValid(): boolean {
    if (!this.licenseInfo) return false;
    
    // Check if expired
    if (this.licenseInfo.expiresAt) {
      const now = new Date();
      const expiresAt = new Date(this.licenseInfo.expiresAt);
      if (now > expiresAt) {
        this.licenseInfo.isValid = false;
        return false;
      }
    }
    
    // Check usage limits
    if (this.licenseInfo.maxUses && this.licenseInfo.currentUses) {
      if (this.licenseInfo.currentUses >= this.licenseInfo.maxUses) {
        this.licenseInfo.isValid = false;
        return false;
      }
    }
    
    return this.licenseInfo.isValid;
  }

  /**
   * Check if feature is available
   */
  hasFeature(feature: string): boolean {
    if (!this.isLicenseValid()) return false;
    if (!this.licenseInfo) return false;
    
    return this.licenseInfo.features.includes(feature);
  }

  /**
   * Start periodic license validation
   */
  private startPeriodicValidation() {
    this.stopPeriodicValidation();
    
    // Check every hour
    this.validationInterval = window.setInterval(async () => {
      if (this.licenseKey) {
        await this.validateLicense(this.licenseKey);
      }
    }, 60 * 60 * 1000);
  }

  /**
   * Stop periodic license validation
   */
  stopPeriodicValidation() {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
      this.validationInterval = null;
    }
  }

  /**
   * Deactivate license
   */
  async deactivateLicense(): Promise<void> {
    try {
      await invoke('remove_license_key');
      this.licenseKey = '';
      this.licenseInfo = null;
      this.stopPeriodicValidation();
    } catch (error) {
      console.error('Failed to deactivate license:', error);
    }
  }

  /**
   * Get trial info
   */
  getTrialInfo(): { isTrial: boolean; daysLeft: number } {
    if (!this.licenseInfo) {
      return { isTrial: false, daysLeft: 0 };
    }
    
    if (!this.licenseInfo.isTrial) {
      return { isTrial: false, daysLeft: 0 };
    }
    
    if (this.licenseInfo.expiresAt) {
      const now = new Date();
      const expiresAt = new Date(this.licenseInfo.expiresAt);
      const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      
      return { isTrial: true, daysLeft };
    }
    
    return { isTrial: true, daysLeft: this.licenseInfo.trialDaysLeft || 0 };
  }

  /**
   * Check if app is ready to use
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get license status message
   */
  getStatusMessage(): string {
    if (!this.licenseInfo) {
      return 'ยังไม่ได้เปิดใช้งาน License';
    }
    
    if (!this.isLicenseValid()) {
      if (this.licenseInfo.expiresAt) {
        const now = new Date();
        const expiresAt = new Date(this.licenseInfo.expiresAt);
        if (now > expiresAt) {
          return 'License หมดอายุแล้ว';
        }
      }
      return 'License ไม่ถูกต้อง';
    }
    
    if (this.licenseInfo.isTrial) {
      const trialInfo = this.getTrialInfo();
      return `Trial License (เหลือ ${trialInfo.daysLeft} วัน)`;
    }
    
    return 'License ถูกต้อง';
  }
}

// Create singleton instance
const licenseManager = new LicenseManager();

export default licenseManager; 
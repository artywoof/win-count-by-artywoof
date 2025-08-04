// App Security & Anti-Reverse Engineering System
export class AppSecurity {
  private static readonly INTEGRITY_KEY = 'WIN_COUNT_INTEGRITY_CHECK';
  
  // สร้าง Hash สำหรับตรวจสอบความถูกต้องของแอพ
  static async createAppHash(): Promise<string> {
    const appData = {
      name: 'Win Count by ArtYWoof',
      version: '1.0.0',
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    };
    
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(appData));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }
  
  // ตรวจสอบความปลอดภัยของแอพ
  static async validateAppIntegrity(): Promise<boolean> {
    try {
      const currentHash = await this.createAppHash();
      const storedHash = localStorage.getItem(this.INTEGRITY_KEY);
      
      if (!storedHash) {
        localStorage.setItem(this.INTEGRITY_KEY, currentHash);
        return true;
      }
      
      // ตรวจสอบการเปลี่ยนแปลงที่ผิดปกติ
      if (storedHash !== currentHash) {
        console.warn('🚨 App integrity compromised');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Security check failed:', error);
      return false;
    }
  }
  
  // เข้ารหัสข้อมูล License
  static async encryptLicenseData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // เพิ่มการเข้ารหัสเพิ่มเติม
    const obfuscated = btoa(hashHex).split('').reverse().join('');
    return obfuscated;
  }
  
  // ตรวจสอบ License ที่เข้ารหัสแล้ว
  static async verifyLicenseData(encryptedData: string, originalData: string): Promise<boolean> {
    try {
      const expectedEncrypted = await this.encryptLicenseData(originalData);
      return encryptedData === expectedEncrypted;
    } catch (error) {
      console.error('❌ License verification failed:', error);
      return false;
    }
  }
  
  // สร้าง Machine ID ที่ปลอดภัย
  static async generateSecureMachineId(): Promise<string> {
    try {
      const components = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset().toString(),
        navigator.hardwareConcurrency?.toString() || '0'
      ];
      
      const data = components.join('|');
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      return hashHex.substring(0, 16); // ใช้ 16 ตัวแรก
    } catch (error) {
      console.error('❌ Machine ID generation failed:', error);
      return 'fallback-machine-id';
    }
  }
  
  // ตรวจสอบการเปลี่ยนแปลงของแอพ
  static async detectTampering(): Promise<boolean> {
    try {
      // ตรวจสอบการเปลี่ยนแปลงของ DOM
      const originalElements = document.querySelectorAll('*').length;
      
      // ตรวจสอบการเปลี่ยนแปลงของ localStorage
      const originalStorage = JSON.stringify(localStorage);
      
      // ตรวจสอบการเปลี่ยนแปลงของ sessionStorage
      const originalSession = JSON.stringify(sessionStorage);
      
      // ตรวจสอบการเปลี่ยนแปลงของ cookies
      const originalCookies = document.cookie;
      
      // สร้าง hash ของสถานะปัจจุบัน
      const currentState = {
        domElements: originalElements,
        localStorage: originalStorage,
        sessionStorage: originalSession,
        cookies: originalCookies,
        timestamp: Date.now()
      };
      
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(currentState));
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      const storedState = localStorage.getItem('app_state_hash');
      if (!storedState) {
        localStorage.setItem('app_state_hash', hashHex);
        return false; // ไม่มีการเปลี่ยนแปลง
      }
      
      return storedState !== hashHex;
    } catch (error) {
      console.error('❌ Tampering detection failed:', error);
      return false;
    }
  }
} 
// App Security & Anti-Reverse Engineering System
export class AppSecurity {
  private static readonly INTEGRITY_KEY = 'WIN_COUNT_INTEGRITY_CHECK';
  private static readonly LICENSE_KEY = 'win_count_license_key';
  private static readonly SECURITY_HASH = 'security_hash';
  
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
  
  // เพิ่ม callback สำหรับแจ้งเตือน
  static tamperAlertCallback: ((msg: string) => void) | null = null;

  static setTamperAlertCallback(cb: (msg: string) => void) {
    this.tamperAlertCallback = cb;
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
      
      if (storedState !== hashHex) {
        if (this.tamperAlertCallback) {
          this.tamperAlertCallback('⚠️ ตรวจพบการแก้ไข DOM/Storage หรือ Session!');
        }
        console.warn('🚨 Tampering detected!');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Tampering detection failed:', error);
      return false;
    }
  }

  // ระบบป้องกันการเข้าถึง localStorage โดยตรง
  static protectLocalStorage(): void {
    try {
      // Override localStorage methods to add protection
      const originalSetItem = localStorage.setItem;
      const originalGetItem = localStorage.getItem;
      const originalRemoveItem = localStorage.removeItem;
      
      localStorage.setItem = function(key: string, value: string) {
        // Block direct access to license key
        if (key === AppSecurity.LICENSE_KEY) {
          console.warn('🔒 Direct license key modification blocked');
          return;
        }
        return originalSetItem.call(this, key, value);
      };
      
      localStorage.getItem = function(key: string) {
        // Block direct access to license key
        if (key === AppSecurity.LICENSE_KEY) {
          console.warn('🔒 Direct license key access blocked');
          return null;
        }
        return originalGetItem.call(this, key);
      };
      
      localStorage.removeItem = function(key: string) {
        // Block removal of license key
        if (key === AppSecurity.LICENSE_KEY) {
          console.warn('🔒 License key removal blocked');
          return;
        }
        return originalRemoveItem.call(this, key);
      };
      
      console.log('✅ localStorage protection enabled');
    } catch (error) {
      console.error('❌ Failed to protect localStorage:', error);
    }
  }

  // ระบบป้องกัน Developer Tools
  static preventDevTools(): void {
    try {
      // Detect developer tools
      const devtools = {
        open: false,
        orientation: null
      };
      
      const threshold = 160;
      
      setInterval(() => {
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
          if (!devtools.open) {
            devtools.open = true;
            console.warn('🚨 Developer tools detected - app will be locked');
            // Lock the app
            window.location.reload();
          }
        } else {
          devtools.open = false;
        }
      }, 500);
      
      console.log('✅ Developer tools protection enabled');
    } catch (error) {
      console.error('❌ Failed to prevent dev tools:', error);
    }
  }

  // ระบบป้องกันการ Debug
  static preventDebugging(): void {
    try {
      // Prevent console.log override
      const originalLog = console.log;
      const originalWarn = console.warn;
      const originalError = console.error;
      
      console.log = function(...args) {
        // Block suspicious console usage
        const stack = new Error().stack;
        if (stack && stack.includes('debugger')) {
          console.warn('🔒 Debugging attempt detected');
          return;
        }
        return originalLog.apply(this, args);
      };
      
      console.warn = function(...args) {
        return originalWarn.apply(this, args);
      };
      
      console.error = function(...args) {
        return originalError.apply(this, args);
      };
      
      // Prevent debugger statement
      setInterval(() => {
        try {
          eval('debugger');
        } catch (e) {
          // Debugger detected
          console.warn('🔒 Debugger detected');
        }
      }, 1000);
      
      console.log('✅ Debugging protection enabled');
    } catch (error) {
      console.error('❌ Failed to prevent debugging:', error);
    }
  }
} 
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

  // Enhanced Developer Tools Protection
  static preventDevTools(): void {
    try {
      // Block F12, Ctrl+Shift+I, Ctrl+U, etc.
      document.addEventListener('keydown', function(e) {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.shiftKey && e.key === 'J') ||
            (e.ctrlKey && e.shiftKey && e.key === 'C') ||
            (e.ctrlKey && e.key === 'U')) {
          e.preventDefault();
          e.stopPropagation();
          console.clear();
          alert('🚫 Developer Tools ถูกปิดใช้งานเพื่อความปลอดภัย');
          return false;
        }
      });
      
      // Block right-click context menu
      document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        alert('🚫 Right-click ถูกปิดใช้งานเพื่อความปลอดภัย');
        return false;
      });
      
      // Detect developer tools opening
      const devtools = {
        open: false,
        orientation: null
      };
      
      const threshold = 200; // Increased threshold
      
      setInterval(() => {
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
          if (!devtools.open) {
            devtools.open = true;
            console.clear();
            alert('🚫 ตรวจพบการเปิด Developer Tools - แอปจะรีเฟรช');
            window.location.reload();
          }
        } else {
          devtools.open = false;
        }
      }, 500);
      
      // Clear console periodically
      setInterval(() => {
        console.clear();
      }, 2000);
      
      // Disable text selection
      document.onselectstart = function() {
        return false;
      };
      
      // Disable drag
      document.ondragstart = function() {
        return false;
      };
      
      console.log('✅ Enhanced Developer tools protection enabled');
    } catch (error) {
      console.error('❌ Failed to prevent dev tools:', error);
    }
  }

  // Enhanced Anti-Debugging Protection
  static preventDebugging(): void {
    try {
      // Anti-debugging techniques
      (function() {
        let startTime = performance.now();
        debugger;
        let endTime = performance.now();
        
        if (endTime - startTime > 100) {
          alert('🚫 ตรวจพบ Debugger - แอปจะปิดทันที');
          window.close();
        }
      })();
      
      // Prevent console manipulation
      const originalLog = console.log;
      const originalWarn = console.warn;
      const originalError = console.error;
      const originalClear = console.clear;
      
      // Override console methods with protection
      Object.defineProperty(console, 'log', {
        value: function(...args) {
          const stack = new Error().stack;
          if (stack && stack.includes('debugger')) {
            console.warn('🔒 Debugging attempt detected');
            return;
          }
          return originalLog.apply(this, args);
        },
        writable: false,
        configurable: false
      });
      
      // Detect debugger with timing attacks
      setInterval(() => {
        const start = performance.now();
        debugger;
        const end = performance.now();
        
        if (end - start > 100) {
          console.warn('🔒 Debugger detected via timing attack');
          window.location.reload();
        }
      }, 5000);
      
      // Detect debugger via function toString
      setInterval(() => {
        try {
          const func = function() {};
          const original = func.toString();
          func.toString = function() { return 'modified'; };
          
          if (func.toString() !== original && func.toString() === 'modified') {
            console.warn('🔒 Function modification detected');
          }
        } catch (e) {
          // Ignore errors
        }
      }, 3000);
      
      // Block eval and Function constructor
      window.eval = function() {
        console.warn('🔒 eval() blocked for security');
        return null;
      };
      
      window.Function = function() {
        console.warn('🔒 Function() constructor blocked for security');
        return function() {};
      } as any;
      
      console.log('✅ Enhanced debugging protection enabled');
    } catch (error) {
      console.error('❌ Failed to prevent debugging:', error);
    }
  }
} 
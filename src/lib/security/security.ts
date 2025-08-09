export class AppSecurity {
  static protectLocalStorage(): void {}
  static preventDebugging(): void {}
  static async detectTampering(): Promise<boolean> { return false; }
  static preventDevTools(): void {
    try {
      if (import.meta.env?.MODE !== 'production') return;
      document.addEventListener('keydown', function(e) {
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || (e.ctrlKey && e.key === 'U')) {
          e.preventDefault(); e.stopPropagation(); console.clear();
          alert('🚫 Developer Tools ถูกปิดใช้งานเพื่อความปลอดภัย');
          return false;
        }
      });
      document.addEventListener('contextmenu', function(e) { e.preventDefault(); return false; });
    } catch {}
  }
}



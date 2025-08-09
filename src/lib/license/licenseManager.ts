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

class LicenseManager {
  private static instance: LicenseManager;
  private licenseData: LicenseData | null = null;
  private constructor() {}
  static getInstance(): LicenseManager {
    if (!LicenseManager.instance) LicenseManager.instance = new LicenseManager();
    return LicenseManager.instance;
  }

  async checkAndEnsure(): Promise<boolean> {
    const ok = await this.verifyLicense();
    return ok;
  }

  async verifyLicense(): Promise<boolean> {
    try {
      const licenseKey = await invoke<string | null>('get_license_key').catch(() => null);
      if (!licenseKey) return false;
      const machineId = await invoke<string>('m4c5h6n').catch(() => this.generateMachineId());
      const isValid = await invoke<boolean>('a1b2c3d4', { licenseKey, machineId }).catch(() => false);
      return !!isValid;
    } catch { return false; }
  }

  async saveLicense(licenseKey: string): Promise<void> {
    try { await invoke('s4v3k3y', { key: licenseKey }); }
    catch { localStorage.setItem('win_count_license_key', licenseKey); }
  }

  private generateMachineId(): string {
    const ua = navigator.userAgent; const pf = navigator.platform; const lang = navigator.language; const sc = `${window.screen.width}x${window.screen.height}`;
    const data = `${ua}|${pf}|${lang}|${sc}`;
    let hash = 0; for (let i = 0; i < data.length; i++) { const c = data.charCodeAt(i); hash = ((hash << 5) - hash) + c; hash |= 0; }
    return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  }

  async removeLicense(): Promise<void> {
    await invoke('remove_license_key').catch(() => { localStorage.removeItem('win_count_license_key'); });
    this.licenseData = null;
  }

  getCurrentLicense(): LicenseData | null { return this.licenseData; }
}

export default LicenseManager.getInstance();



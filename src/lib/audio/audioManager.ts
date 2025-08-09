interface AudioSettings {
  enabled: boolean;
  volume: number;
  customSounds: Record<string, string>;
}

let audioCtx: AudioContext | null = null;

class AudioManager {
  private settings: AudioSettings = {
    enabled: true,
    volume: 0.5,
    customSounds: {}
  };

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    try {
      const saved = localStorage?.getItem('audioSettings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load audio settings:', error);
    }
  }

  private saveSettings() {
    try {
      localStorage?.setItem('audioSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save audio settings:', error);
    }
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  setEnabled(enabled: boolean) {
    this.settings.enabled = enabled;
    this.saveSettings();
  }

  toggleEnabled(): boolean {
    this.settings.enabled = !this.settings.enabled;
    this.saveSettings();
    return this.settings.enabled;
  }

  setVolume(volume: number) {
    this.settings.volume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }

  private createBeepSound(frequency: number, duration: number) {
    if (!this.settings.enabled) return;
    try {
      if (!audioCtx) {
        const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AC) return;
        audioCtx = new AC();
      }
      const audioContext = audioCtx!;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      const volume = this.settings.volume * 0.3;
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch {}
  }

  async play(soundName: string, forceDefault: boolean = false): Promise<boolean> {
    if (!this.settings.enabled) return false;
    if (!forceDefault && this.settings.customSounds[soundName]) {
      try {
        const success = await this.playCustomSound(soundName);
        if (success) return true;
      } catch {}
    }
    try {
      switch (soundName) {
        case 'increase': this.createBeepSound(800, 0.1); break;
        case 'decrease': this.createBeepSound(400, 0.1); break;
        case 'increment10': this.createBeepSound(1000, 0.15); break;
        case 'decrement10': this.createBeepSound(300, 0.15); break;
        case 'error': this.createBeepSound(200, 0.3); break;
        case 'success': this.createBeepSound(600, 0.2); break;
        default: return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  private async playCustomSound(soundName: string): Promise<boolean> {
    const base64Data = this.settings.customSounds[soundName];
    if (!base64Data) return false;
    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return false;
      const audioContext = new AudioContext();
      const response = await fetch(base64Data);
      if (!response.ok) return false;
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      source.buffer = audioBuffer;
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      gainNode.gain.setValueAtTime(this.settings.volume, audioContext.currentTime);
      source.start();
      return true;
    } catch {
      return false;
    }
  }

  async testSound(soundName: string): Promise<boolean> {
    if (!this.settings.enabled) return false;
    if (this.settings.customSounds[soundName]) {
      const ok = await this.playCustomSound(soundName);
      if (ok) return true;
    }
    await this.play(soundName);
    return true;
  }

  async uploadCustomSound(soundName: string, file: File): Promise<boolean> {
    try {
      const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];
      if (!allowedTypes.includes(file.type)) return false;
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) return false;
      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onload = (e) => {
          if (e.target?.result) {
            this.settings.customSounds[soundName] = e.target.result as string;
            this.saveSettings();
            resolve(true);
          } else resolve(false);
        };
        reader.onerror = () => resolve(false);
        reader.readAsDataURL(file);
      });
    } catch {
      return false;
    }
  }

  removeCustomSound(soundName: string) {
    delete this.settings.customSounds[soundName];
    this.saveSettings();
  }

  hasCustomSound(soundName: string): boolean {
    return !!this.settings.customSounds[soundName];
  }

  getCustomSounds(): string[] {
    return Object.keys(this.settings.customSounds);
  }

  resetToDefaults() {
    this.settings = { enabled: true, volume: 0.5, customSounds: {} };
    this.saveSettings();
  }

  async playIncrease(): Promise<boolean> { return await this.play('increase'); }
  async playDecrease(): Promise<boolean> { return await this.play('decrease'); }
  async playIncrement10(): Promise<boolean> { return await this.play('increment10'); }
  async playDecrement10(): Promise<boolean> { return await this.play('decrement10'); }
  async playError(): Promise<boolean> { return await this.play('error'); }
  async playSuccess(): Promise<boolean> { return await this.play('success'); }
}

export const audioManager = new AudioManager();
export default audioManager;



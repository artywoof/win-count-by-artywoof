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
    console.log(`🔊 AudioManager: createBeepSound called - frequency: ${frequency}, duration: ${duration}, enabled: ${this.settings.enabled}`);
    
    if (!this.settings.enabled) {
      console.log('🔊 AudioManager: Audio disabled, skipping beep sound');
      return;
    }
    
    try {
      if (!audioCtx) {
        console.log('🔊 AudioManager: Creating new AudioContext');
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        if (!AC) {
          console.error('🔊 AudioManager: AudioContext not available');
          return;
        }
        audioCtx = new AC();
        console.log('🔊 AudioManager: AudioContext created successfully');
      }
      
      const audioContext = audioCtx;
      console.log('🔊 AudioManager: AudioContext state:', audioContext.state);
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      const volume = this.settings.volume * 0.3;
      console.log(`🔊 AudioManager: Setting volume to ${volume} (settings: ${this.settings.volume})`);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
      
      console.log(`🔊 AudioManager: Beep sound started - frequency: ${frequency}, duration: ${duration}, volume: ${volume}`);
    } catch (error) {
      console.error('🔊 AudioManager: Failed to play beep sound:', error);
    }
  }

  async play(soundName: string, forceDefault: boolean = false): Promise<boolean> {
    console.log(`🔊 AudioManager: Attempting to play sound '${soundName}', enabled: ${this.settings.enabled}, volume: ${this.settings.volume}`);
    
    if (!this.settings.enabled) {
      console.warn('🔊 AudioManager: Audio is disabled');
      return false;
    }

    // Check if custom sound exists first (unless forcing default)
    if (!forceDefault && this.settings.customSounds[soundName]) {
      try {
        const success = await this.playCustomSound(soundName);
        if (success) {
          return true; // Custom sound played successfully
        } else {
          console.warn(`🔊 AudioManager: Custom sound '${soundName}' failed to play, falling back to default sound`);
        }
      } catch (error) {
        console.warn(`🔊 AudioManager: Unexpected error with custom sound '${soundName}', falling back to default:`, error);
      }
    }

    // Play default sounds
    try {
      console.log(`🔊 AudioManager: Playing default sound '${soundName}'`);
      switch (soundName) {
        case 'increase':
          console.log('🔊 AudioManager: Creating beep sound - frequency: 800, duration: 0.1');
          this.createBeepSound(800, 0.1);
          break;
        case 'decrease':
          console.log('🔊 AudioManager: Creating beep sound - frequency: 400, duration: 0.1');
          this.createBeepSound(400, 0.1);
          break;
        case 'increment10':
          console.log('🔊 AudioManager: Creating beep sound - frequency: 1000, duration: 0.15');
          this.createBeepSound(1000, 0.15);
          break;
        case 'decrement10':
          console.log('🔊 AudioManager: Creating beep sound - frequency: 300, duration: 0.15');
          this.createBeepSound(300, 0.15);
          break;
        case 'error':
          this.createBeepSound(200, 0.3);
          break;
        case 'success':
          this.createBeepSound(600, 0.2);
          break;
        default:
          console.warn(`🔊 AudioManager: Unknown sound: ${soundName}`);
          return false;
      }
      console.log(`🔊 AudioManager: Successfully initiated sound '${soundName}'`);
      return true;
    } catch (error) {
      console.error(`🔊 AudioManager: Failed to play default sound '${soundName}':`, error);
      return false;
    }
  }

  // Play custom sound from Base64 data
  private async playCustomSound(soundName: string): Promise<boolean> {
    const base64Data = this.settings.customSounds[soundName];
    if (!base64Data) {
      console.error(`🔊 AudioManager: Custom sound '${soundName}' not found in settings`);
      return false;
    }

    try {
      console.log(`🔊 AudioManager: Playing custom sound '${soundName}'`);
      
      // Create audio context
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        console.error('🔊 AudioManager: AudioContext not supported in this browser');
        return false;
      }

      const audioContext = new AudioContext();
      console.log(`🔊 AudioManager: AudioContext created successfully`);
      
      // Convert base64 to array buffer
      let response: Response;
      let arrayBuffer: ArrayBuffer;
      
      try {
        response = await fetch(base64Data);
        if (!response.ok) {
          console.error(`🔊 AudioManager: Failed to fetch audio data for '${soundName}': ${response.status} ${response.statusText}`);
          return false;
        }
        arrayBuffer = await response.arrayBuffer();
        console.log(`🔊 AudioManager: Audio data fetched successfully, size: ${arrayBuffer.byteLength} bytes`);
      } catch (fetchError) {
        console.error(`🔊 AudioManager: Error fetching audio data for '${soundName}':`, fetchError);
        return false;
      }
      
      // Decode audio data
      let audioBuffer: AudioBuffer;
      try {
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log(`🔊 AudioManager: Audio decoded successfully - Duration: ${audioBuffer.duration}s, Channels: ${audioBuffer.numberOfChannels}, Sample Rate: ${audioBuffer.sampleRate}Hz`);
      } catch (decodeError) {
        console.error(`🔊 AudioManager: Failed to decode audio data for '${soundName}':`, decodeError);
        console.error(`🔊 AudioManager: Audio data format may be unsupported or corrupted`);
        return false;
      }
      
      // Create source and gain nodes
      try {
        const source = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();
        
        source.buffer = audioBuffer;
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Apply volume setting
        gainNode.gain.setValueAtTime(this.settings.volume, audioContext.currentTime);
        console.log(`🔊 AudioManager: Volume set to ${this.settings.volume}`);
        
        // Set up error handler for playback
        source.addEventListener('ended', () => {
          console.log(`🔊 AudioManager: Playback of '${soundName}' completed successfully`);
        });
        
        // Play the sound
        source.start();
        console.log(`🔊 AudioManager: Playback started for '${soundName}'`);
        
        return true;
        
      } catch (playbackError) {
        console.error(`🔊 AudioManager: Error during playback setup/start for '${soundName}':`, playbackError);
        return false;
      }
      
    } catch (error) {
      console.error(`🔊 AudioManager: Unexpected error playing custom sound '${soundName}':`, error);
      return false;
    }
  }

  // Test sound method
  async testSound(soundName: string): Promise<boolean> {
    console.log(`🔊 AudioManager: Testing sound '${soundName}'`);
    
    if (!this.settings.enabled) {
      console.warn(`🔊 AudioManager: Audio is disabled, cannot test sound '${soundName}'`);
      return false;
    }

    // Check if custom sound exists
    if (this.settings.customSounds[soundName]) {
      try {
        const success = await this.playCustomSound(soundName);
        if (success) {
          console.log(`🔊 AudioManager: Custom sound '${soundName}' test completed successfully`);
          return true;
        } else {
          console.error(`🔊 AudioManager: Custom sound '${soundName}' test failed`);
          return false;
        }
      } catch (error) {
        console.error(`🔊 AudioManager: Error testing custom sound '${soundName}':`, error);
        return false;
      }
    } else {
      // Test default sound
      try {
        await this.play(soundName);
        console.log(`🔊 AudioManager: Default sound '${soundName}' test completed`);
        return true;
      } catch (error) {
        console.error(`🔊 AudioManager: Error testing default sound '${soundName}':`, error);
        return false;
      }
    }
  }

  // Upload custom sound
  async uploadCustomSound(soundName: string, file: File): Promise<boolean> {
    try {
      // Validate file type
      const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];
      if (!allowedTypes.includes(file.type)) {
        console.warn('Unsupported audio file type:', file.type);
        return false;
      }

      // Check file size (limit to 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        console.warn('Audio file too large:', file.size);
        return false;
      }

      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onload = (e) => {
          if (e.target?.result) {
            this.settings.customSounds[soundName] = e.target.result as string;
            this.saveSettings();
            resolve(true);
          } else {
            resolve(false);
          }
        };
        reader.onerror = () => resolve(false);
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Failed to upload custom sound:', error);
      return false;
    }
  }

  // Remove custom sound
  removeCustomSound(soundName: string) {
    delete this.settings.customSounds[soundName];
    this.saveSettings();
  }

  // Check if custom sound exists
  hasCustomSound(soundName: string): boolean {
    return !!this.settings.customSounds[soundName];
  }

  // Get list of available custom sounds
  getCustomSounds(): string[] {
    return Object.keys(this.settings.customSounds);
  }

  // Reset to defaults
  resetToDefaults() {
    this.settings = {
      enabled: true,
      volume: 0.5,
      customSounds: {}
    };
    this.saveSettings();
  }

  // Convenience methods  
  async playIncrease(): Promise<boolean> { return await this.play('increase'); }
  async playDecrease(): Promise<boolean> { return await this.play('decrease'); }
  async playIncrement10(): Promise<boolean> { return await this.play('increment10'); }
  async playDecrement10(): Promise<boolean> { return await this.play('decrement10'); }
  async playError(): Promise<boolean> { return await this.play('error'); }
  async playSuccess(): Promise<boolean> { return await this.play('success'); }
}

// Export singleton instance and set as default
export const audioManager = new AudioManager();
export default audioManager;

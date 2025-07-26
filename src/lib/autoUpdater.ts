import { invoke } from '@tauri-apps/api/core';

export interface UpdateInfo {
  version: string;
  title: string;
  description: string;
  downloadUrl: string;
  releaseDate: string;
  isPrerelease: boolean;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
  updateInfo?: UpdateInfo;
  error?: string;
}

class AutoUpdater {
  private currentVersion: string = '1.0.0';
  private repoOwner: string = 'artywoof';
  private repoName: string = 'win-count-by-artywoof';
  private checkInterval: number | null = null;
  private isChecking: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Get current version from Tauri
      this.currentVersion = await invoke('get_app_version');
    } catch (error) {
      console.warn('Failed to get app version:', error);
    }
  }

  /**
   * Check for updates from GitHub Releases
   */
  async checkForUpdates(): Promise<UpdateCheckResult> {
    if (this.isChecking) {
      return { hasUpdate: false, currentVersion: this.currentVersion };
    }

    this.isChecking = true;

    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/releases/latest`
      );

      if (!response.ok) {
        // Don't throw error for 404 (no releases yet) - just return no update
        if (response.status === 404) {
          console.log('No GitHub releases found yet - this is normal for new repositories');
          return {
            hasUpdate: false,
            currentVersion: this.currentVersion
          };
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const release = await response.json();
      
      // Parse version numbers
      const latestVersion = release.tag_name.replace('v', '');
      const hasUpdate = this.compareVersions(latestVersion, this.currentVersion) > 0;

      if (hasUpdate) {
        const updateInfo: UpdateInfo = {
          version: latestVersion,
          title: release.name || release.tag_name,
          description: release.body || 'No description available',
          downloadUrl: this.getDownloadUrl(release),
          releaseDate: release.published_at,
          isPrerelease: release.prerelease
        };

        return {
          hasUpdate: true,
          currentVersion: this.currentVersion,
          latestVersion,
          updateInfo
        };
      }

      return {
        hasUpdate: false,
        currentVersion: this.currentVersion,
        latestVersion
      };

    } catch (error) {
      // Only log as warning for network errors, not as error
      console.warn('Update check failed (this is normal if no releases exist yet):', error);
      return {
        hasUpdate: false,
        currentVersion: this.currentVersion,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Compare two version strings
   * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }

    return 0;
  }

  /**
   * Get download URL for the current platform
   */
  private getDownloadUrl(release: any): string {
    const platform = this.getPlatform();
    
    // Look for assets that match the platform
    const assets = release.assets || [];
    
    for (const asset of assets) {
      const name = asset.name.toLowerCase();
      
      if (platform === 'windows' && (name.includes('.msi') || name.includes('.exe'))) {
        return asset.browser_download_url;
      }
      
      if (platform === 'macos' && (name.includes('.dmg') || name.includes('.pkg'))) {
        return asset.browser_download_url;
      }
      
      if (platform === 'linux' && (name.includes('.deb') || name.includes('.AppImage'))) {
        return asset.browser_download_url;
      }
    }

    // Fallback to the first asset or release page
    return assets.length > 0 ? assets[0].browser_download_url : release.html_url;
  }

  /**
   * Get current platform
   */
  private getPlatform(): string {
    const platform = navigator.platform.toLowerCase();
    
    if (platform.includes('win')) return 'windows';
    if (platform.includes('mac')) return 'macos';
    if (platform.includes('linux')) return 'linux';
    
    return 'unknown';
  }

  /**
   * Start automatic update checking
   */
  startAutoCheck(intervalMinutes: number = 60) {
    this.stopAutoCheck();
    
    this.checkInterval = window.setInterval(async () => {
      const result = await this.checkForUpdates();
      
      if (result.hasUpdate && result.updateInfo) {
        this.showUpdateNotification(result.updateInfo);
      }
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop automatic update checking
   */
  stopAutoCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Show update notification to user
   */
  private showUpdateNotification(updateInfo: UpdateInfo) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <div class="update-notification-content">
        <div class="update-header">
          <h3>🔄 อัปเดตใหม่พร้อมใช้งาน!</h3>
          <button class="close-update-btn" onclick="this.parentElement.parentElement.parentElement.remove()">✕</button>
        </div>
        <div class="update-info">
          <p><strong>เวอร์ชันใหม่:</strong> v${updateInfo.version}</p>
          <p><strong>วันที่:</strong> ${new Date(updateInfo.releaseDate).toLocaleDateString('th-TH')}</p>
          ${updateInfo.isPrerelease ? '<p class="prerelease-warning">⚠️ นี่เป็นเวอร์ชันทดสอบ</p>' : ''}
        </div>
        <div class="update-description">
          <p>${updateInfo.description.substring(0, 200)}${updateInfo.description.length > 200 ? '...' : ''}</p>
        </div>
        <div class="update-actions">
          <button class="download-update-btn" onclick="window.open('${updateInfo.downloadUrl}', '_blank')">
            📥 ดาวน์โหลดอัปเดต
          </button>
          <button class="remind-later-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
            ⏰ เตือนภายหลัง
          </button>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .update-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 400px;
        background: linear-gradient(145deg, #1a1a1a, #2d2d2d);
        border: 1px solid #007AFF;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        z-index: 10001;
        animation: slideInRight 0.3s ease-out;
      }

      .update-notification-content {
        padding: 20px;
        color: white;
      }

      .update-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }

      .update-header h3 {
        margin: 0;
        color: #007AFF;
        font-size: 1.1em;
      }

      .close-update-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .close-update-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .update-info {
        margin-bottom: 15px;
      }

      .update-info p {
        margin: 5px 0;
        font-size: 14px;
      }

      .prerelease-warning {
        color: #ff6b6b;
        font-weight: 600;
      }

      .update-description {
        margin-bottom: 20px;
      }

      .update-description p {
        margin: 0;
        font-size: 13px;
        color: #ccc;
        line-height: 1.4;
      }

      .update-actions {
        display: flex;
        gap: 10px;
      }

      .download-update-btn, .remind-later-btn {
        flex: 1;
        padding: 10px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.2s;
      }

      .download-update-btn {
        background: linear-gradient(90deg, #007AFF, #00D4FF);
        color: white;
      }

      .download-update-btn:hover {
        opacity: 0.9;
      }

      .remind-later-btn {
        background: rgba(255, 255, 255, 0.1);
        color: #ccc;
        border: 1px solid #333;
      }

      .remind-later-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        color: white;
      }

      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `;

    // Add to document
    document.head.appendChild(style);
    document.body.appendChild(notification);

    // Auto-remove after 30 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 30000);
  }

  /**
   * Get current version
   */
  getCurrentVersion(): string {
    return this.currentVersion;
  }

  /**
   * Manual update check with user notification
   */
  async manualCheck(): Promise<UpdateCheckResult> {
    const result = await this.checkForUpdates();
    
    if (result.hasUpdate && result.updateInfo) {
      this.showUpdateNotification(result.updateInfo);
    } else if (!result.error) {
      this.showNoUpdateNotification();
    } else {
      this.showErrorNotification(result.error);
    }
    
    return result;
  }

  /**
   * Show "no update available" notification
   */
  private showNoUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <div class="update-notification-content">
        <div class="update-header">
          <h3>✅ ไม่มีอัปเดตใหม่</h3>
          <button class="close-update-btn" onclick="this.parentElement.parentElement.parentElement.remove()">✕</button>
        </div>
        <div class="update-info">
          <p>คุณใช้เวอร์ชันล่าสุดแล้ว (v${this.currentVersion})</p>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  /**
   * Show error notification
   */
  private showErrorNotification(error: string) {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <div class="update-notification-content">
        <div class="update-header">
          <h3>❌ เกิดข้อผิดพลาด</h3>
          <button class="close-update-btn" onclick="this.parentElement.parentElement.parentElement.remove()">✕</button>
        </div>
        <div class="update-info">
          <p>ไม่สามารถตรวจสอบอัปเดตได้</p>
          <p class="error-details">${error}</p>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 8000);
  }
}

// Create singleton instance
const autoUpdater = new AutoUpdater();

export default autoUpdater;

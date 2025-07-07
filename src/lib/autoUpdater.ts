import { invoke } from '@tauri-apps/api/core';

// Auto-update system
export class AutoUpdater {
    private checkInterval: number;
    private isChecking: boolean = false;

    constructor(checkIntervalMinutes: number = 60) {
        this.checkInterval = checkIntervalMinutes * 60 * 1000; // Convert to milliseconds
        this.startAutoCheck();
    }

    private startAutoCheck() {
        // Check immediately on startup
        setTimeout(() => this.checkForUpdates(), 5000); // Wait 5 seconds after startup
        
        // Then check periodically
        setInterval(() => {
            this.checkForUpdates();
        }, this.checkInterval);
    }

    async checkForUpdates(showNotification: boolean = false): Promise<boolean> {
        if (this.isChecking) return false;
        
        this.isChecking = true;
        console.log('🔍 Checking for updates...');

        try {
            const result = await invoke('check_for_updates') as string;
            
            if (result.includes('Update available')) {
                console.log('📥 Update available');
                
                if (showNotification) {
                    this.showUpdateNotification('latest');
                }

                // Auto-download and install
                await this.downloadAndInstall();
                return true;
            } else {
                console.log('✅ App is up to date');
                if (showNotification) {
                    this.showNoUpdateNotification();
                }
                return false;
            }
        } catch (error) {
            console.error('❌ Update check failed:', error);
            if (showNotification) {
                this.showUpdateErrorNotification();
            }
            return false;
        } finally {
            this.isChecking = false;
        }
    }

    private async downloadAndInstall() {
        try {
            console.log('📦 Downloading and installing update...');
            
            const result = await invoke('install_update') as string;
            
            if (result.includes('success')) {
                console.log('✅ Update installed successfully');
                this.showRestartNotification();
                
                // Auto-restart after 5 seconds
                setTimeout(() => {
                    window.location.reload();
                }, 5000);
            } else {
                throw new Error(result);
            }
            
        } catch (error) {
            console.error('❌ Update installation failed:', error);
            this.showUpdateErrorNotification();
        }
    }

    private showUpdateNotification(version: string) {
        // You can use Tauri's notification plugin or custom UI
        console.log(`🔔 New update available: v${version}`);
        
        // Custom notification UI
        this.createNotificationUI(
            '🎉 อัปเดทใหม่พร้อมแล้ว!',
            `เวอร์ชัน ${version} พร้อมดาวน์โหลดและติดตั้งแล้ว`,
            'success'
        );
    }

    private showNoUpdateNotification() {
        this.createNotificationUI(
            '✅ เป็นเวอร์ชันล่าสุดแล้ว',
            'แอปของคุณเป็นเวอร์ชันล่าสุดแล้ว',
            'info'
        );
    }

    private showRestartNotification() {
        this.createNotificationUI(
            '🔄 กำลังรีสตาร์ทแอป...',
            'แอปจะรีสตาร์ทเพื่อใช้เวอร์ชันใหม่ใน 5 วินาที',
            'warning'
        );
    }

    private showUpdateErrorNotification() {
        this.createNotificationUI(
            '❌ อัปเดทล้มเหลว',
            'ไม่สามารถอัปเดทได้ กรุณาลองใหม่ภายหลัง',
            'error'
        );
    }

    private createNotificationUI(title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') {
        // Create floating notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 300px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            animation: slideIn 0.3s ease-out;
        `;

        notification.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">${title}</div>
            <div style="font-size: 12px; opacity: 0.9;">${message}</div>
        `;

        // Add animation CSS
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    private getNotificationColor(type: string): string {
        switch (type) {
            case 'success': return 'linear-gradient(135deg, #4ade80, #22c55e)';
            case 'info': return 'linear-gradient(135deg, #60a5fa, #3b82f6)';
            case 'warning': return 'linear-gradient(135deg, #fbbf24, #f59e0b)';
            case 'error': return 'linear-gradient(135deg, #f87171, #ef4444)';
            default: return 'linear-gradient(135deg, #6b7280, #4b5563)';
        }
    }

    // Public method to manually check for updates
    async manualCheck() {
        return await this.checkForUpdates(true);
    }

    // Method to get current version
    async getCurrentVersion(): Promise<string> {
        try {
            return '1.0.0'; // You can get this from package.json or tauri.conf.json
        } catch (error) {
            console.error('Failed to get app version:', error);
            return 'Unknown';
        }
    }
}

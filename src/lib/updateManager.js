import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export class UpdateManager {
    constructor() {
        this.isChecking = false;
        this.isDownloading = false;
        this.updateInfo = null;
        this.downloadProgress = 0;
        
        // Listen to update events
        this.setupEventListeners();
    }
    
    async setupEventListeners() {
        // Update available event
        await listen('update-available', (event) => {
            console.log('🎉 Update available:', event.payload);
            this.updateInfo = event.payload;
            this.showUpdateNotification(event.payload);
        });
        
        // Download progress event
        await listen('update-download-progress', (event) => {
            console.log('📥 Download progress:', event.payload);
            this.downloadProgress = event.payload;
            this.updateDownloadProgress(event.payload);
        });
        
        // Download finished event
        await listen('update-download-finished', () => {
            console.log('✅ Download finished');
            this.showInstallPrompt();
        });
        
        // Update installed event
        await listen('update-installed', () => {
            console.log('✅ Update installed, restarting...');
            this.showRestartMessage();
        });
        
        // Update error event
        await listen('update-error', (event) => {
            console.error('❌ Update error:', event.payload);
            this.showErrorMessage(event.payload);
        });
    }
    
    async checkForUpdates() {
        if (this.isChecking) return;
        
        this.isChecking = true;
        console.log('🔄 Checking for updates...');
        
        try {
            const updateInfo = await invoke('check_for_updates');
            console.log('📋 Update check result:', updateInfo);
            
            if (updateInfo.available) {
                this.updateInfo = updateInfo;
                this.showUpdateDialog(updateInfo);
            } else {
                this.showNoUpdateMessage();
            }
        } catch (error) {
            console.error('❌ Failed to check for updates:', error);
            this.showErrorMessage('Failed to check for updates: ' + error);
        } finally {
            this.isChecking = false;
        }
    }
    
    async downloadAndInstallUpdate() {
        if (this.isDownloading) return;
        
        this.isDownloading = true;
        this.downloadProgress = 0;
        
        try {
            console.log('📥 Starting download and installation...');
            await invoke('download_and_install_update');
        } catch (error) {
            console.error('❌ Failed to download/install update:', error);
            this.showErrorMessage('Failed to download update: ' + error);
        } finally {
            this.isDownloading = false;
        }
    }
    
    showUpdateNotification(updateInfo) {
        // แสดง notification แบบ Toast
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification('Win Count - Update Available', {
                    body: `Version ${updateInfo.version} is available!`,
                    icon: '/assets/ui/app_icon.png',
                    tag: 'win-count-update'
                });
            }
        }
        
        // อัพเดท UI element ถ้ามี
        const updateBtn = document.querySelector('.auto-update-btn');
        if (updateBtn) {
            updateBtn.classList.add('has-update');
            updateBtn.textContent = 'UPDATE';
            updateBtn.title = `Version ${updateInfo.version} available!`;
        }
    }
    
    showUpdateDialog(updateInfo) {
        // สร้าง modal สำหรับแจ้งอัพเดท
        const modal = document.createElement('div');
        modal.className = 'update-modal';
        modal.innerHTML = `
            <div class="update-modal-content">
                <h3>🎉 Update Available!</h3>
                <p><strong>New Version:</strong> ${updateInfo.version}</p>
                <p><strong>Current Version:</strong> ${updateInfo.current_version}</p>
                <div class="update-body">${updateInfo.body}</div>
                <div class="update-actions">
                    <button class="update-btn-download">📥 Download & Install</button>
                    <button class="update-btn-later">⏰ Later</button>
                </div>
            </div>
        `;
        
        // Add event listeners
        modal.querySelector('.update-btn-download').addEventListener('click', () => {
            this.downloadAndInstallUpdate();
            modal.remove();
        });
        
        modal.querySelector('.update-btn-later').addEventListener('click', () => {
            modal.remove();
        });
        
        document.body.appendChild(modal);
    }
    
    updateDownloadProgress(progress) {
        // อัพเดท progress bar ถ้ามี
        const progressBar = document.querySelector('.update-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
            progressBar.textContent = `${progress}%`;
        }
        
        console.log(`📥 Download progress: ${progress}%`);
    }
    
    showInstallPrompt() {
        // แสดงข้อความว่า download เสร็จแล้ว กำลัง install
        console.log('✅ Download completed, installing...');
    }
    
    showRestartMessage() {
        // แสดงข้อความว่ากำลัง restart
        const modal = document.createElement('div');
        modal.className = 'restart-modal';
        modal.innerHTML = `
            <div class="restart-modal-content">
                <h3>🔄 Restarting...</h3>
                <p>Update installed successfully!</p>
                <p>The application will restart automatically.</p>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    showNoUpdateMessage() {
        console.log('✅ You are using the latest version');
        // แสดง toast notification
        this.showToast('✅ You are using the latest version', 'success');
    }
    
    showErrorMessage(message) {
        console.error('❌ Update error:', message);
        this.showToast(`❌ Update error: ${message}`, 'error');
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Style the toast
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            backgroundColor: type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007AFF',
            color: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: '10000',
            fontFamily: 'MiSansThai, sans-serif',
            fontSize: '14px',
            maxWidth: '300px'
        });
        
        document.body.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }
}

// Export singleton instance
export const updateManager = new UpdateManager();

// Usage in Svelte component:
/*
import { updateManager } from '$lib/updateManager';

// In onMount:
onMount(() => {
    // Check for updates on app start
    updateManager.checkForUpdates();
});

// In button click handler:
function checkUpdates() {
    updateManager.checkForUpdates();
}
*/ 
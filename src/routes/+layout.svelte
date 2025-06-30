<script>
  import "../app.css";
  import { getCurrentWindow } from '@tauri-apps/api/window';
  
  const appWindow = getCurrentWindow();
  
  async function hide_to_tray() {
    try {
      await appWindow.hide();
      console.log('🫥 App hidden to tray');
    } catch (err) {
      console.error('❌ Failed to hide to tray:', err);
    }
  }
</script>

<div
  class="w-[492px] h-[806px] bg-[#040319] border-[5px] border-[#ff00cc] rounded-[6px] overflow-hidden relative"
  data-tauri-drag-region
>
  <!-- All app content goes here -->
  <slot />
</div>

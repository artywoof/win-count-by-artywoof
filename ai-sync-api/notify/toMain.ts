// Notify to main AI or log for manual copy
import { SyncEvent } from '../types';

export function notifyToMain(event: SyncEvent) {
  let message = '';
  switch (event.type) {
    case 'win-update':
      message = `App เปลี่ยนจำนวน win เป็น ${event.payload.wins} → โปรดอัปเดต overlay ด้วย`;
      break;
    case 'preset-update':
      message = `Preset มีการเปลี่ยนแปลง → ตรวจสอบ overlay และ app ให้ตรงกัน`;
      break;
    default:
      message = `เกิดเหตุการณ์: ${event.type}`;
  }
  console.log('[AI Sync Notify]', message);
}

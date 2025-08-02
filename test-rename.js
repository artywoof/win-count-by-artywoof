// Test file for rename_preset function
import { invoke } from '@tauri-apps/api/core';

async function testRenamePreset() {
  try {
    console.log('🧪 Testing rename_preset function...');
    
    // ทดสอบเปลี่ยนชื่อ Default เป็น TestPreset
    await invoke('rename_preset', { 
      oldName: 'Default', 
      newName: 'TestPreset' 
    });
    
    console.log('✅ rename_preset function called successfully');
    
    // โหลดรายการ preset เพื่อตรวจสอบ
    const presets = await invoke('load_presets');
    console.log('📋 Current presets:', presets);
    
  } catch (error) {
    console.error('❌ Error testing rename_preset:', error);
  }
}

// รันการทดสอบ
testRenamePreset(); 
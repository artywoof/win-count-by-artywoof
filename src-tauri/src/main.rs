// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{State, Manager, menu::{MenuBuilder, MenuItemBuilder}};
use std::sync::atomic::{AtomicI32, Ordering};

// --- สร้าง State เพื่อเก็บข้อมูลของแอป ---
// เราจะใช้ AtomicI32 เพื่อให้สามารถเข้าถึงและแก้ไขค่าตัวเลขได้อย่างปลอดภัยจากหลายๆ ที่
// โดยไม่ต้องกังวลเรื่องการแย่งกันใช้งาน (thread-safe)
pub struct AppState {
    pub win_count: AtomicI32,
}

// --- Command ใหม่สำหรับเพิ่มค่า Win ---
#[tauri::command]
fn increment_win(state: State<AppState>) -> i32 {
    // เพิ่มค่าขึ้น 1 และ return ค่าใหม่กลับไป
    let new_val = state.win_count.fetch_add(1, Ordering::SeqCst) + 1;
    new_val
}

// --- Command ใหม่สำหรับลดค่า Win ---
#[tauri::command]
fn decrement_win(state: State<AppState>) -> i32 {
    // ลดค่าลง 1 และ return ค่าใหม่กลับไป
    let new_val = state.win_count.fetch_sub(1, Ordering::SeqCst) - 1;
    new_val
}

// --- Command สำหรับดึงค่าเริ่มต้น ---
#[tauri::command]
fn get_initial_win_count(state: State<AppState>) -> i32 {
    state.win_count.load(Ordering::SeqCst)
}

fn main() {
    tauri::Builder::default()
        // --- จัดการ State ที่เราสร้างขึ้น ให้ Tauri รู้จัก ---
        .manage(AppState { win_count: AtomicI32::new(0) })
        .setup(|app| {
            // Setup System Tray (Tauri v2 API)
            println!("🎯 Setting up system tray...");
            let show_menu_item = MenuItemBuilder::with_id("show", "เปิดโปรแกรม").build(app)?;
            let quit_menu_item = MenuItemBuilder::with_id("quit", "ปิดโปรแกรม").build(app)?;
            let tray_menu = MenuBuilder::new(app)
                .items(&[&show_menu_item, &quit_menu_item])
                .build()?;
            
            let tray = app.tray_by_id("main").unwrap();
            tray.set_menu(Some(tray_menu))?;
            tray.on_menu_event(move |app, event| {
                match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                }
            });
            
            tray.on_tray_icon_event(|tray, event| {
                if let tauri::tray::TrayIconEvent::Click { .. } = event {
                    if let Some(app) = tray.app_handle().get_webview_window("main") {
                        let _ = app.show();
                        let _ = app.set_focus();
                    }
                }
            });
            
            println!("✅ System tray setup completed");
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                window.hide().unwrap();
                api.prevent_close();
            }
        })
        // --- เพิ่ม Command ใหม่ๆ ของเราเข้าไปใน handler ---
        .invoke_handler(tauri::generate_handler![
            increment_win, 
            decrement_win,
            get_initial_win_count
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}



// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::atomic::{AtomicI32, Ordering};
use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use tauri::{Emitter, Manager, State};
use tauri_plugin_global_shortcut::GlobalShortcutExt;

pub struct AppState {
    pub win_count: AtomicI32,
}

#[tauri::command]
fn increment_win(state: State<AppState>) -> i32 {
    let new_val = state.win_count.fetch_add(1, Ordering::SeqCst) + 1;
    new_val
}

#[tauri::command]
fn decrement_win(state: State<AppState>) -> i32 {
    let new_val = state.win_count.fetch_sub(1, Ordering::SeqCst) - 1;
    new_val
}

#[tauri::command]
fn get_initial_win_count(state: State<AppState>) -> i32 {
    state.win_count.load(Ordering::SeqCst)
}

fn main() {
    tauri::Builder::default()
        .manage(AppState {
            win_count: AtomicI32::new(0),
        })
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let app_handle = app.handle();

            let show_item = MenuItemBuilder::with_id("show", "เปิดโปรแกรม").build(app)?;
            let quit_item = MenuItemBuilder::with_id("quit", "ปิดโปรแกรม").build(app)?;
            let tray_menu = MenuBuilder::new(app)
                .item(&show_item)
                .separator()
                .item(&quit_item)
                .build()?;

            let _tray = TrayIconBuilder::new()
                .menu(&tray_menu)
                .icon(app.default_window_icon().unwrap().clone())
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "quit" => {
                            std::process::exit(0);
                        }
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                            }
                        }
                        _ => {}
                    }
                })
                .build(app)?;
            
            let global_shortcut = app.global_shortcut();
            global_shortcut.on_shortcuts(["Alt+Equal", "Alt+Minus"], {
                let app_handle = app_handle.clone();
                move |_app, shortcut, _event| {
                    match shortcut.to_string().as_str() {
                        "Alt+Equal" | "alt+Equal" => {
                            let _ = app_handle.emit("hotkey-increment", ());
                        }
                        "Alt+Minus" | "alt+Minus" => {
                            let _ = app_handle.emit("hotkey-decrement", ());
                        }
                        _ => {}
                    }
                }
            })?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                window.hide().unwrap();
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            increment_win,
            decrement_win,
            get_initial_win_count
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}



// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::{Mutex, Arc};
use std::thread;
use tauri::{State, Emitter};
use tauri_plugin_global_shortcut::GlobalShortcutExt;
use tokio::sync::broadcast;
use futures_util::{StreamExt, SinkExt};
use tokio::runtime::Runtime;
use tokio_tungstenite::tungstenite::Message;
use tokio_tungstenite::accept_async;
use serde_json;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WinState {
    pub win: i32,  // Changed from u32 to i32 to support negative numbers
    pub goal: i32, // Changed from u32 to i32 to support negative goals
    pub show_goal: bool,
    pub show_crown: bool,
    pub current_preset: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresetData {
    pub name: String,
    pub win: i32,
    pub goal: i32,
    pub show_goal: bool,
    pub show_crown: bool,
    pub hotkeys: HotkeyConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HotkeyConfig {
    pub increase: String,
    pub decrease: String,
    pub step_size: i32,
}

impl Default for WinState {
    fn default() -> Self {
        Self {
            win: 0,
            goal: 10,
            show_goal: true,
            show_crown: true,
            current_preset: "Default".to_string(),
        }
    }
}

impl Default for HotkeyConfig {
    fn default() -> Self {
        Self {
            increase: "Alt+Equal".to_string(),
            decrease: "Alt+Minus".to_string(),
            step_size: 1,
        }
    }
}

type SharedWinState = Mutex<WinState>;

fn get_state_path() -> PathBuf {
    std::env::temp_dir().join("win_count_state.json")
}

fn load_state(path: &PathBuf) -> WinState {
    fs::read_to_string(path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn save_state(path: &PathBuf, state: &WinState) {
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let _ = fs::write(path, serde_json::to_string_pretty(state).unwrap());
}

#[tauri::command]
fn get_win_state(state: State<'_, SharedWinState>) -> WinState {
    state.lock().unwrap().clone()
}

#[tauri::command]
fn set_win_state(new_state: WinState, state: State<'_, SharedWinState>) {
    let mut s = state.lock().unwrap();
    *s = new_state.clone();
    let path = get_state_path();
    save_state(&path, &new_state);
}

#[tauri::command]
fn minimize_app(window: tauri::Window) {
    let _ = window.minimize();
}

#[tauri::command]
fn hide_to_tray(window: tauri::Window) {
    let _ = window.hide();
}

// Helper function for win state mutation and event emitting
fn change_win_with_step(app: &tauri::AppHandle, state: &SharedWinState, broadcast_tx: &tokio::sync::broadcast::Sender<WinState>, delta: i32, step: i32) {
    let mut s = state.lock().unwrap();
    let new_win = (s.win + (delta * step)).max(-9999).min(9999);  // Support negative values
    s.win = new_win;
    let _ = app.emit("state-updated", s.clone());
    let path = get_state_path();
    save_state(&path, &s);
    let _ = broadcast_tx.send(s.clone());
    
    // Emit sound event
    if delta > 0 {
        let _ = app.emit("play-increase-sound", ());
    } else {
        let _ = app.emit("play-decrease-sound", ());
    }
    
    println!("🔥 Win changed by {} (step: {}), new value: {}", delta * step, step, new_win);
}

// Helper function for win state mutation and event emitting
fn change_win(app: &tauri::AppHandle, state: &SharedWinState, broadcast_tx: &tokio::sync::broadcast::Sender<WinState>, delta: i32) {
    change_win_with_step(app, state, broadcast_tx, delta, 1);
}

#[tauri::command]
fn increase_win(app: tauri::AppHandle, state: State<'_, SharedWinState>, broadcast_tx: State<'_, broadcast::Sender<WinState>>) {
    change_win(&app, &state, &*broadcast_tx, 1);
}

#[tauri::command]
fn decrease_win(app: tauri::AppHandle, state: State<'_, SharedWinState>, broadcast_tx: State<'_, broadcast::Sender<WinState>>) {
    change_win(&app, &state, &*broadcast_tx, -1);
}

#[tauri::command]
fn increase_win_by_step(app: tauri::AppHandle, state: State<'_, SharedWinState>, broadcast_tx: State<'_, broadcast::Sender<WinState>>, step: i32) {
    change_win_with_step(&app, &state, &*broadcast_tx, 1, step);
}

#[tauri::command]
fn decrease_win_by_step(app: tauri::AppHandle, state: State<'_, SharedWinState>, broadcast_tx: State<'_, broadcast::Sender<WinState>>, step: i32) {
    change_win_with_step(&app, &state, &*broadcast_tx, -1, step);
}

#[tauri::command]
fn set_win(app: tauri::AppHandle, state: State<'_, SharedWinState>, broadcast_tx: State<'_, broadcast::Sender<WinState>>, value: i32) {
    let mut s = state.lock().unwrap();
    // Clamp value between -9999 and 9999
    let new_win = value.max(-9999).min(9999);
    s.win = new_win;
    let _ = app.emit("state-updated", s.clone());
    let path = get_state_path();
    save_state(&path, &s);
    let _ = broadcast_tx.send(s.clone());
    println!("🎯 Win set to: {}", new_win);
}

#[tauri::command]
fn set_goal(app: tauri::AppHandle, state: State<'_, SharedWinState>, broadcast_tx: State<'_, broadcast::Sender<WinState>>, value: i32) {
    let mut s = state.lock().unwrap();
    // Clamp value between -9999 and 9999  
    let new_goal = value.max(-9999).min(9999);
    s.goal = new_goal;
    let _ = app.emit("state-updated", s.clone());
    let path = get_state_path();
    save_state(&path, &s);
    let _ = broadcast_tx.send(s.clone());
    println!("🎯 Goal set to: {}", new_goal);
}

#[tauri::command]
fn toggle_goal_visibility(app: tauri::AppHandle, state: State<'_, SharedWinState>, broadcast_tx: State<'_, broadcast::Sender<WinState>>) {
    let mut s = state.lock().unwrap();
    s.show_goal = !s.show_goal;
    let _ = app.emit("state-updated", s.clone());
    let path = get_state_path();
    save_state(&path, &s);
    let _ = broadcast_tx.send(s.clone());
    println!("🎯 Goal visibility toggled to: {}", s.show_goal);
}

#[tauri::command]
fn toggle_crown_visibility(app: tauri::AppHandle, state: State<'_, SharedWinState>, broadcast_tx: State<'_, broadcast::Sender<WinState>>) {
    let mut s = state.lock().unwrap();
    s.show_crown = !s.show_crown;
    let _ = app.emit("state-updated", s.clone());
    let path = get_state_path();
    save_state(&path, &s);
    let _ = broadcast_tx.send(s.clone());
    println!("👑 Crown visibility toggled to: {}", s.show_crown);
}

#[tauri::command]
async fn copy_overlay_link() -> Result<String, String> {
    use std::process::Command;
    let overlay_url = "http://localhost:1420/overlay";
    
    // Use Windows clipboard command  
    #[cfg(windows)]
    {
        let output = Command::new("cmd")
            .args(&["/C", &format!("echo {} | clip", overlay_url)])
            .output()
            .map_err(|e| format!("Failed to copy to clipboard: {}", e))?;
            
        if output.status.success() {
            println!("📋 Copied overlay link to clipboard: {}", overlay_url);
            Ok(overlay_url.to_string())
        } else {
            Err("Failed to copy overlay link to clipboard".to_string())
        }
    }
    
    #[cfg(not(windows))]
    {
        // For non-Windows systems, just return the URL
        println!("📋 Overlay link: {}", overlay_url);
        Ok(overlay_url.to_string())
    }    
}

#[tauri::command]
fn save_preset(preset: PresetData, state: State<'_, SharedWinState>) -> Result<(), String> {
    let presets_path = std::env::temp_dir().join("win_count_presets.json");
    
    // Load existing presets
    let mut presets: Vec<PresetData> = if presets_path.exists() {
        let json = fs::read_to_string(&presets_path)
            .map_err(|e| format!("Failed to read presets: {}", e))?;
        serde_json::from_str(&json)
            .map_err(|e| format!("Failed to parse presets: {}", e))?
    } else {
        Vec::new()
    };
    
    // Remove existing preset with same name
    presets.retain(|p| p.name != preset.name);
    
    // Add new preset
    presets.push(preset.clone());
    
    // Limit to 10 presets
    if presets.len() > 10 {
        presets.remove(0);
    }
    
    // Save presets
    let json = serde_json::to_string_pretty(&presets)
        .map_err(|e| format!("Failed to serialize presets: {}", e))?;
    fs::write(&presets_path, json)
        .map_err(|e| format!("Failed to save presets: {}", e))?;
    
    // Update current state if this is the active preset
    let mut s = state.lock().unwrap();
    if s.current_preset == preset.name {
        s.win = preset.win;
        s.goal = preset.goal;
        s.show_goal = preset.show_goal;
        s.show_crown = preset.show_crown;
    }
    
    println!("💾 Saved preset: {}", preset.name);
    Ok(())
}

#[tauri::command]
fn load_presets() -> Result<Vec<PresetData>, String> {
    let presets_path = std::env::temp_dir().join("win_count_presets.json");
    
    let mut presets: Vec<PresetData> = if presets_path.exists() {
        let json = fs::read_to_string(&presets_path)
            .map_err(|e| format!("Failed to read presets: {}", e))?;
        serde_json::from_str(&json)
            .map_err(|e| format!("Failed to parse presets: {}", e))?
    } else {
        Vec::new()
    };
    
    // Ensure Default preset exists
    if !presets.iter().any(|p| p.name == "Default") {
        let default_preset = PresetData {
            name: "Default".to_string(),
            win: 0,
            goal: 10,
            show_goal: true,
            show_crown: true,
            hotkeys: HotkeyConfig::default(),
        };
        presets.insert(0, default_preset);
        
        // Save updated presets
        let json = serde_json::to_string_pretty(&presets)
            .map_err(|e| format!("Failed to serialize presets: {}", e))?;
        fs::write(&presets_path, json)
            .map_err(|e| format!("Failed to save presets: {}", e))?;
    }
    
    Ok(presets)
}

#[tauri::command]
fn load_preset(name: String, app: tauri::AppHandle, state: State<'_, SharedWinState>, broadcast_tx: State<'_, broadcast::Sender<WinState>>) -> Result<PresetData, String> {
    let presets = load_presets()?;
    let preset = presets.into_iter()
        .find(|p| p.name == name)
        .ok_or_else(|| format!("Preset '{}' not found", name))?;
    
    // Update state
    let mut s = state.lock().unwrap();
    s.win = preset.win;
    s.goal = preset.goal;
    s.show_goal = preset.show_goal;
    s.show_crown = preset.show_crown;
    s.current_preset = preset.name.clone();
    
    // Save state and broadcast
    let path = get_state_path();
    save_state(&path, &s);
    let _ = app.emit("state-updated", s.clone());
    let _ = broadcast_tx.send(s.clone());
    
    println!("📂 Loaded preset: {}", name);
    Ok(preset)
}

#[tauri::command]
fn delete_preset(name: String) -> Result<(), String> {
    if name == "Default" {
        return Err("Cannot delete Default preset".to_string());
    }
    
    let presets_path = std::env::temp_dir().join("win_count_presets.json");
    
    if !presets_path.exists() {
        return Ok(());
    }
    
    let json = fs::read_to_string(&presets_path)
        .map_err(|e| format!("Failed to read presets: {}", e))?;
    let mut presets: Vec<PresetData> = serde_json::from_str(&json)
        .map_err(|e| format!("Failed to parse presets: {}", e))?;
    
    presets.retain(|p| p.name != name);
    
    let json = serde_json::to_string_pretty(&presets)
        .map_err(|e| format!("Failed to serialize presets: {}", e))?;
    fs::write(&presets_path, json)
        .map_err(|e| format!("Failed to save presets: {}", e))?;
    
    println!("🗑️ Deleted preset: {}", name);
    Ok(())
}

#[tauri::command]
fn play_test_sounds(app: tauri::AppHandle) -> Result<(), String> {
    // Emit events for the frontend to play sounds
    let _ = app.emit("play-increase-sound", {});
    
    // Schedule the decrease sound after a short delay
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(200));
        let _ = app.emit("play-decrease-sound", {});
    });
    
    println!("🔊 Test sounds requested");
    Ok(())
}

fn start_ws_server(broadcast_tx: broadcast::Sender<WinState>) {
    thread::spawn(move || {
        let rt = Runtime::new().unwrap();
        rt.block_on(async move {
            use tokio::net::TcpListener;
            println!("🌐 Starting WebSocket server on 127.0.0.1:8080");
            let listener = TcpListener::bind("127.0.0.1:8080").await.unwrap();
            
            loop {
                match listener.accept().await {
                    Ok((stream, addr)) => {
                        println!("🔗 New WebSocket connection from: {}", addr);
                        let broadcast_tx_clone = broadcast_tx.clone();
                        
                        tokio::spawn(async move {
                            match accept_async(stream).await {
                                Ok(ws_stream) => {
                                    let (mut ws_write, mut ws_read) = ws_stream.split();
                                    let mut rx = broadcast_tx_clone.subscribe();
                                    
                                    // Send initial state (default state)
                                    let initial_state = WinState::default();
                                    let initial_msg = serde_json::to_string(&initial_state).unwrap();
                                    let _ = ws_write.send(Message::Text(initial_msg)).await;
                                    
                                    // Task to send state updates
                                    let send_task = tokio::spawn(async move {
                                        while let Ok(state) = rx.recv().await {
                                            println!("📡 Sending state update: {:?}", state);
                                            let msg = serde_json::to_string(&state).unwrap();
                                            match ws_write.send(Message::Text(msg)).await {
                                                Ok(_) => {},
                                                Err(e) => {
                                                    println!("❌ Failed to send message: {}", e);
                                                    break;
                                                }
                                            }
                                        }
                                        println!("📡 Send task ended");
                                    });
                                    
                                    // Task to handle incoming messages and keepalive
                                    let read_task = tokio::spawn(async move {
                                        while let Some(msg) = ws_read.next().await {
                                            match msg {
                                                Ok(Message::Text(_)) => {
                                                    // Handle text messages if needed
                                                },
                                                Ok(Message::Ping(_)) => {
                                                    println!("🏓 Received ping, sending pong");
                                                    // Pong will be handled automatically
                                                },
                                                Ok(Message::Close(_)) => {
                                                    println!("👋 WebSocket close message received");
                                                    break;
                                                },
                                                Err(e) => {
                                                    println!("❌ WebSocket read error: {}", e);
                                                    break;
                                                }
                                                _ => {}
                                            }
                                        }
                                        println!("📖 Read task ended");
                                    });
                                    
                                    // Wait for either task to complete
                                    tokio::select! {
                                        _ = send_task => println!("🔚 Send task completed"),
                                        _ = read_task => println!("🔚 Read task completed"),
                                    }
                                    
                                    println!("🔌 WebSocket connection closed");
                                },
                                Err(e) => {
                                    println!("❌ Failed to accept WebSocket: {}", e);
                                }
                            }
                        });
                    },
                    Err(e) => {
                        println!("❌ Failed to accept TCP connection: {}", e);
                    }
                }
            }
        });
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let path = get_state_path();
    let initial = load_state(&path);
    let shared_state = Arc::new(Mutex::new(initial));
    let (broadcast_tx, _broadcast_rx) = broadcast::channel::<WinState>(32);
    
    // Start WebSocket server
    start_ws_server(broadcast_tx.clone());
    
    tauri::Builder::default()
        .manage(Mutex::new(load_state(&get_state_path())))
        .manage(broadcast_tx.clone())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![greet, get_win_state, set_win_state, minimize_app, hide_to_tray, increase_win, decrease_win, increase_win_by_step, decrease_win_by_step, set_win, set_goal, toggle_goal_visibility, toggle_crown_visibility, copy_overlay_link, save_preset, load_presets, load_preset, delete_preset, play_test_sounds])
        .setup({
            let shared_state = Arc::clone(&shared_state);
            let broadcast_tx = broadcast_tx.clone();
            move |app| {
                let app_handle: Arc<tauri::AppHandle> = Arc::new(app.handle().clone());
                let state: Arc<SharedWinState> = Arc::clone(&shared_state);
                let gs = app_handle.global_shortcut();
                
                println!("🎮 Registering global shortcuts in setup...");
                
                // Unregister any existing shortcuts first (in case of restart)
                let _ = gs.unregister_all();
                println!("🧹 Cleared any existing shortcuts");
                
                match gs.on_shortcuts(["Alt+Equal", "Alt+Minus", "Shift+Alt+Equal", "Shift+Alt+Minus"], {
                    let app_handle: Arc<tauri::AppHandle> = Arc::clone(&app_handle);
                    let state: Arc<SharedWinState> = Arc::clone(&state);
                    let broadcast_tx = broadcast_tx.clone();
                    move |_app, shortcut, _event| {
                        let handle: Arc<tauri::AppHandle> = Arc::clone(&app_handle);
                        let win_state: Arc<SharedWinState> = Arc::clone(&state);
                        let broadcast_tx = broadcast_tx.clone();
                        let shortcut_str = shortcut.to_string();
                        println!("🔥 HOTKEY TRIGGERED: '{}' at {:?}", shortcut_str, std::time::SystemTime::now());
                        match shortcut_str.as_str() {
                            "Alt+Equal" | "alt+Equal" | "ALT+EQUAL" => {
                                println!("⬆️ Executing increase_win via hotkey Alt+Equal (+1)");
                                change_win_with_step(&handle, &win_state, &broadcast_tx, 1, 1);
                            }
                            "Alt+Minus" | "alt+Minus" | "ALT+MINUS" => {
                                println!("⬇️ Executing decrease_win via hotkey Alt+Minus (-1)");
                                change_win_with_step(&handle, &win_state, &broadcast_tx, -1, 1);
                            }
                            "Shift+Alt+Equal" | "shift+alt+Equal" | "SHIFT+ALT+EQUAL" => {
                                println!("⬆️ Executing increase_win via hotkey Shift+Alt+Equal (+10)");
                                change_win_with_step(&handle, &win_state, &broadcast_tx, 1, 10);
                            }
                            "Shift+Alt+Minus" | "shift+alt+Minus" | "SHIFT+ALT+MINUS" => {
                                println!("⬇️ Executing decrease_win via hotkey Shift+Alt+Minus (-10)");
                                change_win_with_step(&handle, &win_state, &broadcast_tx, -1, 10);
                            }
                            _ => {
                                println!("❓ Unknown hotkey format: '{}'", shortcut_str);
                            }
                        }
                    }
                }) {
                    Ok(_) => println!("✅ Global shortcuts registered successfully"),
                    Err(e) => println!("❌ Failed to register global shortcuts: {:?}", e),
                }
                
                Ok(())
            }
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                window.hide().unwrap();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

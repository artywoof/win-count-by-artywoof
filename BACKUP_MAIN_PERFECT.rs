// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::{Mutex, Arc};
use std::thread;
use std::time::{Duration, Instant};
use std::collections::HashMap;
use tauri::{State, Emitter, Manager, menu::{MenuBuilder, MenuItemBuilder}};
use tauri_plugin_global_shortcut::GlobalShortcutExt;
use tokio::sync::broadcast;
use futures_util::{StreamExt, SinkExt};
use tokio::runtime::Runtime;
use tokio_tungstenite::tungstenite::Message;
use tokio_tungstenite::accept_async;
use serde_json;

#[cfg(windows)]
use winapi::um::winuser::{GetAsyncKeyState, VK_MENU, VK_OEM_PLUS, VK_OEM_MINUS};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

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
type KeyTrackerMap = Arc<Mutex<HashMap<String, KeyEventTracker>>>;

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
fn hide_to_tray(window: tauri::Window) -> Result<(), String> {
    println!("🔒 hide_to_tray command called");
    match window.hide() {
        Ok(_) => {
            println!("✅ Window hidden to tray successfully via command");
            Ok(())
        },
        Err(e) => {
            println!("❌ Failed to hide window via command: {:?}", e);
            // Try minimizing as fallback
            match window.minimize() {
                Ok(_) => {
                    println!("✅ Window minimized as fallback via command");
                    Ok(())
                },
                Err(e2) => {
                    let error_msg = format!("Failed to hide or minimize window: {:?}", e2);
                    println!("❌ {}", error_msg);
                    Err(error_msg)
                }
            }
        }
    }
}

#[tauri::command]
fn show_from_tray(window: tauri::Window) {
    let _ = window.show();
    let _ = window.set_focus();
}

// Key event tracking for dynamic speed
#[derive(Debug, Clone)]
struct KeyEventTracker {
    last_press_time: Instant,
    press_count: u32,
    last_execution_time: Instant,
    key_down_count: u32,
    equal_presses: u32, // Count = presses while Alt is held
    last_key_state: bool, // Track the last Windows key state
}

impl Default for KeyEventTracker {
    fn default() -> Self {
        Self {
            last_press_time: Instant::now() - Duration::from_secs(1),
            press_count: 0,
            last_execution_time: Instant::now() - Duration::from_secs(1),
            key_down_count: 0,
            equal_presses: 0,
            last_key_state: false,
        }
    }
}

// Windows-specific key state checking
#[cfg(windows)]
unsafe fn is_key_physically_pressed(vk_code: i32) -> bool {
    // GetAsyncKeyState returns the key state
    // The most significant bit indicates if the key is currently pressed
    (GetAsyncKeyState(vk_code) as u16 & 0x8000) != 0
}

#[cfg(not(windows))]
fn is_key_physically_pressed(_vk_code: i32) -> bool {
    false // Fallback for non-Windows platforms
}

// Check if Alt and Equal keys are physically pressed
fn are_hotkeys_alt_equal_pressed() -> (bool, bool) {
    #[cfg(windows)]
    unsafe {
        let alt_pressed = is_key_physically_pressed(VK_MENU);
        let equal_pressed = is_key_physically_pressed(VK_OEM_PLUS); // = key
        (alt_pressed, equal_pressed)
    }
    #[cfg(not(windows))]
    {
        (false, false)
    }
}

// Check if Alt and Minus keys are physically pressed
fn are_hotkeys_alt_minus_pressed() -> (bool, bool) {
    #[cfg(windows)]
    unsafe {
        let alt_pressed = is_key_physically_pressed(VK_MENU);
        let minus_pressed = is_key_physically_pressed(VK_OEM_MINUS); // - key
        (alt_pressed, minus_pressed)
    }
    #[cfg(not(windows))]
    {
        (false, false)
    }
}

// Calculate dynamic step based on press frequency
fn calculate_dynamic_step(tracker: &KeyEventTracker) -> i32 {
    let time_since_last = tracker.last_press_time.elapsed();
    
    // If pressed rapidly (within 300ms), increase step size
    if time_since_last < Duration::from_millis(300) {
        match tracker.press_count {
            1 => 1,          // First press: always step 1
            2..=3 => 1,      // Still slow: normal step
            4..=6 => 2,      // Medium: double step
            7..=10 => 3,     // Fast: 3x step
            11..=15 => 5,    // Very fast: 5x step
            _ => 8,          // Extremely fast: 8x step
        }
    } else {
        // Reset to normal speed if paused
        1
    }
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

fn main() {
    run()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let path = get_state_path();
    let initial = load_state(&path);
    let shared_state = Arc::new(Mutex::new(initial));
    let (broadcast_tx, _broadcast_rx) = broadcast::channel::<WinState>(32);
    let key_tracker: KeyTrackerMap = Arc::new(Mutex::new(HashMap::new()));
    
    // Start WebSocket server
    start_ws_server(broadcast_tx.clone());
    
    tauri::Builder::default()
        .manage(Mutex::new(load_state(&get_state_path())))
        .manage(broadcast_tx.clone())
        .manage(key_tracker.clone())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![greet, get_win_state, set_win_state, minimize_app, hide_to_tray, show_from_tray, increase_win, decrease_win, increase_win_by_step, decrease_win_by_step, set_win, set_goal, toggle_goal_visibility, toggle_crown_visibility, copy_overlay_link, save_preset, load_presets, load_preset, delete_preset, play_test_sounds])
        .setup({
            let shared_state = Arc::clone(&shared_state);
            let broadcast_tx = broadcast_tx.clone();
            move |app| {
                let app_handle: Arc<tauri::AppHandle> = Arc::new(app.handle().clone());
                let state: Arc<SharedWinState> = Arc::clone(&shared_state);
                let gs = app_handle.global_shortcut();
                
                println!("🎮 Registering dynamic global shortcuts...");
                
                // Unregister any existing shortcuts first (in case of restart)
                let _ = gs.unregister_all();
                println!("🧹 Cleared any existing shortcuts for dynamic system");
                
                match gs.on_shortcuts(["Alt+Equal", "Alt+Minus", "Shift+Alt+Equal", "Shift+Alt+Minus"], {
                    let app_handle: Arc<tauri::AppHandle> = Arc::clone(&app_handle);
                    let state: Arc<SharedWinState> = Arc::clone(&state);
                    let broadcast_tx = broadcast_tx.clone();
                    let key_tracker = key_tracker.clone();
                    move |_app, shortcut, _event| {
                        // 🎯 ULTRA STRICT: MANDATORY Edge-detection - ONLY transitions allowed
                        // ZERO tolerance for non-transitions
                        
                        let handle: Arc<tauri::AppHandle> = Arc::clone(&app_handle);
                        let win_state: Arc<SharedWinState> = Arc::clone(&state);
                        let broadcast_tx = broadcast_tx.clone();
                        let key_tracker = key_tracker.clone();
                        let shortcut_str = shortcut.to_string();
                        
                        println!("🔥 RAW EVENT: '{}' at {:?}", shortcut_str, std::time::SystemTime::now());
                        
                        // ZERO TOLERANCE: Only TRUE edge transitions allowed
                        let step = {
                            let mut trackers = key_tracker.lock().unwrap();
                            let tracker = trackers.entry(shortcut_str.clone()).or_insert_with(KeyEventTracker::default);
                            
                            let current_time = Instant::now();
                            let time_since_last_execution = tracker.last_execution_time.elapsed();
                            
                            // Get current physical key states based on shortcut type
                            let (alt_pressed, target_key_pressed, current_combo_state) = if shortcut_str.contains("Equal") {
                                let (alt, equal) = are_hotkeys_alt_equal_pressed();
                                (alt, equal, alt && equal)
                            } else if shortcut_str.contains("Minus") {
                                let (alt, minus) = are_hotkeys_alt_minus_pressed();
                                (alt, minus, alt && minus)
                            } else {
                                (false, false, false)
                            };
                            
                            println!("🔍 STATE CHECK: Alt={}, TargetKey={}, Combo={}, LastState={}, Shortcut={}", 
                                alt_pressed, target_key_pressed, current_combo_state, tracker.last_key_state, shortcut_str);
                            
                            // RULE 1: Keys must be physically pressed
                            if !current_combo_state {
                                tracker.last_key_state = false;
                                println!("🚫 REJECT: Keys not physically pressed");
                                return;
                            }
                            
                            // RULE 2: MANDATORY edge transition - was NOT pressed before, NOW pressed
                            if tracker.last_key_state {
                                println!("🚫 REJECT: Keys already pressed - NO EDGE TRANSITION");
                                return;
                            }
                            
                            // RULE 3: Anti-double-press protection - MINIMUM 100ms between counts
                            if time_since_last_execution < Duration::from_millis(100) {
                                println!("🚫 REJECT: Too rapid ({:?}ms < 100ms)", 
                                    time_since_last_execution.as_millis());
                                return;
                            }
                            
                            // ✅ VALID EDGE TRANSITION: not pressed -> pressed
                            tracker.last_key_state = true;
                            
                            // Update tracking for valid transitions only
                            tracker.press_count += 1;
                            tracker.equal_presses += 1;
                            tracker.last_press_time = current_time;
                            tracker.last_execution_time = current_time;
                            
                            // ALWAYS step = 1: one press = +1 exactly
                            println!("✅ ACCEPTED: Alt+{}, Press #{}, Step: 1 (gap: {:?}ms, EDGE TRANSITION)", 
                                if shortcut_str.contains("Equal") { "=" } else { "-" },
                                tracker.equal_presses,
                                time_since_last_execution.as_millis());
                            1
                        };
                        
                        match shortcut_str.as_str() {
                            "Alt+Equal" | "alt+Equal" | "ALT+EQUAL" => {
                                println!("⬆️ increase_win (+1) - single press count");
                                change_win(&handle, &win_state, &broadcast_tx, 1);
                            }
                            "Alt+Minus" | "alt+Minus" | "ALT+MINUS" => {
                                println!("⬇️ decrease_win (-1) - single press count");
                                change_win(&handle, &win_state, &broadcast_tx, -1);
                            }
                            "Shift+Alt+Equal" | "shift+alt+Equal" | "SHIFT+ALT+EQUAL" => {
                                println!("⬆️⬆️ big increase_win (+10) - single press count");
                                change_win_with_step(&handle, &win_state, &broadcast_tx, 1, 10);
                            }
                            "Shift+Alt+Minus" | "shift+alt+Minus" | "SHIFT+ALT+MINUS" => {
                                println!("⬇️⬇️ big decrease_win (-10) - single press count");
                                change_win_with_step(&handle, &win_state, &broadcast_tx, -1, 10);
                            }
                            _ => {
                                println!("❓ Unknown hotkey format: '{}'", shortcut_str);
                            }
                        }
                    }
                }) {
                    Ok(_) => println!("✅ Dynamic global shortcuts registered successfully"),
                    Err(e) => println!("❌ Failed to register dynamic global shortcuts: {:?}", e),
                }
                
                // Setup System Tray
                println!("🎯 Setting up system tray...");
                let show_menu_item = MenuItemBuilder::with_id("show", "Show Win Counter").build(app)?;
                let quit_menu_item = MenuItemBuilder::with_id("quit", "Quit").build(app)?;
                let tray_menu = MenuBuilder::new(app)
                    .items(&[&show_menu_item, &quit_menu_item])
                    .build()?;
                
                let tray = app.tray_by_id("main").unwrap();
                tray.set_menu(Some(tray_menu))?;
                tray.on_menu_event({
                    let _app_handle = app_handle.clone();
                    move |app, event| {
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
                    }
                });
                
                println!("✅ System tray setup completed");
                
                println!("✅ Application setup completed");
                
                Ok(())
            }
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                println!("🔒 Close requested, attempting to hide window to tray...");
                match window.hide() {
                    Ok(_) => {
                        println!("✅ Window hidden to tray successfully");
                        api.prevent_close();
                    },
                    Err(e) => {
                        println!("❌ Failed to hide window: {:?}", e);
                        // Try alternative approach - minimize instead of hide
                        match window.minimize() {
                            Ok(_) => {
                                println!("✅ Window minimized as fallback");
                                api.prevent_close();
                            },
                            Err(e2) => {
                                println!("❌ Failed to minimize window: {:?}", e2);
                                // Last resort - allow close but don't exit app
                                api.prevent_close();
                            }
                        }
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// This is just a stub - the real app is in lib.rs

fn main() {
    win_count_by_artywoof_lib::run();
}



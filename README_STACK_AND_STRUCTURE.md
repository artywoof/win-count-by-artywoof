# Win Count by ArtYWoof – Project Stack & Structure

## Stack
- **Desktop App**: Tauri (Rust) + SvelteKit + TailwindCSS
- **Overlay**: SvelteKit (SPA/HTML) + TailwindCSS + WebSocket
- **Build Tool**: Vite
- **Auto-update**: Tauri auto-updater
- **Protection**: Rust logic, production build, code obfuscation

## Main Folders
- `/src-tauri/` : Tauri backend (Rust) – tray, hotkey, auto-update, protection
- `/src/` : SvelteKit frontend (UI, logic, overlay, etc.)
- `/public/overlay/` : Overlay HTML/JS/CSS for TikTok LIVE Studio

## Next Steps
1. Develop Desktop App UI (SvelteKit + Tailwind)
2. Implement Tauri backend (tray, hotkey, auto-update)
3. Build Overlay (real-time sync, animation)
4. Integrate all features step by step

---

> **Note:**
> - Overlay communicates with Desktop App via WebSocket (real-time)
> - All win/goal values auto-save to preset
> - Protection and auto-update will be handled by Tauri

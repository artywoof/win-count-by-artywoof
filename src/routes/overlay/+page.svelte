<script lang="ts">
  import { onMount } from 'svelte';
  import { tauriWin } from '$lib/stores';
  import { loadPreset } from '$lib/presetManager';
  
  // Current win count, goal, and display settings
  let currentWin = 0;
  let currentGoal = 10;
  let showCrown = true;
  let showGoal = true;
  let isConnected = false;
  let lastWinUpdate: number | null = null;

  // Debug info (remove later)
  let debugInfo = {
    lastMessage: null,
    messageCount: 0,
    errors: []
  };

  // Load preset and establish WebSocket connection
  onMount(async () => {
    console.log("🎮 OVERLAY: Initializing...");
    console.log("🎮 OVERLAY: Running in browser:", typeof window !== 'undefined');
    console.log("🎮 OVERLAY: BroadcastChannel available:", typeof BroadcastChannel !== 'undefined');
    console.log("🎮 OVERLAY: WebSocket available:", typeof WebSocket !== 'undefined');
    
    // Load settings from preset
    try {
      const preset = await loadPreset('Default');
      currentGoal = preset.goal || 10;
      showCrown = preset.showCrown !== false; // Default to true
      showGoal = preset.showGoal !== false;   // Default to true
      console.log("📋 OVERLAY: Loaded settings from preset:", { goal: currentGoal, showCrown, showGoal });
    } catch (err) {
      console.warn("⚠️ OVERLAY: Could not load preset, using defaults:", err);
      currentGoal = 10;
      showCrown = true;
      showGoal = true;
    }

    // Initialize BroadcastChannel FIRST (primary communication method)
    if (typeof BroadcastChannel !== 'undefined') {
      const overlayChannel = new BroadcastChannel('win-count-overlay');
      overlayChannel.onmessage = (event) => {
        const data = event.data;
        console.log("📻 OVERLAY: Received BroadcastChannel message:", data);
        console.log("📻 OVERLAY: Message type:", typeof data, "Keys:", Object.keys(data || {}));
        
        // Handle complete state object from Tauri
        if (data.win !== undefined || data.goal !== undefined || data.show_goal !== undefined || data.show_crown !== undefined) {
          console.log("📻 OVERLAY: Processing complete state from Tauri:", data);
          
          if (data.win !== undefined) {
            console.log("📻 OVERLAY: Updating win from", currentWin, "to", data.win);
            currentWin = data.win;
          }
          if (data.goal !== undefined) {
            console.log("📻 OVERLAY: Updating goal from", currentGoal, "to", data.goal);
            currentGoal = data.goal;
          }
          if (data.show_crown !== undefined) {
            console.log("📻 OVERLAY: Updating showCrown from", showCrown, "to", data.show_crown);
            showCrown = data.show_crown;
          }
          if (data.show_goal !== undefined) {
            console.log("📻 OVERLAY: Updating showGoal from", showGoal, "to", data.show_goal);
            showGoal = data.show_goal;
          }
          
          // Force UI update
          debugInfo = { ...debugInfo, lastMessage: data, messageCount: debugInfo.messageCount + 1 };
          lastWinUpdate = Date.now();
          console.log("📻 OVERLAY: State after Tauri update:", { currentWin, currentGoal, showCrown, showGoal });
        }
        // Handle legacy format from frontend (backup compatibility)
        else {
          if (data.win !== undefined) {
            console.log("📻 OVERLAY: Updating win from", currentWin, "to", data.win);
            currentWin = data.win;
          }
          if (data.goal !== undefined) {
            console.log("📻 OVERLAY: Updating goal from", currentGoal, "to", data.goal);
            currentGoal = data.goal;
          }
          if (data.showCrown !== undefined) {
            console.log("📻 OVERLAY: Updating showCrown from", showCrown, "to", data.showCrown);
            showCrown = data.showCrown;
          }
          if (data.showGoal !== undefined) {
            console.log("📻 OVERLAY: Updating showGoal from", showGoal, "to", data.showGoal);
            showGoal = data.showGoal;
          }
          
          // Force UI update
          debugInfo = { ...debugInfo, lastMessage: data, messageCount: debugInfo.messageCount + 1 };
          lastWinUpdate = Date.now();
          console.log("📻 OVERLAY: State after frontend update:", { currentWin, currentGoal, showCrown, showGoal });
        }
      };
      
      console.log("📻 OVERLAY: BroadcastChannel 'win-count-overlay' listener established");
    } else {
      console.error("❌ OVERLAY: BroadcastChannel not supported in this environment");
    }

    // WebSocket connection with reconnection (secondary communication method)
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 2000; // 2 seconds

    function connectWebSocket() {
      console.log("🔌 OVERLAY: Attempting WebSocket connection...");
      const socket = new WebSocket("ws://localhost:8080");

      socket.onopen = () => {
        console.log("🌐 OVERLAY: WebSocket connected to overlay server");
        isConnected = true;
        reconnectAttempts = 0; // Reset on successful connection
        console.log("🌐 OVERLAY: WebSocket connection established successfully");
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          debugInfo.lastMessage = data;
          debugInfo.messageCount++;
          
          console.log("📡 OVERLAY: Received WebSocket message:", data);
          
          // Handle complete state object from new Tauri backend
          if (data.win !== undefined || data.goal !== undefined || data.show_goal !== undefined || data.show_crown !== undefined) {
            console.log("🏆 OVERLAY: Processing complete state update:", data);
            
            if (data.win !== undefined) {
              console.log("🏆 OVERLAY: Win count updating from", currentWin, "to", data.win);
              currentWin = data.win;
              tauriWin.set(data.win);
            }
            
            if (data.goal !== undefined) {
              console.log("🎯 OVERLAY: Goal updating from", currentGoal, "to", data.goal);
              currentGoal = data.goal;
            }
            
            if (data.show_goal !== undefined) {
              console.log("🎯 OVERLAY: ShowGoal updating from", showGoal, "to", data.show_goal);
              showGoal = data.show_goal;
            }
            
            if (data.show_crown !== undefined) {
              console.log("👑 OVERLAY: ShowCrown updating from", showCrown, "to", data.show_crown);
              showCrown = data.show_crown;
            }
            
            lastWinUpdate = Date.now();
            console.log("🏆 OVERLAY: State updated from WebSocket:", { currentWin, currentGoal, showGoal, showCrown });
          }
          // Handle legacy win-only format (backup compatibility)
          else if (data.type === "win" && typeof data.value === "number") {
            console.log("🏆 OVERLAY: Win count updating from", currentWin, "to", data.value);
            currentWin = data.value;
            lastWinUpdate = Date.now();
            tauriWin.set(data.value);
            console.log("🏆 OVERLAY: Win count updated successfully:", currentWin);
          } else {
            console.log("📡 OVERLAY: Ignoring WebSocket message - unknown format");
          }
        } catch (err) {
          console.error("❌ OVERLAY: WebSocket message parsing error:", err);
          console.error("❌ OVERLAY: Raw message was:", event.data);
          debugInfo.errors.push(`Parse error: ${err.message}`);
        }
      };

      socket.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        isConnected = false;
      };

      socket.onclose = (event) => {
        console.warn("🔌 WebSocket disconnected:", event.code, event.reason);
        console.log("🔍 Close event details:", event);
        isConnected = false;
        
        // Attempt to reconnect only if it wasn't a normal closure
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          console.log(`🔄 Reconnecting in ${reconnectDelay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
          setTimeout(connectWebSocket, reconnectDelay);
        } else if (event.code === 1000) {
          console.log("✅ WebSocket closed normally, not reconnecting");
        } else {
          console.error("❌ Max reconnection attempts reached");
        }
      };

      return socket;
    }

    // Initial connection
    const socket = connectWebSocket();

    // Cleanup on component destroy
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  });
</script>

<div class="flex justify-center items-center h-screen">
  <div class="win-counter">
    {#if showCrown}
    <div class="crown-section">
      <img src="/assets/ui/crown.png" class="crown" alt="Crown icon" />
    </div>
    {/if}
    <div class="stats-section">
      <span class="wins">{currentWin}</span>
      {#if showGoal}
      <span class="divider">/</span>
      <span class="goal">{currentGoal}</span>
      {/if}
    </div>
  </div>
  
  <!-- Debug Panel (temporary - remove after testing) -->
  <div class="debug-panel">
    <div class="debug-header">🔧 Debug Info</div>
    <div class="debug-item">
      <span class="debug-label">WebSocket:</span>
      <span class="debug-value" class:connected={isConnected} class:disconnected={!isConnected}>
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </span>
    </div>
    <div class="debug-item">
      <span class="debug-label">Win Count:</span>
      <span class="debug-value">{currentWin}</span>
    </div>
    <div class="debug-item">
      <span class="debug-label">Goal:</span>
      <span class="debug-value">{currentGoal}</span>
    </div>
    <div class="debug-item">
      <span class="debug-label">Show Crown:</span>
      <span class="debug-value">{showCrown ? '✅' : '❌'}</span>
    </div>
    <div class="debug-item">
      <span class="debug-label">Show Goal:</span>
      <span class="debug-value">{showGoal ? '✅' : '❌'}</span>
    </div>
    <div class="debug-item">
      <span class="debug-label">Messages:</span>
      <span class="debug-value">{debugInfo.messageCount}</span>
    </div>
    <div class="debug-item">
      <span class="debug-label">Last Update:</span>
      <span class="debug-value">{lastWinUpdate ? new Date(lastWinUpdate).toLocaleTimeString() : 'Never'}</span>
    </div>
  </div>
</div>

<style>
  @font-face {
    font-family: "MiSansThai";
    src: url("/assets/fonts/MiSansThaiVF.ttf") format("truetype");
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }

  /* Main Container */
  .win-counter {
    display: inline-flex;
    align-items: center;
    gap: 15px;
    padding: 18px 28px;
    background: linear-gradient(135deg, 
      rgba(5, 5, 15, 0.95) 0%, 
      rgba(10, 8, 25, 0.98) 50%, 
      rgba(5, 5, 15, 0.95) 100%
    );
    border-radius: 50px;
    position: relative;
    
    /* Clean subtle border */
    border: 1px solid rgba(0, 255, 255, 0.3);
    box-shadow: 
      0 0 0 1px rgba(0, 200, 255, 0.2),
      0 0 8px rgba(0, 255, 255, 0.15),
      0 0 16px rgba(100, 0, 255, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
  }

  .win-counter:hover {
    border-color: rgba(0, 255, 255, 0.5);
    box-shadow: 
      0 0 0 1px rgba(0, 200, 255, 0.4),
      0 0 12px rgba(0, 255, 255, 0.25),
      0 0 24px rgba(100, 0, 255, 0.15);
  }

  /* Crown Section */
  .crown-section {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .crown {
    width: 70px;
    height: 70px;
    object-fit: contain;
    filter: 
      brightness(1.1)
      drop-shadow(0 0 6px rgba(255, 215, 0, 0.6))
      drop-shadow(0 0 12px rgba(255, 165, 0, 0.3));
    transition: filter 0.3s ease;
  }

  .crown:hover {
    filter: 
      brightness(1.2)
      drop-shadow(0 0 8px rgba(255, 215, 0, 0.8))
      drop-shadow(0 0 16px rgba(255, 165, 0, 0.4));
  }

  /* Stats Section */
  .stats-section {
    display: flex;
    align-items: baseline;
    font-family: "MiSansThai", 'Segoe UI', system-ui, sans-serif;
    font-weight: 800;
    line-height: 0.9;
    letter-spacing: -1px;
  }

  .wins {
    font-size: 72px;
    color: #00f5ff;
    text-shadow: 
      0 0 4px rgba(0, 245, 255, 0.8),
      0 1px 0 rgba(0, 150, 200, 0.5);
    transition: all 0.3s ease;
  }

  .divider {
    font-size: 60px;
    color: rgba(120, 150, 255, 0.7);
    margin: 0 6px;
    font-weight: 300;
    text-shadow: 0 0 4px rgba(120, 150, 255, 0.3);
  }

  .goal {
    font-size: 72px;
    color: #ff1493;
    text-shadow: 
      0 0 4px rgba(255, 20, 147, 0.8),
      0 1px 0 rgba(200, 0, 100, 0.5);
    transition: all 0.3s ease;
  }

  /* Subtle Animations */
  @keyframes pulse-glow {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }

  .wins:hover, .goal:hover {
    transform: scale(1.05);
    text-shadow: 
      0 0 8px currentColor,
      0 2px 0 rgba(0, 0, 0, 0.3);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .win-counter {
      gap: 10px;
      padding: 15px 22px;
    }
    
    .crown {
      width: 60px;
      height: 60px;
    }
    
    .wins, .goal {
      font-size: 60px;
    }
    
    .divider {
      font-size: 48px;
    }
  }

  /* Debug Panel Styles (temporary) */
  .debug-panel {
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.9);
    border: 1px solid rgba(0, 255, 255, 0.3);
    border-radius: 8px;
    padding: 12px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: #00ff00;
    min-width: 250px;
    backdrop-filter: blur(10px);
    z-index: 1000;
  }

  .debug-header {
    color: #00f5ff;
    font-weight: bold;
    margin-bottom: 8px;
    text-align: center;
    border-bottom: 1px solid rgba(0, 255, 255, 0.2);
    padding-bottom: 4px;
  }

  .debug-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
    gap: 8px;
  }

  .debug-label {
    color: #888;
    min-width: 80px;
  }

  .debug-value {
    color: #00ff00;
    font-weight: bold;
    word-break: break-all;
  }

  .debug-value.connected {
    color: #00ff00;
  }

  .debug-value.disconnected {
    color: #ff4444;
  }
</style>

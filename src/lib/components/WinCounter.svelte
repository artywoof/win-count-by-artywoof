<!-- ================================================================= -->
<!-- FILE: src/lib/components/WinCounter.svelte                        -->
<!-- ACTION: Replace the entire content of this file.                -->
<!-- PURPOSE: Significantly reduce the size of the crown icon.       -->
<!-- ================================================================= -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { tauriWin } from '../stores';
  import { invoke } from '@tauri-apps/api/core';
  import { listen, type UnlistenFn } from '@tauri-apps/api/event';
  import EditableNumber from './EditableNumber.svelte';

  let unlistenIncrement: UnlistenFn | null = null;
  let unlistenDecrement: UnlistenFn | null = null;
  let isEditing = false;
  let editValue = '';
  let inputElement: HTMLInputElement;

  $: winCount = $tauriWin.win;
  $: showCrown = $tauriWin.show_crown || false;

  onMount(async () => {
    try {
      unlistenIncrement = await listen("hotkey-increment", () => {
        handleIncrement();
      });

      unlistenDecrement = await listen("hotkey-decrement", () => {
        handleDecrement();
      });

    } catch (e) {
      console.error("Error setting up WinCounter listeners:", e);
    }
  });

  onDestroy(() => {
    if (unlistenIncrement) unlistenIncrement();
    if (unlistenDecrement) unlistenDecrement();
  });

  async function handleIncrement() {
    try {
      await invoke('increase_win');
    } catch (e) {
      console.error("Error incrementing win count:", e);
    }
  }

  async function handleDecrement() {
    try {
      await invoke('decrease_win');
    } catch (e) {
      console.error("Error decrementing win count:", e);
    }
  }

  function startEditing() {
    if (isEditing) return;
    console.log("Starting edit mode, current value:", $tauriWin.win);
    isEditing = true;
    editValue = $tauriWin.win.toString();
    setTimeout(() => {
      if (inputElement) {
        console.log("Focusing input element");
        inputElement.focus();
        inputElement.select();
      }
    }, 10);
  }

  function cancelEditing() {
    isEditing = false;
    editValue = '';
  }

  async function saveEdit() {
    try {
      console.log("Saving edit, value:", editValue);
      const newValue = parseInt(editValue);
      if (isNaN(newValue)) {
        console.error("Invalid number:", editValue);
        cancelEditing();
        return;
      }
      
      console.log("Invoking set_win with value:", newValue);
      await invoke('set_win', { value: newValue });
      console.log("Successfully set win count to:", newValue);
      isEditing = false;
      editValue = '';
    } catch (e) {
      console.error("Error setting win count:", e);
      cancelEditing();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      saveEdit();
    } else if (event.key === 'Escape') {
      cancelEditing();
    }
  }

  function handleBlur() {
    // Small delay to allow click events to register first
    setTimeout(() => {
      if (isEditing) {
        saveEdit();
      }
    }, 100);
  }
</script>

<div class="win-counter-iphone">
  <div class="win-header">
    <span class="win-title">WIN</span>
    {#if showCrown}
      <img src="/assets/ui/app_crown.png" alt="Crown" class="crown-icon-iphone" />
    {/if}
  </div>
  <EditableNumber value={$tauriWin.win} min={-10000} max={10000} on:change={e => tauriWin.update(v => ({...v, win: e.detail}))} />
  <div class="win-actions">
    <button class="win-btn-iphone minus" on:click={handleDecrement}>-</button>
    <button class="win-btn-iphone plus" on:click={handleIncrement}>+</button>
  </div>
</div>

<style>
  .win-counter-iphone {
    background: #fff;
    border-radius: 24px;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.06);
    padding: 24px 0 16px 0;
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 220px;
    max-width: 320px;
  }
  .win-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }
  .win-title {
    font-size: 1.3rem;
    color: #6366f1;
    font-weight: 600;
    letter-spacing: 0.01em;
  }
  .crown-icon-iphone {
    width: 36px;
    height: 36px;
    margin-left: 4px;
  }
  .win-number-iphone {
    font-size: 3.2rem;
    font-weight: 600;
    color: #2d2d2d;
    letter-spacing: 0.04em;
    background: #f6f6fa;
    border-radius: 18px;
    padding: 12px 32px;
    margin-bottom: 12px;
    box-shadow: 0 1px 4px 0 rgba(0,0,0,0.04);
    transition: all 0.2s ease;
  }
  
  .win-number-iphone.clickable {
    cursor: pointer;
    user-select: none;
  }
  
  .win-number-iphone.clickable:hover {
    background: #eef0ff;
    box-shadow: 0 2px 8px 0 rgba(99,102,241,0.1);
    transform: translateY(-1px);
  }
  
  .win-number-iphone.clickable:focus {
    border-color: #4f46e5;
    box-shadow: 0 4px 20px 0 rgba(99,102,241,0.25);
  }
  .win-actions {
    display: flex;
    gap: 18px;
    margin-top: 8px;
  }
  .win-btn-iphone {
    background: linear-gradient(90deg, #e0e7ff 0%, #c7d2fe 100%);
    color: #2d2d2d;
    font-size: 1.6rem;
    font-weight: 700;
    border-radius: 18px;
    border: none;
    padding: 8px 24px;
    box-shadow: 0 2px 8px 0 rgba(0,0,0,0.07);
    transition: background 0.2s, box-shadow 0.2s;
    cursor: pointer;
  }
  .win-btn-iphone.plus {
    background: linear-gradient(90deg, #a5b4fc 0%, #818cf8 100%);
    color: #fff;
  }
  .win-btn-iphone.minus {
    background: linear-gradient(90deg, #fca5a5 0%, #f87171 100%);
    color: #fff;
  }
  .win-btn-iphone:active {
    box-shadow: 0 4px 16px 0 rgba(99,102,241,0.13);
  }
</style>

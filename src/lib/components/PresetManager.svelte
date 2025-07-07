<!-- ================================================================= -->
<!-- FILE: src/lib/components/PresetManager.svelte                   -->
<!-- ACTION: Create this new file.                                   -->
<!-- PURPOSE: A placeholder component for the Preset Management UI.  -->
<!-- ================================================================= -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  function goBack() {
    dispatch('back');
  }
</script>

<div class="preset-iphone">
  <header class="preset-header-iphone">
    <h1 class="preset-title-iphone">Preset Management</h1>
    <button class="preset-close-iphone" on:click={goBack} aria-label="ย้อนกลับ">×</button>
  </header>
  <div class="preset-content-iphone">
    <p class="preset-desc-iphone">Preset management UI is under construction.</p>
  </div>
</div>
<style>
  .preset-iphone {
    width: 100%;
    height: 100%;
    padding: 32px 24px 24px 24px;
    background: #fff;
    border-radius: 32px;
    box-shadow: 0 8px 32px 0 rgba(31,38,135,0.10);
    display: flex;
    flex-direction: column;
    color: #222;
  }
  .preset-header-iphone {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }
  .preset-title-iphone {
    font-size: 2.1rem;
    font-weight: 700;
    color: #6366f1;
    letter-spacing: 0.01em;
  }
  .preset-close-iphone {
    background: #f3f4f6;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    font-size: 2rem;
    color: #6366f1;
    cursor: pointer;
    transition: background 0.2s;
  }
  .preset-close-iphone:hover {
    background: #e0e7ff;
  }
  .preset-content-iphone {
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .preset-desc-iphone {
    color: #7c7c7c;
    font-size: 1.1rem;
  }
</style>

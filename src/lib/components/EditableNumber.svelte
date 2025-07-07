<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Action } from 'svelte/action';

  export let value: number;
  export let min: number = -10000;
  export let max: number = 10000;
  export let extraClasses: string = '';

  let isEditing = false;
  let inputValue: number = value;
  const dispatch = createEventDispatcher();

  const focusAndSelect: Action = (node) => {
    node.focus();
    node.select();
  };

  function handleContainerClick() {
    isEditing = true;
    inputValue = value;
  }

  function handleBlur() {
    let finalValue = isNaN(inputValue) ? value : inputValue;
    if (finalValue < min) finalValue = min;
    if (finalValue > max) finalValue = max;

    value = finalValue;
    dispatch('change', value);
    isEditing = false;
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') (event.target as HTMLInputElement).blur();
    if (event.key === 'Escape') isEditing = false;
  }

  $: if (!isEditing) {
    inputValue = value;
  }
</script>

<div 
  class="relative flex items-center justify-center cursor-pointer {extraClasses}"
  style="-webkit-app-region: no-drag;"
  on:click={handleContainerClick}
  role="button"
  tabindex="0"
  on:keydown={(e) => e.key === 'Enter' && handleContainerClick()}
>
  {#if isEditing}
    <input
      type="number"
      bind:value={inputValue}
      on:blur={handleBlur}
      on:keydown={handleKeyDown}
      class="w-full h-full text-center bg-transparent border-none outline-none text-5xl font-bold"
      use:focusAndSelect
    />
  {:else}
    <span class="text-5xl font-bold select-none">
      {value}
    </span>
  {/if}
</div>

<style>
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type=number] {
    -moz-appearance: textfield;
  }
</style> 
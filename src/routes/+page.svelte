<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  onMount(() => {
    goto('/app');
  });
</script>

<div style="padding:16px;color:#fff;font-family:system-ui">Redirecting to app…</div>



<script lang="ts">
  import EditableNumber from './EditableNumber.svelte';
  let goalCount: number = 10;
</script>

<div class="goal-iphone">
  <span class="goal-label-iphone">GOAL</span>
  <EditableNumber value={goalCount} min={-10000} max={10000} on:change={e => goalCount = e.detail} />
</div>

<style>
  .goal-iphone {
    background: #f6f6fa;
    border-radius: 18px;
    padding: 18px 32px;
    margin-top: 6px;
    box-shadow: 0 1px 4px 0 rgba(0,0,0,0.04);
    font-size: 2.1rem;
    color: #4b4b4b;
    font-weight: 500;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 180px;
    max-width: 320px;
  }
  .goal-label-iphone {
    font-size: 1.2rem;
    color: #6366f1;
    font-weight: 600;
    margin-bottom: 4px;
    letter-spacing: 0.01em;
  }
  .goal-value-iphone {
    font-size: 2.6rem;
    font-weight: 700;
    color: #2d2d2d;
    letter-spacing: 0.04em;
    background: #fff;
    border-radius: 12px;
    padding: 8px 24px;
    margin-top: 4px;
    box-shadow: 0 1px 4px 0 rgba(0,0,0,0.04);
  }
</style>

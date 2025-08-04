<script>
  import "../app.css";
  import { page } from '$app/stores';
  
  $: isOverlay = $page.route.id === '/overlay';
</script>

{#if isOverlay}
  <!-- Overlay page - no gradient border, fully transparent -->
  <div class="overlay-root">
    <slot />
  </div>
{:else}
  <!-- Normal pages - with gradient border -->
<div class="gradient-border-container">
  <div class="w-full h-full bg-[#040319] rounded-[35px] overflow-visible relative z-50 box-border">
    <slot />
  </div>
</div>
{/if}

<style>
  .overlay-root {
    width: 100vw;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    margin: 0;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 0;
    box-sizing: border-box;
    z-index: 1;
  }
  
  .gradient-border-container {
    width: 100vw;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    margin: 0;
    padding: 5px;
    --rotation: 0deg;
    background: conic-gradient(from var(--rotation), 
      #ff0080 0%,    /* Hot Pink */
      #ff1f00 5%,    /* Red-Orange */
      #ff4000 10%,   /* Orange */
      #ff6000 15%,   /* Deep Orange */
      #ff8000 20%,   /* Golden Orange */
      #ffaa00 25%,   /* Gold */
      #ffd400 30%,   /* Yellow Gold */
      #ffff00 35%,   /* Pure Yellow */
      #ccff00 40%,   /* Lime Yellow */
      #80ff00 45%,   /* Lime Green */
      #40ff00 50%,   /* Bright Green */
      #00ff40 55%,   /* Green Cyan */
      #00ff80 60%,   /* Aqua Green */
      #00ffcc 65%,   /* Turquoise */
      #00ccff 70%,   /* Sky Blue */
      #0080ff 75%,   /* Bright Blue */
      #0040ff 80%,   /* Deep Blue */
      #4000ff 85%,   /* Purple Blue */
      #8000ff 90%,   /* Purple */
      #cc00ff 95%,   /* Magenta Purple */
      #ff0080 100%); /* Back to Hot Pink */
    border-radius: 40px;
    box-sizing: border-box;
    z-index: 50;
    animation: smooth-rotate 8s linear infinite;
    pointer-events: none;
    isolation: isolate;
  }
  
  .gradient-border-container > div {
    background: #040319;
    border-radius: 35px;
    margin: 0;
    width: calc(100% - 0px);
    height: calc(100% - 0px);
    pointer-events: auto;
    isolation: isolate;
  }
  
  @keyframes smooth-rotate {
    0% { --rotation: 0deg; }
    100% { --rotation: 360deg; }
  }
  
  @property --rotation {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }
</style>

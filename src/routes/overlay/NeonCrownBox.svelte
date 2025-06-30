<script lang="ts">
  export let win: number = 0;
  export let goal: number = 10;
</script>

<div class="relative z-10 px-[2vw] py-[1vw] min-w-[300px] rounded-[1vw] bg-[#0d0d0d] flex items-center gap-[1.5vw] shadow-[0_0_24px_rgba(0,255,255,0.5)]">
  <!-- glow background layer -->
  <div class="absolute inset-0 rounded-[1vw] z-[-1] bg-gradient-to-r from-cyan-400 to-pink-500 blur-[2vw] opacity-50"></div>

  <img
    src="/assets/ui/crown.png"
    alt="Crown Icon"
    class="w-[3vw] h-[3vw] object-contain drop-shadow-[0_0_12px_#ffc107] pointer-events-none select-none"
  />

  <div class="flex text-[3.5vw] font-bold">
    <span class="text-cyan-400" style="text-shadow: 0 0 12px #00ffff">{win}</span>
    <span class="mx-[0.8vw] text-cyan-200">/</span>
    <span class="text-pink-500" style="text-shadow: 0 0 12px #ff00ff">{goal}</span>
  </div>
</div>

<script lang="ts">
  import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	// Stores for overlay data
	const winCount = writable(0);
	const goalCount = writable(0);
	const isCompact = writable(false);

	let ws: WebSocket | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
	const reconnectDelay = 1000;

	// Animation states
	let animating = false;
	let lastWinCount = 0;
	let lastGoalCount = 0;
	
	// Simple animation states
	let isWinAnimating = false;
	let isGoalAnimating = false;

	// Calculate container width based on number length
	$: winLength = Math.abs($winCount).toString().length;
	$: goalLength = Math.abs($goalCount).toString().length;
	$: maxLength = Math.max(winLength, goalLength);
	
	// Calculate total character count including minus signs
	$: winCharCount = $winCount.toString().length; // includes minus sign
	$: goalCharCount = $goalCount.toString().length; // includes minus sign
	$: totalCharCount = winCharCount + goalCharCount + 1; // +1 for slash
	
	// Lock crown position at fixed offset
	$: crownOffset = -16;
	
	// Calculate container width based on total characters - progressive 98px increments
	$: containerWidth = totalCharCount <= 3 ? 396 :   // e.g., 1/2 = 3 chars (reduced by 98px + 18px)
	                    totalCharCount <= 4 ? 494 :   // e.g., -9/9 = 4 chars (original + 18px)
	                    totalCharCount <= 5 ? 592 :   // e.g., -99/9 = 5 chars (base + 98px + 18px)
	                    totalCharCount <= 6 ? 690 :   // e.g., -99/99 = 6 chars (590 + 98px + 18px)
	                    totalCharCount <= 7 ? 788 :   // e.g., -99/999 = 7 chars (688 + 98px + 18px)
	                    totalCharCount <= 8 ? 886 :   // e.g., -10000/9 = 8 chars (786 + 98px + 18px)
	                    totalCharCount <= 9 ? 984 :   // e.g., -9999/999 = 9 chars (884 + 98px + 18px)
	                    totalCharCount <= 10 ? 1082 : // e.g., -9999/9999 = 10 chars (982 + 98px + 18px)
	                    totalCharCount <= 11 ? 1180 : // e.g., -10000/9999 = 11 chars (1080 + 98px + 18px)
	                    totalCharCount <= 12 ? 1278 : // e.g., -10000/10000 = 12 chars (1178 + 98px + 18px)
	                    1376;
	
	// Keep all sizes fixed at original values but increased
	$: crownSize = 158;
	$: winFontSize = 180;
	$: goalFontSize = 180;
	$: slashFontSize = 160;

	// WebSocket connection
    function connectWebSocket() {
		try {
			ws = new WebSocket('ws://localhost:777');

			ws.onopen = () => {
				console.log('🔗 WebSocket connected to overlay bridge');
				reconnectAttempts = 0;
      };

			ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
					console.log('📥 WebSocket received:', data);
          
					// Handle direct state object from server
            if (data.win !== undefined) {
						const newCount = parseInt(data.win);
						const difference = newCount - lastWinCount;
						console.log('🔢 Win count change:', { newCount, lastWinCount, difference });
						if (newCount !== lastWinCount) {
							// Update stores first
							winCount.set(newCount);
							console.log('🎬 Calling triggerAnimation for win with difference:', difference);
							// Trigger animation with the calculated difference
							triggerAnimationWithDifference('win', difference);
							// Update lastWinCount AFTER animation
							lastWinCount = newCount;
						} else {
							console.log('⚠️ Win count unchanged, no animation');
						}
            }
            
            if (data.goal !== undefined) {
						const newGoal = parseInt(data.goal);
						const difference = newGoal - lastGoalCount;
						console.log('🔢 Goal count change:', { newGoal, lastGoalCount, difference });
						if (newGoal !== lastGoalCount) {
							// Update stores first
							goalCount.set(newGoal);
							console.log('🎬 Calling triggerAnimation for goal with difference:', difference);
							// Trigger animation with the calculated difference
							triggerAnimationWithDifference('goal', difference);
							// Update lastGoalCount AFTER animation
							lastGoalCount = newGoal;
						} else {
							console.log('⚠️ Goal count unchanged, no animation');
						}
            }
            
            if (data.show_goal !== undefined) {
						// Handle show_goal visibility if needed
            }
            
            if (data.show_crown !== undefined) {
						// Handle show_crown visibility if needed
					}
					
					// Also handle the old format for backward compatibility
					if (data.type === 'winCount') {
						const newCount = parseInt(data.value);
						const difference = newCount - lastWinCount;
						console.log('🔢 Win count change (old format):', { newCount, lastWinCount, difference });
						if (newCount !== lastWinCount) {
							// Update stores first
							winCount.set(newCount);
							console.log('🎬 Calling triggerAnimation for win (old format) with difference:', difference);
							// Trigger animation with the calculated difference
							triggerAnimationWithDifference('win', difference);
							// Update lastWinCount AFTER animation
							lastWinCount = newCount;
						} else {
							console.log('⚠️ Win count unchanged (old format), no animation');
						}
					} else if (data.type === 'goalCount') {
						const newGoal = parseInt(data.value);
						const difference = newGoal - lastGoalCount;
						console.log('🔢 Goal count change (old format):', { newGoal, lastGoalCount, difference });
						if (newGoal !== lastGoalCount) {
							// Update stores first
							goalCount.set(newGoal);
							console.log('🎬 Calling triggerAnimation for goal (old format) with difference:', difference);
							// Trigger animation with the calculated difference
							triggerAnimationWithDifference('goal', difference);
							// Update lastGoalCount AFTER animation
							lastGoalCount = newGoal;
          } else {
							console.log('⚠️ Goal count unchanged (old format), no animation');
          }
					} else if (data.type === 'compact') {
						isCompact.set(data.value);
        }
				} catch (error) {
					console.error('Error parsing WebSocket message:', error);
				}
      };

			ws.onclose = () => {
				console.log('🔗 WebSocket disconnected from overlay bridge');
				if (reconnectAttempts < maxReconnectAttempts) {
					setTimeout(() => {
          reconnectAttempts++;
						connectWebSocket();
					}, reconnectDelay);
				}
			};

			ws.onerror = (error) => {
				console.error('❌ WebSocket error:', error);
			};
		} catch (error) {
			console.error('❌ Failed to connect WebSocket:', error);
		}
	}

	// AAA-level Animation System with difference
	function triggerAnimationWithDifference(type: 'win' | 'goal', difference: number) {
		console.log('🎬 Animation triggered with difference:', type, 'Difference:', difference);
		console.log('🔍 Animation states:', { isWinAnimating, isGoalAnimating });
		
		if (type === 'win' && isWinAnimating) {
			console.log('🚫 Win animation already in progress, skipping');
			return;
		}
		
		if (type === 'goal' && isGoalAnimating) {
			console.log('🚫 Goal animation already in progress, skipping');
			return;
		}
		
		if (difference === 0) {
			console.log('🚫 No difference in values, skipping animation');
			return;
		}
		
		const animationType = difference > 0 ? 'increase' : 'decrease';
		const isLargeChange = Math.abs(difference) >= 10;
		
		console.log('🎭 Animation type:', animationType, 'Large change:', isLargeChange);
		
		if (type === 'win') {
			isWinAnimating = true;
			console.log('✅ Win animation started');
		} else {
			isGoalAnimating = true;
			console.log('✅ Goal animation started');
		}
		
		// Trigger simple animation
		console.log('🚀 Triggering simple animation...');
		triggerNumberAnimation(type, animationType, isLargeChange);
		
		// Reset animation states - much faster reset
		setTimeout(() => {
			if (type === 'win') {
				isWinAnimating = false;
				console.log('🔄 Win animation reset');
			} else {
				isGoalAnimating = false;
				console.log('🔄 Goal animation reset');
			}
		}, 100);
	}

	// AAA-level Animation System
	function triggerAnimation(type: 'win' | 'goal' | 'reset') {
		console.log('🎬 Animation triggered:', type, 'Win:', $winCount, 'Goal:', $goalCount);
		console.log('🔍 Animation states:', { isWinAnimating, isGoalAnimating });
		
		if (type === 'reset') {
			console.log('🚫 Skipping reset type');
			return; // Skip reset type
		}
		
		if (type === 'win' && isWinAnimating) {
			console.log('🚫 Win animation already in progress, skipping');
			return;
		}
		
		if (type === 'goal' && isGoalAnimating) {
			console.log('🚫 Goal animation already in progress, skipping');
			return;
		}
		
		const currentValue = type === 'win' ? $winCount : $goalCount;
		const lastValue = type === 'win' ? lastWinCount : lastGoalCount;
		const difference = currentValue - lastValue;
		
		console.log('🔢 Value change:', { currentValue, lastValue, difference });
		
		if (difference === 0) {
			console.log('🚫 No difference in values, skipping animation');
			return;
		}
		
		const animationType = difference > 0 ? 'increase' : 'decrease';
		const isLargeChange = Math.abs(difference) >= 10;
		
		console.log('🎭 Animation type:', animationType, 'Large change:', isLargeChange);
		
		if (type === 'win') {
			isWinAnimating = true;
			console.log('✅ Win animation started');
		} else {
			isGoalAnimating = true;
			console.log('✅ Goal animation started');
		}
		
		// Trigger simple animation only
		console.log('🚀 Triggering simple animation...');
		triggerNumberAnimation(type, animationType, isLargeChange);
		// triggerColorFlash(type, animationType); // Disabled - user doesn't like the flashing border
		
		// Reset animation states - much faster reset
		setTimeout(() => {
			if (type === 'win') {
				isWinAnimating = false;
				console.log('🔄 Win animation reset');
        } else {
				isGoalAnimating = false;
				console.log('🔄 Goal animation reset');
			}
		}, 100);
	}
	

	
	// Enhanced number animation with multiple effects
	function triggerNumberAnimation(type: 'win' | 'goal', animationType: 'increase' | 'decrease', isLarge = false) {
		const element = document.querySelector(`.${type}-number`) as HTMLElement;
		if (!element) {
			console.log('❌ Element not found for number animation:', `.${type}-number`);
			return;
		}
		
		console.log('🎭 Applying simple bounce animation to:', element, 'Type:', animationType);
		
		// เฉพาะ Scale Punch เท่านั้น - เด้งเร็วและทันใจ
		const scaleIntensity = 1.1; // เด้งเบาๆ เหมือนกันทุกครั้ง
		const duration = 120; // เร็วขึ้นมาก เพื่อให้ทันกับการกดคีย์ลัด
		
		// Add CSS animation classes
		element.classList.add('animating');
		
		// เฉพาะ Scale Punch - ไม่มีเอฟเฟคอื่น
		triggerScalePunch(element, scaleIntensity, duration);
		
		// Remove animation classes after duration
		setTimeout(() => {
			element.classList.remove('animating');
			console.log('🧹 Removed animation classes from:', element);
		}, duration);
	}
	
	// Scale Punch Effect - เด้งแรงๆ แบบเรียบง่าย ไม่กระพิบ
	function triggerScalePunch(element: HTMLElement, intensity: number, duration: number) {
		console.log('👊 Simple Scale Punch triggered:', element.className, 'Intensity:', intensity, 'Duration:', duration);
		
		// เด้งแรงๆ แบบเรียบง่าย - ไม่หมุน ไม่เปลี่ยนสี
		const transform = `scale(${intensity})`;
		
		element.style.transform = transform;
		console.log('🎯 Applied simple scale punch:', { transform });
		
		// กลับปกติเร็วๆ - ทันใจ
		setTimeout(() => {
			element.style.transform = 'scale(1)';
			console.log('🏁 Scale punch completed');
		}, duration * 0.6); // กลับปกติเร็วกว่า duration เล็กน้อย
	}

	// Color flash effect
	function triggerColorFlash(type: 'win' | 'goal', animationType: 'increase' | 'decrease') {
		// Try multiple selectors to find the border element
		const pill = document.querySelector('.neon-pill') as HTMLElement ||
		             document.querySelector('.overlay-container') as HTMLElement;
		
		if (!pill) {
			console.log('❌ No element found for color flash');
			return;
		}
		
		console.log('🎨 Applying color flash to:', pill.className);
		
		const flashColor = animationType === 'increase' ? 
			'rgba(0, 255, 0, 0.3)' : 'rgba(255, 68, 68, 0.3)';
		
		// Apply flash effect
		pill.style.boxShadow = `0 0 40px ${flashColor}, inset 0 0 40px ${flashColor}`;
		console.log('✨ Applied color flash:', flashColor);
		
		setTimeout(() => {
			pill.style.boxShadow = '';
			console.log('🧹 Color flash cleared');
		}, 200); // Faster flash fade
	}

	// Load initial data from localStorage
	function loadInitialData() {
		try {
			const storedWinCount = localStorage.getItem('winCount');
			const storedGoalCount = localStorage.getItem('goalCount');
			const storedCompact = localStorage.getItem('isCompact');
			
			if (storedWinCount) {
				const count = parseInt(storedWinCount);
				winCount.set(count);
				lastWinCount = count;
			}
			
			if (storedGoalCount) {
				const goal = parseInt(storedGoalCount);
				goalCount.set(goal);
				lastGoalCount = goal;
			}
			
			if (storedCompact) {
				isCompact.set(storedCompact === 'true');
			}
		} catch (error) {
			console.error('Error loading initial data:', error);
		}
	}

	onMount(() => {
		loadInitialData();
		connectWebSocket();
		
    return () => {
			if (ws) {
				ws.close();
			}
    };
  });
</script>

<svelte:head>
	<title>Win Count Overlay</title>
	<style>
		@font-face {
			font-family: 'MiSansThai-Medium';
			src: url('/assets/fonts/MiSansThai-Medium.ttf') format('truetype');
			font-display: swap;
		}
		
		:global(html) {
			background: transparent !important;
		}
		
		:global(body) {
			margin: 0;
			padding: 0;
			background: transparent !important;
			overflow: hidden;
			font-family: 'MiSansThai-Medium', 'MiSansThai', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		}
		
		:global(*) {
			box-sizing: border-box;
		}
	</style>
</svelte:head>

<div class="overlay-container">
	<div class="neon-pill" style="--crown-size: {crownSize}px; --win-font-size: {winFontSize}px; --slash-font-size: {slashFontSize}px; --goal-font-size: {goalFontSize}px; --container-width: {containerWidth}px; --crown-offset: {crownOffset}px;">
		<div class="content-wrapper">
			<img src="/assets/ui/crown.png" alt="Crown" class="crown-icon" draggable="false" />
			<span class="win-number" class:negative={$winCount < 0}>{$winCount}</span>
			<span class="slash">/</span>
			<span class="goal-number">{$goalCount}</span>
    </div>
  </div>
  
  <!-- Debug Info -->
  <div class="debug-info">
    <div>Win: {$winCount}</div>
    <div>Goal: {$goalCount}</div>
    <div>WS: {ws ? 'Connected' : 'Disconnected'}</div>
  </div>
</div>

<style>
	.overlay-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		z-index: 9999;
		background: transparent;
  }

	.neon-pill {
    position: relative;
		width: var(--container-width);
		height: 180px;
    display: flex;
    align-items: center;
    justify-content: space-between;
		padding: 0 40px;
		background: transparent;
		border-radius: 32px;
		overflow: visible;
		z-index: 1;
		transition: width 0.3s ease;
		isolation: isolate;
		
		/* Main app style rainbow border */
		border: 5px solid transparent;
		background-clip: padding-box;
  }
  
  .content-wrapper {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    height: 100%;
    padding-top: 20px;
  }

	.neon-pill::before {
		content: '';
		position: absolute;
		top: -5px;
		left: -5px;
		right: -5px;
		bottom: -5px;
		border-radius: 37px;
		--rotation: 0deg;
		background: conic-gradient(from var(--rotation), 
			rgba(255, 0, 128, 0.7) 0%,    /* Hot Pink */
			rgba(255, 31, 0, 0.7) 5%,     /* Red-Orange */
			rgba(255, 64, 0, 0.7) 10%,    /* Orange */
			rgba(255, 96, 0, 0.7) 15%,    /* Deep Orange */
			rgba(255, 128, 0, 0.7) 20%,   /* Golden Orange */
			rgba(255, 170, 0, 0.7) 25%,   /* Gold */
			rgba(255, 212, 0, 0.7) 30%,   /* Yellow Gold */
			rgba(255, 255, 0, 0.7) 35%,   /* Pure Yellow */
			rgba(204, 255, 0, 0.7) 40%,   /* Lime Yellow */
			rgba(128, 255, 0, 0.7) 45%,   /* Lime Green */
			rgba(64, 255, 0, 0.7) 50%,    /* Bright Green */
			rgba(0, 255, 64, 0.7) 55%,    /* Green Cyan */
			rgba(0, 255, 128, 0.7) 60%,   /* Aqua Green */
			rgba(0, 255, 204, 0.7) 65%,   /* Turquoise */
			rgba(0, 204, 255, 0.7) 70%,   /* Sky Blue */
			rgba(0, 128, 255, 0.7) 75%,   /* Bright Blue */
			rgba(0, 64, 255, 0.7) 80%,    /* Deep Blue */
			rgba(64, 0, 255, 0.7) 85%,    /* Purple Blue */
			rgba(128, 0, 255, 0.7) 90%,   /* Purple */
			rgba(204, 0, 255, 0.7) 95%,   /* Magenta Purple */
			rgba(255, 0, 128, 0.7) 100%); /* Back to Hot Pink */
		z-index: -2;
		animation: smooth-rotate 8s linear infinite;

    transition: all 0.3s ease;
  }

	.neon-pill::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		border-radius: 32px;
		background: rgba(17, 17, 22, 0.95);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		z-index: -1;
  }

	@keyframes smooth-rotate {
		0% { --rotation: 0deg; }
		100% { --rotation: 360deg; }
  }

	@keyframes subtle-pulse {
		0% { 
			text-shadow: 
				0 0 6px #ff444430,
				0 0 12px #ff444420,
				0 0 18px #ff444415;
		}
		50% { 
			text-shadow: 
				0 0 8px #ff444440,
				0 0 16px #ff444430,
				0 0 24px #ff444420;
		}
		100% { 
			text-shadow: 
				0 0 6px #ff444430,
				0 0 12px #ff444420,
				0 0 18px #ff444415;
  }
  }

	@property --rotation {
		syntax: '<angle>';
		initial-value: 0deg;
		inherits: false;
  }

	.crown-icon {
		width: var(--crown-size);
		height: var(--crown-size);
    object-fit: contain;
		filter: drop-shadow(0 0 8px #ffa50040) drop-shadow(0 0 16px #ff8c0025);
		z-index: 4;
		user-select: none;
		flex-shrink: 0;
		transition: all 0.3s ease;
		transform: translateX(var(--crown-offset));
		margin-top: 4px;
    }
    
	.win-number {
		font-family: 'MiSansThai-Medium', 'MiSansThai', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: var(--win-font-size);
		font-weight: 500;
		color: #00ffff;
		transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
		z-index: 4;
		flex-shrink: 0;
		white-space: nowrap;
		text-align: right;
    min-width: 100px;
		margin-top: -48px;
		margin-left: -18px;
		text-shadow: 
			0 0 6px #00ffff30,
			0 0 12px #00ffff20,
			0 0 18px #00ffff15;
  }
  
  .win-number.negative {
		color: #ff4444;
    text-shadow: 
			0 0 6px #ff444430,
			0 0 12px #ff444420,
			0 0 18px #ff444415;
  }

	.slash {
		font-family: 'MiSansThai-Medium', 'MiSansThai', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: var(--slash-font-size);
    font-weight: 300;
		background: linear-gradient(180deg, #a259f7 0%, #00eaff 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		z-index: 4;
		flex-shrink: 0;
		transition: all 0.3s ease;
		margin-top: -42px;
		text-shadow: 
			0 0 6px #a259f730,
			0 0 12px #00eaff20,
			0 0 18px #a259f715;
  }

	.goal-number {
		font-family: 'MiSansThai-Medium', 'MiSansThai', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: var(--goal-font-size);
		font-weight: 500;
		color: #ff00ff;
		transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
		z-index: 4;
		flex-shrink: 0;
		white-space: nowrap;
		text-align: left;
		min-width: 100px;
		margin-top: -48px;
    text-shadow: 
			0 0 6px #ff00ff30,
			0 0 12px #ff00ff20,
			0 0 18px #ff00ff15;
  }

	/* Mobile responsiveness removed - desktop only */
	
	/* Debug Info */
	.debug-info {
		position: fixed;
		top: 20px;
		left: 20px;
		background: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 10px;
		border-radius: 5px;
		font-size: 14px;
		z-index: 10001;
		pointer-events: none;
  }



	/* AAA-level Animation Effects */
	.particles-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		pointer-events: none;
		z-index: 10000;
		overflow: hidden;
	}
	
	.particle {
		position: absolute;
		border-radius: 50%;
		pointer-events: none;
		box-shadow: 0 0 12px currentColor, 0 0 24px currentColor;
		animation: particle-pop 0.8s ease-out; /* Faster particles */
	}
	
	@keyframes particle-glow {
		0% { 
			transform: scale(0) rotate(0deg);
			box-shadow: 0 0 0px currentColor;
		}
		50% { 
			transform: scale(1.2) rotate(180deg);
			box-shadow: 0 0 12px currentColor;
		}
		100% { 
			transform: scale(1) rotate(360deg);
			box-shadow: 0 0 6px currentColor;
		}
  }

	/* Enhanced Screen Shake Animations */
	@keyframes screen-shake-intense {
		0%, 100% { transform: translate(0, 0) rotate(0deg); }
		8% { transform: translate(-6px, -3px) rotate(-1deg); }
		16% { transform: translate(-3px, 6px) rotate(1deg); }
		24% { transform: translate(6px, 3px) rotate(0deg); }
		32% { transform: translate(3px, -6px) rotate(1deg); }
		40% { transform: translate(-3px, 3px) rotate(-1deg); }
		48% { transform: translate(-6px, 6px) rotate(0deg); }
		56% { transform: translate(6px, -3px) rotate(-1deg); }
		64% { transform: translate(-3px, -6px) rotate(1deg); }
		72% { transform: translate(3px, 6px) rotate(0deg); }
		80% { transform: translate(-6px, 3px) rotate(-1deg); }
		88% { transform: translate(6px, -6px) rotate(1deg); }
		96% { transform: translate(-3px, 3px) rotate(0deg); }
	}
	
	@keyframes screen-shake-large {
		0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
		10% { transform: translate(-8px, -4px) rotate(-2deg) scale(1.02); }
		20% { transform: translate(-4px, 8px) rotate(2deg) scale(0.98); }
		30% { transform: translate(8px, 4px) rotate(-1deg) scale(1.01); }
		40% { transform: translate(4px, -8px) rotate(2deg) scale(0.99); }
		50% { transform: translate(-4px, 4px) rotate(-2deg) scale(1.01); }
		60% { transform: translate(-8px, 8px) rotate(1deg) scale(0.98); }
		70% { transform: translate(8px, -4px) rotate(-2deg) scale(1.02); }
		80% { transform: translate(-4px, -8px) rotate(2deg) scale(0.99); }
		90% { transform: translate(4px, 8px) rotate(-1deg) scale(1.01); }
	}
	

	
	/* Particle Pop Animation (Call of Duty/Fortnite style) */
	@keyframes particle-pop {
		0% { 
			transform: scale(0) rotate(0deg);
			opacity: 1;
		}
		20% { 
			transform: scale(1.5) rotate(90deg);
			opacity: 0.9;
		}
		40% { 
			transform: scale(1.2) rotate(180deg);
			opacity: 0.7;
		}
		60% { 
			transform: scale(1) rotate(270deg);
			opacity: 0.5;
  }
		80% { 
			transform: scale(0.8) rotate(360deg);
			opacity: 0.3;
		}
		100% { 
			transform: scale(0.5) rotate(450deg);
			opacity: 0;
		}
	}
	
	/* Enhanced Number Animations */
	.win-number, .goal-number {
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		transform-origin: center;
	}
	
	.win-number.animating, .goal-number.animating {
		animation: number-burst 0.8s cubic-bezier(0.4, 0, 0.2, 1);
	}
	
	@keyframes number-burst {
		0% { 
			transform: scale(1);
			filter: brightness(1) saturate(1);
  }
		30% { 
			transform: scale(1.25);
			filter: brightness(1.8) saturate(2);
		}
		60% { 
			transform: scale(0.95);
			filter: brightness(1.4) saturate(1.6);
		}
		100% { 
			transform: scale(1);
			filter: brightness(1) saturate(1);
		}
	}
	
	/* Enhanced Glow Effects for Animations */
	.win-number.increase-glow {
		text-shadow: 
			0 0 10px #00ff0080,
			0 0 20px #00ff0060,
			0 0 30px #00ff0040,
			0 0 40px #00ff0020;
		animation: increase-pulse 0.6s ease-out;
  }

	.win-number.decrease-glow {
		text-shadow: 
			0 0 10px #ff444480,
			0 0 20px #ff444460,
			0 0 30px #ff444440,
			0 0 40px #ff444420;
		animation: decrease-pulse 0.6s ease-out;
  }

	.goal-number.increase-glow {
		text-shadow: 
			0 0 10px #00ff0080,
			0 0 20px #00ff0060,
			0 0 30px #00ff0040,
			0 0 40px #00ff0020;
		animation: increase-pulse 0.6s ease-out;
	}
	
	.goal-number.decrease-glow {
		text-shadow: 
			0 0 10px #ff444480,
			0 0 20px #ff444460,
			0 0 30px #ff444440,
			0 0 40px #ff444420;
		animation: decrease-pulse 0.6s ease-out;
  }

	@keyframes increase-pulse {
		0% { 
			text-shadow: 
				0 0 6px #00ffff30,
				0 0 12px #00ffff20,
				0 0 18px #00ffff15;
		}
		50% { 
			text-shadow: 
				0 0 15px #00ff0080,
				0 0 25px #00ff0060,
				0 0 35px #00ff0040,
				0 0 45px #00ff0020;
  }
		100% { 
			text-shadow: 
				0 0 6px #00ffff30,
				0 0 12px #00ffff20,
				0 0 18px #00ffff15;
		}
	}
	
	@keyframes decrease-pulse {
		0% { 
			text-shadow: 
				0 0 6px #00ffff30,
				0 0 12px #00ffff20,
				0 0 18px #00ffff15;
		}
		50% { 
			text-shadow: 
				0 0 15px #ff444480,
				0 0 25px #ff444460,
				0 0 35px #ff444440,
				0 0 45px #ff444420;
		}
		100% { 
			text-shadow: 
				0 0 6px #00ffff30,
				0 0 12px #00ffff20,
				0 0 18px #00ffff15;
		}
  }
</style>

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  safelist: [
    'text-cyan-400',
    'text-pink-500',
    'text-cyan-200',
    'text-shadow-glowCyan',
    'text-shadow-glowPink',
    'text-shadow-neon',
    'text-shadow-glow',
    'text-shadow-yellow',
    'text-shadow-deepPurple',
    'text-shadow-whiteSoft',
    'drop-shadow-[0_0_10px_#ffc107]',
    'animate-pulse-slow',
    'animate-border-run'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"MiSansThaiVF"', 'sans-serif'],
      },
      textShadow: {
        glowCyan: '0 0 6px #00ffff',
        glowPink: '0 0 6px #ff00ff',
        neon: '0 0 4px #ff00cc, 0 0 8px #ff00cc',
        glow: '0 0 4px #00ffff, 0 0 12px #00ffff',
        yellow: '0 0 4px #ffd700, 0 0 12px #ffd700',
        deepPurple: '0 0 4px #cc00ff, 0 0 12px #660066',
        whiteSoft: '0 0 2px #fff, 0 0 6px #aaa',
      },
      dropShadow: {
        crown: '0 0 8px #ff9800',
        neon: '0 0 8px #ff00cc',
        glow: '0 0 12px #00ffff',
        yellow: '0 0 12px #ffd700',
      },
      backgroundColor: {
        'cyber-dark': '#0f0c1f',
        'cyber-darker': '#0a0814',
      },
      borderColor: {
        'cyber-pink': '#ff00cc',
        'cyber-cyan': '#00ffff',
        'cyber-yellow': '#ffd700',
        'cyber-purple': '#cc00ff',
      },
      boxShadow: {
        'neon-pink': '0 0 5px #ff00cc, 0 0 20px #ff00cc, 0 0 35px #ff00cc',
        'neon-cyan': '0 0 5px #00ffff, 0 0 20px #00ffff, 0 0 35px #00ffff',
        'neon-yellow': '0 0 5px #ffd700, 0 0 20px #ffd700, 0 0 35px #ffd700',
        'glow-inset': 'inset 0 0 20px rgba(255, 0, 204, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s infinite',
        'border-run': 'border-run 2s linear infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'border-run': {
          '0%': { 
            'background-position': '0% 50%',
            'box-shadow': '0 0 5px #ff00cc, 0 0 20px #ff00cc'
          },
          '25%': { 
            'background-position': '25% 50%',
            'box-shadow': '0 0 5px #00ffff, 0 0 20px #00ffff'
          },
          '50%': { 
            'background-position': '50% 50%',
            'box-shadow': '0 0 5px #ffd700, 0 0 20px #ffd700'
          },
          '75%': { 
            'background-position': '75% 50%',
            'box-shadow': '0 0 5px #cc00ff, 0 0 20px #cc00ff'
          },
          '100%': { 
            'background-position': '100% 50%',
            'box-shadow': '0 0 5px #ff00cc, 0 0 20px #ff00cc'
          },
        },
        'glow-pulse': {
          'from': {
            'text-shadow': '0 0 4px #ff00cc, 0 0 8px #ff00cc, 0 0 12px #ff00cc',
          },
          'to': {
            'text-shadow': '0 0 8px #ff00cc, 0 0 16px #ff00cc, 0 0 24px #ff00cc',
          },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-textshadow'),
    require('@tailwindcss/forms'),
    require('tailwind-scrollbar'),
  ],
}

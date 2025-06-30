<!-- Cyberpunk Neon Design System Usage Examples -->

<!-- 1. Glowing Title with text-shadow-neon and text-5xl -->
<h1 class="text-shadow-neon text-5xl font-sans text-white animate-glow-pulse">
  CYBERPUNK 2077
</h1>

<!-- 2. Glowing Box with border-pink and neon shadow -->
<div class="bg-cyber-dark border-2 border-cyber-pink shadow-neon-pink p-6 rounded-lg">
  <h2 class="text-shadow-glow text-2xl text-cyan-400">Neural Interface</h2>
  <p class="text-shadow-whiteSoft text-gray-300">
    Connect to the matrix and access unlimited data streams.
  </p>
</div>

<!-- 3. Animated Border Component -->
<div class="animate-border-run bg-gradient-to-r from-cyber-pink via-cyber-cyan to-cyber-yellow p-1 rounded-lg">
  <div class="bg-cyber-dark p-4 rounded-lg">
    <h3 class="text-shadow-yellow text-xl text-yellow-400">Data Terminal</h3>
    <p class="text-shadow-whiteSoft text-gray-300">Access granted</p>
  </div>
</div>

<!-- 4. Forms with @tailwindcss/forms plugin -->
<form class="space-y-4 bg-cyber-darker p-6 rounded-lg shadow-neon-cyan">
  <div>
    <label for="username" class="text-shadow-glow text-cyan-400 block text-sm font-medium mb-2">
      Username
    </label>
    <input 
      id="username"
      type="text" 
      class="w-full bg-cyber-dark border-cyber-cyan border-2 rounded-md px-3 py-2 
             text-white placeholder-gray-500 focus:border-cyber-pink focus:ring-2 
             focus:ring-cyber-pink focus:shadow-neon-pink transition-all duration-300"
      placeholder="Enter your handle..."
    />
  </div>
  
  <div>
    <label for="access-code" class="text-shadow-glow text-cyan-400 block text-sm font-medium mb-2">
      Access Code
    </label>
    <input 
      id="access-code"
      type="password" 
      class="w-full bg-cyber-dark border-cyber-cyan border-2 rounded-md px-3 py-2 
             text-white placeholder-gray-500 focus:border-cyber-yellow focus:ring-2 
             focus:ring-cyber-yellow focus:shadow-neon-yellow transition-all duration-300"
      placeholder="••••••••"
    />
  </div>
  
  <button 
    type="submit"
    class="w-full bg-gradient-to-r from-cyber-pink to-cyber-purple text-white 
           py-3 px-6 rounded-md text-shadow-neon font-medium hover:shadow-neon-pink 
           transition-all duration-300 animate-pulse-slow"
  >
    JACK IN
  </button>
</form>

<!-- 5. Full Component using MiSansThaiVF Font -->
<div class="min-h-screen bg-cyber-dark font-sans">
  <!-- Header -->
  <header class="p-6 border-b border-cyber-pink">
    <nav class="flex justify-between items-center">
      <h1 class="text-shadow-neon text-3xl text-cyber-pink font-bold">
        NEUROMANCER
      </h1>
      <div class="space-x-4">
        <button class="text-shadow-glow text-cyan-400 hover:text-shadow-yellow hover:text-yellow-400 transition-all duration-300">
          Interface
        </button>
        <button class="text-shadow-glow text-cyan-400 hover:text-shadow-yellow hover:text-yellow-400 transition-all duration-300">
          Data
        </button>
        <button class="text-shadow-glow text-cyan-400 hover:text-shadow-yellow hover:text-yellow-400 transition-all duration-300">
          Exit
        </button>
      </div>
    </nav>
  </header>

  <!-- Main Content -->
  <main class="p-6">
    <!-- Status Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-cyber-darker border border-cyber-cyan shadow-neon-cyan p-4 rounded-lg">
        <h3 class="text-shadow-glow text-cyan-400 text-lg mb-2">System Status</h3>
        <div class="text-shadow-whiteSoft text-green-400 text-2xl font-bold">ONLINE</div>
        <div class="w-full bg-gray-700 rounded-full h-2 mt-2">
          <div class="bg-gradient-to-r from-cyber-cyan to-cyber-yellow h-2 rounded-full w-3/4 animate-pulse-slow"></div>
        </div>
      </div>
      
      <div class="bg-cyber-darker border border-cyber-pink shadow-neon-pink p-4 rounded-lg">
        <h3 class="text-shadow-neon text-cyber-pink text-lg mb-2">Data Flow</h3>
        <div class="text-shadow-whiteSoft text-pink-400 text-2xl font-bold">847.3 TB/s</div>
        <div class="w-full bg-gray-700 rounded-full h-2 mt-2">
          <div class="bg-gradient-to-r from-cyber-pink to-cyber-purple h-2 rounded-full w-5/6 animate-pulse-slow"></div>
        </div>
      </div>
      
      <div class="bg-cyber-darker border border-cyber-yellow shadow-neon-yellow p-4 rounded-lg">
        <h3 class="text-shadow-yellow text-yellow-400 text-lg mb-2">Neural Load</h3>
        <div class="text-shadow-whiteSoft text-yellow-400 text-2xl font-bold">23.7%</div>
        <div class="w-full bg-gray-700 rounded-full h-2 mt-2">
          <div class="bg-gradient-to-r from-cyber-yellow to-cyber-cyan h-2 rounded-full w-1/4 animate-pulse-slow"></div>
        </div>
      </div>
    </div>

    <!-- Data Terminal -->
    <div class="bg-cyber-darker rounded-lg p-6 border-2 border-cyber-cyan animate-border-run">
      <h2 class="text-shadow-glow text-2xl text-cyan-400 mb-4">MATRIX INTERFACE</h2>
      
      <!-- Scrollable Content Area -->
      <div class="bg-black rounded p-4 h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-cyber-pink scrollbar-track-gray-900">
        <div class="font-mono text-sm space-y-1">
          <div class="text-shadow-glow text-green-400">> Initializing neural link...</div>
          <div class="text-shadow-glow text-cyan-400">> Connection established</div>
          <div class="text-shadow-yellow text-yellow-400">> Accessing mainframe...</div>
          <div class="text-shadow-neon text-pink-400">> Security protocols bypassed</div>
          <div class="text-shadow-deepPurple text-purple-400">> Data stream active</div>
          <div class="text-shadow-glow text-green-400">> Ready for input</div>
          <div class="text-shadow-whiteSoft text-white">_</div>
        </div>
      </div>
      
      <!-- Input Area -->
      <div class="mt-4 flex">
        <span class="text-shadow-glow text-cyan-400 mr-2">></span>
        <input 
          type="text" 
          class="flex-1 bg-transparent border-none outline-none text-white text-shadow-whiteSoft font-mono"
          placeholder="Enter command..."
        />
      </div>
    </div>
  </main>
</div>

<!-- 6. Additional Component Examples -->

<!-- Glowing Button Set -->
<div class="flex space-x-4 p-6">
  <button class="px-6 py-3 bg-cyber-dark border-2 border-cyber-pink text-shadow-neon text-pink-400 rounded-lg hover:shadow-neon-pink hover:bg-cyber-pink hover:text-black transition-all duration-300">
    Primary Action
  </button>
  
  <button class="px-6 py-3 bg-cyber-dark border-2 border-cyber-cyan text-shadow-glow text-cyan-400 rounded-lg hover:shadow-neon-cyan hover:bg-cyber-cyan hover:text-black transition-all duration-300">
    Secondary
  </button>
  
  <button class="px-6 py-3 bg-cyber-dark border-2 border-cyber-yellow text-shadow-yellow text-yellow-400 rounded-lg hover:shadow-neon-yellow hover:bg-cyber-yellow hover:text-black transition-all duration-300">
    Warning
  </button>
</div>

<!-- Neon Card Grid -->
<div class="grid grid-cols-2 gap-6 p-6">
  <div class="group bg-cyber-darker border border-cyber-pink rounded-lg p-6 hover:shadow-neon-pink transition-all duration-300 cursor-pointer">
    <div class="w-12 h-12 bg-gradient-to-br from-cyber-pink to-cyber-purple rounded-lg mb-4 animate-pulse-slow"></div>
    <h3 class="text-shadow-neon text-pink-400 text-xl mb-2 group-hover:animate-glow-pulse">Data Vault</h3>
    <p class="text-shadow-whiteSoft text-gray-300">Secure storage for sensitive information</p>
  </div>
  
  <div class="group bg-cyber-darker border border-cyber-cyan rounded-lg p-6 hover:shadow-neon-cyan transition-all duration-300 cursor-pointer">
    <div class="w-12 h-12 bg-gradient-to-br from-cyber-cyan to-cyber-yellow rounded-lg mb-4 animate-pulse-slow"></div>
    <h3 class="text-shadow-glow text-cyan-400 text-xl mb-2 group-hover:animate-glow-pulse">Neural Net</h3>
    <p class="text-shadow-whiteSoft text-gray-300">AI processing and analysis hub</p>
  </div>
</div>

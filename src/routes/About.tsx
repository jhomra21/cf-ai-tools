import type { Component } from 'solid-js';

const About: Component = () => {
  return (
    <div class="space-y-8">
      <h1 class="font-mono text-4xl font-bold text-white tracking-tight">
        ABOUT THE SYSTEM
      </h1>
      <p class="font-mono text-neutral-400 max-w-2xl">
        Advanced technology requires advanced solutions. Our system is built 
        with precision and purpose, utilizing cutting-edge web technologies.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="border border-neutral-800 p-6 bg-black/50 backdrop-blur">
          <h2 class="font-mono text-xl text-white mb-4">CAPABILITIES</h2>
          <ul class="font-mono text-sm text-neutral-400 space-y-2">
            <li class="flex items-center">
              <span class="text-blue-400 mr-2">→</span>
              High Performance Runtime
            </li>
            <li class="flex items-center">
              <span class="text-blue-400 mr-2">→</span>
              Real-time Data Processing
            </li>
            <li class="flex items-center">
              <span class="text-blue-400 mr-2">→</span>
              Advanced Security Protocols
            </li>
          </ul>
        </div>
        <div class="border border-neutral-800 p-6 bg-black/50 backdrop-blur">
          <h2 class="font-mono text-xl text-white mb-4">SPECIFICATIONS</h2>
          <div class="font-mono text-sm text-neutral-400">
            <div class="flex justify-between py-2 border-b border-neutral-800">
              <span>ENGINE</span>
              <span class="text-blue-400">SOLIDJS</span>
            </div>
            <div class="flex justify-between py-2 border-b border-neutral-800">
              <span>DESIGN</span>
              <span class="text-blue-400">INDUSTRIAL</span>
            </div>
            <div class="flex justify-between py-2">
              <span>STATUS</span>
              <span class="text-green-400">ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About; 
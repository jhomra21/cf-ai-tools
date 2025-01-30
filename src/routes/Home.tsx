import { Component } from "solid-js";
import { A } from "@solidjs/router";
import PublicShowcase from '../components/PublicShowcase';

const Home: Component = () => {
  return (
    <div class="container mx-auto p-6 max-w-7xl">
      {/* Header Section */}
      <div class="mb-12 border border-[#2D2D2D] bg-[#1E1E1E] p-8">
        <div class="flex items-center justify-between mb-4">
          <h1 class="font-mono text-4xl font-bold tracking-tighter text-white">AI TOOLS</h1>
        </div>
        <p class="font-mono text-neutral-400 text-sm max-w-2xl">
          A minimal site to interact with different AI models.
        </p>
      </div>

      {/* Features Grid */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Chat Card */}
        <A href="/ai-chat" class="group">
          <div class="border border-[#2D2D2D] bg-[#1E1E1E] p-6 h-full
                      transition-colors duration-200 hover:border-[#0066FF]">
            <div class="flex items-center space-x-3 mb-4">
              <h2 class="font-mono text-xl font-bold tracking-tighter text-white">AI CHAT</h2>
              <div class="h-4 w-px bg-[#2D2D2D]"></div>
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-[#28C840] rounded-full"></div>
                <span class="font-mono text-xs text-neutral-400">LLAMA 3.1</span>
              </div>
            </div>
            <p class="font-mono text-sm text-neutral-400 mb-6">
              Chat with the latest LLM models.
            </p>
            <div class="flex items-center space-x-2 text-[#0066FF] font-mono text-sm">
              <span>Start Chat</span>
              <span class="group-hover:translate-x-1 transition-transform duration-200">→</span>
            </div>
          </div>
        </A>

        {/* Image Generation Card */}
        <A href="/image-gen" class="group">
          <div class="border border-[#2D2D2D] bg-[#1E1E1E] p-6 h-full
                      transition-colors duration-200 hover:border-[#0066FF]">
            <div class="flex items-center space-x-3 mb-4">
              <h2 class="font-mono text-xl font-bold tracking-tighter text-white">IMAGE GEN</h2>
              <div class="h-4 w-px bg-[#2D2D2D]"></div>
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-[#28C840] rounded-full"></div>
                <span class="font-mono text-xs text-neutral-400">FLUX-1</span>
              </div>
            </div>
            <p class="font-mono text-sm text-neutral-400 mb-6">
              Generate images from text descriptions.
            </p>
            <div class="flex items-center space-x-2 text-[#0066FF] font-mono text-sm">
              <span>Generate Images</span>
              <span class="group-hover:translate-x-1 transition-transform duration-200">→</span>
            </div>
          </div>
        </A>
      </div>

      {/* Public Showcase Section */}
      <div class="mt-12">
        <PublicShowcase />
      </div>
    </div>
  );
};

export default Home; 
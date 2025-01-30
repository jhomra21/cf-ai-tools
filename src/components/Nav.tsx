import { A } from "@solidjs/router";
import type { Component } from "solid-js";

const Nav: Component = () => {
  return (
    <nav class="border-b border-[#2D2D2D] bg-[#0A0A0A]/95 backdrop-blur-sm sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex h-[72px] items-center justify-between">
          {/* Logo/Brand */}
          <div class="flex items-center">
            <A 
              href="/" 
              class="font-mono text-xl text-white tracking-tighter transition-colors duration-200 border border-transparent hover:border-[#2D2D2D] px-4 py-2"
              activeClass="text-[#0066FF]"
              end
            >
              <span class="font-bold">AI TOOLS</span>
            </A>
          </div>

          {/* Navigation Links */}
          <div class="flex items-center space-x-1">
            <NavLink href="/" label="HOME" />
            <NavLink href="/ai-chat" label="AI CHAT" />
            <NavLink href="/image-gen" label="IMAGE GEN" />
          </div>
        </div>
      </div>
    </nav>
  );
};

// Extracted NavLink component for consistent styling
const NavLink: Component<{ href: string; label: string }> = (props) => {
  return (
    <A 
      href={props.href} 
      class="relative font-mono text-sm text-neutral-400 px-4 py-2 transition-all duration-200
             hover:text-white hover:bg-[#1E1E1E] border border-transparent
             hover:border-[#2D2D2D] tracking-wide"
      activeClass="text-white border-[#2D2D2D] bg-[#1E1E1E]"
      end={props.href === "/"}
    >
      {props.label}
    </A>
  );
};

export default Nav; 
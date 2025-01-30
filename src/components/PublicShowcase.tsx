import { For } from 'solid-js';

interface ShowcaseImage {
  src: string;
  size: string;
}

const showcaseImages: ShowcaseImage[] = [
  {
    src: '/white-horse.jpg',
    size: '17KB'
  },
  {
    src: '/slavic-model.jpg',
    size: '26KB'
  },
  {
    src: '/silver-saturn.jpg',
    size: '296KB'
  }
];

export default function PublicShowcase() {
  return (
    <div class="w-full border-t border-[#2D2D2D]">
     <div class="p-4 border-b border-[#2D2D2D] bg-[#1E1E1E] font-mono text-sm text-neutral-400">EXAMPLES</div>

      {/* Image Grid */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#2D2D2D]">
        
        <For each={showcaseImages}>
          {(image) => (
            <div class="group bg-[#1E1E1E]">
              {/* Image Container */}
              <div class="aspect-square relative overflow-hidden">
                <img 
                  src={image.src} 
                  alt="Showcase Image"
                  class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                
              </div>
              
              {/* Image Info */}
              <div class="p-4 border-t border-[#2D2D2D] flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <span class="font-mono text-xs text-neutral-400">{image.size}</span>
                  <div class="w-1.5 h-1.5 bg-[#28C840] rounded-full"></div>
                </div>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
} 
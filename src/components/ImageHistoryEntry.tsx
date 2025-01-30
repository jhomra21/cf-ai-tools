import type { HistoryEntry } from '../stores/imageHistoryStore';
import { createSignal } from 'solid-js';

interface ImageHistoryEntryProps {
  entry: HistoryEntry;
  onImageClick: (entry: HistoryEntry) => void;
}

export default function ImageHistoryEntry(props: ImageHistoryEntryProps) {
  const [isHovered, setIsHovered] = createSignal(false);

  return (
    <div 
      class="group relative border border-[#2D2D2D] bg-[#1E1E1E] overflow-hidden cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => props.onImageClick(props.entry)}
    >
      {/* Image Container */}
      <div class="aspect-square w-full relative">
        <img 
          src={props.entry.imageURI} 
          alt={props.entry.prompt}
          class="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Overlay with metadata - shows on hover */}
        <div 
          class={`absolute inset-0 bg-black/80 transition-opacity duration-200 ${
            isHovered() ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div class="p-4 h-full flex flex-col justify-end space-y-2">
            <div class="font-mono text-xs text-neutral-400">
              STEPS: {props.entry.steps}
            </div>
            <div class="font-mono text-xs text-neutral-400">
              {new Date(props.entry.timestamp).toLocaleDateString()} {new Date(props.entry.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Prompt - always visible */}
      <div class="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/90 via-black/70 to-transparent">
        <div class="font-mono text-sm text-white line-clamp-2">
          {props.entry.prompt}
        </div>
      </div>
    </div>
  );
} 
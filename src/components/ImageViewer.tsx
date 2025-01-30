import { Show } from 'solid-js';
import type { HistoryEntry } from '../stores/imageHistoryStore';

interface ImageViewerProps {
  entry: HistoryEntry | null;
  onClose: () => void;
}

export default function ImageViewer(props: ImageViewerProps) {
  const handleDownload = () => {
    if (!props.entry) return;
    
    const link = document.createElement('a');
    link.href = props.entry.imageURI;
    link.download = `image-${props.entry.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Show when={props.entry}>
      <div 
        class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
        onClick={props.onClose}
      >
        <div class="absolute top-4 right-4 flex items-center space-x-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            class="px-4 py-2 bg-[#1E1E1E] border border-[#2D2D2D] font-mono text-sm text-white hover:bg-[#252525] transition-colors"
          >
            DOWNLOAD
          </button>
          <button
            onClick={props.onClose}
            class="p-2 bg-[#1E1E1E] border border-[#2D2D2D] font-mono text-sm text-white hover:bg-[#252525] transition-colors"
          >
            ✕
          </button>
        </div>

        <div 
          class="max-w-[90vw] max-h-[90vh] relative"
          onClick={(e) => e.stopPropagation()}
        >
          <img 
            src={props.entry?.imageURI} 
            alt={props.entry?.prompt}
            class="max-w-full max-h-[90vh] object-contain"
          />
          <div class="absolute left-0 right-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
            <div class="font-mono text-sm text-white mb-2">
              {props.entry?.prompt}
            </div>
            <div class="flex items-center justify-between text-xs text-neutral-400 font-mono">
              <div>STEPS: {props.entry?.steps}</div>
              <div>
                {new Date(props.entry?.timestamp || 0).toLocaleDateString()} {new Date(props.entry?.timestamp || 0).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
} 
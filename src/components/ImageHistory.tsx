import { For, createEffect, Show, createSignal } from 'solid-js';
import { history } from '../stores/imageHistoryStore';
import ImageHistoryEntry from './ImageHistoryEntry';
import ImageViewer from './ImageViewer';
import type { HistoryEntry } from '../stores/imageHistoryStore';

interface ImageHistoryProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function ImageHistory(props: ImageHistoryProps) {
  const [selectedImage, setSelectedImage] = createSignal<HistoryEntry | null>(null);
  const [contentVisible, setContentVisible] = createSignal(false);

  // Handle smooth transitions
  createEffect(() => {
    if (props.isOpen) {
      // Small delay to ensure the container is rendered before showing content
      setTimeout(() => setContentVisible(true), 50);
    } else {
      setContentVisible(false);
    }
  });

  return (
    <>
      <div class="border-t border-[#2D2D2D] bg-[#1E1E1E] w-full">
        {/* Header with toggle */}
        <div 
          class="p-4 flex items-center justify-between cursor-pointer hover:bg-[#252525] transition-colors"
          onClick={props.onToggle}
        >
          <div class="flex items-center space-x-4">
            <span class="font-mono text-sm text-white">History</span>
            <span class="font-mono text-xs text-neutral-400">
              {history().length} {history().length === 1 ? 'entry' : 'entries'}
            </span>
          </div>
          <div class={`transform transition-transform duration-200 ${props.isOpen ? 'rotate-180' : ''}`}>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L5 5L9 1" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="square"/>
            </svg>
          </div>
        </div>

        {/* Collapsible content with smooth height transition */}
        <div 
          class={`transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden ${
            props.isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div class="border-t border-[#2D2D2D]">
            <Show when={history().length > 0} fallback={
              <div class="flex items-center justify-center h-32">
                <span class="font-mono text-sm text-neutral-400">No history yet</span>
              </div>
            }>
              <div 
                class={`grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 transition-opacity duration-200 ${
                  contentVisible() ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <For each={history()}>
                  {(entry) => (
                    <ImageHistoryEntry 
                      entry={entry} 
                      onImageClick={(entry) => setSelectedImage(entry)}
                    />
                  )}
                </For>
              </div>
            </Show>
          </div>
        </div>
      </div>

      {/* Full-screen image viewer */}
      <ImageViewer 
        entry={selectedImage()} 
        onClose={() => setSelectedImage(null)}
      />
    </>
  );
} 
import { createSignal, Show, onCleanup, createEffect } from 'solid-js';
import { createMutation, useQueryClient } from '@tanstack/solid-query';
import { history, setHistory, compressImage, saveHistory, MAX_HISTORY } from '../stores/imageHistoryStore';
import ImageHistory from '../components/ImageHistory';

interface ImageResponse {
  dataURI: string;
  error?: string;
  details?: string;
}

interface GenerateImageParams {
  prompt: string;
  steps: number;
}

export default function ImageGen() {
  const [prompt, setPrompt] = createSignal('');
  const [steps, setSteps] = createSignal(4);
  const [realtimeMode, setRealtimeMode] = createSignal(false);
  const [debounceTimeout, setDebounceTimeout] = createSignal<number | undefined>(undefined);
  const [currentAbortController, setCurrentAbortController] = createSignal<AbortController | null>(null);
  const [lastSuccessfulImage, setLastSuccessfulImage] = createSignal<string>('');
  const [isHistoryOpen, setIsHistoryOpen] = createSignal(false);
  const [showHeader, setShowHeader] = createSignal(true);

  const queryClient = useQueryClient();

  // Image generation mutation
  const mutation = createMutation(() => ({
    mutationFn: async (params: GenerateImageParams): Promise<ImageResponse> => {
      if (!params.prompt.trim()) return { dataURI: '' };

      // Create new AbortController for this request
      const abortController = new AbortController();
      // Cancel any existing request
      if (currentAbortController()) {
        currentAbortController()?.abort();
      }
      setCurrentAbortController(abortController);

      try {
        const response = await fetch(import.meta.env.DEV ? 'http://127.0.0.1:8787/generate-image' : `${import.meta.env.VITE_API_URL}/generate-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
          signal: abortController.signal
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || errorData.error || 'Failed to generate image');
        }

        return response.json();
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Return empty response for aborted requests
          return { dataURI: mutation.data?.dataURI || '' };
        }
        throw error;
      } finally {
        // Clear the abort controller if it's the current one
        if (currentAbortController() === abortController) {
          setCurrentAbortController(null);
        }
      }
    }
  }));

  // Show loading only when we're actually generating and have a prompt
  const isLoading = () => mutation.isPending && !!prompt().trim();

  // Handle form submission
  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!prompt().trim()) return;
    
    setShowHeader(false); // Hide header on first generation

    // Clear any pending debounce
    if (debounceTimeout()) {
      clearTimeout(debounceTimeout());
      setDebounceTimeout(undefined);
    }

    mutation.mutate({ prompt: prompt(), steps: steps() });
  };

  // Handle prompt changes with debouncing
  const handlePromptChange = (e: Event) => {
    const input = (e.target as HTMLTextAreaElement).value;
    setPrompt(input);
    
    if (realtimeMode()) {
      // Clear previous timeout
      if (debounceTimeout()) {
        clearTimeout(debounceTimeout());
      }

      // Only set new timeout if we have a prompt
      if (input.trim()) {
        setShowHeader(false); // Hide header in realtime mode when generating
        const timeout = setTimeout(() => {
          mutation.mutate({ prompt: input, steps: steps() });
        }, 350) as unknown as number; // 350ms debounce
        
        setDebounceTimeout(timeout);
      }
    }
  };

  // Reset when switching modes
  const handleModeChange = (e: Event) => {
    const checked = (e.target as HTMLInputElement).checked;
    setRealtimeMode(checked);
    
    // Clear any pending debounce
    if (debounceTimeout()) {
      clearTimeout(debounceTimeout());
      setDebounceTimeout(undefined);
    }

    // Cancel any ongoing request
    if (currentAbortController()) {
      currentAbortController()?.abort();
      setCurrentAbortController(null);
    }

    // Cancel any ongoing mutation
    if (mutation.isPending) {
      mutation.reset();
    }
  };

  // Update history when we get a new successful generation
  createEffect(async () => {
    // Only save to history if:
    // 1. We have mutation data with a dataURI
    // 2. The mutation is not pending
    // 3. We have a prompt
    // 4. The dataURI is different from the last successful image (to prevent duplicates)
    if (
      mutation.data?.dataURI && 
      !mutation.isPending && 
      prompt().trim() && 
      mutation.data.dataURI !== lastSuccessfulImage()
    ) {
      try {
        // Compress the image before storing
        const compressedImage = await compressImage(mutation.data.dataURI);
        
        const newEntry = {
          id: crypto.randomUUID(),
          prompt: prompt(),
          imageURI: compressedImage,
          steps: steps(),
          timestamp: Date.now(),
        };
        
        const currentHistory = history();
        const updatedHistory = [newEntry, ...currentHistory].slice(0, MAX_HISTORY);
        const savedHistory = saveHistory(updatedHistory);
        setHistory(savedHistory || updatedHistory);
        setLastSuccessfulImage(mutation.data.dataURI);
      } catch (error) {
        console.error('Failed to save to history:', error);
      }
    }
  });

  // Cleanup on component unmount
  onCleanup(() => {
    if (debounceTimeout()) {
      clearTimeout(debounceTimeout());
    }
    if (currentAbortController()) {
      currentAbortController()?.abort();
    }
  });

  return (
    <div class="container mx-auto p-4 sm:p-6 max-w-7xl min-h-screen flex flex-col">
      {/* Header Section with Model Info */}
      <Show when={showHeader()}>
        <div class="mb-4 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <div class="border border-[#2D2D2D] bg-[#1E1E1E] p-3 sm:p-4 col-span-2 lg:col-span-1">
            <div class="flex items-center space-x-3">
              <h1 class="font-mono text-lg sm:text-xl font-bold tracking-tighter text-white">IMAGE GEN</h1>
              <div class="h-4 w-px bg-[#2D2D2D]"></div>
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-[#28C840] rounded-full animate-pulse"></div>
                <span class="font-mono text-xs text-neutral-400">SYSTEM ACTIVE</span>
              </div>
            </div>
          </div>

          <div class="border border-[#2D2D2D] bg-[#1E1E1E] p-3 sm:p-4">
            <div class="font-mono text-xs text-neutral-400">MODEL</div>
            <div class="font-mono text-sm text-white truncate">Flux-1 Schnell</div>
          </div>

          <div class="border border-[#2D2D2D] bg-[#1E1E1E] p-3 sm:p-4">
            <div class="font-mono text-xs text-neutral-400">PROVIDER</div>
            <div class="font-mono text-sm text-white truncate">Black Forest Labs</div>
          </div>

          <div class="border border-[#2D2D2D] bg-[#1E1E1E] p-3 sm:p-4">
            <div class="font-mono text-xs text-neutral-400">STATUS</div>
            <div class="flex items-center space-x-2">
              <span class="font-mono text-sm text-[#28C840]">OPERATIONAL</span>
              <span class="w-1.5 h-1.5 bg-[#28C840] rounded-full"></span>
            </div>
          </div>
        </div>
      </Show>

      {/* Error Display */}
      <Show when={mutation.error}>
        <div class="mb-4 px-4 py-3 bg-[#1E1E1E] border-l-4 border-[#FF5F57] font-mono text-sm">
          <div class="flex items-center space-x-2">
            <span class="text-[#FF5F57] font-bold">ERROR</span>
            <span class="text-neutral-400">•</span>
            <span class="text-neutral-300">
              {mutation.error instanceof Error ? mutation.error.message : 'An error occurred'}
            </span>
          </div>
        </div>
      </Show>

      
      {/* Main Content */}
      <div class="flex-1 flex flex-col lg:flex-row gap-6 mb-6">
        {/* Control Panel */}
        <div class="w-full lg:w-1/2 flex flex-col">
          <div class="p-6 h-full">
            <form onSubmit={handleSubmit} class="space-y-6">
              {/* Real-time Mode Toggle */}
              <div class="flex items-center justify-between border-b border-[#2D2D2D] pb-4">
                <span class="font-mono text-sm text-white">Real-time Generation</span>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    class="sr-only peer"
                    checked={realtimeMode()}
                    onChange={handleModeChange}
                  />
                  <div class="w-11 h-6 bg-[#2D2D2D] peer-focus:outline-none peer-focus:ring-1 
                              peer-focus:ring-[#0066FF] rounded-none peer 
                              peer-checked:after:translate-x-full after:content-[''] 
                              after:absolute after:top-[2px] after:left-[2px] 
                              after:bg-white after:border-[#2D2D2D] after:border 
                              after:rounded-none after:h-5 after:w-5 after:transition-all 
                              peer-checked:bg-[#0066FF]">
                  </div>
                </label>
              </div>

              {/* Prompt Input */}
              <div class="space-y-2">
                <label class="block text-neutral-400 font-mono text-xs uppercase">Prompt</label>
                <textarea
                  value={prompt()}
                  onInput={handlePromptChange}
                  placeholder="Describe the image you want to generate..."
                  class="w-full h-32 bg-[#1E1E1E] border border-[#2D2D2D] text-white px-4 py-3 
                         font-mono text-sm placeholder:text-neutral-600 resize-none
                         focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] focus:outline-none
                         disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading() && !realtimeMode()}
                />
              </div>

              {/* Steps Control */}
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <label class="text-neutral-400 font-mono text-xs uppercase">Quality Steps</label>
                  <span class="font-mono text-sm text-white">{steps()}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={steps()}
                  onInput={(e) => {
                    const newSteps = parseInt(e.currentTarget.value);
                    setSteps(newSteps);
                    if (realtimeMode() && prompt().trim()) {
                      if (debounceTimeout()) clearTimeout(debounceTimeout());
                      const timeout = setTimeout(() => {
                        mutation.mutate({ prompt: prompt(), steps: newSteps });
                      }, 2000) as unknown as number;
                      setDebounceTimeout(timeout);
                    }
                  }}
                  class="w-full accent-[#0066FF]"
                  disabled={isLoading() && !realtimeMode()}
                />
                <div class="flex justify-between text-xs text-neutral-500 font-mono">
                  <span>FASTER GENERATION</span>
                  <span>BETTER QUALITY</span>
                </div>
              </div>

              {/* Generate Button - Hidden in real-time mode */}
              <Show when={!realtimeMode()}>
                <button
                  type="submit"
                  disabled={isLoading()}
                  class="w-full bg-[#0066FF] text-white px-6 py-3 font-mono text-sm
                         hover:bg-[#0052CC] focus:outline-none focus:ring-1 
                         focus:ring-[#0066FF] disabled:opacity-50 
                         disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isLoading() ? 'GENERATING...' : 'GENERATE IMAGE'}
                </button>
              </Show>
            </form>
          </div>
        </div>

        {/* Preview Panel */}
        <div class="w-full lg:w-1/2 flex flex-col">
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <span class="font-mono text-sm text-white">Preview</span>
              <div class="flex items-center space-x-2">
                <span class="font-mono text-xs text-neutral-400">
                  {isLoading() ? 'GENERATING' : 'READY'}
                </span>
                <span class={`w-1.5 h-1.5 rounded-full ${
                  isLoading() ? 'bg-[#FFBD2E] animate-pulse' : 'bg-[#28C840]'
                }`} />
              </div>
            </div>

            {/* Preview Container */}
            <div class="relative border border-[#2D2D2D] bg-[#1E1E1E] aspect-square w-full">
              <Show 
                when={lastSuccessfulImage() || mutation.data?.dataURI}
                fallback={
                  <div class="absolute inset-0 flex items-center justify-center">
                    <Show
                      when={isLoading()}
                      fallback={<span class="font-mono text-sm text-neutral-400">No image generated yet</span>}
                    >
                      <div class="flex flex-col items-center space-y-4">
                        <div class="flex space-x-2">
                          <div class="w-2 h-2 bg-[#FFBD2E] rounded-full animate-pulse"></div>
                          <div class="w-2 h-2 bg-[#FFBD2E] rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
                          <div class="w-2 h-2 bg-[#FFBD2E] rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
                        </div>
                        <span class="font-mono text-xs text-neutral-400">GENERATING IMAGE</span>
                      </div>
                    </Show>
                  </div>
                }
              >
                <div class="relative w-full h-full">
                  <img 
                    src={mutation.data?.dataURI || lastSuccessfulImage()} 
                    alt="Generated image"
                    class={`w-full h-full object-contain transition-all duration-300 ${
                      isLoading() ? 'blur-md' : 'blur-0'
                    }`}
                  />
                  
                  {/* Loading overlay */}
                  <Show when={isLoading()}>
                    <div class="absolute inset-0 flex items-center justify-center">
                      <div class="flex flex-col items-center space-y-4 bg-[#1E1E1E] px-6 py-4">
                        <div class="flex space-x-2">
                          <div class="w-2 h-2 bg-[#FFBD2E] rounded-full animate-pulse"></div>
                          <div class="w-2 h-2 bg-[#FFBD2E] rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
                          <div class="w-2 h-2 bg-[#FFBD2E] rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
                        </div>
                        <span class="font-mono text-xs text-white">GENERATING IMAGE</span>
                      </div>
                    </div>
                  </Show>
                </div>
              </Show>
            </div>
             {/* History Section - Moved up */}
             <ImageHistory 
                isOpen={isHistoryOpen()} 
                onToggle={() => setIsHistoryOpen(prev => !prev)} 
            />

          </div>
        </div>
      </div>
    </div>
  );
} 
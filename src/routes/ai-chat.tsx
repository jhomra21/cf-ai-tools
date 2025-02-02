import { createSignal, createEffect, For, Show, onMount, onCleanup, batch } from 'solid-js';
import { chatStore, type ChatMessage } from '../stores/chatStore';
import { useLocation, useIsRouting } from '@solidjs/router';
import MarkdownRenderer from '../components/MarkdownRenderer';

type ScrollState = 'at-bottom' | 'scrolled-up' | 'scrolling';

export default function AiChat() {
  const [currentInput, setCurrentInput] = createSignal('');
  const [isLoading, setIsLoading] = createSignal(false);
  const [currentAssistantMessage, setCurrentAssistantMessage] = createSignal('');
  const [error, setError] = createSignal<string | null>(null);
  const [showHeader, setShowHeader] = createSignal(true);
  const [scrollState, setScrollState] = createSignal<ScrollState>('at-bottom');
  const [isInitialMount, setIsInitialMount] = createSignal(true);
  const location = useLocation();
  const isRouting = useIsRouting();
  let inputRef: HTMLTextAreaElement | undefined;
  let messagesContainerRef: HTMLDivElement | undefined;
  let partialResponse = '';
  let scrollTimeout: number | undefined;
  let lastUserInteraction = 0;
  let isUpdating = false;
  let scrollDebounceTimeout: number | undefined;
  let setupTimeout: number | undefined;

  // Derived state
  const shouldAutoScroll = () => scrollState() === 'at-bottom';

  // Check if we're near the bottom of the scroll container
  const isNearBottom = () => {
    if (!messagesContainerRef) return true;
    const { scrollHeight, scrollTop, clientHeight } = messagesContainerRef;
    return scrollHeight - scrollTop - clientHeight <= 50;
  };

  // Scroll to bottom function
  const scrollToBottom = (smooth = true, force = false) => {
    if (!messagesContainerRef || (isUpdating && !force)) return;
    
    // Small delay to ensure DOM has updated
    requestAnimationFrame(() => {
      const container = messagesContainerRef;
      if (!container) return;
      
      const maxScroll = container.scrollHeight - container.clientHeight;
      container.scrollTo({
        top: maxScroll,
        behavior: smooth ? 'smooth' : 'instant'
      });
    });
  };

  // Update scroll state with debounce
  const updateScrollState = (newState: ScrollState) => {
    if (scrollDebounceTimeout) {
      window.clearTimeout(scrollDebounceTimeout);
    }

    scrollDebounceTimeout = window.setTimeout(() => {
      if (!isUpdating) {
        setScrollState(newState);
      }
    }, 100);
  };

  // Handle manual scrolling
  const handleScroll = (e: Event) => {
    if (!messagesContainerRef || isUpdating) return;
    
    // Clear any existing timeouts
    if (scrollTimeout) {
      window.clearTimeout(scrollTimeout);
    }

    isUpdating = true;
    lastUserInteraction = Date.now();
    
    // Update scroll state
    updateScrollState(isNearBottom() ? 'at-bottom' : 'scrolled-up');

    // Set a timeout to reset updating flag
    scrollTimeout = window.setTimeout(() => {
      isUpdating = false;
    }, 150);
  };

  // Handle viewport changes
  const handleViewportChange = () => {
    if (!messagesContainerRef || !shouldAutoScroll() || isUpdating) return;
    scrollToBottom(false);
  };

  // Focus and scroll setup
  const setupView = (immediate = false) => {
    // Clear any existing setup timeout
    if (setupTimeout) {
      clearTimeout(setupTimeout);
    }

    const delay = immediate ? 0 : 200; // Increased delay for navigation

    // Wait for routing to complete and DOM to be ready
    setupTimeout = window.setTimeout(() => {
      // Use double RAF to ensure next render cycle
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Only proceed if we're not in the middle of a route transition
          if (!isRouting()) {
            // Scroll to bottom first
            if (chatStore.messages.length > 0 && messagesContainerRef) {
              scrollToBottom(false);
            }
            // Then focus input
            if (inputRef) {
              inputRef.focus();
            }
          }
        });
      });
    }, delay);
  };

  // Mount handler
  onMount(() => {
    // Set initial states
    batch(() => {
      setScrollState('at-bottom');
      setIsInitialMount(true);
    });
    
    // Initial setup with no delay
    setupView(true);

    // Add event listeners
    messagesContainerRef?.addEventListener('scroll', handleScroll, { passive: true });
    window.visualViewport?.addEventListener('resize', handleViewportChange);
    window.visualViewport?.addEventListener('scroll', handleViewportChange);

    // Cleanup
    onCleanup(() => {
      // Clear any pending timeouts
      if (scrollTimeout) {
        window.clearTimeout(scrollTimeout);
      }
      if (scrollDebounceTimeout) {
        window.clearTimeout(scrollDebounceTimeout);
      }
      if (setupTimeout) {
        window.clearTimeout(setupTimeout);
      }
      
      // Reset states
      batch(() => {
        setScrollState('at-bottom');
        setIsInitialMount(false);
      });
      
      // Remove event listeners
      messagesContainerRef?.removeEventListener('scroll', handleScroll);
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
      
      isUpdating = false;
    });
  });

  // Handle navigation and routing state changes
  createEffect(() => {
    const path = location.pathname;
    const routing = isRouting();
    
    // Skip initial mount since onMount handles it
    if (isInitialMount()) {
      setIsInitialMount(false);
      return;
    }

    // If we're navigating to the chat route and routing is complete
    if (path === '/ai-chat' && !routing) {
      setupView();
    }
  });

  const parseStreamChunk = (data: string) => {
    try {
      // Split by newlines and filter empty lines
      const lines = data
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

      let text = '';

      for (const line of lines) {
        // Skip control messages
        if (line.includes('[DONE]') || line.includes('"prompt_tokens"') || line.includes('usage')) {
          continue;
        }

        // Remove data: prefix(es) and clean the line
        const cleanedLine = line.replace(/^(data:\s*)+/, '').trim();
        
        try {
          // Try to parse as JSON directly
          const parsed = JSON.parse(cleanedLine);
          if (parsed.response !== undefined) {
            text += parsed.response;
            continue;
          }
        } catch (e) {
          // Not a complete JSON object, accumulate it
          partialResponse += cleanedLine;
        }

        // Try to extract complete JSON objects from accumulated response
        const matches = partialResponse.match(/\{"response":"([^"]*)"[^}]*\}/g);
        if (matches) {
          for (const match of matches) {
            try {
              const parsed = JSON.parse(match);
              if (parsed.response !== undefined) {
                text += parsed.response;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
          // Keep any remaining partial data
          const lastMatch = matches[matches.length - 1];
          partialResponse = partialResponse.slice(partialResponse.lastIndexOf(lastMatch) + lastMatch.length);
        }
      }

      return text;
    } catch (e) {
      console.error('Error in parseStreamChunk:', e);
      return '';
    }
  };

  // Function to render message content with different styling for thinking and response
  const renderMessageContent = (content: string) => {
    const parts = content.split('</think>');
    if (parts.length === 1) {
      // No thinking tag, render as normal response
      return <div class="message-content"><MarkdownRenderer content={content} /></div>;
    }

    return (
      <div class="space-y-4">
        {/* Thinking part */}
        <pre class="whitespace-pre-wrap text-sm leading-relaxed font-mono text-neutral-400 bg-[#1A1A1A] p-3 border-l border-neutral-800">
          {parts[0]}
        </pre>
        {/* Response part */}
        <div class="message-content">
          <MarkdownRenderer content={parts[1]} />
        </div>
      </div>
    );
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    const userMessage = currentInput();
    if (!userMessage.trim()) return;

    batch(() => {
      setScrollState('at-bottom');
      setShowHeader(false);
      setError(null);
      setCurrentAssistantMessage('');
      setCurrentInput('');
      setIsLoading(true);
    });
    
    partialResponse = '';
    chatStore.addMessage({ role: 'user', content: userMessage });
    
    // Scroll after adding user message
    if (shouldAutoScroll()) {
      scrollToBottom(true);
    }

    try {
      const response = await fetch(import.meta.env.DEV ? 'http://127.0.0.1:8787' : `${import.meta.env.VITE_API_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.details || errorData.error || 'Failed to fetch response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const text = parseStreamChunk(chunk);
          
          if (text) {
            assistantMessage += text;
            setCurrentAssistantMessage(assistantMessage);
            
            // Scroll if near bottom for each chunk
            if (shouldAutoScroll()) {
              scrollToBottom(true, true); // Force scroll during streaming
            }
          }
        }

        if (assistantMessage.trim()) {
          chatStore.addMessage({ role: 'assistant', content: assistantMessage });
          setCurrentAssistantMessage(''); // Clear streaming message after adding to store
          // Scroll after adding assistant message if near bottom
          if (shouldAutoScroll()) {
            scrollToBottom(true);
          }
        }
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      chatStore.addMessage({ 
        role: 'assistant', 
        content: '❌ Sorry, I encountered an error. Please try again.' 
      });
      // Scroll to show error if near bottom
      if (shouldAutoScroll()) {
        scrollToBottom(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="container mx-auto p-4 sm:p-6 max-w-7xl flex flex-col h-[calc(100vh-72px-1px)] pb-[env(safe-area-inset-bottom,0px)]">
      {/* Header Section with Model Info */}
      <Show when={showHeader()}>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">

          <div class="border border-[#2D2D2D] bg-[#1E1E1E] p-3 sm:p-4">
            <div class="font-mono text-xs text-neutral-400">MODEL</div>
            <div class="font-mono text-sm text-white text-wrap">DeepSeek R1 Distill Qwen 32B</div>
          </div>

          <div class="border border-[#2D2D2D] bg-[#1E1E1E] p-3 sm:p-4">
            <div class="font-mono text-xs text-neutral-400">PROVIDER</div>
            <div class="font-mono text-sm text-white truncate">Cloudflare AI</div>
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
      <Show when={error()}>
        <div class="mt-4 px-4 py-3 bg-[#1E1E1E] border-l-4 border-[#FF5F57] font-mono text-sm">
          <div class="flex items-center space-x-2">
            <span class="text-[#FF5F57] font-bold">ERROR</span>
            <span class="text-neutral-400">•</span>
            <span class="text-neutral-300">{error()}</span>
          </div>
        </div>
      </Show>

      {/* Main Chat Interface */}
      <div class="flex-1 flex flex-col min-h-0 mt-4">
        {/* Messages Container */}
        <div class="flex-1 overflow-y-auto" ref={messagesContainerRef}>
          <div class="flex flex-col min-h-full justify-end">
            <div class="max-w-3xl mx-auto px-2 sm:px-4 py-8 space-y-6 w-full">
              <For each={chatStore.messages}>
                {(message) => (
                  <div class={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} fade-in`}>
                    <div class={`max-w-[85%] ${
                      message.role === 'user' 
                        ? 'border-r-4 border-[#0066FF] bg-[#1E1E1E]' 
                        : 'border-l-4 border-[#28C840] bg-[#1E1E1E]'
                    } p-4`}>
                      <div class="flex items-center space-x-3 mb-2">
                        <span class="font-mono text-xs uppercase text-neutral-400">
                          {message.role === 'user' ? 'User Input' : 'AI Response'}
                        </span>
                        <span class="text-xs text-neutral-500">•</span>
                        <span class="font-mono text-xs text-neutral-500">
                          {new Date(message.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      {renderMessageContent(message.content)}
                    </div>
                  </div>
                )}
              </For>
              
              {/* Streaming message */}
              <Show when={currentAssistantMessage()}>
                <div class="flex justify-start fade-in">
                  <div class="max-w-[85%] border-l-4 border-[#28C840] bg-[#1E1E1E] p-4">
                    <div class="flex items-center space-x-3 mb-2">
                      <span class="font-mono text-xs uppercase text-neutral-400">System Response</span>
                      <span class="text-xs text-neutral-500">•</span>
                      <span class="font-mono text-xs text-neutral-500">Streaming</span>
                    </div>
                    {renderMessageContent(currentAssistantMessage())}
                  </div>
                </div>
              </Show>

              {/* Loading indicator */}
              <Show when={isLoading() && !currentAssistantMessage()}>
                <div class="flex justify-start fade-in">
                  <div class="max-w-[85%] border-l-4 border-[#FFBD2E] bg-[#1E1E1E] p-4">
                    <div class="flex items-center space-x-3">
                      <span class="font-mono text-xs uppercase text-neutral-400">Processing</span>
                      <div class="flex space-x-1">
                        <div class="w-1 h-1 bg-[#FFBD2E] rounded-full animate-pulse"></div>
                        <div class="w-1 h-1 bg-[#FFBD2E] rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
                        <div class="w-1 h-1 bg-[#FFBD2E] rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </Show>
            </div>
          </div>
        </div>

        {/* Input Section - Updated with safe area handling */}
        <div class="sticky bottom-0 mt-4 max-w-3xl mx-auto w-full px-2 sm:px-4 pb-[env(safe-area-inset-bottom,16px)]">
          <form onSubmit={handleSubmit} class="relative">
            <textarea
              ref={inputRef}
              value={currentInput()}
              onInput={(e) => setCurrentInput(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Message DeepSeek..."
              class="w-full bg-[#1E1E1E] border border-[#2D2D2D] rounded-none p-3 sm:p-4 pr-20 sm:pr-24
                     font-mono text-base text-white placeholder:text-neutral-600
                     focus:outline-none focus:border-[#0066FF] focus:ring-0
                     resize-none h-[48px] sm:h-[56px] overflow-hidden"
              disabled={isLoading()}
            />
            <button
              type="submit"
              disabled={isLoading() || !currentInput().trim()}
              class="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2
                     bg-[#0066FF] text-white font-mono text-sm px-3 sm:px-4 py-1.5
                     disabled:opacity-50 disabled:cursor-not-allowed
                     hover:bg-[#0052CC] transition-colors duration-200"
            >
              SEND
            </button>
          </form>
          <div class="mt-2 font-mono text-xs text-neutral-400 mb-2">
            ↵ to send • shift + ↵ for new line
          </div>
        </div>
      </div>
    </div>
  );
}
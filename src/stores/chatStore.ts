import { createStore } from "solid-js/store";

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatState {
  messages: ChatMessage[];
}

// Load initial state from localStorage
const loadInitialState = (): ChatState => {
  if (typeof window === 'undefined') return { messages: [] };
  
  const saved = localStorage.getItem('chat-history');
  if (!saved) return { messages: [] };
  
  try {
    const parsed = JSON.parse(saved);
    // Clean up any potential duplicate messages during load
    const uniqueMessages = removeDuplicateMessages(parsed.messages || []);
    return { messages: uniqueMessages };
  } catch (e) {
    console.error('Failed to parse chat history:', e);
    return { messages: [] };
  }
};

// Helper to remove duplicate messages
const removeDuplicateMessages = (messages: ChatMessage[]): ChatMessage[] => {
  const seen = new Set();
  return messages.filter(message => {
    const key = `${message.role}:${message.content}:${message.timestamp}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// Create the store
const [state, setState] = createStore<ChatState>(loadInitialState());

// Save to localStorage whenever messages change
const saveToStorage = (messages: ChatMessage[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('chat-history', JSON.stringify({ messages }));
  } catch (e) {
    console.error('Failed to save chat history:', e);
  }
};

export const chatStore = {
  // Getters
  get messages() {
    return state.messages;
  },

  // Actions
  addMessage(message: Omit<ChatMessage, 'timestamp'>) {
    const newMessage = {
      ...message,
      timestamp: Date.now()
    };

    // Check for duplicates in recent messages (last 3)
    const recentMessages = state.messages.slice(-3);
    const isDuplicate = recentMessages.some(msg => 
      msg.role === newMessage.role && 
      msg.content === newMessage.content &&
      Math.abs(msg.timestamp - newMessage.timestamp) < 1000
    );

    if (isDuplicate) {
      return; // Skip duplicate message
    }

    setState('messages', messages => [...messages, newMessage]);
    saveToStorage([...state.messages, newMessage]);
  },

  clearHistory() {
    setState('messages', []);
    saveToStorage([]);
  }
}; 
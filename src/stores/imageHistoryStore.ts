import { createSignal, createRoot } from 'solid-js';

export interface HistoryEntry {
  id: string;
  prompt: string;
  imageURI: string;
  steps: number;
  timestamp: number;
}

// Constants
export const STORAGE_KEY = 'image-gen-history';
export const MAX_HISTORY = 10;
export const MAX_IMAGE_SIZE = 600;
const COMPRESSION_QUALITY = 0.6;

// Compress image before storing
export async function compressImage(dataURI: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // Calculate new dimensions while maintaining aspect ratio
      if (width > height && width > MAX_IMAGE_SIZE) {
        height = Math.round((height * MAX_IMAGE_SIZE) / width);
        width = MAX_IMAGE_SIZE;
      } else if (height > MAX_IMAGE_SIZE) {
        width = Math.round((width * MAX_IMAGE_SIZE) / height);
        height = MAX_IMAGE_SIZE;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Apply sharper compression
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';
      ctx.drawImage(img, 0, 0, width, height);
      
      // Try progressive compression if the image is still too large
      let quality = COMPRESSION_QUALITY;
      let result = canvas.toDataURL('image/jpeg', quality);
      
      // If the result is too large, compress further
      while (result.length > 500000 && quality > 0.1) { // 500KB limit
        quality -= 0.1;
        result = canvas.toDataURL('image/jpeg', quality);
      }
      
      resolve(result);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataURI;
  });
}

// Load history from localStorage
function loadHistory(): HistoryEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const history = JSON.parse(stored);
    // Ensure we don't exceed MAX_HISTORY on load
    return history.slice(0, MAX_HISTORY);
  } catch (error) {
    console.error('Failed to load history:', error);
    return [];
  }
}

// Save history to localStorage with progressive fallback
export function saveHistory(history: HistoryEntry[]) {
  // Always ensure we're within limits
  const trimmedHistory = history.slice(0, MAX_HISTORY);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));
    return trimmedHistory;
  } catch (error) {
    console.warn('Initial save failed, attempting cleanup:', error);
    
    try {
      // First attempt: Remove oldest entries
      const reducedHistory = trimmedHistory.slice(0, Math.max(1, Math.floor(trimmedHistory.length / 2)));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedHistory));
      return reducedHistory;
    } catch (error2) {
      console.warn('Cleanup attempt 1 failed, trying minimal save:', error2);
      
      try {
        // Second attempt: Keep only the most recent entry
        const minimalHistory = trimmedHistory.slice(0, 1);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalHistory));
        return minimalHistory;
      } catch (error3) {
        console.error('All save attempts failed, clearing history:', error3);
        localStorage.removeItem(STORAGE_KEY);
        return [];
      }
    }
  }
}

// Create history store within a root to ensure reactivity
const historyData = createRoot(() => {
  const [history, setHistory] = createSignal<HistoryEntry[]>(loadHistory());
  return { history, setHistory };
});

export const { history, setHistory } = historyData; 
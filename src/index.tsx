/* @refresh reload */
import { render } from 'solid-js/web';
import { Router, Route } from "@solidjs/router";
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import './index.css';
import Layout from './components/Layout';
import Home from './routes/Home';
import AiChat from './routes/ai-chat';
import ImageGen from './routes/image-gen';

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

render(() => (
  <QueryClientProvider client={queryClient}>
    <Router root={Layout}>
      <Route path="/" component={Home} />
      <Route path="/ai-chat" component={AiChat} />
      <Route path="/image-gen" component={ImageGen} />
    </Router>
  </QueryClientProvider>
), root!);

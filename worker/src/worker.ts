import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { ExecutionContext, Ai } from '@cloudflare/workers-types';

interface Env {
  AI: Ai;
  ENVIRONMENT: string;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Transform stream to properly formatted SSE
function transformStream(readable: ReadableStream) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      const reader = readable.getReader();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            break;
          }

          // Forward the chunk directly as SSE
          const chunk = decoder.decode(value);
          controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
        }
        controller.close();
      } catch (error) {
        console.error('Stream error:', error);
        controller.error(error);
      }
    },
  });
}

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  maxAge: 86400,
}));

// Health check endpoint
app.get('/', (c) => c.text('OK'));

// Image generation endpoint
app.post('/generate-image', async (c) => {
  try {
    const body = await c.req.json<{ prompt: string; steps?: number }>();
    
    if (!body.prompt) {
      return c.json({ error: "Prompt is required" }, 400);
    }

    // Check if the request was aborted
    if (c.req.raw.signal?.aborted) {
      return c.json({ error: "Request aborted" }, 408);
    }

    const response = await c.env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
      prompt: body.prompt,
      steps: body.steps || 4
    });

    // Check again if the request was aborted after generation
    if (c.req.raw.signal?.aborted) {
      return c.json({ error: "Request aborted" }, 408);
    }

    if (!response?.image) {
      throw new Error('No image generated');
    }

    // Return data URI format
    const dataURI = `data:image/jpeg;base64,${response.image}`;
    return c.json({ dataURI });

  } catch (error) {
    console.error('Image generation error:', error);
    return c.json({ 
      error: "Failed to generate image", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Chat endpoint
app.post('/', async (c) => {
  try {
    const body = await c.req.json<{ message: string }>();
    if (!body.message) {
      return c.json({ error: "Message is required" }, 400);
    }
    
    // Create messages array for chat
    const messages: ChatMessage[] = [
      { role: 'system', content: 'You are a helpful AI assistant that provides clear and concise responses.' },
      { role: 'user', content: body.message }
    ];

    // Get streaming AI response
    const aiResponse = await c.env.AI.run("@cf/deepseek-ai/deepseek-r1-distill-qwen-32b" as any, {
      messages,
      stream: true
    });

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Transform and return streaming response
    const transformedStream = transformStream(aiResponse as ReadableStream);
    
    return new Response(transformedStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error('Worker error:', error);
    return c.json({ 
      error: "Failed to process request", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app; 
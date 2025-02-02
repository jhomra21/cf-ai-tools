import { Component, createEffect } from 'solid-js';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import Prism from 'prismjs';
import type { Renderer, Tokens, Token } from 'marked';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';
import '../styles/prism-theme.css';

// Declare modules that don't have type definitions
declare module 'dompurify';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
}

// Create a custom renderer class that extends the default one
class CustomRenderer extends marked.Renderer {
  constructor() {
    super();
    // Initialize the lexer with proper inline formatting
    this.options = {
      ...marked.defaults,
      gfm: true,
      breaks: true,
      pedantic: false
    };
  }

  code(token: Tokens.Code): string {
    const language = token.lang || '';
    const highlighted = language && Prism.languages[language]
      ? Prism.highlight(token.text, Prism.languages[language], language)
      : token.text;

    return `
      <div class="relative group">
        <div class="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onclick="navigator.clipboard.writeText(this.parentElement.parentElement.querySelector('code').textContent)"
            class="bg-[#2D2D2D] hover:bg-[#3D3D3D] text-white font-mono text-xs px-2 py-1 rounded-none transition-colors duration-200"
          >
            COPY
          </button>
        </div>
        <pre class="${language ? `language-${language}` : ''} bg-[#1A1A1A] p-4 overflow-x-auto">
          <code class="${language ? `language-${language}` : ''} font-mono text-sm">${highlighted}</code>
        </pre>
      </div>
    `;
  }

  link(token: Tokens.Link): string {
    return `
      <a
        href="${token.href}"
        title="${token.title || ''}"
        class="text-[#0066FF] hover:text-[#0052CC] underline transition-colors duration-200"
        target="_blank"
        rel="noopener noreferrer"
      >${token.text}</a>
    `;
  }

  list(token: Tokens.List): string {
    const type = token.ordered ? 'ol' : 'ul';
    const className = token.ordered
      ? 'list-decimal list-inside mb-4 space-y-2'
      : 'list-disc list-inside mb-4 space-y-2';
    
    // Process each list item
    const items = token.items.map(item => {
   
      // Split the content at line breaks
      const lines = item.text.split('\n');
      
      // Process each line
      const processedLines = lines.map((line, index) => {
        // Pre-process the line to handle markdown
        const processedLine = line.trim();
        
        // Parse the line as inline markdown
        const parsed = marked.parseInline(processedLine, {
          renderer: this,
          gfm: true,
          breaks: true,
          pedantic: false
        });
        
        // Add line break except for the first line
        return index === 0 ? parsed : `<br>${parsed}`;
      });

      // Combine the processed lines
      const itemContent = processedLines.join('');

      return `<li class="text-sm leading-relaxed text-white font-mono">${itemContent}</li>`;
    });

    return `<${type} class="${className}">${items.join('')}</${type}>`;
  }

  paragraph(token: Tokens.Paragraph): string {
    return `<p class="text-sm leading-relaxed text-white font-mono mb-4">${this.parseInline(token.tokens)}</p>`;
  }

  blockquote(token: Tokens.Blockquote): string {
    return `<blockquote class="border-l-4 border-[#2D2D2D] pl-4 my-4 text-neutral-300 italic">${this.parseInline(token.tokens)}</blockquote>`;
  }

  heading(token: Tokens.Heading): string {
    const sizes: Record<number, string> = {
      1: 'text-xl mb-4',
      2: 'text-lg mb-3',
      3: 'text-base mb-2',
      4: 'text-sm mb-2',
      5: 'text-sm mb-2',
      6: 'text-sm mb-2',
    };
    return `<h${token.depth} class="font-bold text-white font-mono ${sizes[token.depth]}">${this.parseInline(token.tokens)}</h${token.depth}>`;
  }

  table(token: Tokens.Table): string {
    const headerHtml = token.header
      ? `<tr>${token.header.map(cell => `<th class="border border-[#2D2D2D] bg-[#1A1A1A] px-4 py-2 text-left font-mono text-sm text-white">${cell}</th>`).join('')}</tr>`
      : '';
    
    const bodyHtml = token.rows
      .map(row => `<tr class="border-b border-[#2D2D2D]">${
        row.map(cell => `<td class="border border-[#2D2D2D] px-4 py-2 text-left font-mono text-sm text-white">${cell}</td>`).join('')
      }</tr>`).join('');

    return `
      <div class="overflow-x-auto mb-4">
        <table class="w-full border-collapse">
          ${headerHtml ? `<thead>${headerHtml}</thead>` : ''}
          <tbody>${bodyHtml}</tbody>
        </table>
      </div>
    `;
  }

  strong(token: Tokens.Strong): string {
    
    // Handle the token's raw text directly if tokens array is not available
    const content = token.tokens 
      ? this.parseInline(token.tokens)
      : token.raw.replace(/^\*\*|\*\*$/g, ''); // Remove ** markers if using raw text
      
    return `<strong class="font-bold text-white">${content}</strong>`;
  }

  em(token: Tokens.Em): string {
    return `<em class="italic text-neutral-300">${this.parseInline(token.tokens)}</em>`;
  }

  codespan(token: Tokens.Codespan): string {
    return `<code class="bg-[#1A1A1A] px-1 py-0.5 rounded-none font-mono text-sm text-white">${token.text}</code>`;
  }

  space(): string {
    return '';
  }

  text(token: Tokens.Text): string {
    return token.text;
  }

  // Helper method to parse inline tokens
  private parseInline(tokens: Token[]): string {
    if (!tokens) return '';
    return tokens.map(token => {
      switch (token.type) {
        case 'strong':
          return this.strong(token as Tokens.Strong);
        case 'em':
          return this.em(token as Tokens.Em);
        case 'codespan':
          return this.codespan(token as Tokens.Codespan);
        case 'text':
          return this.text(token as Tokens.Text);
        case 'link':
          return this.link(token as Tokens.Link);
        default:
          return token.raw || '';
      }
    }).join('');
  }
}

// Configure marked with our custom renderer and proper options
marked.setOptions({
  gfm: true,
  breaks: true,
  pedantic: false,
  renderer: new CustomRenderer()
});

const MarkdownRenderer: Component<MarkdownRendererProps> = (props) => {
  // Effect to highlight code blocks after render
  createEffect(() => {
    if (props.content) {
      requestAnimationFrame(() => {
        document.querySelectorAll('pre code').forEach((block) => {
          Prism.highlightElement(block);
        });
      });
    }
  });

  // Render markdown content
  const renderedContent = () => {
    try {
      // Remove zero-width characters that might interfere with parsing
      const cleanContent = props.content.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, '');
      // Parse markdown to HTML
      const html = marked.parse(cleanContent) as string;

      // Sanitize the HTML
      const sanitized = DOMPurify.sanitize(html, {
        ADD_TAGS: ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre', 'strong', 'em', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'button'],
        ADD_ATTR: ['class', 'id', 'target', 'rel', 'href', 'title', 'onclick', 'style'],
        ALLOW_DATA_ATTR: true,
        ALLOW_ARIA_ATTR: true,
      });

      return sanitized;
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return props.content;
    }
  };

  return (
    <div
      class={`markdown-content ${props.className || ''}`}
      innerHTML={renderedContent()}
    />
  );
};

export default MarkdownRenderer; 
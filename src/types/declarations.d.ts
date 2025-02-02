declare module 'solid-markdown' {
  import { Component, JSX } from 'solid-js';

  interface SolidMarkdownProps {
    children: string;
    components?: Record<string, Component<any>>;
    [key: string]: any;
  }

  const SolidMarkdown: Component<SolidMarkdownProps>;
  export default SolidMarkdown;
}

declare module 'prismjs' {
  const Prism: {
    highlightElement(element: Element): void;
    highlight(text: string, grammar: any, language: string): string;
    languages: Record<string, any>;
  };
  export default Prism;
}

declare module 'dompurify' {
  const DOMPurify: {
    sanitize(dirty: string, config?: any): string;
  };
  export default DOMPurify;
} 
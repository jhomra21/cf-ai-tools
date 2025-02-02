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
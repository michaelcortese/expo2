declare namespace JSX {
  interface IntrinsicElements {
    'elevenlabs-convai': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      'agent-id': string;
      'button-text'?: string;
      'greeting-text'?: string;
    };
  }
} 
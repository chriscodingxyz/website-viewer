declare module 'dom-to-image' {
    export function toPng(node: HTMLElement, options?: Record<string, unknown>): Promise<string>;
  }
  
  declare module 'gif.js' {
    export default class GIF {
      constructor(options: Record<string, unknown>);
      addFrame(imageElement: HTMLImageElement, options?: Record<string, unknown>): void;
      on(event: string, callback: (blob: Blob) => void): void;
      render(): void;
    }
  }
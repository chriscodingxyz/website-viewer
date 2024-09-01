declare module 'dom-to-image' {
    export function toPng(node: HTMLElement, options?: Object): Promise<string>;
  }
  
  declare module 'gif.js' {
    export default class GIF {
      constructor(options: Object);
      addFrame(imageElement: HTMLImageElement, options?: Object): void;
      on(event: string, callback: (blob: Blob) => void): void;
      render(): void;
    }
  }
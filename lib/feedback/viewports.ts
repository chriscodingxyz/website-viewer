export type CanvasViewport = 'desktop' | 'tablet' | 'mobile' | 'fullscreen'

export const VIEWPORT_PRESETS: Record<
  Exclude<CanvasViewport, 'fullscreen'>,
  { id: number; type: 'desktop' | 'tablet' | 'mobile'; width: number; height: number }
> = {
  desktop: { id: 1, type: 'desktop', width: 1440, height: 900 },
  tablet: { id: 2, type: 'tablet', width: 768, height: 1024 },
  mobile: { id: 3, type: 'mobile', width: 375, height: 812 }
}

/**
 * Phase-2 hook: capture a small crop of the iframe region around a pin.
 * Requires html-to-image (or similar) on same-origin proxied content.
 * MVP returns undefined; selectors + coords + comments are enough for the
 * markdown LLM export. JSON export will pick up screenshots once enabled.
 */
export async function captureIframeRegion(
  _iframe: HTMLIFrameElement,
  _xPct: number,
  _yPct: number,
  _cropSize = 240
): Promise<string | undefined> {
  return undefined
}

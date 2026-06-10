import { chromium, type Browser } from 'playwright'

let browserPromise: Promise<Browser> | null = null

/** Singleton headless Chromium; relaunches if the previous instance died. */
export async function getBrowser(): Promise<Browser> {
  if (browserPromise) {
    try {
      const browser = await browserPromise
      if (browser.isConnected()) return browser
    } catch {
      // fall through to relaunch
    }
  }
  browserPromise = chromium.launch({ headless: true })
  return browserPromise
}

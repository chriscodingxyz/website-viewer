import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const size = { width: 180, height: 180 }
export const contentType = 'image/svg+xml'

export default function AppleIcon() {
  const iconPath = path.join(process.cwd(), 'public', 'icon.svg')
  const iconSvg = fs.readFileSync(iconPath, 'utf8')
  
  return new Response(iconSvg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
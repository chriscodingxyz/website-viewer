import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const size = { width: 32, height: 32 }
export const contentType = 'image/svg+xml'

export default function Icon() {
  const iconPath = path.join(process.cwd(), 'public', 'icon.svg')
  const iconSvg = fs.readFileSync(iconPath, 'utf8')
  
  return new Response(iconSvg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    
    if (!url) {
      return NextResponse.json({ error: 'URL parameter required' }, { status: 400 })
    }

    // For local images, check if file exists
    if (url.startsWith('/')) {
      const imagePath = path.join(process.cwd(), 'public', url.replace('/', ''))
      const exists = fs.existsSync(imagePath)
      
      if (exists) {
        const stats = fs.statSync(imagePath)
        return NextResponse.json({
          exists: true,
          path: url,
          size: stats.size,
          lastModified: stats.mtime
        })
      } else {
        return NextResponse.json({ exists: false, path: url })
      }
    }

    // For external URLs, try to fetch
    try {
      const response = await fetch(url, { method: 'HEAD' })
      return NextResponse.json({
        exists: response.ok,
        status: response.status,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length')
      })
    } catch {
      return NextResponse.json({ exists: false, url })
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
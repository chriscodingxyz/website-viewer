import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { nanoid } from 'nanoid'
import { s3, s3Bucket, publicUrlFor } from '@/lib/s3'
import { requireUser } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'video/webm',
  'video/mp4'
])

export async function POST(req: NextRequest) {
  if (!s3) return NextResponse.json({ error: 'Storage not configured' }, { status: 503 })
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { contentType, ext } = await req.json().catch(() => ({ contentType: '', ext: '' }))
  if (!contentType || !ALLOWED_TYPES.has(contentType)) {
    return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 })
  }

  const key = `${user.id}/${new Date().toISOString().slice(0, 10)}/${nanoid()}${ext ? `.${ext}` : ''}`
  const cmd = new PutObjectCommand({
    Bucket: s3Bucket,
    Key: key,
    ContentType: contentType
  })
  const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 })

  return NextResponse.json({
    uploadUrl,
    key,
    publicUrl: publicUrlFor(key)
  })
}

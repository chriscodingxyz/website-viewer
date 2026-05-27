import { S3Client } from '@aws-sdk/client-s3'

const endpoint = process.env.S3_ENDPOINT
const region = process.env.S3_REGION || 'us-east-1'
const accessKey = process.env.S3_ACCESS_KEY
const secretKey = process.env.S3_SECRET_KEY
const forcePathStyle = process.env.S3_FORCE_PATH_STYLE !== 'false'

export const s3Bucket = process.env.S3_BUCKET || 'feedback-uploads'
export const s3PublicUrl = process.env.S3_PUBLIC_URL || ''

export const s3 = accessKey && secretKey
  ? new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      forcePathStyle
    })
  : null

export function publicUrlFor(key: string) {
  if (!s3PublicUrl) return null
  return `${s3PublicUrl.replace(/\/$/, '')}/${key}`
}

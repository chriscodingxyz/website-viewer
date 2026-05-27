export function canonicalFeedbackUrl(value: string, baseUrl?: string) {
  const trimmed = value.trim()
  if (!trimmed) return trimmed

  try {
    const url = baseUrl ? new URL(trimmed, baseUrl) : new URL(trimmed)
    url.hash = ''
    return url.toString()
  } catch {
    return trimmed
  }
}

export function sameFeedbackUrl(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b) return false
  return canonicalFeedbackUrl(a) === canonicalFeedbackUrl(b)
}

export function feedbackPath(value: string) {
  try {
    const url = new URL(canonicalFeedbackUrl(value))
    return `${url.pathname}${url.search}` || '/'
  } catch {
    return value
  }
}

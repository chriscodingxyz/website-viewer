import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
// SDK structured-output helper requires zod v4 types (shipped under zod/v4)
import { z } from 'zod/v4'

const DEFAULT_MODEL = 'claude-sonnet-4-6'

const VerdictSchema = z.object({
  verdict: z.enum(['implemented', 'not-implemented', 'unclear']),
  confidence: z.enum(['low', 'medium', 'high']),
  reason: z.string()
})
export type PinVerdict = z.infer<typeof VerdictSchema>

export function aiVerifyEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

export interface VerifyPinInput {
  intentLabel: string
  editInstruction?: string
  replacementText?: string
  assetUrl?: string
  reviewerComment?: string
  elementTag?: string
  cssSelector?: string
  snapshotHtml?: string
  liveHtml?: string
  liveElementFound: boolean
  snapshotImage?: Buffer
  liveImage?: Buffer
}

const imageBlock = (data: Buffer) =>
  ({
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: 'image/png' as const,
      data: data.toString('base64')
    }
  })

/**
 * Asks Claude to judge whether a requested website change has been applied,
 * by comparing the captured snapshot (then) with the live page (now).
 */
export async function verifyPin(input: VerifyPinInput): Promise<PinVerdict> {
  const client = new Anthropic()
  const model = process.env.BUGSMASH_VERIFY_MODEL || DEFAULT_MODEL

  const lines: string[] = []
  lines.push('A website reviewer requested the following change:')
  lines.push(`- Intent: ${input.intentLabel}`)
  if (input.editInstruction) lines.push(`- Instruction: ${input.editInstruction}`)
  if (input.replacementText) lines.push(`- Requested content: ${input.replacementText}`)
  if (input.assetUrl) lines.push(`- Replacement asset URL: ${input.assetUrl}`)
  if (input.reviewerComment) lines.push(`- Reviewer note: ${input.reviewerComment}`)
  if (input.elementTag) lines.push(`- Target element: <${input.elementTag}>`)
  if (input.cssSelector) lines.push(`- CSS selector: ${input.cssSelector}`)
  lines.push('')
  lines.push('Element HTML when the request was made (THEN):')
  lines.push('```html')
  lines.push(input.snapshotHtml || '(not captured)')
  lines.push('```')
  lines.push('')
  if (input.liveElementFound) {
    lines.push('Element HTML on the live page right now (NOW):')
    lines.push('```html')
    lines.push(input.liveHtml || '(empty)')
    lines.push('```')
  } else {
    lines.push(
      'The target element could NOT be found on the live page right now (selector no longer matches anything).'
    )
  }
  lines.push('')
  lines.push(
    'Decide whether the requested change has been implemented on the live page. ' +
      'A removal request counts as implemented when the element is gone. ' +
      'If the element moved or the page changed in unrelated ways, judge only the requested change. ' +
      'Answer "unclear" when the evidence is insufficient.'
  )

  const content: Anthropic.ContentBlockParam[] = [
    { type: 'text', text: lines.join('\n') }
  ]
  if (input.snapshotImage) {
    content.push({ type: 'text', text: 'Screenshot THEN (at request time):' })
    content.push(imageBlock(input.snapshotImage))
  }
  if (input.liveImage) {
    content.push({ type: 'text', text: 'Screenshot NOW (live page):' })
    content.push(imageBlock(input.liveImage))
  }

  const response = await client.messages.parse({
    model,
    max_tokens: 1024,
    messages: [{ role: 'user', content }],
    output_config: { format: zodOutputFormat(VerdictSchema) }
  })

  if (!response.parsed_output) {
    return {
      verdict: 'unclear',
      confidence: 'low',
      reason: 'Model response could not be parsed.'
    }
  }
  return response.parsed_output
}

import { z } from 'zod'

export const SeverityEnum = z.enum(['low', 'medium', 'high', 'blocking'])
export type Severity = z.infer<typeof SeverityEnum>

export const ViewportTypeEnum = z.enum(['desktop', 'tablet', 'mobile'])
export type FeedbackViewportType = z.infer<typeof ViewportTypeEnum>

export const FeedbackPinKindEnum = z.enum(['comment', 'inspect'])
export type FeedbackPinKind = z.infer<typeof FeedbackPinKindEnum>

export const FeedbackPinStatusEnum = z.enum(['open', 'implemented', 'closed'])
export type FeedbackPinStatus = z.infer<typeof FeedbackPinStatusEnum>

export const AnchorStatusEnum = z.enum(['found', 'missing', 'matches-target'])
export type AnchorStatus = z.infer<typeof AnchorStatusEnum>

export const VerificationStateEnum = z.enum([
  'unverified',
  'possibly-done',
  'confirmed-done',
  'still-open'
])
export type VerificationState = z.infer<typeof VerificationStateEnum>

export const VerifiedByEnum = z.enum(['heuristic', 'ai', 'human'])
export type VerifiedBy = z.infer<typeof VerifiedByEnum>

export const PinReplySchema = z.object({
  id: z.string(),
  body: z.string(),
  authorName: z.string(),
  authorEmail: z.string().optional(),
  userId: z.string().optional(),
  createdAt: z.string()
})
export type PinReply = z.infer<typeof PinReplySchema>

export const PinSnapshotSchema = z.object({
  status: z.enum(['pending', 'captured', 'element-missing', 'failed']),
  pageScreenshotUrl: z.string().optional(),
  elementScreenshotUrl: z.string().optional(),
  elementHtml: z.string().optional(),
  capturedUrl: z.string().optional(),
  capturedAt: z.string().optional()
})
export type PinSnapshot = z.infer<typeof PinSnapshotSchema>

export const PinSchema = z.object({
  id: z.string(),
  number: z.number().int().min(1),
  kind: FeedbackPinKindEnum.optional(),
  status: FeedbackPinStatusEnum.optional(),
  authorName: z.string().optional(),
  authorEmail: z.string().optional(),
  authorUserId: z.string().optional(),
  isGuest: z.boolean().optional(),
  url: z.string(),
  viewportId: z.number(),
  viewportType: ViewportTypeEnum,
  viewportWidth: z.number(),
  viewportHeight: z.number(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  documentX: z.number().optional(),
  documentY: z.number().optional(),
  scrollX: z.number().optional(),
  scrollY: z.number().optional(),
  cssSelector: z.string().optional(),
  playwrightLocator: z.string().optional(),
  elementText: z.string().optional(),
  elementTag: z.string().optional(),
  elementAttributes: z.record(z.string()).optional(),
  elementHtml: z.string().optional(),
  ancestorChain: z.array(z.string()).optional(),
  replacementText: z.string().optional(),
  editInstruction: z.string().optional(),
  severity: SeverityEnum,
  comment: z.string(),
  assetUrl: z.string().optional(),
  anchorStatus: AnchorStatusEnum.optional(),
  anchorCheckedAt: z.string().optional(),
  // server/human-owned; round-tripped for display but ignored by the bulk sync
  verificationState: VerificationStateEnum.optional(),
  verifiedBy: VerifiedByEnum.optional(),
  verifiedAt: z.string().optional(),
  verificationReason: z.string().optional(),
  // server-populated historical capture; never written by the bulk sync
  snapshot: PinSnapshotSchema.optional(),
  createdAt: z.string(),
  replies: z.array(PinReplySchema).optional()
})
export type Pin = z.infer<typeof PinSchema>

export const FeedbackSessionSchema = z.object({
  id: z.string(),
  projectId: z.string().optional(),
  url: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  pins: z.array(PinSchema),
  meta: z.object({
    title: z.string().optional(),
    userAgent: z.string(),
    capturedViewports: z.array(
      z.object({
        type: ViewportTypeEnum,
        w: z.number(),
        h: z.number()
      })
    )
  })
})
export type FeedbackSession = z.infer<typeof FeedbackSessionSchema>

export type FeedbackTool = FeedbackPinKind

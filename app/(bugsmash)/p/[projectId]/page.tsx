import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth-helpers'
import { loadProjectBundle, toFeedbackSession } from '@/lib/projects'
import ProjectWorkspace from '@/components/bugsmash/ProjectWorkspace'

export const dynamic = 'force-dynamic'

export default async function ProjectWorkspacePage({
  params
}: {
  params: { projectId: string }
}) {
  const session = await requireSession()
  const bundle = await loadProjectBundle(params.projectId, session)

  if (!bundle) {
    notFound()
  }

  const initialSession = toFeedbackSession(
    bundle.feedbackSession,
    bundle.pins,
    bundle.replies
  )

  return (
    <ProjectWorkspace
      project={{
        id: bundle.project.id,
        name: bundle.project.name,
        websiteUrl: bundle.project.websiteUrl,
        publicAccess: bundle.project.publicAccess
      }}
      role={bundle.member?.role ?? null}
      canEdit={bundle.canEdit}
      publicView={bundle.publicView}
      initialSession={initialSession}
    />
  )
}

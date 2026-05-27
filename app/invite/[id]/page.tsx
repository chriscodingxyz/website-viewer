import InviteAcceptClient from './InviteAcceptClient'

export default function InvitePage({ params }: { params: { id: string } }) {
  return <InviteAcceptClient invitationId={params.id} />
}

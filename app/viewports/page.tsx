import WebsiteViewer from '@/components/WebsiteViewer'

// Disable static generation for this page since it requires client-side context
export const dynamic = 'force-dynamic'

export default function ViewportsPage() {
  return <WebsiteViewer />
}
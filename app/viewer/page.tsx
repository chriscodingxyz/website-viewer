import WebsiteViewer from '@/components/WebsiteViewer'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Free Website Viewer — preview any site across devices',
  description:
    'Preview any URL across desktop, tablet, and mobile. Audit SEO, social cards, and technical setup.'
}

export default function FreeViewerPage() {
  return (
    <div className='w-full'>
      <WebsiteViewer />
    </div>
  )
}

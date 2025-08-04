'use client'

import React from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Shield, Smartphone, Palette, FileText, Server, Fingerprint, Lock, Globe } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface TechnicalSectionProps {
  metadata: WebsiteMetadata
}

export default function TechnicalSection({ metadata }: TechnicalSectionProps) {
  const { technical, headers, icons, structuredData } = metadata

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard`)
    } catch (err) {
      toast.error(`Failed to copy ${label}`)
    }
  }

  const GridItem = ({ label, value, icon: Icon }: { label: string; value?: string; icon: React.ElementType }) => (
    <div className="flex items-start gap-3 p-3 bg-orange-50/50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50 rounded-lg">
      <Icon className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-1 shrink-0" />
      <div className="flex-1">
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
        {value ? (
          <p className="text-sm text-gray-800 dark:text-gray-200 font-semibold break-all">{value}</p>
        ) : (
          <p className="text-sm text-red-600 dark:text-red-400 font-semibold">Not set</p>
        )}
      </div>
      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => copyToClipboard(value, label)}
          className="shrink-0 ml-2 h-6 w-6 p-0 hover:bg-orange-100/60 text-orange-600 hover:text-orange-700"
        >
          <Copy className="h-3 w-3" />
        </Button>
      )}
    </div>
  );

  const IconsSection = () => (
    <div className="bg-white/50 dark:bg-gray-900/30 backdrop-blur-sm border border-orange-200/60 dark:border-orange-800/40 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <Palette className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Icons & Favicons</h3>
      </div>
      <div>
        {icons.length > 0 ? (
          <div className="space-y-3">
            {icons.map((icon, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-orange-50/50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50 rounded-xl">
                <div className="relative w-8 h-8 bg-orange-100 dark:bg-orange-900/50 rounded shrink-0">
                  <Image
                    src={icon.href}
                    alt={`Icon ${icon.rel}`}
                    fill
                    className="object-contain rounded"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/70 dark:text-orange-300 dark:border-orange-800/60">{icon.rel}</Badge>
                    {icon.sizes && <Badge variant="secondary" className="bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200">{icon.sizes}</Badge>}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium break-all">{icon.href}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(icon.href, `${icon.rel} icon URL`)}
                  className="h-7 w-7 p-0 hover:bg-orange-100/60 text-orange-600 hover:text-orange-700"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 font-medium text-center py-4">No icons found</p>
        )}
      </div>
    </div>
  )

  const StructuredDataSection = () => (
    <div className="bg-white/50 dark:bg-gray-900/30 backdrop-blur-sm border border-orange-200/60 dark:border-orange-800/40 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Structured Data (JSON-LD)</h3>
      </div>
      <div>
        {structuredData.length > 0 ? (
          <div className="space-y-3">
            {structuredData.map((data, index) => (
              <div key={index} className="bg-orange-50/50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/70 dark:text-orange-300 dark:border-orange-800/60">{data.type}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(JSON.stringify(data.data, null, 2), `${data.type} schema`)}
                    className="h-7 w-7 p-0 hover:bg-orange-100/60 text-orange-600 hover:text-orange-700"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <pre className="text-xs bg-white/70 dark:bg-gray-800/30 border border-orange-200/60 dark:border-orange-800/50 p-3 rounded-lg overflow-x-auto font-mono">
                  {JSON.stringify(data.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 font-medium text-center py-4">No structured data found</p>
        )}
      </div>
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="bg-white/50 dark:bg-gray-900/30 backdrop-blur-sm border border-orange-200/60 dark:border-orange-800/40 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Technical Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <GridItem label="Character Set" value={technical.charset} icon={Globe} />
            <GridItem label="Theme Color" value={technical.themeColor} icon={Palette} />
            <GridItem label="Generator" value={technical.generator} icon={Fingerprint} />
            <GridItem label="Referrer Policy" value={technical.referrer} icon={Lock} />
            <GridItem label="Web App Manifest" value={technical.manifestUrl} icon={FileText} />
            <GridItem label="Apple Touch Icon" value={technical.appleTouchIcon} icon={Smartphone} />
          </div>
        </div>

        <div className="bg-white/50 dark:bg-gray-900/30 backdrop-blur-sm border border-orange-200/60 dark:border-orange-800/40 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Server className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">HTTP Headers</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <GridItem label="Server" value={headers?.server} icon={Server} />
            <GridItem label="Content-Type" value={headers?.contentType} icon={FileText} />
            <GridItem label="Cache-Control" value={headers?.cacheControl} icon={FileText} />
            <GridItem label="X-Frame-Options" value={headers?.xFrameOptions} icon={Shield} />
            <GridItem label="Strict-Transport-Security" value={headers?.strictTransportSecurity} icon={Lock} />
          </div>
        </div>
        
        <StructuredDataSection />
      </div>

      <div className="space-y-6">
        <IconsSection />
      </div>
    </div>
  )
}

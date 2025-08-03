'use client'

import React from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Shield, Smartphone, Palette, FileText } from 'lucide-react'
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

  const MetadataRow = ({ 
    label, 
    value, 
    badge 
  }: { 
    label: string
    value?: string
    badge?: string 
  }) => (
    <div className="flex items-center justify-between p-4 bg-orange-50/50 border border-orange-100 rounded-xl">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-800 text-sm">{label}</span>
          {badge && <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 border-orange-200">{badge}</Badge>}
        </div>
        {value ? (
          <p className="text-sm text-gray-700 font-medium mt-1 break-all">{value}</p>
        ) : (
          <p className="text-sm text-red-600 font-semibold mt-1">Not set</p>
        )}
      </div>
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyToClipboard(value, label)}
          className="shrink-0 ml-2 h-7 w-7 p-0 hover:bg-orange-100/60 text-orange-600 hover:text-orange-700"
        >
          <Copy className="h-3 w-3" />
        </Button>
      )}
    </div>
  )

  // Icons and Favicons
  const IconsSection = () => (
    <div className="bg-white/50 backdrop-blur-sm border border-orange-200/60 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Palette className="h-5 w-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-800">Icons & Favicons</h3>
      </div>
      <div>
        {icons.length > 0 ? (
          <div className="space-y-4">
            {icons.map((icon, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-orange-50/50 border border-orange-100 rounded-xl">
                <div className="relative w-8 h-8 bg-orange-100 rounded shrink-0">
                  <Image
                    src={icon.href}
                    alt={`Icon ${icon.rel}`}
                    fill
                    className="object-contain rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">{icon.rel}</Badge>
                    {icon.sizes && <Badge variant="secondary" className="bg-orange-200 text-orange-800">{icon.sizes}</Badge>}
                    {icon.type && <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">{icon.type}</Badge>}
                  </div>
                  <p className="text-sm text-gray-700 font-medium break-all">
                    {icon.href}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(icon.href, `${icon.rel} icon URL`)}
                  className="h-7 w-7 p-0 hover:bg-orange-100/60 text-orange-600 hover:text-orange-700"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 font-medium">No icons found</p>
        )}
      </div>
    </div>
  )

  // Security Headers
  const SecuritySection = () => (
    <div className="bg-white/50 backdrop-blur-sm border border-orange-200/60 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-5 w-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-800">Security Headers</h3>
      </div>
      <div className="space-y-4">
        <MetadataRow 
          label="X-Frame-Options" 
          value={headers?.xFrameOptions}
          badge="Clickjacking Protection"
        />
        <MetadataRow 
          label="Content-Security-Policy" 
          value={headers?.contentSecurityPolicy}
          badge="XSS Protection"
        />
        <MetadataRow 
          label="Strict-Transport-Security" 
          value={headers?.strictTransportSecurity}
          badge="HTTPS Enforcement"
        />
      </div>
    </div>
  )

  // Technical Metadata
  const TechnicalMetadataSection = () => (
    <div className="bg-white/50 backdrop-blur-sm border border-orange-200/60 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Smartphone className="h-5 w-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-800">Technical Details</h3>
      </div>
      <div className="space-y-4">
        <MetadataRow label="Character Set" value={technical.charset} />
        <MetadataRow label="Theme Color" value={technical.themeColor} />
        <MetadataRow label="Web App Manifest" value={technical.manifestUrl} />
        <MetadataRow label="Generator" value={technical.generator} />
        <MetadataRow label="Referrer Policy" value={technical.referrer} />
        <MetadataRow label="Apple Touch Icon" value={technical.appleTouchIcon} />
        <MetadataRow label="Apple iTunes App" value={technical.appleItunes} />
        <MetadataRow label="MS Application Config" value={technical.msapplicationConfig} />
      </div>
    </div>
  )

  // Response Headers
  const ResponseHeadersSection = () => (
    <div className="bg-white/50 backdrop-blur-sm border border-orange-200/60 rounded-2xl p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">HTTP Response Headers</h3>
      </div>
      <div className="space-y-4">
        <MetadataRow label="Server" value={headers?.server} />
        <MetadataRow label="Content-Type" value={headers?.contentType} />
        <MetadataRow label="Content-Encoding" value={headers?.contentEncoding} />
        <MetadataRow label="Cache-Control" value={headers?.cacheControl} />
        <MetadataRow label="Last-Modified" value={headers?.lastModified} />
        <MetadataRow label="ETag" value={headers?.etag} />
      </div>
    </div>
  )

  // Structured Data
  const StructuredDataSection = () => (
    <div className="bg-white/50 backdrop-blur-sm border border-orange-200/60 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-5 w-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-800">Structured Data (JSON-LD)</h3>
      </div>
      <div>
        {structuredData.length > 0 ? (
          <div className="space-y-4">
            {structuredData.map((data, index) => (
              <div key={index} className="bg-orange-50/50 border border-orange-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">{data.type}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(data.data, null, 2), `${data.type} schema`)}
                    className="h-7 w-7 p-0 hover:bg-orange-100/60 text-orange-600 hover:text-orange-700"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <pre className="text-xs bg-white/70 border border-orange-200/60 p-3 rounded-lg overflow-x-auto font-mono">
                  {JSON.stringify(data.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 font-medium">No structured data found</p>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <TechnicalMetadataSection />
      <IconsSection />
      <SecuritySection />
      <ResponseHeadersSection />
      <StructuredDataSection />
    </div>
  )
}
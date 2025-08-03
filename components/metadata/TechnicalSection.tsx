'use client'

import React from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{label}</span>
          {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
        </div>
        {value ? (
          <p className="text-sm text-muted-foreground mt-1 break-all">{value}</p>
        ) : (
          <p className="text-sm text-red-500 mt-1">Not set</p>
        )}
      </div>
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyToClipboard(value, label)}
          className="shrink-0 ml-2"
        >
          <Copy className="h-3 w-3" />
        </Button>
      )}
    </div>
  )

  // Icons and Favicons
  const IconsSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Icons & Favicons
        </CardTitle>
      </CardHeader>
      <CardContent>
        {icons.length > 0 ? (
          <div className="space-y-3">
            {icons.map((icon, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-md">
                <div className="relative w-8 h-8 bg-gray-100 rounded shrink-0">
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
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{icon.rel}</Badge>
                    {icon.sizes && <Badge variant="secondary">{icon.sizes}</Badge>}
                    {icon.type && <Badge variant="outline">{icon.type}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 break-all">
                    {icon.href}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(icon.href, `${icon.rel} icon URL`)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No icons found</p>
        )}
      </CardContent>
    </Card>
  )

  // Security Headers
  const SecuritySection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Headers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
      </CardContent>
    </Card>
  )

  // Technical Metadata
  const TechnicalMetadataSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Technical Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <MetadataRow label="Character Set" value={technical.charset} />
        <MetadataRow label="Theme Color" value={technical.themeColor} />
        <MetadataRow label="Web App Manifest" value={technical.manifestUrl} />
        <MetadataRow label="Generator" value={technical.generator} />
        <MetadataRow label="Referrer Policy" value={technical.referrer} />
        <MetadataRow label="Apple Touch Icon" value={technical.appleTouchIcon} />
        <MetadataRow label="Apple iTunes App" value={technical.appleItunes} />
        <MetadataRow label="MS Application Config" value={technical.msapplicationConfig} />
      </CardContent>
    </Card>
  )

  // Response Headers
  const ResponseHeadersSection = () => (
    <Card>
      <CardHeader>
        <CardTitle>HTTP Response Headers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <MetadataRow label="Server" value={headers?.server} />
        <MetadataRow label="Content-Type" value={headers?.contentType} />
        <MetadataRow label="Content-Encoding" value={headers?.contentEncoding} />
        <MetadataRow label="Cache-Control" value={headers?.cacheControl} />
        <MetadataRow label="Last-Modified" value={headers?.lastModified} />
        <MetadataRow label="ETag" value={headers?.etag} />
      </CardContent>
    </Card>
  )

  // Structured Data
  const StructuredDataSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Structured Data (JSON-LD)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {structuredData.length > 0 ? (
          <div className="space-y-4">
            {structuredData.map((data, index) => (
              <div key={index} className="border rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{data.type}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(data.data, null, 2), `${data.type} schema`)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                  {JSON.stringify(data.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No structured data found</p>
        )}
      </CardContent>
    </Card>
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
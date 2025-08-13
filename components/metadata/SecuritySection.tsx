'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  RefreshCw,
  FileCode
} from 'lucide-react'
import { toast } from 'sonner'
import { SecurityScanner, SecurityScanResult, SecurityFinding, SecuritySeverity } from '@/services/SecurityScanner'

interface SecuritySectionProps {
  url: string
}

const SeverityIcon = ({ severity }: { severity: SecuritySeverity }) => {
  switch (severity) {
    case 'critical':
      return <ShieldX className="h-4 w-4 text-red-500" />
    case 'high':
      return <ShieldAlert className="h-4 w-4 text-orange-500" />
    case 'medium':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    case 'low':
      return <Shield className="h-4 w-4 text-blue-500" />
    case 'info':
      return <Info className="h-4 w-4 text-gray-500" />
    default:
      return <Shield className="h-4 w-4" />
  }
}

const SeverityBadge = ({ severity }: { severity: SecuritySeverity }) => {
  const variants = {
    critical: 'destructive',
    high: 'destructive',
    medium: 'default',
    low: 'secondary',
    info: 'outline'
  } as const

  const colors = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200', 
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-blue-100 text-blue-800 border-blue-200',
    info: 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <Badge className={colors[severity]}>
      {severity.toUpperCase()}
    </Badge>
  )
}

const SecurityFindingCard = ({ finding }: { finding: SecurityFinding }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showValue, setShowValue] = useState(false)

  const copyValue = async () => {
    try {
      const valueToCopy = finding.value || 'No value available'
      await navigator.clipboard.writeText(valueToCopy)
      toast.success('Value copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy value')
    }
  }

  const getServiceIcon = (service?: string) => {
    switch (service?.toLowerCase()) {
      case 'aws':
        return '🔶'
      case 'stripe':
        return '💳'
      case 'supabase':
        return '🗃️'
      case 'firebase':
        return '🔥'
      case 'openai':
        return '🤖'
      case 'sendgrid':
        return '📧'
      default:
        return '🔑'
    }
  }

  const truncateValue = (value: string, maxLength: number = 40) => {
    if (value.length <= maxLength) return value
    return `${value.substring(0, maxLength)}...`
  }

  return (
    <Card className="mb-3">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SeverityIcon severity={finding.severity} />
                <div>
                  <CardTitle className="text-sm flex items-center gap-2">
                    {finding.service && (
                      <span className="text-lg">{getServiceIcon(finding.service)}</span>
                    )}
                    {finding.title}
                  </CardTitle>
                  <p className="text-xs text-gray-600 mt-1">
                    Found in: {finding.location}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <SeverityBadge severity={finding.severity} />
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Description */}
              <div>
                <p className="text-sm text-gray-700">
                  {finding.description}
                </p>
              </div>

              {/* Value */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">
                    {finding.value ? 'Exposed Value:' : 'Reference Details:'}
                  </span>
                  {finding.value && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowValue(!showValue)}
                        className="h-6 px-2"
                      >
                        {showValue ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        <span className="ml-1 text-xs">
                          {showValue ? 'Hide' : 'Show'}
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyValue}
                        className="h-6 px-2"
                      >
                        <Copy className="h-3 w-3" />
                        <span className="ml-1 text-xs">Copy</span>
                      </Button>
                    </>
                  )}
                </div>
                <code className="bg-gray-100 p-2 rounded text-xs block font-mono">
                  {finding.value ? (
                    showValue ? finding.value : '•'.repeat(Math.min(finding.value.length, 40))
                  ) : (
                    <span className="text-gray-600 italic">
                      Process environment reference found (value not exposed in bundle)
                    </span>
                  )}
                </code>
              </div>

              {/* Recommendation */}
              <div>
                <h4 className="text-sm font-medium mb-2 text-blue-700">
                  🛠️ How to fix this:
                </h4>
                <p className="text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
                  {finding.recommendation}
                </p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

export default function SecuritySection({ url }: SecuritySectionProps) {
  const [scanResult, setScanResult] = useState<SecurityScanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runSecurityScan = useCallback(async () => {
    if (!url) return
    
    setLoading(true)
    setError(null)
    
    try {
      const scanner = new SecurityScanner()
      const result = await scanner.scanWebsite(url)
      setScanResult(result)
      
      if (result.summary.critical > 0 || result.summary.high > 0) {
        toast.error(`Found ${result.summary.critical + result.summary.high} critical security issues!`)
      } else if (result.totalFindings > 0) {
        toast.warning(`Found ${result.totalFindings} potential security concerns`)
      } else {
        toast.success('No security issues detected!')
      }
    } catch (error) {
      console.error('Security scan failed:', error)
      setError(error instanceof Error ? error.message : 'Security scan failed')
      toast.error('Security scan failed')
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    if (url) {
      runSecurityScan()
    }
  }, [url, runSecurityScan])

  const getSeverityColor = (severity: SecuritySeverity) => {
    switch (severity) {
      case 'critical': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-blue-600'
      case 'info': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const criticalFindings = scanResult?.findings.filter(f => f.severity === 'critical') || []
  const highFindings = scanResult?.findings.filter(f => f.severity === 'high') || []
  const mediumFindings = scanResult?.findings.filter(f => f.severity === 'medium') || []
  const lowFindings = scanResult?.findings.filter(f => f.severity === 'low') || []
  const infoFindings = scanResult?.findings.filter(f => f.severity === 'info') || []

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Security Analysis</h3>
        </div>
        <Button
          onClick={runSecurityScan}
          disabled={loading || !url}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="ml-2">
            {loading ? 'Scanning...' : 'Refresh Scan'}
          </span>
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-y-2">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
              <div className="ml-3">
                <p className="font-medium">Scanning website for security issues...</p>
                <p className="text-sm text-gray-600">This may take a few moments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <ShieldX className="h-6 w-6 text-red-500" />
              <div>
                <p className="font-medium text-red-700">Security scan failed</p>
                <p className="text-sm text-gray-600">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {scanResult && !loading && (
        <div className="space-y-4">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                Security Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getSeverityColor('critical')}`}>
                    {scanResult.summary.critical}
                  </div>
                  <div className="text-xs text-gray-600">Critical</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getSeverityColor('high')}`}>
                    {scanResult.summary.high}
                  </div>
                  <div className="text-xs text-gray-600">High</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getSeverityColor('medium')}`}>
                    {scanResult.summary.medium}
                  </div>
                  <div className="text-xs text-gray-600">Medium</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getSeverityColor('low')}`}>
                    {scanResult.summary.low}
                  </div>
                  <div className="text-xs text-gray-600">Low</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getSeverityColor('info')}`}>
                    {scanResult.summary.info}
                  </div>
                  <div className="text-xs text-gray-600">Info</div>
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <FileCode className="h-4 w-4" />
                  {scanResult.bundlesScanned} bundles scanned
                </div>
                {scanResult.bundlesFailed > 0 && (
                  <div className="text-red-600">
                    {scanResult.bundlesFailed} failed
                  </div>
                )}
                <div>Scan time: {scanResult.scanTime}ms</div>
              </div>
            </CardContent>
          </Card>

          {/* Critical Issues */}
          {criticalFindings.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2">
                <ShieldX className="h-5 w-5" />
                Critical Security Issues ({criticalFindings.length})
              </h4>
              {criticalFindings.map(finding => (
                <SecurityFindingCard key={finding.id} finding={finding} />
              ))}
            </div>
          )}

          {/* High Risk Issues */}
          {highFindings.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-orange-700 mb-3 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                High Risk Issues ({highFindings.length})
              </h4>
              {highFindings.map(finding => (
                <SecurityFindingCard key={finding.id} finding={finding} />
              ))}
            </div>
          )}

          {/* Medium Risk Issues */}
          {mediumFindings.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-yellow-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Medium Risk Issues ({mediumFindings.length})
              </h4>
              {mediumFindings.map(finding => (
                <SecurityFindingCard key={finding.id} finding={finding} />
              ))}
            </div>
          )}

          {/* Info Items */}
          {infoFindings.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Info className="h-5 w-5" />
                Information & Recommendations ({infoFindings.length})
              </h4>
              {infoFindings.map(finding => (
                <SecurityFindingCard key={finding.id} finding={finding} />
              ))}
            </div>
          )}

          {/* No Issues Found */}
          {scanResult.totalFindings === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <ShieldCheck className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-green-700">
                  No Security Issues Detected!
                </h4>
                <p className="text-gray-600">
                  Your website appears to be following security best practices.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Bundle Information */}
          {scanResult.scannedBundles && scanResult.scannedBundles.length > 0 && (
            <Card>
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCode className="h-4 w-4" />
                        Scanned JavaScript Bundles ({scanResult.scannedBundles.length})
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="space-y-2">
                      {scanResult.scannedBundles.map((bundle, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <FileCode className="h-3 w-3 text-gray-400" />
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {bundle.url.split('/').pop() || bundle.url}
                            </code>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">
                              {(bundle.size / 1024).toFixed(1)}KB
                            </span>
                            {bundle.error ? (
                              <span className="text-red-500 text-xs">Failed</span>
                            ) : (
                              <span className="text-green-500 text-xs">✓</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
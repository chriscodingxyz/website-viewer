'use client'

import React, { useState } from 'react'
import { WebsiteMetadata } from '@/types/metadata'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FileDown, FileText, Code, Settings, ChevronDown } from 'lucide-react'
import ExportReportModal from './ExportReportModal'
import { generateQuickJSONExport } from './utils/generateJSON'
import { toast } from 'sonner'

interface ExportButtonProps {
  metadata: WebsiteMetadata | null
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  showLabel?: boolean
}

export default function ExportButton({
  metadata,
  variant = 'ghost',
  size = 'sm',
  showLabel = false
}: ExportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (!metadata) return null

  const handleQuickJSONExport = async () => {
    try {
      await generateQuickJSONExport(metadata)
      toast.success('JSON exported successfully')
    } catch (error) {
      toast.error('Failed to export JSON')
    }
  }

  const handleProfessionalReport = () => {
    setIsModalOpen(true)
  }

  // Simple button for ghost variant (existing usage)
  if (variant === 'ghost' && !showLabel) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={variant} size={size} title="Export options">
              <FileDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleProfessionalReport}>
              <FileText className="h-4 w-4 mr-2" />
              <div className="flex flex-col">
                <span className="font-medium">Professional Report</span>
                <span className="text-xs text-muted-foreground">PDF + JSON with analysis</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleQuickJSONExport}>
              <Code className="h-4 w-4 mr-2" />
              <div className="flex flex-col">
                <span className="font-medium">Quick JSON Export</span>
                <span className="text-xs text-muted-foreground">Raw data for developers</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ExportReportModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          metadata={metadata}
        />
      </>
    )
  }

  // Full button with label (for prominent placement)
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} className="gap-2">
            <FileDown className="h-4 w-4" />
            {showLabel && 'Export Report'}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem onClick={handleProfessionalReport} className="p-3">
            <FileText className="h-4 w-4 mr-3 text-blue-600" />
            <div className="flex flex-col gap-1">
              <span className="font-medium">Professional Report</span>
              <span className="text-xs text-muted-foreground">
                Customizable PDF and JSON with environment analysis
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleQuickJSONExport} className="p-3">
            <Code className="h-4 w-4 mr-3 text-green-600" />
            <div className="flex flex-col gap-1">
              <span className="font-medium">Quick JSON Export</span>
              <span className="text-xs text-muted-foreground">
                Raw metadata for development and automation
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ExportReportModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        metadata={metadata}
      />
    </>
  )
}
'use client'

import React from 'react'
import { Clock, X } from 'lucide-react'
import { useHistory } from '@/contexts/HistoryContext'

type HistoryLinksProps = {
  setUrlWithHighlight: (url: string) => void
}

const HistoryLinks = ({ setUrlWithHighlight }: HistoryLinksProps) => {
  const { history, removeFromHistory } = useHistory()

  if (history.length === 0) return null

  return (
    <div className='space-y-2 container mx-auto'>
      <div className='flex flex-wrap items-center gap-2 bg-secondary/10 p-2 rounded-lg'>
        <Clock size={16} className='text-primary' />
        {history.map((item, index) => (
          <div
            key={index}
            className='flex items-center bg-secondary/20 rounded-md hover:bg-secondary/30 transition-colors'
          >
            <button
              onClick={() => setUrlWithHighlight(item)}
              className='text-xs text-primary hover:underline px-3 py-1.5 truncate max-w-[200px]'
              title={item}
            >
              {item}
            </button>
            <button
              onClick={() => removeFromHistory(item)}
              className='text-gray-500 hover:text-gray-700 px-2 py-1.5 border-l border-secondary'
            >
              <X className='h-3 w-3' />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HistoryLinks

'use client'

import React from 'react'
import { Heart, X } from 'lucide-react'
import { useFavorites } from '@/contexts/FavoritesContext'

type FavoriteLinksProps = {
  setUrlWithHighlight: (url: string) => void
}

const FavoriteLinks = ({ setUrlWithHighlight }: FavoriteLinksProps) => {
  const { favorites, removeFromFavorites } = useFavorites()

  if (favorites.length === 0) return null

  return (
    <div className='space-y-2 container mx-auto'>
      <div className='flex flex-wrap items-center gap-2 bg-secondary/10 p-2 rounded-lg'>
        <Heart size={16} className='text-primary' />
        {favorites.map((item, index) => (
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
              onClick={() => removeFromFavorites(item)}
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

export default FavoriteLinks

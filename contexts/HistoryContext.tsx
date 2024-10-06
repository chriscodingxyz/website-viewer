'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react'

type HistoryContextType = {
  history: string[]
  addToHistory: (url: string) => void
  removeFromHistory: (url: string) => void
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined)

type HistoryProviderProps = {
  children: ReactNode
}

function HistoryProvider ({ children }: HistoryProviderProps) {
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    const storedHistory = localStorage.getItem('history')
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory))
    }
  }, [])

  const addToHistory = (url: string) => {
    setHistory(prevHistory => {
      const newHistory = [
        url,
        ...prevHistory.filter(item => item !== url)
      ].slice(0, 10)
      localStorage.setItem('history', JSON.stringify(newHistory))
      return newHistory
    })
  }

  const removeFromHistory = (url: string) => {
    setHistory(prevHistory => {
      const newHistory = prevHistory.filter(item => item !== url)
      localStorage.setItem('history', JSON.stringify(newHistory))
      return newHistory
    })
  }

  return (
    <HistoryContext.Provider
      value={{ history, addToHistory, removeFromHistory }}
    >
      {children}
    </HistoryContext.Provider>
  )
}

function useHistory () {
  const context = useContext(HistoryContext)
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider')
  }
  return context
}

export { HistoryProvider, useHistory }

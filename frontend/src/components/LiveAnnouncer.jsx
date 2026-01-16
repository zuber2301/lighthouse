import React, { createContext, useContext, useCallback, useState } from 'react'

const LiveAnnounceContext = createContext(undefined)

export function LiveAnnouncerProvider({ children }) {
  const [message, setMessage] = useState('')

  const announce = useCallback((m) => {
    // Clear then set to ensure screen readers detect repeated messages
    // small delay to ensure repeated messages are read
    setMessage('')
    setTimeout(() => setMessage(m), 200)
  }, [])

  return (
    <LiveAnnounceContext.Provider value={{ announce }}>
      {/* Polite live region for non-interruptive announcements */}
      <div aria-live="polite" role="status" className="sr-only">{message}</div>
      {children}
    </LiveAnnounceContext.Provider>
  )
}

export function useAnnounce() {
  const ctx = useContext(LiveAnnounceContext)
  if (!ctx) throw new Error('useAnnounce must be used within LiveAnnouncerProvider')
  return ctx.announce
}

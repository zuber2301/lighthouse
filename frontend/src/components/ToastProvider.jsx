import React, { createContext, useContext, useCallback, useState, useEffect } from 'react'

const ToastCtx = createContext(undefined)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'info') => {
    const id = String(Date.now() + Math.random())
    setToasts((s) => [...s, { id, message, type }])
    // auto-dismiss
    setTimeout(() => setToasts((s) => s.filter((t) => t.id !== id)), 4000)
  }, [])

  return (
    <ToastCtx.Provider value={{ showToast }}>
      {children}
      <div aria-live="polite" className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        {toasts.map((t) => (
          <div key={t.id} className={`px-4 py-2 rounded-md shadow ${t.type === 'error' ? 'bg-rose-600' : t.type === 'success' ? 'bg-emerald-600' : 'bg-card/20'} text-text-main`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx.showToast
}

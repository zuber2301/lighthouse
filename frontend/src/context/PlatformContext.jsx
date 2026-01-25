import React, { createContext, useContext, useState } from 'react'

const PlatformContext = createContext(null)

export function PlatformProvider({ children }) {
  const [selectedTenant, setSelectedTenant] = useState(null)

  const switchTenant = (tenant) => {
    setSelectedTenant(tenant)
  }

  return (
    <PlatformContext.Provider value={{ selectedTenant, switchTenant }}>
      {children}
    </PlatformContext.Provider>
  )
}

export function usePlatform() {
  const ctx = useContext(PlatformContext)
  if (!ctx) throw new Error('usePlatform must be used within PlatformProvider')
  return ctx
}

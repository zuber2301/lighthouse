import React, { createContext, useContext } from 'react'
import useTemplatemoTheme from './useTemplatemoTheme'

const ThemeContext = createContext(false)

export function ThemeProvider({ children }) {
  useTemplatemoTheme()
  return (
    <ThemeContext.Provider value={true}>
      <div className="p-6 rounded-xl bg-gradient-to-br from-tm-bg-dark to-surface">{children}</div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { ThemeProvider } from '../themes/templatemo_602_graph_page/ThemeProvider'

export default function AppLayout() {
  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-6">
          <div className="max-w-full">
            <ThemeProvider>
              <Outlet />
            </ThemeProvider>
          </div>
        </main>
      </div>
    </div>
  )
}

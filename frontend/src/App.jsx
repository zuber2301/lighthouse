import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import DashboardPage from './features/dashboard/DashboardPage'
import RecognitionPage from './features/recognition/RecognitionPage'
import RewardsPage from './features/rewards/RewardsPage'
import AnalyticsPage from './features/analytics/AnalyticsPage'
import AdminPage from './features/admin/AdminPage'
import ThemeDemo from './pages/ThemeDemo'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="recognition" element={<RecognitionPage />} />
          <Route path="rewards" element={<RewardsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="theme-demo" element={<ThemeDemo />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

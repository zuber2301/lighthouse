import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import AuthLayout from './layouts/AuthLayout'
import LoginPage from './auth/LoginPage'
import RegisterPage from './auth/RegisterPage'
import OAuthCallback from './auth/OAuthCallback'
import DashboardPage from './features/dashboard/DashboardPage'
import RecognitionPage from './features/recognition/RecognitionPage'
import RewardsPage from './features/rewards/RewardsPage'
import AnalyticsPage from './features/analytics/AnalyticsPage'
import AdminPage from './features/admin/AdminPage'
import PlatformAdminPage from './features/admin/PlatformAdminPage'
import PlatformCatalog from './features/admin/PlatformCatalog'
import PlatformLogs from './features/admin/PlatformLogs'
import CreateTenantForm from './features/admin/CreateTenantForm'
import TenantAdminBudget from './features/admin/TenantAdminBudget'
import TenantLeadDashboard from './features/admin/TenantLeadDashboard'
import CorporateUserDashboard from './features/admin/CorporateUserDashboard'
import TenantDashboard from './features/tenant/TenantDashboard'
import TenantsPage from './features/tenant/TenantsPage'
import ThemeDemo from './pages/ThemeDemo'
import RecognitionFeedDemo from './pages/RecognitionFeedDemo'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Auth routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="callback" element={<OAuthCallback />} />
        </Route>

        {/* Protected app routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="recognition" element={<RecognitionPage />} />
          <Route path="rewards" element={<RewardsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="platform-admin" element={<PlatformAdminPage />} />
        <Route path="platform-admin/create-tenant" element={<CreateTenantForm />} />
          <Route path="platform-admin/global-catalog" element={<PlatformCatalog />} />
          <Route path="platform-admin/logs" element={<PlatformLogs />} />
          <Route path="tenant-admin" element={<TenantAdminBudget />} />
          <Route path="tenant-lead" element={<TenantLeadDashboard />} />
          <Route path="tenant-dashboard" element={<TenantDashboard />} />
          <Route path="tenants" element={<TenantsPage />} />
          <Route path="corporate-user" element={<CorporateUserDashboard />} />
          <Route path="feed" element={<RecognitionFeedDemo />} />
          <Route path="theme-demo" element={<ThemeDemo />} />
        </Route>

        {/* Redirect unknown routes to login */}
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}

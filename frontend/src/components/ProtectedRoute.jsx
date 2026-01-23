import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

function roleFromToken() {
  try {
    const token = localStorage.getItem('auth_token')
    if (!token) return null
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.role || null
  } catch (err) {
    return null
  }
}

export default function ProtectedRoute({ children, allowedRoles, redirectTo = '/dashboard' }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-text-main">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  const role = user?.role || roleFromToken() || 'CORPORATE_USER'

  if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />
  }

  return children
}
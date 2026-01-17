import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function OAuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token')
        const userParam = searchParams.get('user')

        if (token && userParam) {
          const user = JSON.parse(decodeURIComponent(userParam))
          login(token, user)

          // Redirect to dashboard or the intended page
          const redirectTo = searchParams.get('redirect') || '/dashboard'
          navigate(redirectTo, { replace: true })
        } else {
          // No token received, redirect to login
          navigate('/auth/login', { replace: true })
        }
      } catch (error) {
        console.error('OAuth callback error:', error)
        navigate('/auth/login', { replace: true })
      }
    }

    handleCallback()
  }, [searchParams, login, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <div className="text-slate-100">Completing sign in...</div>
      </div>
    </div>
  )
}
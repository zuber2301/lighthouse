import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      // TODO: Implement registration API call
      console.log('Registration attempt:', formData)

      // For now, just navigate to login
      navigate('/auth/login')
    } catch (error) {
      console.error('Registration failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-card/20 border border-indigo-500/10 backdrop-blur-sm border border-indigo-500/10 rounded-2xl p-8 shadow-2xl transition-colors duration-200">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-tm-teal to-tm-teal-2 rounded-2xl mb-4 shadow-tm-neon">
          <svg className="w-8 h-8 text-tm-bg-dark" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-tm-teal bg-clip-text text-transparent">
          Join Lighthouse
        </h1>
        <p className="text-text-main opacity-60 mt-2">Create your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="fullName" className="block text-sm font-normal text-text-main opacity-70 mb-2">
            Full Name
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 bg-surface/50 border border-indigo-500/10 rounded-xl text-text-main placeholder:opacity-40 focus:outline-none focus:ring-2 focus:ring-tm-teal/50 focus:border-tm-teal transition-all duration-200"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-normal text-text-main/60 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 bg-card/20 border border-indigo-500/10 rounded-xl text-text-main placeholder:text-text-main/60 focus:outline-none focus:ring-2 focus:ring-tm-teal/50 focus:border-tm-teal transition-all duration-200"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-normal text-text-main/60 mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 bg-card/20 border border-indigo-500/10 rounded-xl text-text-main placeholder:text-text-main/60 focus:outline-none focus:ring-2 focus:ring-tm-teal/50 focus:border-tm-teal transition-all duration-200"
            placeholder="Create a password"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-normal text-text-main/60 mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 bg-card/20 border border-indigo-500/10 rounded-xl text-text-main placeholder:text-text-main/60 focus:outline-none focus:ring-2 focus:ring-tm-teal/50 focus:border-tm-teal transition-all duration-200"
            placeholder="Confirm your password"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="terms"
            required
            className="rounded border-indigo-500/5 text-tm-teal focus:ring-tm-teal/50"
          />
          <label htmlFor="terms" className="ml-2 text-sm text-text-main/60">
            I agree to the{' '}
            <Link to="/terms" className="text-tm-teal hover:text-tm-teal-2 transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-tm-teal hover:text-tm-teal-2 transition-colors">
              Privacy Policy
            </Link>
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-gradient-to-r from-tm-teal to-tm-teal-2 text-tm-bg-dark font-semibold rounded-xl hover:shadow-lg hover:shadow-tm-teal/25 transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-text-main/60">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-tm-teal hover:text-tm-teal-2 font-normal transition-colors">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../api/services'
import toast from 'react-hot-toast'
import { Building2, ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email) {
      toast.error('Please enter your email')
      return
    }

    setLoading(true)
    try {
      const res = await authApi.forgotPassword({ email })
      
      if (res.data.success) {
        setEmailSent(true)
        toast.success('Password reset link sent! Check your email.')
      } else {
        toast.error(res.data.message || 'Something went wrong')
      }
    } catch (_err) {
      // Don't reveal if email exists or not (security)
      setEmailSent(true)
      toast.success('If the email exists, a reset link has been sent')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-xl mb-3">
            <Mail size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Forgot Password?</h1>
          <p className="text-gray-500 text-sm mt-1 text-center">
            {emailSent 
              ? 'Check your email for reset instructions' 
              : 'Enter your email to receive a password reset link'}
          </p>
        </div>

        {!emailSent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-green-800 text-sm">
              If an account exists with <strong>{email}</strong>, you will receive 
              a password reset link shortly.
            </p>
            <p className="text-green-700 text-xs mt-2">
              Please check your spam folder if you don't see it in your inbox.
            </p>
          </div>
        )}

        <div className="mt-6">
          <Link
            to="/login"
            className="flex items-center justify-center text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Login
          </Link>
        </div>

        {emailSent && (
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setEmailSent(false)
                setEmail('')
              }}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Try a different email
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

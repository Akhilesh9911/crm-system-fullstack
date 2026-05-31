import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/services'
import toast from 'react-hot-toast'
import { Building2 } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  const onSubmit = async (data) => {
    try {
      const res = await authApi.login(data)
      const authData = res?.data?.data
      if (!res?.data?.success || !authData?.token) {
        toast.error(res?.data?.message || 'Login failed')
        return
      }
      login(authData)
      toast.success('Login successful')
      navigate('/')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid email or password')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-xl mb-3"><Building2 size={28} className="text-white" /></div>
          <h1 className="text-2xl font-bold text-gray-900">CRM System</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" {...register('email', { required: 'Email is required' })} className="input-field" placeholder="you@example.com" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" {...register('password', { required: 'Password is required' })} className="input-field" placeholder="••••••••" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
         <button type="submit" className="btn-primary w-full mt-2">
           Sign In
         </button>
        </form>
        <div className="mt-3 text-center">
          <Link to="/forgot-password" className="text-sm text-blue-600 font-medium hover:underline">
            Forgot Password?
          </Link>
        </div>
        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500">Don't have an account? </span>
          <Link to="/register" className="text-blue-600 font-medium hover:underline">Register</Link>
        </div>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg text-xs text-gray-500">
          <p className="font-semibold mb-1">Demo credentials:</p>
          <p>Email: akki@crm.com | Password: admin123</p>
        </div>
      </div>
    </div>
  )
}

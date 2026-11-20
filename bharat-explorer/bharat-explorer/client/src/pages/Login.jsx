import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiEye, FiEyeOff, FiLock, FiMail } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/'
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.email || !form.password) {
      toast.error('Fill all fields')
      return
    }
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back')
      navigate(from, { replace: true })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="hero-bg flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white">
          <FiArrowLeft /> Back to Home
        </Link>

        <div className="glass-card p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-amber-400 text-lg font-black text-slate-950">BE</div>
            <h1 className="text-3xl font-black text-white">Welcome back</h1>
            <p className="mt-2 text-sm text-slate-400">Sign in to continue planning with Bharat Explorer.</p>
          </div>

          <div className="mb-6 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-center text-sm font-semibold text-amber-100">
            Demo admin: admin@bharat.com / admin123
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input name="email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="you@example.com" className="input-field pl-11" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">Password</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="Enter your password" className="input-field pl-11 pr-12" />
                <button type="button" onClick={() => setShowPass((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  {showPass ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            New here? <Link to="/register" className="font-bold text-amber-300 hover:text-amber-200">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

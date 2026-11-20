import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiEye, FiEyeOff, FiLock, FiMail, FiUser } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.name || !form.email || !form.password) {
      toast.error('Fill all fields')
      return
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      toast.success('Account created')
      navigate('/')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed')
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
            <h1 className="text-3xl font-black text-white">Create account</h1>
            <p className="mt-2 text-sm text-slate-400">Save wishlists and build smarter travel plans.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AuthInput icon={FiUser} label="Full Name" value={form.name} placeholder="Your name" onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
            <AuthInput icon={FiMail} label="Email Address" type="email" value={form.email} placeholder="you@example.com" onChange={(value) => setForm((current) => ({ ...current, email: value }))} />

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">Password</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="Min 6 characters" className="input-field pl-11 pr-12" />
                <button type="button" onClick={() => setShowPass((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  {showPass ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <AuthInput icon={FiLock} label="Confirm Password" type="password" value={form.confirm} placeholder="Repeat your password" onChange={(value) => setForm((current) => ({ ...current, confirm: value }))} />

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already registered? <Link to="/login" className="font-bold text-amber-300 hover:text-amber-200">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function AuthInput({ icon: Icon, label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-300">{label}</label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="input-field pl-11" />
      </div>
    </div>
  )
}

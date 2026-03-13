import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { RiPulseLine, RiMailLine, RiLockPasswordLine, RiUserLine, RiArrowRightLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, register, isLoading, error, clearError } = useAuthStore()
  const [mode, setMode] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    let result
    if (mode === 'login') {
      result = await login(form.email, form.password)
    } else {
      result = await register(form.name, form.email, form.password)
    }
    if (result.success) navigate('/dashboards')
  }

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="min-h-screen bg-[#0F172A] flex overflow-hidden">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12"
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)',
        }}
      >
        {/* Animated grid bg */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(99,102,241,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.07) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
          {/* Glow orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, #6366F1, transparent)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-15" style={{ background: 'radial-gradient(circle, #06B6D4, transparent)' }} />
        </div>

        {/* Content */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
              <RiPulseLine className="text-white text-xl" />
            </div>
            <span className="text-xl font-bold text-white">InsightForge</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Build Powerful
              <span className="gradient-text block">Analytics Dashboards</span>
            </h1>
            <p className="text-text-secondary text-lg leading-relaxed max-w-md">
              Drag, drop, and customize beautiful data visualizations. Connect any data source.
              Share insights with your team in real time.
            </p>
          </motion.div>

          {/* Feature chips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-2 mt-8"
          >
            {['🎯 Drag & Drop Builder', '📊 10+ Chart Types', '⚡ Real-time Updates', '🔗 Multi-source Integration', '📤 Export Reports', '👥 Team Collaboration'].map((feat) => (
              <span key={feat} className="px-3 py-1.5 glass-card text-sm text-text-secondary rounded-full border border-white/10">
                {feat}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="relative"
        >
          <p className="text-text-secondary text-xs mb-3">Trusted by teams worldwide</p>
          <div className="flex items-center gap-6">
            {['Tableau', 'Power BI', 'Grafana'].map((name) => (
              <span key={name} className="text-white/30 text-sm font-semibold">{name}-like</span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel — Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <RiPulseLine className="text-white text-lg" />
            </div>
            <span className="text-xl font-bold text-white">InsightForge</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-text-secondary mb-8">
            {mode === 'login' ? "Sign in to access your dashboards." : "Start building powerful analytics for free."}
          </p>

          {/* Toggle */}
          <div className="flex p-1 glass-card rounded-xl mb-6">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); clearError() }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${mode === m ? 'bg-primary text-white shadow-glow' : 'text-text-secondary hover:text-text-primary'}`}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <RiUserLine className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    className="input-field pl-9"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  className="input-field pl-9"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <RiLockPasswordLine className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  className="input-field pl-9 pr-10"
                  placeholder="Min. 6 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  {showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center py-3 text-base mt-2"
            >
              {isLoading ? (
                <span className="animate-spin">⟳</span>
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <RiArrowRightLine />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-text-secondary text-sm mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); clearError() }}
              className="text-primary hover:text-primary-light transition-colors font-medium"
            >
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import AppLayout from '../components/AppLayout'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'
import { RiUser3Line, RiMailLine, RiShieldKeyholeLine, RiPaletteLine } from 'react-icons/ri'

export default function UserSettings() {
  const { user, updateProfile } = useAuthStore()
  const [form, setForm] = useState({
    name: '',
    email: '',
    preferences: { theme: 'dark' }
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        email: user.email,
        preferences: user.preferences || { theme: 'dark' }
      })
    }
  }, [user])

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    const res = await updateProfile({ name: form.name, preferences: form.preferences })
    setIsSaving(false)
    if (res.success) toast.success('Profile updated successfully')
    else toast.error(res.error || 'Failed to update profile')
  }

  return (
    <AppLayout>
      <Navbar title="Account Settings" />
      <div className="p-6 max-w-3xl mx-auto">
        
        {/* Profile Card */}
        <div className="glass-card p-8 mb-8 flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl font-bold text-white shadow-glow">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">{user?.name}</h2>
            <p className="text-text-secondary flex items-center gap-2 mt-1">
              <RiMailLine /> {user?.email}
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono uppercase text-text-secondary">
              <RiShieldKeyholeLine className="text-primary" /> {user?.role} Role
            </div>
          </div>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="glass-card p-6 space-y-5">
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2 border-b border-white/5 pb-4">
              <RiUser3Line className="text-primary" /> Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label">Email Address (Read-only)</label>
                <input
                  type="email"
                  value={form.email}
                  disabled
                  className="input-field opacity-60 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 space-y-5">
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2 border-b border-white/5 pb-4">
              <RiPaletteLine className="text-accent" /> Preferences
            </h3>
            
            <div>
              <label className="label mb-3">Theme</label>
              <div className="flex gap-4">
                {['dark', 'light'].map(theme => (
                  <label key={theme} className={`flex-1 glass-card p-4 rounded-xl cursor-pointer border-2 transition-all ${form.preferences.theme === theme ? 'border-primary shadow-glow' : 'border-transparent hover:border-white/20'}`}>
                    <input
                      type="radio"
                      name="theme"
                      value={theme}
                      checked={form.preferences.theme === theme}
                      onChange={e => setForm({...form, preferences: {...form.preferences, theme: e.target.value}})}
                      className="hidden"
                    />
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${form.preferences.theme === theme ? 'border-primary' : 'border-white/30'}`}>
                        {form.preferences.theme === theme && <div className="w-3 h-3 rounded-full bg-primary" />}
                      </div>
                      <span className="font-medium capitalize">{theme} Theme</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

      </div>
    </AppLayout>
  )
}

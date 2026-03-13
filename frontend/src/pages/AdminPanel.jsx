import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import AppLayout from '../components/AppLayout'
import Navbar from '../components/Navbar'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { RiShieldUserLine, RiDeleteBinLine, RiRefreshLine } from 'react-icons/ri'

export default function AdminPanel() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/users/stats'),
        api.get('/users')
      ])
      setStats(statsRes.data)
      setUsers(usersRes.data)
    } catch (err) {
      toast.error('Failed to load admin data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete user and ALL their dashboards? This action cannot be undone.')) return
    try {
      await api.delete(`/users/${id}`)
      setUsers(users.filter(u => u._id !== id))
      toast.success('User deleted')
      fetchData() // Refresh stats
    } catch (err) {
      toast.error('Failed to delete user')
    }
  }

  const handleRoleChange = async (id, newRole) => {
    try {
      await api.put(`/users/${id}`, { role: newRole })
      setUsers(users.map(u => u._id === id ? { ...u, role: newRole } : u))
      toast.success('Role updated')
    } catch (err) {
      toast.error('Failed to update role')
    }
  }

  return (
    <AppLayout>
      <Navbar
        title="Admin Dashboard"
        actions={
          <button onClick={fetchData} className="btn-secondary text-xs px-3 py-1.5" title="Refresh Data">
            <RiRefreshLine /> Refresh
          </button>
        }
      />
      <div className="p-6">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Users', value: stats?.totalUsers || 0, color: 'text-primary' },
            { label: 'Dashboards Created', value: stats?.totalDashboards || 0, color: 'text-accent' },
            { label: 'Active Widgets', value: stats?.totalWidgets || 0, color: 'text-green-400' },
          ].map((stat, i) => (
             <motion.div
               key={stat.label}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               className="glass-card p-6 flex items-center justify-between shadow-glow"
             >
               <div>
                 <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">{stat.label}</p>
                 <span className={`text-4xl font-bold font-mono ${stat.color}`}>{isLoading ? '-' : stat.value}</span>
               </div>
               <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mix-blend-screen opacity-50 shadow-inner">
                 <RiShieldUserLine className={`text-3xl ${stat.color}`} />
               </div>
             </motion.div>
          ))}
        </div>

        {/* User Management Table */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-semibold text-text-primary text-lg">User Management</h3>
            <span className="text-xs text-text-secondary">{users.length} registered users</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#080F1E] border-b border-white/5 text-text-secondary">
                <tr>
                  <th className="px-6 py-3 font-semibold w-1/4">User</th>
                  <th className="px-6 py-3 font-semibold w-1/4">Email</th>
                  <th className="px-6 py-3 font-semibold w-1/4">Role & Access</th>
                  <th className="px-6 py-3 font-semibold w-1/4">Joined Date</th>
                  <th className="px-6 py-3 font-semibold w-16 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/5 h-16 shimmer opacity-50" />
                  ))
                ) : (
                  users.map(u => (
                    <tr key={u._id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 font-medium text-text-primary">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white shadow-md">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          {u.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        <a href={`mailto:${u.email}`} className="hover:text-primary transition-colors">{u.email}</a>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={u.role}
                          onChange={e => handleRoleChange(u._id, e.target.value)}
                          className={`bg-transparent p-1 rounded font-mono text-xs uppercase cursor-pointer border hover:border-white/20 focus:outline-none transition-colors
                            ${u.role === 'admin' ? 'text-primary border-primary/30' : 'text-text-secondary border-transparent'}`}
                        >
                          <option value="user" className="bg-[#0F172A]">User</option>
                          <option value="admin" className="bg-[#0F172A]">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-text-secondary font-mono text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="p-2 text-text-secondary hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete User"
                        >
                          <RiDeleteBinLine className="text-lg" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

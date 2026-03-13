import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import {
  RiDashboardLine, RiLayoutGridLine, RiDatabase2Line,
  RiSettings4Line, RiLogoutBoxLine, RiUserLine,
  RiBarChartGroupedLine, RiShieldUserLine, RiPulseLine
} from 'react-icons/ri'

const navItems = [
  { path: '/dashboards', icon: RiDashboardLine, label: 'Dashboards' },
  { path: '/datasources', icon: RiDatabase2Line, label: 'Data Sources' },
  { path: '/settings', icon: RiSettings4Line, label: 'Settings' },
]

const adminItems = [
  { path: '/admin', icon: RiShieldUserLine, label: 'Admin Panel' },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-64 h-screen flex flex-col bg-[#080F1E] border-r border-white/5 fixed left-0 top-0 z-40"
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <Link to="/dashboards" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
            <RiPulseLine className="text-white text-lg" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white leading-tight">InsightForge</h1>
            <p className="text-xs text-text-secondary">Analytics Platform</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider px-3 mb-3">Navigation</p>

        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname.startsWith(path)
          return (
            <Link key={path} to={path}>
              <motion.div
                whileHover={{ x: 2 }}
                className={`sidebar-item ${isActive ? 'sidebar-item-active text-primary' : ''}`}
              >
                <Icon className="text-lg shrink-0" />
                <span className="text-sm font-medium">{label}</span>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                  />
                )}
              </motion.div>
            </Link>
          )
        })}

        {user?.role === 'admin' && (
          <>
            <div className="pt-4">
              <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider px-3 mb-3">Admin</p>
              {adminItems.map(({ path, icon: Icon, label }) => {
                const isActive = location.pathname.startsWith(path)
                return (
                  <Link key={path} to={path}>
                    <motion.div
                      whileHover={{ x: 2 }}
                      className={`sidebar-item ${isActive ? 'sidebar-item-active text-primary' : ''}`}
                    >
                      <Icon className="text-lg shrink-0" />
                      <span className="text-sm font-medium">{label}</span>
                    </motion.div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-white/5">
        <Link to="/settings">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
              <p className="text-xs text-text-secondary truncate">{user?.email}</p>
            </div>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full sidebar-item text-red-400 hover:text-red-300 hover:bg-red-500/10 mt-1"
        >
          <RiLogoutBoxLine className="text-lg" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </motion.aside>
  )
}

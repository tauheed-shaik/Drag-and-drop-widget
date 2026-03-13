import { motion } from 'framer-motion'
import { useDashboardStore } from '../store/dashboardStore'
import { RiSaveLine, RiWifiLine, RiLoader4Line } from 'react-icons/ri'

export default function Navbar({ title, actions }) {
  const { isSaving } = useDashboardStore()

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#080F1E]/80 backdrop-blur-md sticky top-0 z-30"
    >
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        {isSaving && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5 text-xs text-text-secondary"
          >
            <RiLoader4Line className="animate-spin text-primary" />
            <span>Saving...</span>
          </motion.div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-green-400">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span>Live</span>
        </div>
        {actions}
      </div>
    </motion.header>
  )
}

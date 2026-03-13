import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ChartWidget from './ChartWidget'
import KpiWidget from './KpiWidget'
import TableWidget from './TableWidget'
import { useDashboardStore } from '../../store/dashboardStore'
import {
  RiSettings4Line, RiDeleteBinLine, RiDragMove2Line,
  RiFullscreenLine, RiMoreLine
} from 'react-icons/ri'
import toast from 'react-hot-toast'

function WidgetMenu({ onEdit, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -5 }}
      className="absolute right-0 top-8 z-50 glass-card min-w-[160px] py-1 shadow-card"
    >
      <button
        onClick={onEdit}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-white/5 transition-colors"
      >
        <RiSettings4Line className="text-primary" /> Configure
      </button>
      <div className="h-px bg-white/5 my-1" />
      <button
        onClick={onDelete}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
      >
        <RiDeleteBinLine /> Delete Widget
      </button>
    </motion.div>
  )
}

export default function WidgetContainer({ widget, onEdit, isEditing }) {
  const { deleteWidget } = useDashboardStore()
  const [showMenu, setShowMenu] = useState(false)

  const handleDelete = async () => {
    setShowMenu(false)
    const result = await deleteWidget(widget._id)
    if (result.success) toast.success('Widget deleted')
    else toast.error(result.error || 'Failed to delete widget')
  }

  const renderContent = () => {
    if (widget.type === 'kpi') return <KpiWidget widget={widget} />
    if (widget.type === 'table') return <TableWidget widget={widget} />
    return <ChartWidget widget={widget} />
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="glass-card h-full flex flex-col overflow-hidden group glow-on-hover"
    >
      {/* Widget header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {isEditing && (
            <RiDragMove2Line className="text-text-secondary cursor-grab active:cursor-grabbing shrink-0 drag-handle" />
          )}
          <h3 className="text-sm font-semibold text-text-primary truncate">{widget.title}</h3>
        </div>

        {isEditing && (
          <div className="flex items-center gap-1 relative">
            <button
              onClick={() => onEdit(widget)}
              className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100"
            >
              <RiSettings4Line className="text-sm" />
            </button>
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100"
            >
              <RiMoreLine className="text-sm" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <WidgetMenu onEdit={() => { setShowMenu(false); onEdit(widget) }} onDelete={handleDelete} />
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Widget body */}
      <div className="flex-1 p-3 min-h-0 overflow-hidden">
        {renderContent()}
      </div>
    </motion.div>
  )
}

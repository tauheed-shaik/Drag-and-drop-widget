import { motion } from 'framer-motion'
import { useDrop } from 'react-dnd'
import { WIDGET_TYPES } from '../../utils/mockData'
import { RiAddLine } from 'react-icons/ri'

function WidgetTypeCard({ wt, onAdd }) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'WIDGET_TYPE',
    drop: () => onAdd(wt.type),
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  }))

  return (
    <motion.div
      ref={drop}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onAdd(wt.type)}
      className={`glass-card p-4 cursor-pointer transition-all duration-200 group
        ${isOver ? 'border-primary/60 bg-primary/10 shadow-glow' : 'hover:border-primary/30'}`}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-2xl">{wt.icon}</span>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
            <RiAddLine className="text-primary text-sm" />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">{wt.label}</p>
          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{wt.desc}</p>
        </div>
      </div>
    </motion.div>
  )
}

export default function WidgetLibraryPanel({ onAddWidget, onClose }) {
  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-72 h-full bg-[#080F1E] border-l border-white/5 flex flex-col shrink-0"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-text-primary">Widget Library</h3>
          <p className="text-xs text-text-secondary mt-0.5">Click or drag to add</p>
        </div>
        <button
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Widget list */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 gap-3">
          {WIDGET_TYPES.map((wt) => (
            <WidgetTypeCard key={wt.type} wt={wt} onAdd={onAddWidget} />
          ))}
        </div>
      </div>

      {/* Footer tip */}
      <div className="px-5 py-3 border-t border-white/5">
        <p className="text-xs text-text-secondary text-center">
          💡 Drag widgets directly onto the canvas
        </p>
      </div>
    </motion.div>
  )
}

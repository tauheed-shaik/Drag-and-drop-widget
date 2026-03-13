import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Responsive, WidthProvider } from 'react-grid-layout'
import { DndProvider, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import toast, { Toaster } from 'react-hot-toast'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

import AppLayout from '../components/AppLayout'
import Navbar from '../components/Navbar'
import WidgetLibraryPanel from '../components/widgets/WidgetLibraryPanel'
import WidgetSettingsPanel from '../components/widgets/WidgetSettingsPanel'
import WidgetContainer from '../components/widgets/WidgetContainer'
import { useDashboardStore } from '../store/dashboardStore'
import { useSocket } from '../hooks/useSocket'
import { RiAddCircleLine, RiEdit2Line, RiShareBoxLine, RiSave3Line, RiDownloadLine, RiTeamLine } from 'react-icons/ri'

const ResponsiveGridLayout = WidthProvider(Responsive)

export default function DashboardBuilderPage() {
  const { id } = useParams()
  const { fetchDashboard, activeDashboard, widgets, updateDashboard, saveLayout, addWidget, isLoading } = useDashboardStore()
  
  // Connect to room for this dashboard
  useSocket(id)

  const [isEditing, setIsEditing] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [editingWidget, setEditingWidget] = useState(null)
  const [dashboardName, setDashboardName] = useState('')

  useEffect(() => {
    fetchDashboard(id).then((res) => {
      if (res?.dashboard) setDashboardName(res.dashboard.name)
    })
  }, [id])

  // Convert layout from DB structure to react-grid-layout structure
  const layout = useMemo(() => {
    return activeDashboard?.layout?.map(item => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
    })) || []
  }, [activeDashboard?.layout])

  const onLayoutChange = useCallback((newLayout) => {
    if (!isEditing) return
    // Optimistic cache update would go here if needed, 
    // but the store action throttles and saves.
    saveLayout(id, newLayout.map(item => ({
      i: item.i, x: item.x, y: item.y, w: item.w, h: item.h
    })))
  }, [id, isEditing, saveLayout])

  const handleAddWidget = async (type) => {
    const defaultPosition = { x: (widgets.length * 4) % 12, y: Infinity }
    const res = await addWidget({
      dashboardId: id,
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Widget`,
      position: defaultPosition,
      size: { w: 4, h: 3 },
    })

    if (res.success) {
      toast.success('Widget added')
      setEditingWidget(res.widget) // auto open config
    } else {
      toast.error(res.error || 'Failed to add widget')
    }
  }

  const handleNameSave = () => {
    if (dashboardName !== activeDashboard?.name) {
      updateDashboard(id, { name: dashboardName })
    }
  }

  const handleShare = async () => {
    const res = await useDashboardStore.getState().shareDashboard(id)
    if (res.success) {
      navigator.clipboard.writeText(res.shareUrl)
      toast.success('Share link copied to clipboard!')
    } else {
      toast.error('Failed to generate share link')
    }
  }

  if (isLoading || !activeDashboard) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin" />
        </div>
      </AppLayout>
    )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <AppLayout>
        <div className="h-full flex relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#0F172A] to-[#0F172A]">
          {/* Main workspace */}
          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            
            <Navbar
              title={
                isEditing ? (
                  <input
                    value={dashboardName}
                    onChange={(e) => setDashboardName(e.target.value)}
                    onBlur={handleNameSave}
                    className="bg-white/10 text-white px-2 py-1 rounded text-lg font-semibold w-64 border border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                ) : (
                  dashboardName
                )
              }
              actions={
                <div className="flex items-center gap-2">
                  <div className="h-4 w-px bg-white/10 mx-2" />
                  
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => setShowLibrary(!showLibrary)}
                        className={`btn-secondary text-xs px-3 py-1.5 ${showLibrary ? 'bg-primary/20 border-primary/40 text-primary' : ''}`}
                      >
                        <RiAddCircleLine /> Add Widget
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="btn-primary text-xs px-3 py-1.5"
                      >
                        <RiSave3Line /> Done Editing
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleShare}
                        className="btn-secondary text-xs px-3 py-1.5"
                      >
                        <RiShareBoxLine /> Share
                      </button>
                      <button
                        onClick={() => document.getElementById('export-modal')?.showModal()}
                        className="btn-secondary text-xs px-3 py-1.5"
                      >
                        <RiDownloadLine /> Export
                      </button>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="btn-primary text-xs px-3 py-1.5 shadow-glow"
                      >
                        <RiEdit2Line /> Edit Dashboard
                      </button>
                    </>
                  )}
                </div>
              }
            />

            {/* Grid Area */}
            <div className={`flex-1 overflow-auto p-6 ${isEditing ? 'bg-[length:24px_24px] tracking-grid animate-fade-in' : ''}`}
              style={isEditing ? {
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1.5px, transparent 1.5px)'
              } : {}}
            >
              <DroppableGridArea
                layout={layout}
                widgets={widgets}
                onLayoutChange={onLayoutChange}
                isEditing={isEditing}
                onEditWidget={setEditingWidget}
                onAddWidget={handleAddWidget}
              />
            </div>
          </div>

          {/* Right Panels (Library / Settings) */}
          <AnimatePresence>
            {showLibrary && isEditing && !editingWidget && (
              <WidgetLibraryPanel
                onClose={() => setShowLibrary(false)}
                onAddWidget={handleAddWidget}
              />
            )}
            
            {editingWidget && isEditing && (
              <WidgetSettingsPanel
                widget={editingWidget}
                onClose={() => setEditingWidget(null)}
              />
            )}
          </AnimatePresence>
          
          <dialog id="export-modal" className="modal bg-transparent m-auto backdrop:bg-[#0F172A]/80 backdrop:backdrop-blur-sm shadow-card glow-on-hover rounded-xl glass-card w-full max-w-sm p-6 text-center">
             <h3 className="text-lg font-semibold text-text-primary mb-4">Export Dashboard</h3>
             <div className="flex flex-col gap-3">
               <button className="btn-secondary justify-center w-full" onClick={() => {toast.success('Exporting PDF...'); document.getElementById('export-modal').close()}}>Export as PDF</button>
               <button className="btn-secondary justify-center w-full" onClick={() => {toast.success('Exporting PNG...'); document.getElementById('export-modal').close()}}>Export as PNG Image</button>
               <button className="btn-secondary justify-center w-full" onClick={() => {toast.success('Exporting CSV data...'); document.getElementById('export-modal').close()}}>Export underlying data (CSV)</button>
             </div>
             <button onClick={() => document.getElementById('export-modal').close()} className="mt-4 text-sm text-text-secondary hover:text-white transition-colors">Cancel</button>
          </dialog>

        </div>
      </AppLayout>
    </DndProvider>
  )
}

function DroppableGridArea({ layout, widgets, onLayoutChange, isEditing, onEditWidget, onAddWidget }) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'WIDGET_TYPE',
    drop: (item) => onAddWidget(item.type),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }))

  if (widgets.length === 0) {
    return (
      <div 
        ref={drop}
        className={`h-full border-2 border-dashed rounded-xl flex items-center justify-center transition-colors 
          ${isOver ? 'border-primary bg-primary/5' : 'border-white/10 hover:border-white/20'}`}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
            <RiAddCircleLine className="text-3xl text-text-secondary" />
          </div>
          <h3 className="text-xl font-medium text-text-primary mb-2">Empty Dashboard</h3>
          <p className="text-text-secondary max-w-xs mb-6">
            Drag widgets here from the library, or click "Edit Dashboard" to start building.
          </p>
          {isEditing && (
             <p className="text-sm font-semibold text-primary/80 uppercase tracking-widest mt-8 animate-pulse">Drag widgets here</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div ref={drop} className={`min-h-full ${isOver ? 'bg-primary/5' : ''}`}>
      <ResponsiveGridLayout
        className={`layout ${isEditing ? 'is-editing' : ''}`}
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100}
        onLayoutChange={(currLayout, allLayouts) => onLayoutChange(currLayout)}
        isDraggable={isEditing}
        isResizable={isEditing}
        draggableHandle=".drag-handle"
        margin={[16, 16]}
        compactType="vertical"
        useCSSTransforms={true}
      >
        {widgets.map((widget) => {
           const layoutItem = layout.find(l => l.i === widget._id) || { i: widget._id, x: 0, y: Infinity, w: 4, h: 3 };
           return (
             <div key={widget._id} data-grid={layoutItem}>
               <WidgetContainer
                 widget={widget}
                 isEditing={isEditing}
                 onEdit={onEditWidget}
               />
             </div>
           )
        })}
      </ResponsiveGridLayout>
    </div>
  )
}

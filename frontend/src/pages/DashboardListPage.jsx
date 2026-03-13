import { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDashboardStore } from '../store/dashboardStore'
import AppLayout from '../components/AppLayout'
import Navbar from '../components/Navbar'
import api from '../api/axios'
import toast from 'react-hot-toast'
import {
  RiAddLine, RiDashboard2Line, RiDeleteBinLine,
  RiUploadCloud2Line, RiSparkling2Line, RiLoader4Line,
  RiCloseLine, RiCheckLine, RiDatabase2Line, RiArrowRightLine,
  RiFileLine, RiBarChartBoxLine, RiRefreshLine,
} from 'react-icons/ri'

// ─── Wizard step constants ──────────────────────────────────────────────────
const STEP_UPLOAD   = 'upload'
const STEP_ANALYZE  = 'analyzing'
const STEP_REVIEW   = 'review'
const STEP_CREATING = 'creating'

const CHART_ICONS = {
  bar: '📊', line: '📈', area: '🗻', pie: '🥧', donut: '🍩',
  scatter: '⁙', kpi: '💡', table: '📋',
}

// ─── DashboardWizard ────────────────────────────────────────────────────────
function DashboardWizard({ onClose, onCreated }) {
  const [step, setStep]               = useState(STEP_UPLOAD)
  const [file, setFile]               = useState(null)
  const [dragOver, setDragOver]       = useState(false)
  const [dashName, setDashName]       = useState('')
  const [analysisResult, setResult]   = useState(null)
  // analysisResult = { dataSourceId, columns, totalRows, totalRawRows, preview,
  //                    widgets, fileName, cleaningReport, aiUsed }
  const [suggestions, setSuggestions] = useState([])
  const fileRef                       = useRef()

  // ── Upload & analyze ──────────────────────────────────────────────────────
  const handleAnalyze = useCallback(async (selectedFile) => {
    const f = selectedFile || file
    if (!f) return toast.error('Please select a file first.')
    setStep(STEP_ANALYZE)

    const form = new FormData()
    form.append('file', f)

    try {
      // Backend parses, cleans, stores in DB, returns only metadata + ref ID
      const { data } = await api.post('/ai/analyze', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000, // 2 min for large files
      })
      // ✅ No raw data stored in browser — only metadata
      setResult(data)
      setSuggestions(data.widgets || [])
      setDashName(f.name.replace(/\.(csv|xlsx|xls)$/i, '') + ' Dashboard')
      setStep(STEP_REVIEW)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed. Try again.')
      setStep(STEP_UPLOAD)
    }
  }, [file])

  // ── Drop handlers ─────────────────────────────────────────────────────────
  const onDrop  = useCallback((e) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) { setFile(f); handleAnalyze(f) }
  }, [handleAnalyze])

  const onPick  = (e) => {
    const f = e.target.files[0]
    if (f) { setFile(f); handleAnalyze(f) }
  }

  // ── Create dashboard ──────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!dashName.trim()) return toast.error('Enter a dashboard name.')
    if (!analysisResult?.dataSourceId) return toast.error('Data source missing — please re-upload.')
    setStep(STEP_CREATING)
    try {
      // Only ID + widget configs sent — no raw data in request body
      const { data } = await api.post('/ai/create-dashboard', {
        name:              dashName,
        dataSourceId:      analysisResult.dataSourceId,
        widgetSuggestions: suggestions,
      })
      toast.success('🎉 AI dashboard created!')
      onCreated(data.dashboard._id)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Creation failed.')
      setStep(STEP_REVIEW)
    }
  }

  // ── Remove / edit suggestion ──────────────────────────────────────────────
  const removeSuggestion = (i) => setSuggestions(s => s.filter((_, idx) => idx !== i))
  const updateSuggestion = (i, key, val) => setSuggestions(s => s.map((item, idx) => idx === i ? { ...item, [key]: val } : item))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0F172A]/90 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 24 }}
        className="glass-card w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
              <RiSparkling2Line className="text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-text-primary text-sm">AI Dashboard Builder</h2>
              <p className="text-[11px] text-text-secondary">Upload your dataset and let AI build your dashboard</p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors p-1">
            <RiCloseLine className="text-lg" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-0 px-6 py-3 border-b border-white/5 shrink-0">
          {[['1', 'Upload Dataset'], ['2', 'AI Analysis'], ['3', 'Review & Create']].map(([n, label], idx) => {
            const active = (idx === 0 && step === STEP_UPLOAD) ||
                           (idx === 1 && step === STEP_ANALYZE) ||
                           (idx === 2 && (step === STEP_REVIEW || step === STEP_CREATING))
            const done   = (idx === 0 && step !== STEP_UPLOAD) ||
                           (idx === 1 && (step === STEP_REVIEW || step === STEP_CREATING))
            return (
              <div key={n} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors
                  ${done ? 'bg-green-500 text-white' : active ? 'bg-primary text-white' : 'bg-white/10 text-text-secondary'}`}>
                  {done ? <RiCheckLine /> : n}
                </div>
                <span className={`text-xs ${active ? 'text-text-primary' : 'text-text-secondary'}`}>{label}</span>
                {idx < 2 && <RiArrowRightLine className="text-text-secondary mx-2 text-xs" />}
              </div>
            )
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">

            {/* ── STEP: UPLOAD ─────────────────────────────────────────────── */}
            {step === STEP_UPLOAD && (
              <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all
                    ${dragOver ? 'border-primary bg-primary/10' : 'border-white/15 hover:border-primary/50 hover:bg-primary/5'}`}
                >
                  <div className="w-16 h-16 bg-primary/15 rounded-2xl flex items-center justify-center">
                    <RiUploadCloud2Line className="text-3xl text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-text-primary mb-1">Drop your dataset here</p>
                    <p className="text-sm text-text-secondary">Supports <span className="text-primary font-medium">.csv</span>, <span className="text-primary font-medium">.xlsx</span>, <span className="text-primary font-medium">.xls</span> — up to 20MB</p>
                  </div>
                  <button className="btn-primary text-sm">
                    <RiFileLine /> Browse Files
                  </button>
                  <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onPick} />
                </div>
                <div className="mt-6 p-4 rounded-xl bg-white/3 border border-white/5">
                  <p className="text-xs text-text-secondary flex items-start gap-2">
                    <RiSparkling2Line className="text-primary shrink-0 mt-0.5" />
                    <span>After uploading, <strong className="text-primary">Gemini AI</strong> will analyze your column types, detect patterns, and automatically generate the best charts and KPIs for your data.</span>
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── STEP: ANALYZING ──────────────────────────────────────────── */}
            {step === STEP_ANALYZE && (
              <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="p-12 flex flex-col items-center justify-center gap-5 min-h-[300px]">
                <div className="relative">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                    <RiSparkling2Line className="text-3xl text-primary animate-pulse" />
                  </div>
                  <RiLoader4Line className="text-primary text-lg absolute -bottom-1 -right-1 animate-spin" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-text-primary mb-1">AI is analyzing your dataset…</p>
                  <p className="text-sm text-text-secondary">Detecting columns, data types, and generating the best chart recommendations</p>
                </div>
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── STEP: REVIEW ─────────────────────────────────────────────── */}
            {(step === STEP_REVIEW || step === STEP_CREATING) && analysisResult && (
              <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 space-y-5">
                {/* Dataset summary */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-green-500/8 border border-green-500/20">
                  <div className="w-10 h-10 bg-green-500/15 rounded-lg flex items-center justify-center shrink-0">
                    <RiDatabase2Line className="text-green-400 text-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary text-sm">{analysisResult.fileName}</p>
                    <p className="text-xs text-text-secondary">
                      {analysisResult.totalRows.toLocaleString()} clean rows
                      {analysisResult.totalRawRows > analysisResult.totalRows && (
                        <span className="text-orange-400 ml-1">(from {analysisResult.totalRawRows.toLocaleString()} raw)</span>
                      )}
                      {' '}• {analysisResult.columns.length} columns
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {analysisResult.columns.slice(0, 4).map(c => (
                      <span key={c.name} className={`text-[10px] px-1.5 py-0.5 rounded font-medium
                        ${c.type === 'numeric' ? 'bg-blue-500/15 text-blue-400' : c.type === 'date' ? 'bg-purple-500/15 text-purple-400' : 'bg-orange-500/15 text-orange-400'}`}>
                        {c.name}
                      </span>
                    ))}
                    {analysisResult.columns.length > 4 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-text-secondary">+{analysisResult.columns.length - 4} more</span>}
                  </div>
                </div>

                {/* Cleaning report */}
                {analysisResult.cleaningReport?.length > 0 && (
                  <div className="p-3 rounded-xl bg-blue-500/8 border border-blue-500/20">
                    <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      🧹 Auto Data Cleaning Applied ({analysisResult.cleaningReport.length} operations)
                    </p>
                    <ul className="space-y-0.5">
                      {analysisResult.cleaningReport.map((op, i) => (
                        <li key={i} className="text-[10px] text-text-secondary flex items-start gap-1.5">
                          <span className="text-blue-400 shrink-0">✓</span> {op}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Dashboard name */}
                <div>
                  <label className="label">Dashboard Name</label>
                  <input
                    value={dashName}
                    onChange={e => setDashName(e.target.value)}
                    className="input-field"
                    placeholder="My Analytics Dashboard"
                  />
                </div>

                {/* AI widget suggestions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <RiSparkling2Line className="text-primary" />
                      {analysisResult.aiUsed ? 'Gemini AI' : 'Smart'} Suggested Widgets ({suggestions.length})
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ml-1 ${analysisResult.aiUsed ? 'bg-primary/20 text-primary' : 'bg-orange-500/20 text-orange-400'}`}>
                        {analysisResult.aiUsed ? '✨ Gemini' : '⚡ Rule-based'}
                      </span>
                    </p>
                    <button onClick={() => handleAnalyze(file)} className="text-[10px] text-text-secondary hover:text-primary flex items-center gap-1 transition-colors">
                      <RiRefreshLine /> Regenerate
                    </button>
                  </div>
                  <div className="space-y-2">
                    {suggestions.map((ws, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/4 border border-white/8 group">
                        <span className="text-xl shrink-0">{CHART_ICONS[ws.type] || '📊'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <input
                              value={ws.title}
                              onChange={e => updateSuggestion(i, 'title', e.target.value)}
                              className="text-sm font-medium text-text-primary bg-transparent border-none outline-none w-full"
                            />
                          </div>
                          <p className="text-[10px] text-text-secondary truncate">
                            {ws.type.toUpperCase()} •
                            {ws.xAxis ? ` X: ${ws.xAxis}` : ''}
                            {ws.metrics?.length ? ` • Y: ${ws.metrics.join(', ')}` : ''}
                          </p>
                        </div>
                        <select
                          value={ws.type}
                          onChange={e => updateSuggestion(i, 'type', e.target.value)}
                          className="text-[10px] bg-white/5 border border-white/10 rounded px-1.5 py-1 text-text-secondary shrink-0"
                        >
                          {['bar','line','area','pie','donut','scatter','kpi','table'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button onClick={() => removeSuggestion(i)} className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-red-400 transition-all shrink-0">
                          <RiCloseLine />
                        </button>
                      </div>
                    ))}
                    {suggestions.length === 0 && (
                      <p className="text-sm text-text-secondary text-center py-4">No widgets — click Regenerate to try again.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP: CREATING ───────────────────────────────────────────── */}
            {step === STEP_CREATING && (
              <motion.div key="creating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex items-center justify-center bg-[#080F1E]/80 z-10">
                <div className="flex flex-col items-center gap-3">
                  <RiLoader4Line className="text-primary text-3xl animate-spin" />
                  <p className="text-sm text-text-primary">Building your dashboard…</p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer */}
        {(step === STEP_REVIEW || step === STEP_CREATING) && (
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between shrink-0">
            <button onClick={() => { setStep(STEP_UPLOAD); setFile(null); setResult(null) }}
              className="btn-secondary text-sm" disabled={step === STEP_CREATING}>
              ← Back
            </button>
            <button
              onClick={handleCreate}
              disabled={step === STEP_CREATING || suggestions.length === 0}
              className="btn-primary text-sm"
            >
              {step === STEP_CREATING ? <><RiLoader4Line className="animate-spin" /> Creating…</> : <><RiSparkling2Line /> Create Dashboard ({suggestions.length} widgets)</>}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── DashboardListPage ───────────────────────────────────────────────────────
export default function DashboardListPage() {
  const { dashboards, fetchDashboards, deleteDashboard, isLoading } = useDashboardStore()
  const navigate = useNavigate()
  const [showWizard, setShowWizard] = useState(false)

  useEffect(() => { fetchDashboards() }, [])

  const handleDelete = async (e, id) => {
    e.preventDefault(); e.stopPropagation()
    if (!window.confirm('Delete this dashboard?')) return
    const res = await deleteDashboard(id)
    if (res.success) toast.success('Dashboard deleted')
    else toast.error(res.error || 'Delete failed')
  }

  const handleCreated = (id) => {
    setShowWizard(false)
    navigate(`/dashboards/${id}`)
  }

  return (
    <AppLayout>
      <Navbar
        title="My Dashboards"
        actions={
          <button onClick={() => setShowWizard(true)} className="btn-primary py-1.5 px-3 text-sm">
            <RiAddLine /> New Dashboard
          </button>
        }
      />

      <div className="p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="glass-card h-48 shimmer" />)}
          </div>
        ) : dashboards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <RiDashboard2Line className="text-4xl text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">No dashboards yet</h2>
            <p className="text-text-secondary max-w-sm mb-6">
              Upload a dataset and let AI instantly build a powerful analytics dashboard for you.
            </p>
            <button onClick={() => setShowWizard(true)} className="btn-primary">
              <RiUploadCloud2Line /> Upload Dataset & Create Dashboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {dashboards.map((dash, i) => (
              <motion.div key={dash._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/dashboards/${dash._id}`} className="block h-full">
                  <div className="glass-card glass-card-hover h-full flex flex-col p-5 group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <RiBarChartBoxLine className="text-primary text-xl" />
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => handleDelete(e, dash._id)} className="p-1.5 text-text-secondary hover:text-red-400 hover:bg-red-500/10 rounded">
                          <RiDeleteBinLine />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary mb-1 line-clamp-1">{dash.name}</h3>
                    <p className="text-xs text-text-secondary mb-4 line-clamp-2">{dash.description || 'AI-generated analytics dashboard'}</p>
                    <div className="mt-auto pt-4 border-t border-white/5 flex gap-4 text-xs text-text-secondary">
                      <span>{dash.widgetCount || 0} Widgets</span>
                      <span>Updated {new Date(dash.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showWizard && <DashboardWizard onClose={() => setShowWizard(false)} onCreated={handleCreated} />}
      </AnimatePresence>
    </AppLayout>
  )
}

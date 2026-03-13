import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { motion } from 'framer-motion'
import { useDashboardStore } from '../../store/dashboardStore'
import { WIDGET_TYPES, CHART_COLORS } from '../../utils/mockData'
import {
  RiCloseLine, RiSaveLine, RiDatabase2Line, RiBarChartBoxLine,
  RiPulseLine, RiTableLine, RiSparkling2Line,
} from 'react-icons/ri'
import toast from 'react-hot-toast'

// ─── Constants ────────────────────────────────────────────────────────────────
const AGGREGATIONS = [
  { value: 'sum',   label: 'Sum — total of all values' },
  { value: 'avg',   label: 'Average — mean value' },
  { value: 'count', label: 'Count — number of rows' },
  { value: 'max',   label: 'Maximum value' },
  { value: 'min',   label: 'Minimum value' },
]

// ─── Helper components ────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children }) {
  return (
    <div className="space-y-3 p-3 rounded-xl bg-white/3 border border-white/6">
      <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
        {Icon && <Icon className="text-primary text-xs" />} {title}
      </p>
      {children}
    </div>
  )
}

function Label({ children }) {
  return <label className="block text-xs text-text-secondary mb-1 font-medium">{children}</label>
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        onClick={onChange}
        className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${checked ? 'bg-primary' : 'bg-white/10'}`}
      >
        <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </div>
      <span className="text-sm text-text-primary">{label}</span>
    </label>
  )
}

// Column dropdown (or free-text if no columns loaded)
function ColSelect({ label, value, columns, onChange, placeholder, multi = false }) {
  if (multi) {
    const selected = Array.isArray(value) ? value : []
    return (
      <div>
        <Label>{label}</Label>
        {columns.length > 0 ? (
          <div className="space-y-1 max-h-36 overflow-y-auto pr-1 rounded border border-white/6 p-2 bg-white/2">
            {columns.map(col => {
              const checked = selected.includes(col)
              return (
                <label key={col} className="flex items-center gap-2 cursor-pointer hover:bg-white/4 rounded px-1 py-0.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onChange(checked ? selected.filter(m => m !== col) : [...selected, col])}
                    className="accent-primary w-3 h-3"
                  />
                  <span className="text-xs text-text-primary font-mono">{col}</span>
                </label>
              )
            })}
          </div>
        ) : (
          <input
            value={selected.join(', ')}
            onChange={e => onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            className="input-field"
            placeholder={placeholder}
          />
        )}
        {selected.length > 0 && (
          <p className="text-[10px] text-primary mt-1 truncate">✓ {selected.join(', ')}</p>
        )}
      </div>
    )
  }

  return (
    <div>
      <Label>{label}</Label>
      {columns.length > 0 ? (
        <select value={value || ''} onChange={e => onChange(e.target.value)} className="input-field">
          <option value="">— select column —</option>
          {columns.map(col => (
            <option key={col} value={col} className="bg-[#0F172A]">{col}</option>
          ))}
        </select>
      ) : (
        <input value={value || ''} onChange={e => onChange(e.target.value)} className="input-field" placeholder={placeholder} />
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WidgetSettingsPanel({ widget, onClose }) {
  const { updateWidget }          = useDashboardStore()
  const [dataSources, setDataSources] = useState([])
  const [dsColumns,    setDsColumns]  = useState([])
  const [saving,       setSaving]     = useState(false)

  useEffect(() => {
    api.get('/datasources').then(res => setDataSources(res.data)).catch(console.error)
  }, [])

  const initDs = typeof widget?.dataSource === 'object' && widget?.dataSource !== null
    ? widget.dataSource._id
    : (widget?.dataSource || '')

  const [form, setForm] = useState({
    title:      widget?.title || '',
    type:       widget?.type  || 'bar',
    dataSource: initDs,
    configuration: {
      // Common
      showLegend:  widget?.configuration?.showLegend  ?? true,
      showGrid:    widget?.configuration?.showGrid     ?? true,
      // Chart
      xAxis:       widget?.configuration?.xAxis       || '',
      metrics:     widget?.configuration?.metrics      || [],
      colors:      widget?.configuration?.colors      || [],
      // Scatter specific
      yAxis:       widget?.configuration?.yAxis       || '',
      zAxis:       widget?.configuration?.zAxis       || '',
      // KPI
      aggregation: widget?.configuration?.aggregation || 'sum',
      kpiValue:    widget?.configuration?.kpiValue    || '',
    },
  })

  // Load columns when datasource changes
  useEffect(() => {
    const id = form.dataSource
    if (!id) { setDsColumns([]); return }
    const local = dataSources.find(d => d._id === id)
    if (local?.cachedData?.length > 0) {
      setDsColumns(Object.keys(local.cachedData[0])); return
    }
    api.get(`/datasources/${id}`)
      .then(res => {
        if (res.data?.cachedData?.length > 0) setDsColumns(Object.keys(res.data.cachedData[0]))
      })
      .catch(console.error)
  }, [form.dataSource, dataSources])

  const update = (path, value) => {
    if (path.startsWith('configuration.')) {
      const key = path.replace('configuration.', '')
      setForm(f => ({ ...f, configuration: { ...f.configuration, [key]: value } }))
    } else {
      setForm(f => ({ ...f, [path]: value }))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = { ...form, dataSource: form.dataSource || null }
    const result  = await updateWidget(widget._id, payload)
    setSaving(false)
    if (result.success) { toast.success('Widget updated!'); onClose() }
    else toast.error(result.error || 'Failed to save')
  }

  const isKpi     = form.type === 'kpi'
  const isTable   = form.type === 'table'
  const isScatter = form.type === 'scatter'
  const isPie     = form.type === 'pie' || form.type === 'donut'
  const isChart   = !isKpi && !isTable   // bar, line, area, pie, donut, scatter

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-80 h-full bg-[#080F1E] border-l border-white/5 flex flex-col shrink-0 overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-text-primary text-sm">Widget Settings</h3>
        <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors p-1">
          <RiCloseLine className="text-lg" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Title */}
        <div>
          <Label>Widget Title</Label>
          <input value={form.title} onChange={e => update('title', e.target.value)} className="input-field" placeholder="Enter widget title…" />
        </div>

        {/* Widget Type */}
        <div>
          <Label>Widget Type</Label>
          <div className="grid grid-cols-2 gap-2">
            {WIDGET_TYPES.map(wt => (
              <button
                key={wt.type}
                onClick={() => update('type', wt.type)}
                title={wt.desc}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left
                  ${form.type === wt.type
                    ? 'bg-primary/20 border border-primary/40 text-primary'
                    : 'bg-white/5 border border-white/10 text-text-secondary hover:border-white/20'}`}
              >
                <span>{wt.icon}</span><span>{wt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Data Source (all types) */}
        <Section title="Data Source" icon={RiDatabase2Line}>
          <div>
            <Label>Dataset</Label>
            <select value={form.dataSource} onChange={e => update('dataSource', e.target.value)} className="input-field">
              <option value="">— None selected —</option>
              {dataSources.map(ds => (
                <option key={ds._id} value={ds._id} className="bg-[#0F172A]">{ds.name}</option>
              ))}
            </select>
          </div>
          {/* Column tags */}
          {dsColumns.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {dsColumns.map(col => (
                <span key={col} className="text-[9px] px-1.5 py-0.5 rounded bg-white/6 text-text-secondary font-mono cursor-default">{col}</span>
              ))}
            </div>
          )}
        </Section>

        {/* ═══ KPI SETTINGS ════════════════════════════════════════════════ */}
        {isKpi && (
          <Section title="KPI Configuration" icon={RiPulseLine}>
            <ColSelect
              label="Metric Column"
              value={form.configuration.metrics?.[0] || ''}
              columns={dsColumns}
              onChange={v => update('configuration.metrics', v ? [v] : [])}
              placeholder="e.g. revenue"
            />
            <div>
              <Label>Aggregation Method</Label>
              <select value={form.configuration.aggregation} onChange={e => update('configuration.aggregation', e.target.value)} className="input-field">
                {AGGREGATIONS.map(a => <option key={a.value} value={a.value} className="bg-[#0F172A]">{a.label}</option>)}
              </select>
            </div>
            <div className="border-t border-white/6 pt-3">
              <p className="text-[10px] text-text-secondary mb-2 flex items-center gap-1">
                <RiSparkling2Line className="text-primary" />
                Manual override (leave blank to auto-compute):
              </p>
              <Label>Fixed Display Value</Label>
              <input
                value={form.configuration.kpiValue}
                onChange={e => update('configuration.kpiValue', e.target.value)}
                className="input-field"
                placeholder="e.g. $1.4M"
              />
            </div>
          </Section>
        )}

        {/* ═══ SCATTER SETTINGS ════════════════════════════════════════════ */}
        {isScatter && (
          <Section title="Scatter Plot Axes" icon={RiBarChartBoxLine}>
            <ColSelect
              label="X-Axis (numeric column)"
              value={form.configuration.xAxis}
              columns={dsColumns}
              onChange={v => update('configuration.xAxis', v)}
              placeholder="e.g. price"
            />
            <ColSelect
              label="Y-Axis (numeric column)"
              value={form.configuration.yAxis || form.configuration.metrics?.[0] || ''}
              columns={dsColumns}
              onChange={v => {
                update('configuration.yAxis', v)
                update('configuration.metrics', v ? [v] : [])
              }}
              placeholder="e.g. sales"
            />
            <ColSelect
              label="Bubble Size / Z-Axis (optional)"
              value={form.configuration.zAxis || form.configuration.metrics?.[1] || ''}
              columns={dsColumns}
              onChange={v => {
                update('configuration.zAxis', v)
                const existing = form.configuration.metrics?.[0] || ''
                update('configuration.metrics', existing ? [existing, v] : [v])
              }}
              placeholder="e.g. quantity (optional)"
            />
          </Section>
        )}

        {/* ═══ PIE / DONUT SETTINGS ════════════════════════════════════════ */}
        {isPie && (
          <Section title="Pie / Donut Mapping" icon={RiBarChartBoxLine}>
            <ColSelect
              label="Label / Category Column (X-Axis)"
              value={form.configuration.xAxis}
              columns={dsColumns}
              onChange={v => update('configuration.xAxis', v)}
              placeholder="e.g. product, region"
            />
            <ColSelect
              label="Value Column (numeric)"
              value={form.configuration.metrics?.[0] || ''}
              columns={dsColumns}
              onChange={v => update('configuration.metrics', v ? [v] : [])}
              placeholder="e.g. revenue"
            />
            {/* Slice color overrides */}
            <div>
              <Label>Slice Colors (comma-separated hex, optional)</Label>
              <input
                value={(form.configuration.colors || []).join(', ')}
                onChange={e => update('configuration.colors', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                className="input-field font-mono text-xs"
                placeholder="#6366F1, #06B6D4, #F59E0B"
              />
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {CHART_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => {
                      const curr = form.configuration.colors || []
                      if (!curr.includes(c)) update('configuration.colors', [...curr, c])
                    }}
                    className="w-5 h-5 rounded-full border-2 border-transparent hover:border-white/40 transition-all"
                    style={{ background: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* ═══ BAR / LINE / AREA SETTINGS ══════════════════════════════════ */}
        {isChart && !isScatter && !isPie && (
          <Section title="Data Mapping" icon={RiBarChartBoxLine}>
            <ColSelect
              label="X-Axis (category / date column)"
              value={form.configuration.xAxis}
              columns={dsColumns}
              onChange={v => update('configuration.xAxis', v)}
              placeholder="e.g. month, date, product"
            />
            <ColSelect
              label="Y-Axis / Metrics (select multiple)"
              value={form.configuration.metrics}
              columns={dsColumns}
              onChange={v => update('configuration.metrics', v)}
              placeholder="e.g. revenue, profit"
              multi
            />
          </Section>
        )}

        {/* ═══ TABLE SETTINGS ══════════════════════════════════════════════ */}
        {isTable && (
          <Section title="Visible Columns" icon={RiTableLine}>
            {dsColumns.length > 0 ? (
              <>
                <div className="flex gap-2 mb-1">
                  <button
                    onClick={() => update('configuration.metrics', [])}
                    className="text-[10px] text-primary hover:underline"
                  >
                    Select all
                  </button>
                  <button
                    onClick={() => update('configuration.metrics', [...dsColumns])}
                    className="text-[10px] text-text-secondary hover:underline"
                  >
                    Deselect all
                  </button>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1 rounded border border-white/6 p-2 bg-white/2">
                  {dsColumns.map(col => {
                    const hidden  = (form.configuration.metrics || []).includes(col)
                    const visible = !hidden || (form.configuration.metrics || []).length === 0
                    return (
                      <label key={col} className="flex items-center gap-2 cursor-pointer hover:bg-white/4 rounded px-1 py-0.5">
                        <input
                          type="checkbox"
                          checked={!(form.configuration.metrics || []).includes(col)}
                          onChange={() => {
                            const hidden = form.configuration.metrics || []
                            update('configuration.metrics',
                              hidden.includes(col)
                                ? hidden.filter(m => m !== col)
                                : [...hidden, col]
                            )
                          }}
                          className="accent-primary w-3 h-3"
                        />
                        <span className="text-xs text-text-primary font-mono">{col}</span>
                      </label>
                    )
                  })}
                </div>
                <p className="text-[10px] text-text-secondary">Checked = visible. Uncheck to hide column.</p>
              </>
            ) : (
              <p className="text-xs text-text-secondary">Select a data source above to choose columns.</p>
            )}
          </Section>
        )}

        {/* ═══ DISPLAY OPTIONS (charts only) ═══════════════════════════════ */}
        {isChart && (
          <Section title="Display Options">
            <Toggle
              label="Show Legend"
              checked={form.configuration.showLegend}
              onChange={() => update('configuration.showLegend', !form.configuration.showLegend)}
            />
            <Toggle
              label="Show Grid Lines"
              checked={form.configuration.showGrid}
              onChange={() => update('configuration.showGrid', !form.configuration.showGrid)}
            />
          </Section>
        )}

      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/5 shrink-0">
        <button onClick={handleSave} disabled={saving} className="btn-primary w-full justify-center">
          {saving ? <><span className="animate-spin text-lg">⟳</span> Saving…</> : <><RiSaveLine /> Save Changes</>}
        </button>
      </div>
    </motion.div>
  )
}

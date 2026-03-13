import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { RiArrowUpLine, RiArrowDownLine, RiPulseLine, RiLoader4Line } from 'react-icons/ri'
import api from '../../api/axios'

const COLORS = ['#6366F1', '#06B6D4', '#F59E0B', '#22C55E', '#EC4899', '#8B5CF6']

function formatNumber(n) {
  if (n === null || n === undefined || isNaN(n)) return '—'
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B'
  if (abs >= 1_000_000)     return (n / 1_000_000).toFixed(2) + 'M'
  if (abs >= 1_000)         return (n / 1_000).toFixed(1) + 'K'
  return n.toFixed(Number.isInteger(n) ? 0 : 2)
}

export default function KpiWidget({ widget }) {
  const { title, configuration, dataSource, style } = widget
  const [fetchedData, setFetchedData] = useState(null)
  const [loading, setLoading]         = useState(false)

  const sourceId         = typeof dataSource === 'object' && dataSource !== null ? dataSource._id : dataSource
  const hasPopulatedData = typeof dataSource === 'object' && dataSource !== null && Array.isArray(dataSource.cachedData)

  // Fetch datasource if not already populated
  useEffect(() => {
    if (!sourceId) return
    if (hasPopulatedData) return
    setLoading(true)
    api.get(`/datasources/${sourceId}`)
      .then(res => { if (res.data?.cachedData) setFetchedData(res.data.cachedData) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [sourceId, hasPopulatedData])

  const rows = useMemo(() => {
    if (hasPopulatedData)                            return dataSource.cachedData
    if (fetchedData && fetchedData.length > 0)       return fetchedData
    if (configuration?.staticData?.length > 0)       return configuration.staticData
    return null
  }, [fetchedData, hasPopulatedData, dataSource, configuration?.staticData])

  // Aggregate: prefer configuration.kpiValue (manual), else compute from metrics column
  const { displayValue, metricLabel, trend } = useMemo(() => {
    // Manual override always wins
    if (configuration?.kpiValue) {
      return {
        displayValue: configuration.kpiValue,
        metricLabel:  title,
        trend:        configuration?.kpiTrend ?? null,
      }
    }

    if (!rows || rows.length === 0) {
      return { displayValue: null, metricLabel: title, trend: null }
    }

    const metricCol    = configuration?.metrics?.[0]
    const aggregation  = configuration?.aggregation || 'sum' // sum | avg | count | max | min

    if (!metricCol) {
      // No metric col — just count rows
      return { displayValue: formatNumber(rows.length), metricLabel: 'Total Records', trend: null }
    }

    // Parse the column values
    const vals = rows
      .map(r => {
        const raw = r[metricCol]
        if (raw === null || raw === undefined || String(raw).trim() === '') return NaN
        const n = Number(String(raw).replace(/[,$%€£¥\s]/g, ''))
        return isNaN(n) ? NaN : n
      })
      .filter(v => !isNaN(v))

    if (vals.length === 0) {
      return { displayValue: '—', metricLabel: metricCol, trend: null }
    }

    let agg
    switch (aggregation) {
      case 'avg':   agg = vals.reduce((a, b) => a + b, 0) / vals.length; break
      case 'count': agg = vals.length;                                    break
      case 'max':   agg = Math.max(...vals);                              break
      case 'min':   agg = Math.min(...vals);                              break
      default:      agg = vals.reduce((a, b) => a + b, 0);               break // sum
    }

    // Compute a simple trend: compare first half vs second half sums
    let trend = null
    if (vals.length >= 4) {
      const mid    = Math.floor(vals.length / 2)
      const first  = vals.slice(0, mid).reduce((a, b) => a + b, 0)
      const second = vals.slice(mid).reduce((a, b) => a + b, 0)
      if (first !== 0) {
        trend = Math.round(((second - first) / Math.abs(first)) * 100)
      }
    }

    return {
      displayValue: formatNumber(agg),
      metricLabel:  metricCol,
      trend,
    }
  }, [rows, configuration, title])

  const color      = style?.borderColor || COLORS[Math.abs(title?.charCodeAt(0) || 0) % COLORS.length]
  const isPositive = (trend ?? 0) >= 0

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RiLoader4Line className="text-primary text-2xl animate-spin opacity-60" />
      </div>
    )
  }

  // No data / no datasource
  if (!displayValue && !configuration?.kpiValue) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-secondary text-center p-4">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
          <RiPulseLine className="text-xl opacity-50" />
        </div>
        <p className="text-xs font-medium uppercase tracking-wider mb-1">No Data</p>
        <p className="text-[10px] opacity-70 max-w-[150px]">
          {sourceId ? 'No numeric values in selected metric.' : 'Select a data source in widget settings.'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col justify-between h-full p-1">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-[10px] font-medium text-text-secondary uppercase tracking-wider truncate">
            {title || metricLabel}
          </p>
          <motion.p
            key={displayValue}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="text-3xl font-bold text-text-primary mt-1.5 font-mono truncate"
          >
            {displayValue}
          </motion.p>
          {metricLabel && metricLabel !== title && (
            <p className="text-[10px] text-text-secondary truncate mt-0.5">∑ {metricLabel}</p>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}20` }}
        >
          <div className="w-4 h-4 rounded-full" style={{ background: color }} />
        </div>
      </div>

      {/* Trend badge */}
      {trend !== null && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 mt-2"
        >
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
            ${isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}
          >
            {isPositive ? <RiArrowUpLine /> : <RiArrowDownLine />}
            <span>{Math.abs(trend)}%</span>
          </div>
          <span className="text-[10px] text-text-secondary">vs first half</span>
        </motion.div>
      )}

      {/* Sparkline — driven by actual data distribution */}
      {rows && rows.length > 0 && configuration?.metrics?.[0] && (() => {
        const col    = configuration.metrics[0]
        // Sample up to 16 points evenly across the dataset
        const step   = Math.max(1, Math.floor(rows.length / 16))
        const points = []
        for (let i = 0; i < rows.length && points.length < 16; i += step) {
          const n = Number(String(rows[i]?.[col] ?? '').replace(/[,$%€£¥\s]/g, ''))
          if (!isNaN(n)) points.push(n)
        }
        if (points.length < 2) return null
        const min = Math.min(...points)
        const max = Math.max(...points)
        const range = max - min || 1
        return (
          <div className="mt-3 flex gap-0.5 items-end h-8">
            {points.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm transition-all duration-300"
                style={{
                  height: `${Math.max(10, ((v - min) / range) * 100)}%`,
                  background: color,
                  opacity: i === points.length - 1 ? 1 : 0.25 + (i / points.length) * 0.6,
                }}
              />
            ))}
          </div>
        )
      })()}
    </div>
  )
}

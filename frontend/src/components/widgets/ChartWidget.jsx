import React, { useMemo, useState, useEffect } from 'react'
import api from '../../api/axios'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, ScatterChart, Scatter, ZAxis,
} from 'recharts'
import { CHART_COLORS } from '../../utils/mockData'
import { RiBarChartBoxLine } from 'react-icons/ri'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0F172A]/95 border border-white/10 rounded-lg p-3 text-xs backdrop-blur-sm">
      {label && <p className="text-text-secondary mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  )
}

export default function ChartWidget({ widget }) {
  const { type, configuration, dataSource } = widget
  const [fetchedData, setFetchedData] = useState(null)

  const sourceId = typeof dataSource === 'object' && dataSource !== null ? dataSource._id : dataSource
  const hasPopulatedData = typeof dataSource === 'object' && dataSource !== null && Array.isArray(dataSource.cachedData)

  useEffect(() => {
    if (sourceId && !hasPopulatedData) {
      api.get(`/datasources/${sourceId}`).then(res => {
         if (res.data && res.data.cachedData) {
           setFetchedData(res.data.cachedData)
         }
      }).catch(console.error)
    }
  }, [sourceId, hasPopulatedData])

  const data = useMemo(() => {
    let sourceData = [];
    if (fetchedData && fetchedData.length > 0) sourceData = fetchedData
    else if (hasPopulatedData && dataSource.cachedData.length > 0) sourceData = dataSource.cachedData
    else if (configuration?.staticData) sourceData = configuration.staticData
    
    // Attempt dynamic parsing for numeric fields if they are sent as strings
    if (sourceData.length > 0 && configuration?.metrics?.length > 0) {
       return sourceData.map(row => {
          const parsed = { ...row };
          configuration.metrics.forEach(m => {
             if (typeof parsed[m] === 'string' && !isNaN(Number(parsed[m].replace(/[^0-9.-]+/g,"")))) {
                parsed[m] = Number(parsed[m].replace(/[^0-9.-]+/g,""));
             }
          });
          return parsed;
       })
    }
    return sourceData;
  }, [type, widget._id, fetchedData, configuration?.staticData, configuration?.metrics, hasPopulatedData, dataSource])

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-secondary text-center p-4">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
          <RiBarChartBoxLine className="text-xl opacity-50" />
        </div>
        <p className="text-xs font-medium uppercase tracking-wider mb-1">No Data Bound</p>
        <p className="text-[10px] opacity-70 max-w-[150px]">Select a data source in settings to visualize your metrics.</p>
      </div>
    )
  }

  const commonProps = {
    data,
    margin: { top: 5, right: 10, left: -10, bottom: 5 },
  }

  const showGrid   = configuration?.showGrid   !== false
  const showLegend = configuration?.showLegend !== false

  const axisProps = {
    XAxis:   <XAxis dataKey={configuration?.xAxis || 'name'} type={type === 'scatter' ? 'number' : 'category'} tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />,
    YAxis:   <YAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />,
    Grid:    showGrid ? <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={type === 'scatter'} /> : null,
    Tooltip: <Tooltip content={<CustomTooltip />} cursor={type !== 'scatter' ? { fill: 'rgba(255,255,255,0.05)' } : { strokeDasharray: '3 3' }} />,
  }

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart {...commonProps}>
          {axisProps.Grid}
          {axisProps.XAxis}
          {axisProps.YAxis}
          {axisProps.Tooltip}
          {showLegend && <Legend wrapperStyle={{ fontSize: '11px', color: '#64748B' }} />}
          {configuration?.metrics?.length > 0
            ? configuration.metrics.map((metric, i) => (
                <Bar key={metric} dataKey={metric} fill={configuration?.colors?.[i] || CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} maxBarSize={50} />
              ))
            : <Bar dataKey={Object.keys(data[0] || {}).find(k => k !== configuration?.xAxis && !isNaN(Number(data[0][k]))) || 'value'} fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={50} />
          }
        </BarChart>
      </ResponsiveContainer>
    )
  }

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart {...commonProps}>
          {axisProps.Grid}
          {axisProps.XAxis}
          {axisProps.YAxis}
          {axisProps.Tooltip}
          {showLegend && <Legend wrapperStyle={{ fontSize: '11px', color: '#64748B' }} />}
          {configuration?.metrics?.length > 0
            ? configuration.metrics.map((metric, i) => (
                <Line key={metric} dataKey={metric} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              ))
            : <Line dataKey={Object.keys(data[0] || {}).find(k => k !== configuration?.xAxis && !isNaN(Number(data[0][k]))) || 'value'} stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          }
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (type === 'area') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart {...commonProps}>
          <defs>
            {(configuration?.metrics?.length > 0 ? configuration.metrics : ['value']).map((metric, i) => (
              <linearGradient key={metric} id={`grad_${metric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          {axisProps.Grid}
          {axisProps.XAxis}
          {axisProps.YAxis}
          {axisProps.Tooltip}
          {showLegend && <Legend wrapperStyle={{ fontSize: '11px', color: '#64748B' }} />}
          {configuration?.metrics?.length > 0
            ? configuration.metrics.map((metric, i) => (
                <Area key={metric} dataKey={metric} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} fill={`url(#grad_${metric})`} />
              ))
            : <Area dataKey={Object.keys(data[0] || {}).find(k => k !== configuration?.xAxis && !isNaN(Number(data[0][k]))) || 'value'} stroke={CHART_COLORS[0]} strokeWidth={2} fill={`url(#grad_value)`} />
          }
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  if (type === 'pie' || type === 'donut') {
    const innerRadius = type === 'donut' ? '55%' : 0
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius="70%"
            paddingAngle={3}
            dataKey={configuration?.metrics?.[0] || 'value'}
            nameKey={configuration?.xAxis || 'name'}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.fill || configuration?.colors?.[index] || CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => <span style={{ color: '#94A3B8', fontSize: '11px' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  if (type === 'scatter') {
    const yDataKey = configuration?.yAxis || configuration?.metrics?.[0] || ''
    const zDataKey = configuration?.zAxis || configuration?.metrics?.[1] || ''
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart {...commonProps}>
          {axisProps.Grid}
          <XAxis dataKey={configuration?.xAxis || ''} type="number" name={configuration?.xAxis || 'X'} tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis dataKey={yDataKey} type="number" name={yDataKey || 'Y'} tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
          {zDataKey && <ZAxis dataKey={zDataKey} type="number" range={[50, 400]} name={zDataKey} />}
          {axisProps.Tooltip}
          {showLegend && <Legend wrapperStyle={{ fontSize: '11px', color: '#64748B' }} />}
          <Scatter name={yDataKey || 'Values'} data={data} fill={CHART_COLORS[0]} opacity={0.75} />
        </ScatterChart>
      </ResponsiveContainer>
    )
  }

  return (
    <div className="flex items-center justify-center h-full text-text-secondary text-sm">
      Unsupported chart type: {type}
    </div>
  )
}

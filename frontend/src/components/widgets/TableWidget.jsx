import { useState, useEffect, useMemo } from 'react'
import api from '../../api/axios'
import { RiTableLine } from 'react-icons/ri'

const statusColors = {
  Active: 'bg-green-500/15 text-green-400',
  Pending: 'bg-yellow-500/15 text-yellow-400',
  Inactive: 'bg-red-500/15 text-red-400',
}

export default function TableWidget({ widget }) {
  const { configuration, dataSource } = widget
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
    if (fetchedData && fetchedData.length > 0) return fetchedData
    if (hasPopulatedData && dataSource.cachedData.length > 0) return dataSource.cachedData
    if (configuration?.staticData && configuration.staticData.length > 0) return configuration.staticData
    return []
  }, [fetchedData, configuration?.staticData, hasPopulatedData, dataSource])

  const columns = useMemo(() => {
    if (configuration?.columns?.length > 0) return configuration.columns;
    if (data && data.length > 0) {
       return Object.keys(data[0]).slice(0, 8).map(key => ({
         key, label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')
       }))
    }
    return []
  }, [data, configuration?.columns])

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-secondary text-center p-4">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
          <RiTableLine className="text-xl opacity-50" />
        </div>
        <p className="text-xs font-medium uppercase tracking-wider mb-1">No Data Bound</p>
        <p className="text-[10px] opacity-70 max-w-[160px]">Select a data source in widget settings to display your table.</p>
      </div>
    )
  }

  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/5">
            {columns.map((col) => (
              <th key={col.key} className="text-left px-3 py-2 text-text-secondary font-semibold uppercase tracking-wider whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              className="border-b border-white/3 hover:bg-white/3 transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-2.5 text-text-primary whitespace-nowrap">
                  {col.key === 'status' ? (
                    <span className={`badge ${statusColors[row[col.key]] || 'bg-white/10 text-text-secondary'}`}>
                      {row[col.key]}
                    </span>
                  ) : col.key === 'growth' ? (
                    <span className={row[col.key]?.startsWith('-') ? 'text-red-400' : 'text-green-400'}>
                      {row[col.key]}
                    </span>
                  ) : (
                    row[col.key] !== null && row[col.key] !== undefined ? row[col.key].toString() : '-'
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

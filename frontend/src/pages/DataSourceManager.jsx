import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { RiDatabase2Line, RiAddLine, RiDeleteBinLine, RiRefreshLine, RiGlobeLine, RiFileExcel2Line, RiCodeLine } from 'react-icons/ri'
import AppLayout from '../components/AppLayout'
import Navbar from '../components/Navbar'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function DataSourceManager() {
  const [sources, setSources] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'rest_api', endpoint: '' })
  const [saving, setSaving] = useState(false)
  
  // CSV upload state
  const [file, setFile] = useState(null)

  useEffect(() => {
    fetchSources()
  }, [])

  const fetchSources = async () => {
    setIsLoading(true)
    try {
      const { data } = await api.get('/datasources')
      setSources(data)
    } catch (err) {
      toast.error('Failed to load data sources')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete data source?')) return
    try {
      await api.delete(`/datasources/${id}`)
      setSources(sources.filter(s => s._id !== id))
      toast.success('Data source deleted')
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (form.type === 'csv') {
        if (!file) {
          toast.error('Please select a CSV file')
          setSaving(false)
          return
        }
        const formData = new FormData()
        formData.append('file', file)
        formData.append('name', form.name)
        
        const { data } = await api.post('/datasources/upload/csv', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        setSources([data.source, ...sources])
      } else {
        const { data } = await api.post('/datasources', form)
        setSources([data, ...sources])
      }
      
      toast.success('Data source added')
      setShowModal(false)
      setForm({ name: '', type: 'rest_api', endpoint: '' })
      setFile(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add data source')
    } finally {
      setSaving(false)
    }
  }

  const handleFetch = async (id) => {
    const toastId = toast.loading('Fetching data...')
    try {
      await api.post(`/datasources/${id}/fetch`)
      toast.success('Data fetched correctly', { id: toastId })
      fetchSources()
    } catch (err) {
      toast.error('Failed to fetch data', { id: toastId })
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'rest_api': return <RiGlobeLine className="text-primary text-xl" />
      case 'csv': return <RiFileExcel2Line className="text-green-500 text-xl" />
      case 'static': return <RiCodeLine className="text-accent text-xl" />
      default: return <RiDatabase2Line className="text-primary text-xl" />
    }
  }

  return (
    <AppLayout>
      <Navbar
        title="Data Sources"
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary py-1.5 px-3 text-sm"
          >
            <RiAddLine /> Add Source
          </button>
        }
      />

      <div className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="glass-card h-20 shimmer" />)}
          </div>
        ) : sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary text-4xl">
               <RiDatabase2Line />
            </div>
            <h2 className="text-xl font-semibold mb-2">No data sources connected</h2>
            <p className="text-text-secondary max-w-sm mb-6">Connect REST APIs, upload CSVs, or add manual data to power your dashboards.</p>
            <button onClick={() => setShowModal(true)} className="btn-primary"><RiAddLine /> Add Data Source</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {sources.map((source, i) => (
               <motion.div
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.05 }}
                 key={source._id}
                 className="glass-card p-5 group hover:border-primary/30 transition-colors"
               >
                 <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                       {getIcon(source.type)}
                     </div>
                     <div>
                       <h3 className="font-semibold text-text-primary">{source.name}</h3>
                       <span className="badge bg-white/5 text-text-secondary border border-white/10 uppercase font-mono text-[10px] mt-1">
                         {source.type.replace('_', ' ')}
                       </span>
                     </div>
                   </div>
                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => handleFetch(source._id)} className="p-1.5 text-text-secondary hover:text-green-400 rounded hover:bg-white/5" title="Fetch Now">
                       <RiRefreshLine />
                     </button>
                     <button onClick={() => handleDelete(source._id)} className="p-1.5 text-text-secondary hover:text-red-400 rounded hover:bg-red-500/10" title="Delete">
                       <RiDeleteBinLine />
                     </button>
                   </div>
                 </div>

                 {source.endpoint && source.type !== 'csv' && (
                   <div className="mb-4 bg-[#080F1E] rounded-md p-2 text-xs font-mono text-text-secondary truncate border border-white/5 overflow-x-auto">
                     {source.endpoint}
                   </div>
                 )}

                 <div className="flex justify-between items-center text-xs text-text-secondary border-t border-white/5 pt-3 mt-auto">
                    <span className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${source.status === 'active' ? 'bg-green-500' : source.status === 'error' ? 'bg-red-500' : 'bg-gray-500'}`} />
                      {source.status === 'active' ? 'Active' : source.status === 'error' ? 'Error' : 'Idle'}
                    </span>
                    <span>
                      {source.lastFetched ? `Updated ${new Date(source.lastFetched).toLocaleTimeString()}` : 'Never fetched'}
                    </span>
                 </div>
               </motion.div>
             ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card w-full max-w-md bg-[#0F172A] shadow-glow-lg border-primary/20"
          >
            <div className="p-5 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-text-primary">New Data Source</h2>
              <button onClick={() => setShowModal(false)} className="text-text-secondary hover:text-text-primary text-xl">✕</button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="label">Source Name</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="input-field"
                  placeholder="e.g. Production API"
                />
              </div>

              <div>
                <label className="label">Source Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'rest_api', label: 'REST API', icon: RiGlobeLine },
                    { id: 'csv', label: 'CSV Upload', icon: RiFileExcel2Line },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setForm({...form, type: t.id})}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${form.type === t.id ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'}`}
                    >
                      <t.icon className="text-xl" />
                      <span className="text-xs font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {form.type === 'rest_api' && (
                <div>
                  <label className="label">API Endpoint URL</label>
                  <input
                    required
                    type="url"
                    value={form.endpoint}
                    onChange={e => setForm({...form, endpoint: e.target.value})}
                    className="input-field font-mono text-sm"
                    placeholder="https://api.example.com/v1/data"
                  />
                  <p className="text-[10px] text-text-secondary mt-1">Must return JSON array or object</p>
                </div>
              )}

              {form.type === 'csv' && (
                <div>
                  <label className="label">CSV File</label>
                  <input
                    required
                    type="file"
                    accept=".csv"
                    onChange={e => setFile(e.target.files[0])}
                    className="input-field pt-2"
                  />
                  <p className="text-[10px] text-text-secondary mt-1">Max file size: 10MB</p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary w-full justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
                  {saving ? 'Saving...' : 'Connect Source'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AppLayout>
  )
}

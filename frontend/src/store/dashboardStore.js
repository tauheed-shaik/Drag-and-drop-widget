import { create } from 'zustand'
import api from '../api/axios'

export const useDashboardStore = create((set, get) => ({
  dashboards: [],
  activeDashboard: null,
  widgets: [],
  isLoading: false,
  isSaving: false,
  error: null,

  // Fetch all dashboards
  fetchDashboards: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.get('/dashboards')
      set({ dashboards: data, isLoading: false })
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load dashboards', isLoading: false })
    }
  },

  // Fetch single dashboard + widgets
  fetchDashboard: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.get(`/dashboards/${id}`)
      set({ activeDashboard: data.dashboard, widgets: data.widgets, isLoading: false })
      return data
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load dashboard', isLoading: false })
    }
  },

  // Create dashboard
  createDashboard: async (payload) => {
    try {
      const { data } = await api.post('/dashboards', payload)
      set((state) => ({ dashboards: [data, ...state.dashboards] }))
      return { success: true, dashboard: data }
    } catch (err) {
      return { success: false, error: err.response?.data?.message }
    }
  },

  // Update dashboard metadata
  updateDashboard: async (id, updates) => {
    set({ isSaving: true })
    try {
      const { data } = await api.put(`/dashboards/${id}`, updates)
      set((state) => ({
        dashboards: state.dashboards.map((d) => (d._id === id ? data : d)),
        activeDashboard: state.activeDashboard?._id === id ? data : state.activeDashboard,
        isSaving: false,
      }))
      return { success: true, dashboard: data }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, error: err.response?.data?.message }
    }
  },

  // Save layout
  saveLayout: async (id, layout) => {
    set((state) => ({ 
      isSaving: true,
      activeDashboard: state.activeDashboard ? { ...state.activeDashboard, layout } : state.activeDashboard
    }))
    try {
      await api.put(`/dashboards/${id}/layout`, { layout })
      set({ isSaving: false })
    } catch (err) {
      set({ isSaving: false })
    }
  },

  // Delete dashboard
  deleteDashboard: async (id) => {
    try {
      await api.delete(`/dashboards/${id}`)
      set((state) => ({ dashboards: state.dashboards.filter((d) => d._id !== id) }))
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.message }
    }
  },

  // Share dashboard
  shareDashboard: async (id) => {
    try {
      const { data } = await api.post(`/dashboards/${id}/share`)
      return { success: true, ...data }
    } catch (err) {
      return { success: false, error: err.response?.data?.message }
    }
  },

  // Widget operations
  addWidget: async (payload) => {
    try {
      const { data } = await api.post('/widgets', payload)
      set((state) => {
        // Prevent duplicate if socket beat HTTP
        if (state.widgets.some((w) => w._id === data._id)) return state

        const newLayoutEntry = {
          i: data._id,
          x: payload.position?.x || 0,
          y: payload.position?.y || Infinity,
          w: payload.size?.w || 4,
          h: payload.size?.h || 3
        }

        return { 
          widgets: [...state.widgets, data],
          activeDashboard: state.activeDashboard ? {
            ...state.activeDashboard,
            layout: [...(state.activeDashboard.layout || []), newLayoutEntry]
          } : state.activeDashboard
        }
      })
      return { success: true, widget: data }
    } catch (err) {
      return { success: false, error: err.response?.data?.message }
    }
  },

  updateWidget: async (id, updates) => {
    try {
      const { data } = await api.put(`/widgets/${id}`, updates)
      set((state) => ({
        widgets: state.widgets.map((w) => (w._id === id ? data : w)),
      }))
      return { success: true, widget: data }
    } catch (err) {
      return { success: false, error: err.response?.data?.message }
    }
  },

  deleteWidget: async (id) => {
    try {
      await api.delete(`/widgets/${id}`)
      set((state) => ({
        widgets: state.widgets.filter((w) => w._id !== id),
        activeDashboard: state.activeDashboard ? {
          ...state.activeDashboard,
          layout: (state.activeDashboard.layout || []).filter(l => l.i !== id)
        } : state.activeDashboard
      }))
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.message }
    }
  },

  // Real-time: update widget from socket
  socketUpdateWidget: (widget) => {
    set((state) => ({
      widgets: state.widgets.map((w) => (w._id === widget._id ? widget : w)),
    }))
  },

  socketAddWidget: (widget) => {
    set((state) => {
      if (state.widgets.some((w) => w._id === widget._id)) return state
      return { 
        widgets: [...state.widgets, widget],
        activeDashboard: state.activeDashboard ? {
          ...state.activeDashboard,
          layout: [...(state.activeDashboard.layout || []), { i: widget._id, x: 0, y: Infinity, w: 4, h: 3 }]
        } : state.activeDashboard
      }
    })
  },

  socketDeleteWidget: ({ id }) => {
    set((state) => ({ 
      widgets: state.widgets.filter((w) => w._id !== id),
      activeDashboard: state.activeDashboard ? {
        ...state.activeDashboard,
        layout: (state.activeDashboard.layout || []).filter(l => l.i !== id)
      } : state.activeDashboard
    }))
  },

  socketUpdateLayout: (layout) => {
    set((state) => ({
      activeDashboard: state.activeDashboard ? { ...state.activeDashboard, layout } : state.activeDashboard,
    }))
  },

  setActiveDashboard: (dashboard) => set({ activeDashboard: dashboard }),
  setWidgets: (widgets) => set({ widgets }),
  clearDashboard: () => set({ activeDashboard: null, widgets: [] }),
}))

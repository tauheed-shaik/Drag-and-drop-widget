import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useDashboardStore } from '../store/dashboardStore'

let socketInstance = null

export const useSocket = (dashboardId) => {
  const socketRef = useRef(null)
  const { socketUpdateWidget, socketAddWidget, socketDeleteWidget, socketUpdateLayout } = useDashboardStore()

  useEffect(() => {
    if (!dashboardId) return

    if (!socketInstance) {
      socketInstance = io('/', { transports: ['websocket', 'polling'] })
    }

    socketRef.current = socketInstance
    socketInstance.emit('join-dashboard', dashboardId)

    socketInstance.on('widget-updated', socketUpdateWidget)
    socketInstance.on('widget-added', socketAddWidget)
    socketInstance.on('widget-deleted', socketDeleteWidget)
    socketInstance.on('layout-updated', socketUpdateLayout)

    return () => {
      socketInstance.emit('leave-dashboard', dashboardId)
      socketInstance.off('widget-updated', socketUpdateWidget)
      socketInstance.off('widget-added', socketAddWidget)
      socketInstance.off('widget-deleted', socketDeleteWidget)
      socketInstance.off('layout-updated', socketUpdateLayout)
    }
  }, [dashboardId])

  return socketRef.current
}

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import DashboardListPage from './pages/DashboardListPage'
import DashboardBuilderPage from './pages/DashboardBuilderPage'
import DataSourceManager from './pages/DataSourceManager'
import UserSettings from './pages/UserSettings'
import AdminPanel from './pages/AdminPanel'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Routes */}
        <Route path="/dashboards" element={<ProtectedRoute><DashboardListPage /></ProtectedRoute>} />
        <Route path="/dashboards/:id" element={<ProtectedRoute><DashboardBuilderPage /></ProtectedRoute>} />
        <Route path="/datasources" element={<ProtectedRoute><DataSourceManager /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><UserSettings /></ProtectedRoute>} />
        
        {/* Admin Route */}
        <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />

        {/* Redirect root to dashboards */}
        <Route path="/" element={<Navigate to="/dashboards" replace />} />
        <Route path="*" element={<Navigate to="/dashboards" replace />} />
      </Routes>
    </Router>
  )
}

export default App

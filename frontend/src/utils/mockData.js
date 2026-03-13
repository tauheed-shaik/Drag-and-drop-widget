// Mock data generators for demo widgets
export const generateSalesData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months.map((month) => ({
    name: month,
    revenue: Math.floor(Math.random() * 80000) + 20000,
    target: Math.floor(Math.random() * 70000) + 25000,
    profit: Math.floor(Math.random() * 30000) + 5000,
  }))
}

export const generateUserData = () => {
  const days = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`)
  return days.map((day) => ({
    name: day,
    users: Math.floor(Math.random() * 5000) + 1000,
    sessions: Math.floor(Math.random() * 8000) + 2000,
    pageViews: Math.floor(Math.random() * 20000) + 5000,
  }))
}

export const generatePieData = () => [
  { name: 'Mobile', value: 45, fill: '#6366F1' },
  { name: 'Desktop', value: 30, fill: '#06B6D4' },
  { name: 'Tablet', value: 15, fill: '#22C55E' },
  { name: 'Other', value: 10, fill: '#F59E0B' },
]

export const generateHeatmapData = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hours = Array.from({ length: 24 }, (_, i) => `${i}h`)
  return days.map((day) =>
    hours.map((hour) => ({
      day,
      hour,
      value: Math.floor(Math.random() * 100),
    }))
  ).flat()
}

export const generateTableData = () =>
  Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Product ${String.fromCharCode(65 + i)}`,
    category: ['Electronics', 'Clothing', 'Food', 'Sports'][i % 4],
    revenue: `$${(Math.random() * 50000 + 5000).toFixed(2)}`,
    growth: `${(Math.random() * 30 - 5).toFixed(1)}%`,
    status: ['Active', 'Pending', 'Inactive'][i % 3],
  }))

export const CHART_COLORS = [
  '#6366F1', '#06B6D4', '#22C55E', '#F59E0B',
  '#EF4444', '#8B5CF6', '#EC4899', '#10B981',
]

export const WIDGET_TYPES = [
  { type: 'bar', label: 'Bar Chart', icon: '📊', desc: 'Compare values across categories' },
  { type: 'line', label: 'Line Chart', icon: '📈', desc: 'Track trends over time' },
  { type: 'area', label: 'Area Chart', icon: '🗻', desc: 'Show volume and trends' },
  { type: 'pie', label: 'Pie Chart', icon: '🥧', desc: 'Show proportional distribution' },
  { type: 'donut', label: 'Donut Chart', icon: '🍩', desc: 'Proportions with center metric' },
  { type: 'scatter', label: 'Scatter Plot', icon: '⁙', desc: 'Relationship between two variables' },
  { type: 'kpi', label: 'KPI Card', icon: '💡', desc: 'Display key metrics at a glance' },
  { type: 'table', label: 'Data Table', icon: '📋', desc: 'Show structured data' },
]

export const TIME_RANGES = [
  { label: 'Last 24h', value: '1d' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'Last year', value: '1y' },
  { label: 'All time', value: 'all' },
]

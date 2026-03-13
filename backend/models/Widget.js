const mongoose = require('mongoose');

const widgetSchema = new mongoose.Schema({
  dashboardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dashboard',
    required: true,
  },
  type: {
    type: String,
    enum: ['bar', 'line', 'area', 'pie', 'donut', 'kpi', 'table', 'heatmap', 'stacked'],
    required: true,
  },
  title: {
    type: String,
    default: 'New Widget',
    trim: true,
  },
  dataSource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DataSource',
    default: null,
  },
  configuration: {
    // Chart-specific config
    xAxis: { type: String, default: '' },
    yAxis: { type: String, default: '' },
    metrics: [{ type: String }],
    filters: { type: Object, default: {} },
    timeRange: { type: String, default: '7d' },
    colors: [{ type: String }],
    showLegend: { type: Boolean, default: true },
    showGrid: { type: Boolean, default: true },
    // KPI-specific
    kpiValue: { type: String, default: '' },
    kpiUnit: { type: String, default: '' },
    kpiTrend: { type: Number, default: 0 },
    // Table-specific
    columns: [{ type: Object }],
    // Query / data override
    staticData: { type: Array, default: null },
    dataQuery: { type: String, default: '' },
  },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
  },
  size: {
    w: { type: Number, default: 4 },
    h: { type: Number, default: 3 },
  },
  style: {
    backgroundColor: { type: String, default: '' },
    borderColor: { type: String, default: '' },
    opacity: { type: Number, default: 1 },
  },
}, { timestamps: true });

module.exports = mongoose.model('Widget', widgetSchema);

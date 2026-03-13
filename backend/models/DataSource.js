const mongoose = require('mongoose');

const dataSourceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Data source name is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['rest_api', 'csv', 'static', 'database'],
    required: true,
  },
  endpoint: {
    type: String,
    default: '',
  },
  method: {
    type: String,
    enum: ['GET', 'POST'],
    default: 'GET',
  },
  headers: {
    type: Object,
    default: {},
  },
  body: {
    type: Object,
    default: {},
  },
  credentials: {
    apiKey: { type: String, default: '' },
    token: { type: String, default: '' },
  },
  // Cached / preprocessed data
  cachedData: {
    type: Array,
    default: null,
  },
  lastFetched: {
    type: Date,
    default: null,
  },
  refreshInterval: {
    type: Number,
    default: 300, // 5 minutes default
  },
  status: {
    type: String,
    enum: ['active', 'error', 'idle'],
    default: 'idle',
  },
  errorMessage: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('DataSource', dataSourceSchema);

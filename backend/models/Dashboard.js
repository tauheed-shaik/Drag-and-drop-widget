const mongoose = require('mongoose');

const dashboardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Dashboard name is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  thumbnail: {
    type: String,
    default: '',
  },
  layout: {
    type: Array,
    default: [],
    // Each item: { i: widgetId, x, y, w, h }
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  shareToken: {
    type: String,
    default: null,
  },
  sharedWith: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    permission: { type: String, enum: ['view', 'edit'], default: 'view' },
  }],
  tags: [{ type: String }],
  refreshInterval: {
    type: Number,
    default: 0, // 0 = no auto-refresh; value in seconds
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

module.exports = mongoose.model('Dashboard', dashboardSchema);

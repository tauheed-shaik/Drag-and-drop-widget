const express = require('express');
const router = express.Router();
const Dashboard = require('../models/Dashboard');
const Widget = require('../models/Widget');
const { protect } = require('../middleware/auth');
const crypto = require('crypto');

// GET /api/dashboards — user's dashboards
router.get('/', protect, async (req, res) => {
  try {
    const dashboards = await Dashboard.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .lean();

    // Attach widget count
    const withCounts = await Promise.all(
      dashboards.map(async (d) => {
        const count = await Widget.countDocuments({ dashboardId: d._id });
        return { ...d, widgetCount: count };
      })
    );
    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboards/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const dashboard = await Dashboard.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.user._id },
        { 'sharedWith.userId': req.user._id },
        { isPublic: true },
      ],
    });

    if (!dashboard) {
      return res.status(404).json({ message: 'Dashboard not found.' });
    }

    const widgets = await Widget.find({ dashboardId: dashboard._id }).populate('dataSource');
    res.json({ dashboard, widgets });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/dashboards — create dashboard
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, tags, refreshInterval } = req.body;
    const dashboard = await Dashboard.create({
      userId: req.user._id,
      name: name || 'Untitled Dashboard',
      description: description || '',
      tags: tags || [],
      refreshInterval: refreshInterval || 0,
      layout: [],
    });
    res.status(201).json(dashboard);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/dashboards/:id — update dashboard
router.put('/:id', protect, async (req, res) => {
  try {
    const dashboard = await Dashboard.findOne({ _id: req.params.id, userId: req.user._id });
    if (!dashboard) return res.status(404).json({ message: 'Dashboard not found.' });

    const updates = req.body;
    updates.lastModifiedBy = req.user._id;

    const updated = await Dashboard.findByIdAndUpdate(req.params.id, updates, { new: true });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) io.to(req.params.id).emit('dashboard-updated', updated);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/dashboards/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const dashboard = await Dashboard.findOne({ _id: req.params.id, userId: req.user._id });
    if (!dashboard) return res.status(404).json({ message: 'Dashboard not found.' });

    await Widget.deleteMany({ dashboardId: req.params.id });
    await Dashboard.findByIdAndDelete(req.params.id);

    res.json({ message: 'Dashboard deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/dashboards/:id/share — generate share link
router.post('/:id/share', protect, async (req, res) => {
  try {
    const dashboard = await Dashboard.findOne({ _id: req.params.id, userId: req.user._id });
    if (!dashboard) return res.status(404).json({ message: 'Dashboard not found.' });

    const shareToken = crypto.randomBytes(16).toString('hex');
    dashboard.shareToken = shareToken;
    dashboard.isPublic = true;
    await dashboard.save();

    res.json({ shareToken, shareUrl: `${req.protocol}://${req.get('host')}/shared/${shareToken}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboards/shared/:token — view shared dashboard
router.get('/shared/:token', async (req, res) => {
  try {
    const dashboard = await Dashboard.findOne({ shareToken: req.params.token, isPublic: true });
    if (!dashboard) return res.status(404).json({ message: 'Shared dashboard not found.' });

    const widgets = await Widget.find({ dashboardId: dashboard._id });
    res.json({ dashboard, widgets });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/dashboards/:id/layout — save layout positions
router.put('/:id/layout', protect, async (req, res) => {
  try {
    const { layout } = req.body;
    const dashboard = await Dashboard.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { layout, lastModifiedBy: req.user._id },
      { new: true }
    );
    if (!dashboard) return res.status(404).json({ message: 'Dashboard not found.' });

    const io = req.app.get('io');
    if (io) io.to(req.params.id).emit('layout-updated', layout);

    res.json(dashboard);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

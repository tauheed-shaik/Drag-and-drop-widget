const express = require('express');
const router = express.Router();
const Widget = require('../models/Widget');
const Dashboard = require('../models/Dashboard');
const { protect } = require('../middleware/auth');

// POST /api/widgets — create widget
router.post('/', protect, async (req, res) => {
  try {
    const { dashboardId, type, title, dataSource, configuration, position, size, style } = req.body;

    // Verify dashboard ownership
    const dashboard = await Dashboard.findOne({ _id: dashboardId, userId: req.user._id });
    if (!dashboard) return res.status(404).json({ message: 'Dashboard not found.' });

    const widget = await Widget.create({
      dashboardId,
      type: type || 'bar',
      title: title || 'New Widget',
      dataSource: dataSource || null,
      configuration: configuration || {},
      position: position || { x: 0, y: 0 },
      size: size || { w: 4, h: 3 },
      style: style || {},
    });

    // Update dashboard layout
    dashboard.layout.push({ i: widget._id.toString(), x: position?.x || 0, y: position?.y || 0, w: size?.w || 4, h: size?.h || 3 });
    await dashboard.save();

    const io = req.app.get('io');
    if (io) io.to(dashboardId).emit('widget-added', widget);

    res.status(201).json(widget);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/widgets/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const widget = await Widget.findById(req.params.id).populate('dataSource');
    if (!widget) return res.status(404).json({ message: 'Widget not found.' });
    res.json(widget);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/widgets/:id — update widget
router.put('/:id', protect, async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.dataSource === '') {
      updates.dataSource = null;
    }

    const widget = await Widget.findByIdAndUpdate(req.params.id, updates, { new: true }).populate('dataSource');
    if (!widget) return res.status(404).json({ message: 'Widget not found.' });

    const io = req.app.get('io');
    if (io) io.to(widget.dashboardId.toString()).emit('widget-updated', widget);

    res.json(widget);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/widgets/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const widget = await Widget.findByIdAndDelete(req.params.id);
    if (!widget) return res.status(404).json({ message: 'Widget not found.' });

    // Remove from dashboard layout
    await Dashboard.findByIdAndUpdate(widget.dashboardId, {
      $pull: { layout: { i: widget._id.toString() } },
    });

    const io = req.app.get('io');
    if (io) io.to(widget.dashboardId.toString()).emit('widget-deleted', { id: req.params.id });

    res.json({ message: 'Widget deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/widgets/dashboard/:dashboardId — all widgets for a dashboard
router.get('/dashboard/:dashboardId', protect, async (req, res) => {
  try {
    const widgets = await Widget.find({ dashboardId: req.params.dashboardId }).populate('dataSource');
    res.json(widgets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

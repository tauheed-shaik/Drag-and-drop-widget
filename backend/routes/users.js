const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Dashboard = require('../models/Dashboard');
const Widget = require('../models/Widget');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/users — admin: all users
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/stats — admin: usage stats
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDashboards = await Dashboard.countDocuments();
    const totalWidgets = await Widget.countDocuments();
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);

    res.json({ totalUsers, totalDashboards, totalWidgets, recentUsers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/:id — admin: update role
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/users/:id — admin: delete user
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Dashboard.deleteMany({ userId: req.params.id });
    res.json({ message: 'User and their dashboards deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

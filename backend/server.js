const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboards');
const widgetRoutes = require('./routes/widgets');
const datasourceRoutes = require('./routes/datasources');
const userRoutes = require('./routes/users');
const aiRoutes = require('./routes/ai');

app.use('/api/auth', authRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/widgets', widgetRoutes);
app.use('/api/datasources', datasourceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'InsightForge API is running', timestamp: new Date().toISOString() });
});

// Socket.IO — real-time dashboard updates
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('join-dashboard', (dashboardId) => {
    socket.join(dashboardId);
    console.log(`📊 Socket ${socket.id} joined dashboard: ${dashboardId}`);
  });

  socket.on('leave-dashboard', (dashboardId) => {
    socket.leave(dashboardId);
  });

  socket.on('widget-update', ({ dashboardId, widget }) => {
    socket.to(dashboardId).emit('widget-updated', widget);
  });

  socket.on('layout-update', ({ dashboardId, layout }) => {
    socket.to(dashboardId).emit('layout-updated', layout);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Make io accessible to routes
app.set('io', io);

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'insightforge',
    });
    console.log('✅ MongoDB Atlas connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 InsightForge server running on http://localhost:${PORT}`);
});

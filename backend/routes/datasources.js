const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const DataSource = require('../models/DataSource');
const { protect } = require('../middleware/auth');

// Multer for CSV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// GET /api/datasources — user's datasources
router.get('/', protect, async (req, res) => {
  try {
    const sources = await DataSource.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    res.json(sources);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/datasources/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const source = await DataSource.findOne({ _id: req.params.id, userId: req.user._id });
    if (!source) return res.status(404).json({ message: 'Data source not found.' });
    res.json(source);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/datasources — create datasource
router.post('/', protect, async (req, res) => {
  try {
    const { name, type, endpoint, method, headers, body, credentials, refreshInterval } = req.body;

    const source = await DataSource.create({
      userId: req.user._id,
      name,
      type,
      endpoint: endpoint || '',
      method: method || 'GET',
      headers: headers || {},
      body: body || {},
      credentials: credentials || {},
      refreshInterval: refreshInterval || 300,
    });
    res.status(201).json(source);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/datasources/:id — update datasource
router.put('/:id', protect, async (req, res) => {
  try {
    const source = await DataSource.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!source) return res.status(404).json({ message: 'Data source not found.' });
    res.json(source);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/datasources/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await DataSource.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: 'Data source deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/datasources/:id/fetch — fetch data from source
router.post('/:id/fetch', protect, async (req, res) => {
  try {
    const source = await DataSource.findOne({ _id: req.params.id, userId: req.user._id });
    if (!source) return res.status(404).json({ message: 'Data source not found.' });

    if (source.type === 'rest_api') {
      const headers = { ...source.headers };
      if (source.credentials?.apiKey) headers['Authorization'] = `Bearer ${source.credentials.apiKey}`;

      const response = await axios({
        method: source.method || 'GET',
        url: source.endpoint,
        headers,
        data: source.body,
        timeout: 15000,
      });

      source.cachedData = Array.isArray(response.data) ? response.data : [response.data];
      source.lastFetched = new Date();
      source.status = 'active';
      await source.save();

      return res.json({ data: source.cachedData });
    }

    if (source.type === 'static' && source.cachedData) {
      return res.json({ data: source.cachedData });
    }

    return res.json({ data: source.cachedData || [] });
  } catch (err) {
    const source = await DataSource.findOne({ _id: req.params.id });
    if (source) {
      source.status = 'error';
      source.errorMessage = err.message;
      await source.save();
    }
    res.status(500).json({ message: err.message });
  }
});

// POST /api/datasources/upload — CSV upload
router.post('/upload/csv', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const csvData = fs.readFileSync(req.file.path, 'utf8');
    const lines = csvData.split('\n').filter(Boolean);
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      return headers.reduce((obj, h, i) => {
        const val = values[i];
        obj[h] = isNaN(val) ? val : Number(val);
        return obj;
      }, {});
    });

    const source = await DataSource.create({
      userId: req.user._id,
      name: req.body.name || req.file.originalname,
      type: 'csv',
      endpoint: req.file.path,
      cachedData: data,
      lastFetched: new Date(),
      status: 'active',
    });

    res.status(201).json({ source, preview: data.slice(0, 5), totalRows: data.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/datasources/static — create from static JSON
router.post('/static/create', protect, async (req, res) => {
  try {
    const { name, data } = req.body;
    const source = await DataSource.create({
      userId: req.user._id,
      name: name || 'Static Data',
      type: 'static',
      cachedData: data,
      lastFetched: new Date(),
      status: 'active',
    });
    res.status(201).json(source);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

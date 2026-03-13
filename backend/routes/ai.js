const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { protect } = require('../middleware/auth');
const Dashboard = require('../models/Dashboard');
const Widget = require('../models/Widget');
const DataSource = require('../models/DataSource');

// ─── Multer ───────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only CSV and Excel files are allowed'));
  },
});

// ─── Parse file → JSON array (streaming-safe via XLSX) ───────────────────────
function parseFile(filePath) {
  const workbook = XLSX.readFile(filePath, { dense: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: null });
}

// ─── Detect column types ──────────────────────────────────────────────────────
function detectColumns(rows) {
  if (!rows || rows.length === 0) return [];
  const keys = Object.keys(rows[0]);
  return keys.map(key => {
    const samples = rows.slice(0, 50).map(r => r[key]).filter(v => v !== null && v !== undefined && String(v).trim() !== '');
    const numericCount = samples.filter(v => !isNaN(Number(String(v).replace(/[,$%\s]/g, ''))) && String(v).trim() !== '').length;
    const isDate = samples.length > 0 && samples.some(v => !isNaN(Date.parse(String(v))) && isNaN(Number(String(v))));
    return {
      name: key,
      type: isDate ? 'date' : numericCount > samples.length * 0.6 ? 'numeric' : 'categorical',
      sample: samples.slice(0, 3),
      nullCount: rows.filter(r => r[key] === null || r[key] === undefined || String(r[key]).trim() === '').length,
    };
  });
}

// ─── AI-powered data cleaning ─────────────────────────────────────────────────
function cleanDataset(rows, columns) {
  const numericCols = columns.filter(c => c.type === 'numeric').map(c => c.name);
  const report = [];
  let cleaned = [...rows];

  // 1. Remove completely empty rows
  const beforeEmpty = cleaned.length;
  cleaned = cleaned.filter(row =>
    Object.values(row).some(v => v !== null && v !== undefined && String(v).trim() !== '')
  );
  if (cleaned.length < beforeEmpty) report.push(`Removed ${beforeEmpty - cleaned.length} empty rows`);

  // 2. Remove duplicate rows
  const seen = new Set();
  const beforeDupe = cleaned.length;
  cleaned = cleaned.filter(row => {
    const key = JSON.stringify(Object.values(row));
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (cleaned.length < beforeDupe) report.push(`Removed ${beforeDupe - cleaned.length} duplicate rows`);

  // 3. Normalize numeric columns — strip currency/percent symbols, parse to number
  let numericFixed = 0;
  cleaned = cleaned.map(row => {
    const r = { ...row };
    numericCols.forEach(col => {
      const val = r[col];
      if (val !== null && val !== undefined) {
        const str = String(val).replace(/[,$%\s€£¥]/g, '').trim();
        const num = Number(str);
        if (!isNaN(num)) {
          if (r[col] !== num) numericFixed++;
          r[col] = num;
        }
      }
    });
    return r;
  });
  if (numericFixed > 0) report.push(`Normalized ${numericFixed} numeric values (stripped currency/percent symbols)`);

  // 4. Fill null numerics with column median
  numericCols.forEach(col => {
    const vals = cleaned.map(r => r[col]).filter(v => v !== null && v !== undefined && !isNaN(Number(v))).map(Number).sort((a, b) => a - b);
    if (vals.length === 0) return;
    const median = vals[Math.floor(vals.length / 2)];
    let filled = 0;
    cleaned = cleaned.map(row => {
      if (row[col] === null || row[col] === undefined || (typeof row[col] === 'string' && isNaN(Number(row[col])))) {
        filled++;
        return { ...row, [col]: median };
      }
      return row;
    });
    if (filled > 0) report.push(`Filled ${filled} missing values in "${col}" with median (${median})`);
  });

  // 5. Trim whitespace from string values
  let trimmed = 0;
  cleaned = cleaned.map(row => {
    const r = { ...row };
    Object.keys(r).forEach(key => {
      if (typeof r[key] === 'string') {
        const trimVal = r[key].trim();
        if (trimVal !== r[key]) { r[key] = trimVal; trimmed++; }
      }
    });
    return r;
  });
  if (trimmed > 0) report.push(`Trimmed whitespace from ${trimmed} string values`);

  return { cleaned, report };
}

// ─── Rule-based widget generator (AI fallback) ────────────────────────────────
function generateSmartWidgets(columns) {
  const numerics     = columns.filter(c => c.type === 'numeric');
  const categoricals = columns.filter(c => c.type === 'categorical');
  const dates        = columns.filter(c => c.type === 'date');
  const widgets = [];

  numerics.slice(0, 2).forEach(col => {
    widgets.push({ title: `Total ${col.name}`, type: 'kpi', xAxis: '', metrics: [col.name], w: 3, h: 3 });
  });

  if (categoricals.length > 0 && numerics.length > 0) {
    widgets.push({
      title: `${numerics[0].name} by ${categoricals[0].name}`,
      type: 'bar',
      xAxis: categoricals[0].name,
      metrics: numerics.slice(0, 2).map(c => c.name),
      w: 6, h: 4,
    });
  }

  if (dates.length > 0 && numerics.length > 0) {
    widgets.push({
      title: `${numerics[0].name} Over Time`,
      type: 'line',
      xAxis: dates[0].name,
      metrics: numerics.slice(0, 2).map(c => c.name),
      w: 6, h: 4,
    });
  } else if (categoricals.length > 0 && numerics.length > 1) {
    widgets.push({
      title: `${numerics[1].name} Trend`,
      type: 'area',
      xAxis: categoricals[0].name,
      metrics: [numerics[1].name],
      w: 6, h: 4,
    });
  }

  if (categoricals.length > 0 && numerics.length > 0) {
    widgets.push({
      title: `${numerics[0].name} Distribution`,
      type: 'pie',
      xAxis: categoricals[0].name,
      metrics: [numerics[0].name],
      w: 5, h: 4,
    });
  }

  widgets.push({ title: 'Full Dataset Table', type: 'table', xAxis: '', metrics: [], w: 12, h: 4 });
  return widgets.slice(0, 6);
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/ai/analyze
// Upload → parse → clean → store DataSource → Gemini suggestions → return ref
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/analyze', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    console.log(`📂 Parsing file: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);

    // 1. Parse full dataset from disk (never passed to browser)
    const rawRows   = parseFile(req.file.path);
    if (!rawRows || rawRows.length === 0) return res.status(400).json({ message: 'File is empty or could not be parsed.' });

    const totalRawRows = rawRows.length;
    console.log(`📊 Parsed ${totalRawRows} rows`);

    // 2. Detect columns on raw data
    const rawColumns = detectColumns(rawRows);

    // 3. Clean data server-side — never touch browser memory
    const { cleaned, report: cleaningReport } = cleanDataset(rawRows, rawColumns);
    const totalRows = cleaned.length;
    const columns   = detectColumns(cleaned); // re-detect after cleaning
    console.log(`🧹 Cleaned: ${totalRawRows - totalRows} rows removed. Ops: ${cleaningReport.length}`);

    // 4. Store the FULL cleaned dataset in MongoDB as a DataSource
    //    The browser never sees the raw data — it only gets back an ID.
    const source = await DataSource.create({
      userId:       req.user._id,
      name:         req.file.originalname,
      type:         'csv',
      endpoint:     req.file.path,
      cachedData:   cleaned,           // ← full dataset stored in DB
      lastFetched:  new Date(),
      status:       'active',
    });
    console.log(`💾 DataSource stored: ${source._id}`);

    // 5. Try Gemini AI for widget suggestions (schema + 10 sample rows only)
    let widgets = [];
    let aiUsed  = false;

    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI  = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model  = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const schemaText  = columns.map(c => `- "${c.name}" (${c.type}), nulls: ${c.nullCount}, sample: ${c.sample.join(', ')}`).join('\n');
        const sampleText  = JSON.stringify(cleaned.slice(0, 8), null, 2);

        const prompt = `You are a data analytics expert.\nDataset: ${totalRows} rows, ${columns.length} columns.\n\nColumns:\n${schemaText}\n\nSample rows:\n${sampleText}\n\nDesign up to 6 dashboard widgets (bar, line, area, pie, donut, scatter, kpi, table).\n\nReturn ONLY a JSON array, no markdown:\n[\n  {"title":"Name","type":"bar","xAxis":"col","metrics":["col2"],"w":6,"h":4}\n]\n\nRules:\n- xAxis and metrics must be exact column names\n- kpi: metrics=[one numeric], xAxis=""\n- pie/donut: xAxis=categorical, metrics=[one numeric]\n- table: metrics=[], xAxis=""\n- w: 3-12, h: 3-5\n- Diverse chart types please`;

        const result = await model.generateContent(prompt);
        const raw    = result.response.text().trim().replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();
        const match  = raw.match(/\[[\s\S]*\]/);
        if (match) {
          widgets = JSON.parse(match[0]);
          aiUsed  = true;
          console.log(`✅ Gemini generated ${widgets.length} widgets`);
        }
      } catch (aiErr) {
        console.warn('⚠ Gemini unavailable, rule-based fallback:', aiErr.message);
      }
    }

    if (widgets.length === 0) {
      widgets = generateSmartWidgets(columns);
    }

    // 6. Return only lightweight metadata — NO raw data to browser
    res.json({
      dataSourceId: source._id,          // ← reference only
      columns,
      totalRows,
      totalRawRows,
      preview:      cleaned.slice(0, 10), // 10 rows for UI preview only
      widgets,
      fileName:     req.file.originalname,
      cleaningReport,
      aiUsed,
    });

  } catch (err) {
    console.error('AI analyze error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/ai/create-dashboard
// Wire existing DataSource + widget configs → create dashboard + widgets
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/create-dashboard', protect, async (req, res) => {
  try {
    const { name, description, dataSourceId, widgetSuggestions } = req.body;

    if (!dataSourceId) return res.status(400).json({ message: 'dataSourceId is required.' });

    // Verify the datasource belongs to this user
    const source = await DataSource.findOne({ _id: dataSourceId, userId: req.user._id });
    if (!source) return res.status(404).json({ message: 'Data source not found.' });

    // Create Dashboard with empty layout first
    const dashboard = await Dashboard.create({
      userId:      req.user._id,
      name:        name || `${source.name} Dashboard`,
      description: description || `AI-generated dashboard from ${source.name}`,
      layout:      [],
    });

    // Create Widgets and build layout
    const createdWidgets = [];
    let gx = 0, gy = 0;

    for (let i = 0; i < widgetSuggestions.length; i++) {
      const ws = widgetSuggestions[i];
      const w  = Number(ws.w) || 6;
      const h  = Number(ws.h) || 4;
      if (gx + w > 12) { gx = 0; gy += h + 1; }

      const widget = await Widget.create({
        dashboardId:   dashboard._id,
        type:          ws.type || 'bar',
        title:         ws.title || `Widget ${i + 1}`,
        dataSource:    source._id,
        configuration: {
          xAxis:      ws.xAxis || '',
          metrics:    ws.metrics || [],
          showLegend: true,
          showGrid:   true,
        },
        position: { x: gx, y: gy },
        size:     { w, h },
      });

      dashboard.layout.push({ i: widget._id.toString(), x: gx, y: gy, w, h });
      createdWidgets.push(widget);
      gx += w;
    }

    await dashboard.save();
    console.log(`🎉 Dashboard created: ${dashboard._id} with ${createdWidgets.length} widgets`);

    res.status(201).json({ dashboard, widgets: createdWidgets, source });

  } catch (err) {
    console.error('Create dashboard error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

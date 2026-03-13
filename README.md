# InsightForge 📊

> **AI-powered drag-and-drop analytics dashboard builder** — upload any dataset and get a fully configured, interactive dashboard in seconds, powered by Google Gemini AI.

![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![React](https://img.shields.io/badge/react-18.3.1-61dafb)
![MongoDB](https://img.shields.io/badge/database-MongoDB%20Atlas-green)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Dashboard Generation** | Upload a CSV/Excel file → Gemini AI analyzes it and generates the best dashboard automatically |
| 🧹 **Auto Data Cleaning** | Detects and removes empty rows, duplicates, strips currency symbols, fills nulls with column median |
| 📊 **8 Chart Types** | Bar, Line, Area, Pie, Donut, Scatter, KPI Card, Data Table |
| 🖱️ **Drag & Drop Layout** | Freely resize and rearrange widgets using react-grid-layout |
| ⚙️ **Per-Widget Settings** | Column picker, aggregation (sum/avg/count/max/min), color controls, legend/grid toggles |
| 🔗 **Shareable Dashboards** | Generate a public share link (no login required for viewers) |
| 🔐 **JWT Authentication** | Register/Login with bcrypt-hashed passwords, token-protected routes |
| 👤 **Admin Panel** | User management, role assignment, usage statistics |
| ⚡ **Real-time Sync** | Socket.IO for live layout updates across sessions |
| 🛡️ **Rule-based Fallback** | Works without Gemini key — smart rule engine auto-suggests charts |

---

## 🗂️ Project Structure

```
Drag-and-drop-widget/
├── backend/                    # Express.js API server
│   ├── middleware/
│   │   └── auth.js             # JWT protect + adminOnly guards
│   ├── models/
│   │   ├── Dashboard.js        # Dashboard schema
│   │   ├── DataSource.js       # Dataset storage schema
│   │   ├── User.js             # User schema with roles
│   │   └── Widget.js           # Widget schema
│   ├── routes/
│   │   ├── ai.js               # AI analyze + create-dashboard
│   │   ├── auth.js             # Register / Login / Profile
│   │   ├── dashboards.js       # Dashboard CRUD + share + layout
│   │   ├── datasources.js      # DataSource CRUD + fetch + upload
│   │   ├── users.js            # Admin user management
│   │   └── widgets.js          # Widget CRUD
│   ├── uploads/                # Temp storage for uploaded files
│   ├── .env                    # Environment variables
│   ├── server.js               # Express + Socket.IO entry point
│   └── package.json
│
├── frontend/                   # React + Vite SPA
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js        # Axios instance with auth headers
│   │   ├── components/
│   │   │   ├── widgets/
│   │   │   │   ├── ChartWidget.jsx         # Bar/Line/Area/Pie/Donut/Scatter
│   │   │   │   ├── KpiWidget.jsx           # KPI card with live aggregation
│   │   │   │   ├── TableWidget.jsx         # Dynamic data table
│   │   │   │   ├── WidgetContainer.jsx     # Drag wrapper + settings toggle
│   │   │   │   ├── WidgetLibraryPanel.jsx  # Add-widget sidebar
│   │   │   │   └── WidgetSettingsPanel.jsx # Per-widget config panel
│   │   │   ├── AppLayout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── pages/
│   │   │   ├── AdminPanel.jsx          # User management (admin only)
│   │   │   ├── DashboardBuilderPage.jsx # Main dashboard editor
│   │   │   ├── DashboardListPage.jsx   # Dashboard list + AI wizard
│   │   │   ├── DataSourceManager.jsx   # Data source management
│   │   │   ├── LoginPage.jsx
│   │   │   └── UserSettings.jsx
│   │   ├── store/
│   │   │   ├── authStore.js        # Zustand auth state
│   │   │   └── dashboardStore.js   # Zustand dashboard/widget state
│   │   └── utils/
│   │       └── mockData.js         # WIDGET_TYPES, CHART_COLORS constants
│   └── package.json
│
├── test-api.js                 # API test suite (45 tests, Node.js only)
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 18.0.0 |
| npm | ≥ 9.0.0 |
| MongoDB Atlas | Free tier works |
| Google Gemini API Key | Free at [aistudio.google.com](https://aistudio.google.com/app/apikey) |

---

### 1 — Clone the repository

```bash
git clone https://github.com/tauheed-shaik/Drag-and-drop-widget.git
cd Drag-and-drop-widget
```

---

### 2 — Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=development
GEMINI_API_KEY=AIzaSy...your_gemini_key...
```

> 💡 If `GEMINI_API_KEY` is missing, the system automatically falls back to the built-in rule-based widget generator — dashboards still work.

Start backend:

```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

Server runs on: `http://localhost:5000`

---

### 3 — Frontend setup

```bash
cd frontend
npm install
npm run dev
```

App runs on: `http://localhost:5173`

---

### 4 — Run API tests

```bash
# From project root (backend must be running on :5000)
node test-api.js
```

Expected output: **45/45 tests pass ✅**

---

## 📦 Dependencies

### Backend

| Package | Version | Purpose |
|---|---|---|
| `express` | ^4.21.2 | HTTP server framework |
| `mongoose` | ^8.0.0 | MongoDB ODM |
| `dotenv` | ^16.4.7 | Environment variable loader |
| `cors` | ^2.8.5 | Cross-origin resource sharing |
| `bcryptjs` | ^2.4.3 | Password hashing |
| `jsonwebtoken` | ^9.0.2 | JWT creation and verification |
| `socket.io` | ^4.8.1 | Real-time WebSocket communication |
| `multer` | ^1.4.5-lts.1 | Multipart file upload handling |
| `xlsx` | ^0.18.5 | CSV and Excel file parsing |
| `axios` | ^1.7.9 | HTTP client for external API calls |
| `@google/generative-ai` | ^0.24.1 | Google Gemini AI SDK |
| **`nodemon`** _(dev)_ | ^3.1.14 | Auto-restart on file changes |

### Frontend

| Package | Version | Purpose |
|---|---|---|
| `react` | ^18.3.1 | UI framework |
| `react-dom` | ^18.3.1 | React DOM renderer |
| `react-router-dom` | ^6.28.1 | Client-side routing |
| `axios` | ^1.7.9 | HTTP client for API calls |
| `zustand` | ^5.0.3 | Lightweight global state management |
| `recharts` | ^2.15.4 | Chart components (bar, line, pie, etc.) |
| `react-grid-layout` | ^1.5.0 | Drag-and-drop resizable grid |
| `react-dnd` | ^16.0.1 | Drag-and-drop primitives |
| `react-dnd-html5-backend` | ^16.0.1 | HTML5 DnD backend for react-dnd |
| `framer-motion` | ^11.18.2 | Animations and transitions |
| `react-hot-toast` | ^2.4.1 | Toast notifications |
| `react-icons` | ^5.5.0 | Icon library (Remix Icons used) |
| `socket.io-client` | ^4.8.1 | WebSocket client |
| `date-fns` | ^3.6.0 | Date formatting utilities |
| **`vite`** _(dev)_ | ^6.2.2 | Build tool and dev server |
| **`@vitejs/plugin-react`** _(dev)_ | ^4.3.4 | Vite React plugin |
| **`tailwindcss`** _(dev)_ | ^3.4.17 | Utility-first CSS framework |
| **`autoprefixer`** _(dev)_ | ^10.4.20 | CSS vendor prefix automation |
| **`postcss`** _(dev)_ | ^8.4.49 | CSS processing pipeline |

---

## 🔌 API Reference

**Base URL:** `http://localhost:5000/api`  
**Auth:** All protected routes require `Authorization: Bearer <token>` header  
**Admin routes:** Also require the authenticated user to have `role: "admin"`

---

### 🔐 Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | ❌ | Create account `{ name, email, password }` |
| `POST` | `/auth/login` | ❌ | Login `{ email, password }` → returns `{ token, user }` |
| `GET` | `/auth/me` | ✅ | Get current user profile |
| `PUT` | `/auth/me` | ✅ | Update profile `{ name, email, password? }` |

---

### 📊 Dashboards

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/dashboards` | ✅ | List all dashboards for current user |
| `POST` | `/dashboards` | ✅ | Create dashboard `{ name, description }` |
| `GET` | `/dashboards/:id` | ✅ | Get dashboard + widgets by ID |
| `PUT` | `/dashboards/:id` | ✅ | Update dashboard metadata |
| `DELETE` | `/dashboards/:id` | ✅ | Delete dashboard + cascade delete widgets |
| `PUT` | `/dashboards/:id/layout` | ✅ | Save grid layout `{ layout: [...] }` |
| `POST` | `/dashboards/:id/share` | ✅ | Generate public share token |
| `GET` | `/dashboards/shared/:token` | ❌ | View shared dashboard publicly |

---

### 🧩 Widgets

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/widgets/dashboard/:dashboardId` | ✅ | Get all widgets for a dashboard |
| `POST` | `/widgets` | ✅ | Create widget `{ dashboardId, type, title, configuration, position, size }` |
| `GET` | `/widgets/:id` | ✅ | Get single widget |
| `PUT` | `/widgets/:id` | ✅ | Update widget (title, type, config, dataSource, size) |
| `DELETE` | `/widgets/:id` | ✅ | Delete widget |

**Widget `type` values:** `bar` `line` `area` `pie` `donut` `scatter` `kpi` `table`

**Widget `configuration` fields:**
```json
{
  "xAxis": "month",
  "metrics": ["revenue", "profit"],
  "yAxis": "sales",
  "zAxis": "quantity",
  "aggregation": "sum",
  "showLegend": true,
  "showGrid": true,
  "colors": ["#6366F1", "#06B6D4"]
}
```

---

### 🗄️ Data Sources

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/datasources` | ✅ | List all data sources |
| `GET` | `/datasources/:id` | ✅ | Get data source with cached data |
| `POST` | `/datasources` | ✅ | Create REST API source `{ name, type, endpoint, method }` |
| `PUT` | `/datasources/:id` | ✅ | Update data source config |
| `DELETE` | `/datasources/:id` | ✅ | Delete data source |
| `POST` | `/datasources/:id/fetch` | ✅ | Trigger manual fetch from REST endpoint |
| `POST` | `/datasources/static/create` | ✅ | Create static JSON source `{ name, data: [...] }` |
| `POST` | `/datasources/upload/csv` | ✅ | Upload CSV file (multipart) |

---

### 🤖 AI (Gemini-powered)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/ai/analyze` | ✅ | Upload CSV/Excel → clean data → store in DB → return AI widget suggestions |
| `POST` | `/ai/create-dashboard` | ✅ | Create full dashboard from suggestions `{ name, dataSourceId, widgetSuggestions }` |

**`/ai/analyze` — multipart form upload:**
```
Content-Type: multipart/form-data
Field: file  (CSV, XLS, or XLSX — max 50MB)
```

**Response:**
```json
{
  "dataSourceId": "abc123",
  "columns": [{ "name": "revenue", "type": "numeric", "sample": [1234, 5678] }],
  "totalRows": 1500,
  "totalRawRows": 1523,
  "preview": [...],
  "widgets": [{ "title": "Revenue by Region", "type": "bar", "xAxis": "region", "metrics": ["revenue"], "w": 6, "h": 4 }],
  "cleaningReport": ["Removed 23 empty rows", "Normalized 340 numeric values"],
  "aiUsed": true
}
```

**`/ai/create-dashboard`:**
```json
{
  "name": "Sales Dashboard",
  "dataSourceId": "abc123",
  "widgetSuggestions": [
    { "title": "Revenue by Region", "type": "bar", "xAxis": "region", "metrics": ["revenue"], "w": 6, "h": 4 }
  ]
}
```

---

### 👥 Users (Admin only)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/users` | ✅ Admin | List all users |
| `GET` | `/users/stats` | ✅ Admin | Platform usage statistics |
| `PUT` | `/users/:id/role` | ✅ Admin | Update user role |
| `DELETE` | `/users/:id` | ✅ Admin | Delete user |

---

## 🧪 API Test Results

Run `node test-api.js` from the project root:

```
══════════════════════════════════════════════════
  InsightForge API Test Suite
══════════════════════════════════════════════════
  Base URL: http://localhost:5000/api

── HEALTH ─────────────────────────────────────────
  ✓ [PASS] GET /api/health — server is up

── AUTH ────────────────────────────────────────────
  ✓ [PASS] POST /auth/register — create user
  ✓ [PASS] POST /auth/register — returns token
  ✓ [PASS] POST /auth/register — rejects duplicate email
  ✓ [PASS] POST /auth/register — rejects missing fields
  ✓ [PASS] POST /auth/login — valid credentials
  ✓ [PASS] POST /auth/login — returns token
  ✓ [PASS] POST /auth/login — rejects wrong password
  ✓ [PASS] GET /auth/me — returns current user
  ✓ [PASS] GET /auth/me — rejects unauthenticated
  ✓ [PASS] PUT /auth/me — updates profile

── DASHBOARDS ──────────────────────────────────────
  ✓ [PASS] GET /dashboards — returns array
  ✓ [PASS] POST /dashboards — creates dashboard
  ✓ [PASS] POST /dashboards — returns _id
  ✓ [PASS] POST /dashboards — defaults name if empty
  ✓ [PASS] GET /dashboards/:id — fetches dashboard
  ✓ [PASS] GET /dashboards/:id — includes widgets array
  ✓ [PASS] GET /dashboards/:id — 404 for missing id
  ✓ [PASS] PUT /dashboards/:id — updates dashboard
  ✓ [PASS] PUT /dashboards/:id/layout — saves layout
  ✓ [PASS] POST /dashboards/:id/share — generates share token

── WIDGETS ─────────────────────────────────────────
  ✓ [PASS] POST /widgets — creates widget
  ✓ [PASS] POST /widgets — returns _id
  ✓ [PASS] POST /widgets — 404 for invalid dashboardId
  ✓ [PASS] GET /widgets/:id — fetches widget
  ✓ [PASS] GET /widgets/dashboard/:id — list for dashboard
  ✓ [PASS] PUT /widgets/:id — updates widget
  ✓ [PASS] PUT /widgets/:id — type changed
  ✓ [PASS] PUT /widgets/:id — coerces empty dataSource to null

── DATASOURCES ─────────────────────────────────────
  ✓ [PASS] GET /datasources — returns array
  ✓ [PASS] POST /datasources/static/create — creates static source
  ✓ [PASS] POST /datasources/static/create — stores cachedData
  ✓ [PASS] POST /datasources — create REST API source
  ✓ [PASS] POST /datasources/:id/fetch — fetches REST data
  ✓ [PASS] GET /datasources/:id — fetches datasource
  ✓ [PASS] GET /datasources/:id — cachedData present
  ✓ [PASS] PUT /datasources/:id — updates name
  ✓ [PASS] PUT /widgets/:id — wires datasource to widget

── USERS (Admin) ───────────────────────────────────
  ✓ [PASS] GET /users — requires admin role
  ✓ [PASS] GET /users/stats — requires admin role

── CLEANUP ─────────────────────────────────────────
  ✓ [PASS] DELETE /widgets/:id — deletes widget
  ✓ [PASS] GET /widgets/:id — 404 after delete
  ✓ [PASS] DELETE /datasources/:id — deletes datasource
  ✓ [PASS] DELETE /dashboards/:id — deletes dashboard
  ✓ [PASS] GET /dashboards/:id — 404 after delete

  Total:  45  |  Passed: 45  |  Failed: 0
  [████████████████████] 100%

  ✅ All tests passed!
```

---

## 🤖 AI Data Cleaning Pipeline

When you upload a file, the following operations run automatically server-side **before** the data is stored:

| Step | Operation |
|---|---|
| 1️⃣ | Remove completely empty rows |
| 2️⃣ | Remove exact duplicate rows |
| 3️⃣ | Strip currency/percent symbols (`$`, `€`, `£`, `%`, `,`) and parse to numbers |
| 4️⃣ | Fill missing numeric values with the column **median** |
| 5️⃣ | Trim leading/trailing whitespace from all strings |

The cleaning report is shown in the dashboard creation wizard after upload.

---

## 🧩 Widget Configuration Guide

### KPI Card
```json
{ "metrics": ["revenue"], "aggregation": "sum" }
```
Aggregation options: `sum` | `avg` | `count` | `max` | `min`

### Bar / Line / Area
```json
{ "xAxis": "month", "metrics": ["revenue", "profit"], "showLegend": true, "showGrid": true }
```

### Pie / Donut
```json
{ "xAxis": "region", "metrics": ["sales"], "colors": ["#6366F1", "#06B6D4"] }
```

### Scatter Plot
```json
{ "xAxis": "price", "yAxis": "quantity", "zAxis": "discount" }
```

### Data Table
```json
{ "metrics": [] }
```
`metrics: []` shows all columns. Add column names to `metrics` to **hide** them.

---

## 🔐 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | ✅ | Backend server port (default: 5000) |
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Secret key for JWT signing (min 32 chars) |
| `NODE_ENV` | ✅ | `development` or `production` |
| `GEMINI_API_KEY` | ⚡ Optional | Google Gemini AI key — falls back to rule-based if absent |

---

## 📝 Available Scripts

### Backend
```bash
npm run dev     # Start with nodemon (auto-restart)
npm start       # Start production server
```

### Frontend
```bash
npm run dev     # Start Vite dev server (HMR enabled)
npm run build   # Build for production
npm run preview # Preview production build locally
```

### Root
```bash
node test-api.js   # Run full API test suite (45 tests)
```

---

## 🔄 How Dashboard Creation Works

```
User uploads CSV/Excel
        │
        ▼
Backend parses file (xlsx)          ← Never sent to browser
        │
        ▼
Auto data cleaning pipeline
  • Remove empty/duplicate rows
  • Normalize numeric values
  • Fill nulls with median
        │
        ▼
Full cleaned dataset stored in MongoDB as DataSource
        │
        ▼
Gemini AI analyzes schema + 8 sample rows
  → Suggests up to 6 optimal widgets
  (Falls back to rule-based engine if AI unavailable)
        │
        ▼
Browser receives ONLY:
  • dataSourceId (reference)
  • Column names + types
  • 10-row preview
  • Widget suggestions
  • Cleaning report
        │
        ▼
User reviews/edits suggestions in wizard
        │
        ▼
POST /ai/create-dashboard  ← Only IDs + widget configs (no raw data)
        │
        ▼
Dashboard + Widgets created and linked to DataSource
```

---

## 📜 License

MIT © 2026 InsightForge

---

<div align="center">
  Built with ❤️ using React, Express, MongoDB & Google Gemini AI
</div>

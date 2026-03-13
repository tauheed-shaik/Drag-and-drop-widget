/**
 * InsightForge API Test Suite
 * Runs end-to-end tests against all backend endpoints.
 * Usage: node test-api.js
 */

const https = require('https');
const http = require('http');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:5000/api';

// ─── Colour helpers ───────────────────────────────────────────────────────────
const c = {
  green:  (s) => `\x1b[32m${s}\x1b[0m`,
  red:    (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan:   (s) => `\x1b[36m${s}\x1b[0m`,
  bold:   (s) => `\x1b[1m${s}\x1b[0m`,
  dim:    (s) => `\x1b[2m${s}\x1b[0m`,
};

// ─── Stats ────────────────────────────────────────────────────────────────────
const results = { pass: 0, fail: 0, skip: 0, tests: [] };

function log(status, name, detail = '') {
  const icon  = status === 'PASS' ? c.green('✓') : status === 'FAIL' ? c.red('✗') : c.yellow('⚠');
  const label = status === 'PASS' ? c.green('PASS') : status === 'FAIL' ? c.red('FAIL') : c.yellow('SKIP');
  console.log(`  ${icon} [${label}] ${name}${detail ? c.dim(' — ' + detail) : ''}`);
  results[status.toLowerCase()]++;
  results.tests.push({ status, name, detail });
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────
function request(method, path, { body, token, formData } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const isJson = body && !formData;
    const postData = isJson ? JSON.stringify(body) : null;

    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(isJson ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) } : {}),
    };

    const opts = {
      hostname: url.hostname,
      port:     url.port || 80,
      path:     url.pathname + url.search,
      method,
      headers,
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// ─── Assert ───────────────────────────────────────────────────────────────────
function assert(name, condition, detail = '') {
  if (condition) log('PASS', name, detail);
  else           log('FAIL', name, detail);
  return condition;
}

// ─── TEST RUNNER ──────────────────────────────────────────────────────────────
async function run() {
  console.log('\n' + c.bold(c.cyan('══════════════════════════════════════════════════')));
  console.log(c.bold(c.cyan('  InsightForge API Test Suite')));
  console.log(c.bold(c.cyan('══════════════════════════════════════════════════')));
  console.log(c.dim(`  Base URL: ${BASE}`));
  console.log(c.dim(`  Time:     ${new Date().toLocaleTimeString()}\n`));

  let token, userId, dashboardId, widgetId, datasourceId;
  const testEmail = `test_${Date.now()}@insightforge.test`;
  const testPass  = 'TestPass123!';

  // ════════════════════════════════════════════════════════════════════
  console.log(c.bold('\n── HEALTH ─────────────────────────────────────────'));
  // ════════════════════════════════════════════════════════════════════

  try {
    const r = await request('GET', '/health');
    assert('GET /api/health — server is up', r.status === 200, r.body?.status);
  } catch (e) {
    log('FAIL', 'GET /api/health — server is up', e.message);
    console.log(c.red('\n  ❌ Cannot reach backend on port 5000. Aborting.\n'));
    process.exit(1);
  }

  // ════════════════════════════════════════════════════════════════════
  console.log(c.bold('\n── AUTH ────────────────────────────────────────────'));
  // ════════════════════════════════════════════════════════════════════

  // Register
  {
    const r = await request('POST', '/auth/register', { body: { name: 'Test User', email: testEmail, password: testPass } });
    const ok = assert('POST /auth/register — create user', r.status === 201, `status ${r.status}`);
    if (ok) { token = r.body.token; userId = r.body.user._id; }
    assert('POST /auth/register — returns token', !!token, token ? 'token present' : 'NO TOKEN');
  }

  // Register duplicate
  {
    const r = await request('POST', '/auth/register', { body: { name: 'Dup', email: testEmail, password: testPass } });
    assert('POST /auth/register — rejects duplicate email', r.status === 409, `status ${r.status}`);
  }

  // Register missing fields
  {
    const r = await request('POST', '/auth/register', { body: { email: testEmail } });
    assert('POST /auth/register — rejects missing fields', r.status === 400, `status ${r.status}`);
  }

  // Login success
  {
    const r = await request('POST', '/auth/login', { body: { email: testEmail, password: testPass } });
    assert('POST /auth/login — valid credentials', r.status === 200, `status ${r.status}`);
    assert('POST /auth/login — returns token', !!r.body.token, r.body.token ? 'present' : 'missing');
    if (r.body.token) token = r.body.token; // refresh token
  }

  // Login wrong password
  {
    const r = await request('POST', '/auth/login', { body: { email: testEmail, password: 'wrongpass' } });
    assert('POST /auth/login — rejects wrong password', r.status === 401, `status ${r.status}`);
  }

  // GET /me
  {
    const r = await request('GET', '/auth/me', { token });
    assert('GET /auth/me — returns current user', r.status === 200 && !!r.body.user, `email: ${r.body?.user?.email}`);
  }

  // GET /me without token
  {
    const r = await request('GET', '/auth/me');
    assert('GET /auth/me — rejects unauthenticated', r.status === 401, `status ${r.status}`);
  }

  // PUT /me
  {
    const r = await request('PUT', '/auth/me', { token, body: { name: 'Updated Name' } });
    assert('PUT /auth/me — updates profile', r.status === 200 && r.body?.user?.name === 'Updated Name', r.body?.user?.name);
  }

  // ════════════════════════════════════════════════════════════════════
  console.log(c.bold('\n── DASHBOARDS ──────────────────────────────────────'));
  // ════════════════════════════════════════════════════════════════════

  // GET all (empty)
  {
    const r = await request('GET', '/dashboards', { token });
    assert('GET /dashboards — returns array', r.status === 200 && Array.isArray(r.body), `count: ${r.body?.length}`);
  }

  // POST create
  {
    const r = await request('POST', '/dashboards', { token, body: { name: 'API Test Dashboard', description: 'Created by test suite' } });
    const ok = assert('POST /dashboards — creates dashboard', r.status === 201, `status ${r.status}`);
    if (ok) dashboardId = r.body._id;
    assert('POST /dashboards — returns _id', !!dashboardId, dashboardId || 'missing');
  }

  // POST create minimal (no name)
  {
    const r = await request('POST', '/dashboards', { token, body: {} });
    assert('POST /dashboards — defaults name if empty', r.status === 201 && r.body.name === 'Untitled Dashboard', r.body.name);
    // cleanup
    if (r.body._id) await request('DELETE', `/dashboards/${r.body._id}`, { token });
  }

  // GET by id
  {
    const r = await request('GET', `/dashboards/${dashboardId}`, { token });
    assert('GET /dashboards/:id — fetches dashboard', r.status === 200, r.body?.dashboard?.name);
    assert('GET /dashboards/:id — includes widgets array', Array.isArray(r.body?.widgets), `widgets: ${r.body?.widgets?.length}`);
  }

  // GET non-existent
  {
    const r = await request('GET', '/dashboards/000000000000000000000000', { token });
    assert('GET /dashboards/:id — 404 for missing id', r.status === 404, `status ${r.status}`);
  }

  // PUT update
  {
    const r = await request('PUT', `/dashboards/${dashboardId}`, { token, body: { name: 'Renamed Dashboard' } });
    assert('PUT /dashboards/:id — updates dashboard', r.status === 200 && r.body.name === 'Renamed Dashboard', r.body.name);
  }

  // PUT layout
  {
    const layout = [{ i: 'fake-widget', x: 0, y: 0, w: 4, h: 3 }];
    const r = await request('PUT', `/dashboards/${dashboardId}/layout`, { token, body: { layout } });
    assert('PUT /dashboards/:id/layout — saves layout', r.status === 200, `status ${r.status}`);
  }

  // POST share
  {
    const r = await request('POST', `/dashboards/${dashboardId}/share`, { token });
    assert('POST /dashboards/:id/share — generates share token', r.status === 200 && !!r.body.shareToken, r.body.shareToken || 'missing');
  }

  // ════════════════════════════════════════════════════════════════════
  console.log(c.bold('\n── WIDGETS ─────────────────────────────────────────'));
  // ════════════════════════════════════════════════════════════════════

  // POST create widget
  {
    const r = await request('POST', '/widgets', { token, body: {
      dashboardId,
      type: 'bar',
      title: 'Test Widget',
      configuration: { xAxis: 'month', metrics: ['revenue', 'profit'] },
      position: { x: 0, y: 0 },
      size: { w: 6, h: 4 },
    }});
    const ok = assert('POST /widgets — creates widget', r.status === 201, `status ${r.status}`);
    if (ok) widgetId = r.body._id;
    assert('POST /widgets — returns _id', !!widgetId, widgetId || 'missing');
  }

  // POST widget with invalid dashboard
  {
    const r = await request('POST', '/widgets', { token, body: { dashboardId: '000000000000000000000000', type: 'bar', title: 'Bad' } });
    assert('POST /widgets — 404 for invalid dashboardId', r.status === 404, `status ${r.status}`);
  }

  // GET by id
  {
    const r = await request('GET', `/widgets/${widgetId}`, { token });
    assert('GET /widgets/:id — fetches widget', r.status === 200 && r.body._id === widgetId, r.body?.title);
  }

  // GET by dashboard
  {
    const r = await request('GET', `/widgets/dashboard/${dashboardId}`, { token });
    assert('GET /widgets/dashboard/:id — list for dashboard', r.status === 200 && Array.isArray(r.body), `count: ${r.body?.length}`);
  }

  // PUT update widget
  {
    const r = await request('PUT', `/widgets/${widgetId}`, { token, body: {
      title: 'Updated Widget',
      type: 'line',
      configuration: { xAxis: 'date', metrics: ['users'] },
    }});
    assert('PUT /widgets/:id — updates widget', r.status === 200 && r.body.title === 'Updated Widget', r.body.title);
    assert('PUT /widgets/:id — type changed', r.body.type === 'line', r.body.type);
  }

  // PUT widget with empty dataSource should null it
  {
    const r = await request('PUT', `/widgets/${widgetId}`, { token, body: { dataSource: '' } });
    assert('PUT /widgets/:id — coerces empty dataSource to null', r.status === 200 && r.body.dataSource === null, String(r.body.dataSource));
  }

  // ════════════════════════════════════════════════════════════════════
  console.log(c.bold('\n── DATASOURCES ─────────────────────────────────────'));
  // ════════════════════════════════════════════════════════════════════

  // GET all (empty initially)
  {
    const r = await request('GET', '/datasources', { token });
    assert('GET /datasources — returns array', r.status === 200 && Array.isArray(r.body), `count: ${r.body?.length}`);
  }

  // POST static datasource
  {
    const r = await request('POST', '/datasources/static/create', { token, body: {
      name: 'Monthly Sales',
      data: [
        { month: 'Jan', revenue: 45000, profit: 12000 },
        { month: 'Feb', revenue: 52000, profit: 15000 },
        { month: 'Mar', revenue: 61000, profit: 18000 },
      ]
    }});
    const ok = assert('POST /datasources/static/create — creates static source', r.status === 201, `status ${r.status}`);
    if (ok) datasourceId = r.body._id;
    assert('POST /datasources/static/create — stores cachedData', Array.isArray(r.body?.cachedData), `rows: ${r.body?.cachedData?.length}`);
  }

  // POST REST API datasource
  {
    const r = await request('POST', '/datasources', { token, body: {
      name: 'JSONPlaceholder Posts',
      type: 'rest_api',
      endpoint: 'https://jsonplaceholder.typicode.com/posts',
      method: 'GET',
    }});
    assert('POST /datasources — create REST API source', r.status === 201, `status ${r.status}`);
    if (r.body._id) {
      // POST fetch
      const fr = await request('POST', `/datasources/${r.body._id}/fetch`, { token });
      assert('POST /datasources/:id/fetch — fetches REST data', fr.status === 200 && Array.isArray(fr.body?.data), `rows: ${fr.body?.data?.length}`);
      await request('DELETE', `/datasources/${r.body._id}`, { token });
    }
  }

  // GET by id
  {
    const r = await request('GET', `/datasources/${datasourceId}`, { token });
    assert('GET /datasources/:id — fetches datasource', r.status === 200, r.body?.name);
    assert('GET /datasources/:id — cachedData present', Array.isArray(r.body?.cachedData), `rows: ${r.body?.cachedData?.length}`);
  }

  // PUT update datasource
  {
    const r = await request('PUT', `/datasources/${datasourceId}`, { token, body: { name: 'Monthly Sales Updated' } });
    assert('PUT /datasources/:id — updates name', r.status === 200 && r.body.name === 'Monthly Sales Updated', r.body.name);
  }

  // Wire datasource to widget
  {
    const r = await request('PUT', `/widgets/${widgetId}`, { token, body: {
      dataSource: datasourceId,
      configuration: { xAxis: 'month', metrics: ['revenue', 'profit'] },
    }});
    assert('PUT /widgets/:id — wires datasource to widget', r.status === 200 && r.body.dataSource !== null, `dataSource: ${r.body.dataSource}`);
  }

  // ════════════════════════════════════════════════════════════════════
  console.log(c.bold('\n── USERS (Admin) ───────────────────────────────────'));
  // ════════════════════════════════════════════════════════════════════

  // GET users — should 403 for non-admin
  {
    const r = await request('GET', '/users', { token });
    assert('GET /users — requires admin role', r.status === 403, `status ${r.status}`);
  }

  // GET /users/stats — should 403 for non-admin
  {
    const r = await request('GET', '/users/stats', { token });
    assert('GET /users/stats — requires admin role', r.status === 403, `status ${r.status}`);
  }

  // ════════════════════════════════════════════════════════════════════
  console.log(c.bold('\n── CLEANUP ─────────────────────────────────────────'));
  // ════════════════════════════════════════════════════════════════════

  // DELETE widget
  {
    const r = await request('DELETE', `/widgets/${widgetId}`, { token });
    assert('DELETE /widgets/:id — deletes widget', r.status === 200, r.body.message);
  }

  // Verify widget gone
  {
    const r = await request('GET', `/widgets/${widgetId}`, { token });
    assert('GET /widgets/:id — 404 after delete', r.status === 404, `status ${r.status}`);
  }

  // DELETE datasource
  {
    const r = await request('DELETE', `/datasources/${datasourceId}`, { token });
    assert('DELETE /datasources/:id — deletes datasource', r.status === 200, r.body.message);
  }

  // DELETE dashboard (cascades widgets)
  {
    const r = await request('DELETE', `/dashboards/${dashboardId}`, { token });
    assert('DELETE /dashboards/:id — deletes dashboard', r.status === 200, r.body.message);
  }

  // Verify dashboard gone
  {
    const r = await request('GET', `/dashboards/${dashboardId}`, { token });
    assert('GET /dashboards/:id — 404 after delete', r.status === 404, `status ${r.status}`);
  }

  // ════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ════════════════════════════════════════════════════════════════════
  const total = results.pass + results.fail + results.skip;
  console.log('\n' + c.bold(c.cyan('══════════════════════════════════════════════════')));
  console.log(c.bold('  RESULTS'));
  console.log(c.bold(c.cyan('══════════════════════════════════════════════════')));
  console.log(`  Total:  ${total}`);
  console.log(`  ${c.green('Passed:')} ${results.pass}`);
  console.log(`  ${c.red('Failed:')} ${results.fail}`);
  if (results.skip > 0) console.log(`  ${c.yellow('Skipped:')} ${results.skip}`);

  if (results.fail > 0) {
    console.log(c.bold(c.red('\n  Failed tests:')));
    results.tests.filter(t => t.status === 'FAIL').forEach(t => {
      console.log(c.red(`  ✗ ${t.name}`) + c.dim(` — ${t.detail}`));
    });
  }

  const pct = Math.round((results.pass / total) * 100);
  const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
  console.log(`\n  [${pct >= 80 ? c.green(bar) : c.red(bar)}] ${pct}%`);
  console.log(pct === 100 ? c.bold(c.green('\n  ✅ All tests passed!\n')) :
              pct >= 80   ? c.yellow('\n  ⚠ Some tests failed — see above.\n') :
                            c.red('\n  ❌ Multiple failures detected.\n'));
}

run().catch(err => {
  console.error(c.red('\nFatal error: ' + err.message));
  process.exit(1);
});

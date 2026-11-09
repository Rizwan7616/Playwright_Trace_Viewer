// Zero dependency demo backend + static host for the TaskBoard app.
// Intentionally simple: in memory data, fixed demo token. NOT production auth.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || '127.0.0.1';
const PUBLIC_DIR = path.join(__dirname, 'public');
const TOKEN = 'demo-access-token';

const users = [{ id: 1, email: 'qa@example.com', password: 'Password123!', name: 'QA Engineer' }];
let tasks = [
  { id: 1, title: 'Review regression suite', completed: false },
  { id: 2, title: 'Validate API contract', completed: true }
];
let nextId = 3;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function send(res, status, body) {
  if (body === undefined) {
    res.writeHead(status);
    return res.end();
  }
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(payload) });
  return res.end(payload);
}

function readJson(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) req.destroy();
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        const parsed = JSON.parse(raw);
        // Only JSON objects are valid request bodies for this API.
        resolve(parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null);
      } catch { resolve(null); }
    });
  });
}

function serveStatic(req, res, pathname) {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, requested));
  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) return send(res, 403, { error: 'Forbidden' });
  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, { error: 'Not found' });
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    return res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (!pathname.startsWith('/api/')) return serveStatic(req, res, pathname);

  if (req.method === 'GET' && pathname === '/api/health') {
    return send(res, 200, { status: 'UP', service: 'taskboard-demo' });
  }

  if (req.method === 'POST' && pathname === '/api/auth/login') {
    const body = await readJson(req);
    if (body === null) return send(res, 400, { error: 'Invalid JSON' });
    const user = users.find((u) => u.email === body.email && u.password === body.password);
    if (!user) return send(res, 401, { error: 'Invalid email or password' });
    return send(res, 200, { accessToken: TOKEN, user: { id: user.id, name: user.name, email: user.email } });
  }

  // Everything below requires authentication.
  if (req.headers.authorization !== `Bearer ${TOKEN}`) return send(res, 401, { error: 'Unauthorized' });

  if (req.method === 'GET' && pathname === '/api/me') {
    const { password: _omit, ...user } = users[0];
    return send(res, 200, user);
  }

  if (req.method === 'GET' && pathname === '/api/tasks') return send(res, 200, { items: tasks });

  if (req.method === 'POST' && pathname === '/api/tasks') {
    const body = await readJson(req);
    if (body === null) return send(res, 400, { error: 'Invalid JSON' });
    const title = String(body.title || '').trim();
    if (!title) return send(res, 400, { error: 'title is required' });
    if (title.length > 80) return send(res, 400, { error: 'title must be 80 characters or fewer' });
    const task = { id: nextId++, title, completed: false };
    tasks.push(task);
    return send(res, 201, task);
  }

  const match = pathname.match(/^\/api\/tasks\/(\d+)$/);
  if (match) {
    const id = Number(match[1]);
    const task = tasks.find((t) => t.id === id);

    if (req.method === 'PATCH') {
      if (!task) return send(res, 404, { error: 'Task not found' });
      const body = await readJson(req);
      if (body === null || typeof body.completed !== 'boolean') return send(res, 400, { error: 'completed must be boolean' });
      task.completed = body.completed;
      return send(res, 200, task);
    }
    if (req.method === 'DELETE') {
      if (!task) return send(res, 404, { error: 'Task not found' });
      tasks = tasks.filter((t) => t.id !== id);
      return send(res, 204);
    }
  }

  return send(res, 404, { error: 'Not found' });
});

server.listen(PORT, HOST, () => console.log(`TaskBoard demo running at http://${HOST}:${PORT}`));

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}

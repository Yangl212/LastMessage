import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const PORT = Number(process.env.PORT || 3000);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg'
};

createServer(async (req, res) => {
  try {
    if (!req.url) {
      sendJson(res, 400, { error: 'Bad request URL' });
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);


    if (req.method === 'GET') {
      await serveStatic(url.pathname, res);
      return;
    }

    sendJson(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    sendJson(res, 500, { error: error?.message || 'Server error' });
  }
}).listen(PORT, () => {
  console.log(`Local chat server running at http://localhost:${PORT}`);
  console.log(`Open: http://localhost:${PORT}/introduction.html`);
});

async function serveStatic(requestPath, res) {
  const safePath = decodeURIComponent(requestPath.split('?')[0]);
  const normalizedPath = safePath === '/' ? '/introduction.html' : safePath;
  const absolutePath = path.resolve(rootDir, `.${normalizedPath}`);

  if (!absolutePath.startsWith(rootDir)) {
    sendJson(res, 403, { error: 'Forbidden' });
    return;
  }

  try {
    const ext = path.extname(absolutePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const body = await readFile(absolutePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(body);
  } catch {
    const notFoundPath = path.resolve(rootDir, './warning.html');
    try {
      const html = await readFile(notFoundPath, 'utf8');
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch {
      sendJson(res, 404, { error: 'Not found' });
    }
  }
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}


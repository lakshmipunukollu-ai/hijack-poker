const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;

const HOLDEM_HOST = process.env.HOLDEM_HOST || 'holdem-processor.railway.internal';
const HOLDEM_PORT = process.env.HOLDEM_PORT || 3030;
const BROADCAST_HOST = process.env.BROADCAST_HOST || 'cash-game-broadcast.railway.internal';
const BROADCAST_PORT = process.env.BROADCAST_PORT || 3032;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.js.gz': 'application/javascript',
  '.wasm': 'application/wasm',
  '.wasm.gz': 'application/wasm',
  '.data': 'application/octet-stream',
  '.data.gz': 'application/octet-stream',
  '.framework.js.gz': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};

function proxyRequest(req, res, targetHost, targetPort, rewrittenPath) {
  const proxyReq = http.request(
    {
      hostname: targetHost,
      port: targetPort,
      path: rewrittenPath,
      method: req.method,
      headers: {
        ...req.headers,
        host: `${targetHost}:${targetPort}`,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, {
        ...proxyRes.headers,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      });
      proxyRes.pipe(res);
    }
  );
  proxyReq.on('error', (err) => {
    console.error(`Proxy error → ${targetHost}:${targetPort}${rewrittenPath}:`, err.message);
    res.writeHead(502);
    res.end(`Backend unavailable: ${err.message}`);
  });
  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return;
  }

  // Proxy /api/* → holdem-processor (strip /api prefix)
  if (urlPath.startsWith('/api/') || urlPath === '/api') {
    const stripped = urlPath.replace(/^\/api\/?/, '/') + query;
    const target = stripped === '/' ? '/health' : stripped;
    console.log(`[proxy] ${req.method} ${req.url} → ${HOLDEM_HOST}:${HOLDEM_PORT}${target}`);
    proxyRequest(req, res, HOLDEM_HOST, HOLDEM_PORT, target);
    return;
  }

  // Static file serving
  const servePath = urlPath === '/' ? 'index.html' : urlPath;
  const filePath = path.join(__dirname, servePath);
  const ext = servePath.endsWith('.gz')
    ? path.extname(servePath.replace('.gz', '')) + '.gz'
    : path.extname(servePath);
  let contentType = mimeTypes[ext] || 'application/octet-stream';

  if (req.url.endsWith('.gz')) {
    res.setHeader('Content-Encoding', 'gzip');
    if (req.url.includes('.wasm')) contentType = 'application/wasm';
    else if (req.url.includes('.framework') || req.url.includes('.js')) contentType = 'application/javascript';
    else if (req.url.includes('.data')) contentType = 'application/octet-stream';
  }

  res.setHeader('Content-Type', contentType);
  res.setHeader('Access-Control-Allow-Origin', '*');

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200);
    res.end(data);
  });
});

// WebSocket upgrade → cash-game-broadcast
server.on('upgrade', (req, socket, head) => {
  if (!req.url.startsWith('/ws')) {
    socket.destroy();
    return;
  }
  console.log(`[ws-proxy] Upgrade ${req.url} → ${BROADCAST_HOST}:${BROADCAST_PORT}${req.url}`);
  const proxyReq = http.request({
    hostname: BROADCAST_HOST,
    port: BROADCAST_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers,
  });
  proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
    const status = `HTTP/1.1 ${proxyRes.statusCode || 101} ${proxyRes.statusMessage || 'Switching Protocols'}\r\n`;
    const headers = Object.entries(proxyRes.headers)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\r\n');
    socket.write(status + headers + '\r\n\r\n');
    if (proxyHead.length) socket.write(proxyHead);
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
    proxySocket.on('error', () => socket.destroy());
    socket.on('error', () => proxySocket.destroy());
  });
  proxyReq.on('error', (err) => {
    console.error(`[ws-proxy] Error:`, err.message);
    socket.destroy();
  });
  proxyReq.end();
});

server.listen(PORT, () => console.log(`Serving on ${PORT} (API→${HOLDEM_HOST}:${HOLDEM_PORT}, WS→${BROADCAST_HOST}:${BROADCAST_PORT})`));

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;

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

http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  const ext = req.url.endsWith('.gz') ? path.extname(req.url.replace('.gz','')) + '.gz' : path.extname(req.url);
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
}).listen(PORT, () => console.log(`Serving on ${PORT}`));

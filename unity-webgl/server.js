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
  const urlPath = req.url.split('?')[0];
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
}).listen(PORT, () => console.log(`Serving on ${PORT}`));

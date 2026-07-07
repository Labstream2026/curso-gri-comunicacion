const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const PORT = 8830;
const MIME = { '.html':'text/html', '.css':'text/css', '.js':'application/javascript', '.json':'application/json', '.mp3':'audio/mpeg', '.wav':'audio/wav', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml', '.pdf':'application/pdf', '.webp':'image/webp' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden'); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('not found'); }
    const ext = path.extname(file).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    // soporte Range para audio
    const range = req.headers.range;
    if (range && (ext === '.mp3' || ext === '.wav')) {
      const m = /bytes=(\d+)-(\d*)/.exec(range);
      const start = parseInt(m[1], 10);
      const end = m[2] ? parseInt(m[2], 10) : st.size - 1;
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
      fs.createReadStream(file, { start, end }).pipe(res);
    } else {
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Cache-Control': 'no-cache' });
      fs.createReadStream(file).pipe(res);
    }
  });
}).listen(PORT, () => console.log('curso-blueprint en http://localhost:' + PORT));

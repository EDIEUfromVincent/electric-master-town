// 전기 마스터 타운 — 정적 파일 서버 (Railway용). 게임은 index.html 한 파일이다.
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = process.env.PORT || 3000, ROOT = __dirname;
const TYPES = {'.html':'text/html; charset=utf-8', '.md':'text/markdown; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.svg':'image/svg+xml', '.ico':'image/x-icon'};
http.createServer((req, res) => {
  let p; try { p = decodeURIComponent(req.url.split('?')[0]); } catch (e) { res.writeHead(400); return res.end('bad request'); }
  if (p === '/' || p === '') p = '/index.html';
  const file = path.join(ROOT, path.normalize(p));
  if (!file.startsWith(ROOT + path.sep) || /(^|\/)\./.test(p) || p === '/server.js'){ res.writeHead(404); return res.end('not found'); }
  fs.readFile(file, (err, buf) => {
    if (err){ res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'}); return res.end('not found'); }
    res.writeHead(200, {'Content-Type':TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-cache'});
    res.end(buf);
  });
}).listen(PORT, () => console.log('전기 마스터 타운: http://localhost:' + PORT));

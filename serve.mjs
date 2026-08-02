import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';

const ROOT = 'c:/autosait/koko-studio';
const PORT = 8777;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

http
  .createServer((req, res) => {
    let u = decodeURIComponent(req.url.split('?')[0]);
    if (u.endsWith('/')) u += 'index.html';
    const fp = path.normalize(path.join(ROOT, u));
    if (!fp.startsWith(path.normalize(ROOT))) {
      res.writeHead(403);
      return res.end('403');
    }
    fs.readFile(fp, (e, d) => {
      console.log(`${e ? 404 : 200}  ${u}`);
      if (e) {
        res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
        return res.end('<h1>404</h1><p><a href="/">На сайт</a> · <a href="/predlozhenie.html">Предложение</a></p>');
      }
      res.writeHead(200, { 'content-type': TYPES[path.extname(fp)] || 'application/octet-stream', 'cache-control': 'no-cache' });
      res.end(d);
    });
  })
  .listen(PORT, '0.0.0.0', () => {
    const lan = Object.values(os.networkInterfaces())
      .flat()
      .filter((i) => i && i.family === 'IPv4' && !i.internal)
      .map((i) => i.address);
    console.log(`\n  Сайт          http://localhost:${PORT}/`);
    console.log(`  Предложение   http://localhost:${PORT}/predlozhenie.html`);
    lan.forEach((ip) => console.log(`  С телефона    http://${ip}:${PORT}/   (та же сеть Wi-Fi)`));
    console.log('');
  });

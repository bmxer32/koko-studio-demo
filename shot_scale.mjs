import puppeteer from 'puppeteer';
import fs from 'fs';

const b = await puppeteer.launch({ headless: 'new' });
const p = await b.newPage();
await p.setViewport({ width: 900, height: 900, deviceScaleFactor: 1 });
await p.goto('http://localhost:8777/index.html', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2000));

const shots = [];
for (let i = 0; i < 8; i++) {
  await p.evaluate((i) => {
    const r = document.querySelector('#scaleRange');
    r.value = i;
    r.dispatchEvent(new Event('input', { bubbles: true }));
  }, i);
  await new Promise((r) => setTimeout(r, 900));
  const el = await p.$('.scale__stage');
  const buf = await el.screenshot({ encoding: 'base64' });
  const label = await p.evaluate(() => document.querySelector('#scaleBadge').textContent);
  const ratio = await p.evaluate(() => document.querySelector('#scaleRatio').textContent);
  shots.push({ buf, label, ratio });
}

const html = `<style>body{margin:0;background:#EDEBE9;font:12px system-ui}
.g{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:8px}
figure{margin:0}figure img{width:100%;display:block;border:1px solid #ccc}
figcaption{padding:5px 2px;font:12px/1.3 monospace}</style>
<div class="g">${shots.map((s) => `<figure><img src="data:image/png;base64,${s.buf}"><figcaption><b>${s.label}</b><br>${s.ratio}</figcaption></figure>`).join('')}</div>`;
fs.writeFileSync('c:/autosait/koko-studio/scale_all.html', html);
await p.goto('file:///c:/autosait/koko-studio/scale_all.html', { waitUntil: 'networkidle0' });
await p.setViewport({ width: 1200, height: 700 });
await new Promise((r) => setTimeout(r, 600));
await p.screenshot({ path: 'c:/autosait/koko-studio/scale_all.png', fullPage: true });
console.log('ок');
await b.close();

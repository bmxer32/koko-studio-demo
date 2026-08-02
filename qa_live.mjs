import puppeteer from 'puppeteer';
const URL = 'https://bmxer32.github.io/koko-studio-demo/';
const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
const bad = [];
p.on('requestfailed', (r) => bad.push('FAIL ' + r.url()));
p.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
p.on('pageerror', (e) => bad.push('JS ' + e.message));

await p.goto(URL, { waitUntil: 'networkidle2', timeout: 90000 });
await new Promise((r) => setTimeout(r, 3000));

console.log('заголовок:', await p.title());
console.log('фото в галерее:', await p.evaluate(() => document.querySelectorAll('#grid figure img').length));
console.log('строк прайса:', await p.evaluate(() => document.querySelectorAll('.prow').length));
console.log('отзывов:', await p.evaluate(() => document.querySelectorAll('.review').length));
console.log('битых картинок:', await p.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length));

await p.evaluate(() => document.querySelector('.dock__main').click());
await new Promise((r) => setTimeout(r, 12000));
for (const f of p.frames()) {
  if (f.url().includes('yclients')) {
    const t = await f.evaluate(() => document.body.innerText);
    console.log('запись YCLIENTS:', t.slice(0, 120).replace(/\n/g, ' | '));
  }
}
await p.screenshot({ path: 'c:/autosait/koko-studio/live-mobile.png' });

const p2 = await b.newPage();
await p2.goto(URL + 'predlozhenie.html', { waitUntil: 'networkidle2', timeout: 60000 });
console.log('предложение:', await p2.title());

console.log('проблемы:', bad.length ? [...new Set(bad)].slice(0, 8) : 'нет');
await b.close();

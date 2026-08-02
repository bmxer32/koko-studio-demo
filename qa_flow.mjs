import puppeteer from 'puppeteer';
const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

/* 1. какая картинка битая */
const p0 = await b.newPage();
await p0.setViewport({ width: 390, height: 844, isMobile: true });
await p0.goto('https://bmxer32.github.io/koko-studio-demo/', { waitUntil: 'networkidle2', timeout: 90000 });
await new Promise((r) => setTimeout(r, 3000));
console.log('битые:', await p0.evaluate(() =>
  [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src + ' | alt=' + i.alt)
));
await p0.close();

/* 2. проходит ли запись до конца в iframe с github.io */
async function walk(url, label) {
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  if (label === 'iframe') await p.setExtraHTTPHeaders({ Referer: 'https://bmxer32.github.io/' });
  await p.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise((r) => setTimeout(r, 6000));

  const click = async (text) => {
    const ok = await p.evaluate((t) => {
      const el = [...document.querySelectorAll('div,button,a,span,li,p')]
        .filter((e) => e.offsetParent && (e.textContent || '').trim() === t)
        .pop();
      if (el) { el.click(); return true; }
      return false;
    }, text);
    await new Promise((r) => setTimeout(r, 4000));
    return ok;
  };

  console.log(`\n── ${label} ──`);
  console.log('кат.:', await click('LED наращивание ресниц'));
  console.log('услуга:', await click('3D ресницы'));
  const txt = await p.evaluate(() => document.body.innerText.slice(0, 400).replace(/\n+/g, ' | '));
  console.log('экран:', txt);
  await p.screenshot({ path: `c:/autosait/koko-studio/flow-${label}.png` });
  await p.close();
}

await walk('https://n596014.yclients.com/company/563183/personal/select-services?o=', 'iframe');
await b.close();

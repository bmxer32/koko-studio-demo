(() => {
  'use strict';
  const D = window.KOKO;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const money = (n) => n.toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽';
  const photo = (base, w) => `assets/photo/${base}-${w}.webp`;
  /* 1 отзыв, 2 отзыва, 5 отзывов */
  const plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    if (b === 1) return one;
    return many;
  };

  /* ───────── схема ресничного ряда ─────────
     Рисуем настоящий смысл цифры: на каждую свою ресницу вешаем count наращённых.
     Дробный объём — чередование: 1,5D это то одна, то две. */
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const LID = { x0: 26, y0: 322, x1: 150, y1: 222, x2: 250, y2: 222, x3: 374, y3: 322 };

  const bezier = (t) => {
    const u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    return {
      x: a * LID.x0 + b * LID.x1 + c * LID.x2 + d * LID.x3,
      y: a * LID.y0 + b * LID.y1 + c * LID.y2 + d * LID.y3,
    };
  };

  /* ресница = сужающийся к кончику изогнутый лепесток */
  const lashPath = (x, y, deg, len, curl, w) => {
    const a = (deg * Math.PI) / 180;
    const p = a - Math.PI / 2;
    const tx = x + Math.cos(a) * len, ty = y + Math.sin(a) * len;
    const mx = x + Math.cos(a) * len * 0.55 + Math.cos(p) * curl;
    const my = y + Math.sin(a) * len * 0.55 + Math.sin(p) * curl;
    const nx = (Math.cos(p) * w) / 2, ny = (Math.sin(p) * w) / 2;
    return `M${(x + nx).toFixed(1)},${(y + ny).toFixed(1)} Q${(mx + nx * 0.35).toFixed(1)},${(my + ny * 0.35).toFixed(1)} ${tx.toFixed(1)},${ty.toFixed(1)} Q${(mx - nx * 0.35).toFixed(1)},${(my - ny * 0.35).toFixed(1)} ${(x - nx).toFixed(1)},${(y - ny).toFixed(1)} Z`;
  };

  function drawLashes(count) {
    const svg = $('#scaleSvg');
    while (svg.lastChild && svg.lastChild.nodeName !== 'title') svg.removeChild(svg.lastChild);

    const add = (d, cls) => {
      const p = document.createElementNS(SVG_NS, 'path');
      p.setAttribute('d', d);
      p.setAttribute('class', cls);
      svg.appendChild(p);
      return p;
    };

    /* линия века */
    add(`M${LID.x0},${LID.y0} C${LID.x1},${LID.y1} ${LID.x2},${LID.y2} ${LID.x3},${LID.y3} L${LID.x3},${LID.y3 + 6} C${LID.x2},${LID.y2 + 9} ${LID.x1},${LID.y1 + 9} ${LID.x0},${LID.y0 + 6} Z`, 'lid');

    const N = 25;
    const low = Math.floor(count), high = Math.ceil(count);
    let step = 0;

    for (let i = 0; i < N; i++) {
      const t = 0.045 + (i / (N - 1)) * 0.91;
      const { x, y } = bezier(t);
      /* к внешнему углу ресницы длиннее и наклонены сильнее */
      const deg = -116 + t * 64;
      const len = 66 + 62 * Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.1));
      const curl = len * 0.19;

      /* своя ресница — короче и бледнее, лежит под наращёнными */
      add(lashPath(x, y, deg, len * 0.78, curl * 0.8, 3.4), 'own');

      /* сколько вешаем на эту ресницу */
      let k = low;
      if (low !== high) { k = step % 2 === 0 ? low : high; step++; }

      const spread = Math.min(4 + k * 4.6, 26);
      for (let j = 0; j < k; j++) {
        const off = k === 1 ? 0 : (j / (k - 1) - 0.5) * spread;
        const p = add(
          lashPath(x, y, deg + off, len * (1.03 + Math.abs(off) / 260), curl, Math.max(1.15, 3.2 / Math.sqrt(k))),
          'ext'
        );
        p.style.setProperty('--i', String(i * 5 + j));
      }
    }
  }

  const range = $('#scaleRange');
  const ticks = $('#scaleTicks');

  D.volumes.forEach((v, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = v.label;
    b.setAttribute('aria-label', `Показать ${v.name}`);
    b.addEventListener('click', () => {
      range.value = i;
      paint(i);
    });
    li.appendChild(b);
    ticks.appendChild(li);
  });

  let current = -1;
  function paint(i) {
    if (i === current) return;
    const v = D.volumes[i];
    current = i;

    $('#scaleName').textContent = v.name;
    $('#scaleNote').textContent = v.note;
    $('#scaleBadge').textContent = v.label;
    $('#scaleCta').textContent = v.label;
    $('#scalePrice').textContent = v.price[1] && v.price[1] !== v.price[0]
      ? `${v.price[0].toLocaleString('ru-RU').replace(/ /g, ' ')} – ${money(v.price[1])}`
      : money(v.price[0]);
    $('#scaleTime').textContent = v.time;
    $$('#scaleTicks li').forEach((li, n) => li.classList.toggle('is-on', n === i));

    const c = v.count;
    $('#scaleRatio').textContent =
      Number.isInteger(c)
        ? `1 своя ресница → ${c} ${plural(c, 'наращённая', 'наращённых', 'наращённых')}`
        : `1 своя ресница → то ${Math.floor(c)}, то ${Math.ceil(c)}`;
    $('#scaleSvg').querySelector('title').textContent =
      `Схема наращивания ${v.label}: на одну свою ресницу — ${c} наращённых`;
    drawLashes(c);
  }

  range.addEventListener('input', () => paint(+range.value));
  paint(+range.value);

  /* ───────── галерея ───────── */
  const grid = $('#grid');
  const chips = $('#chips');
  const moreBtn = $('#moreBtn');
  const STEP = 12;

  const all = [];
  Object.entries(D.gallery).forEach(([cat, nums]) => {
    nums.forEach((n) => all.push({ cat, base: 'gallery-' + String(n).padStart(2, '0') }));
  });
  /* перемешиваем детерминированно, чтобы «Все работы» не шли блоками по категориям */
  const shuffled = all.slice().sort((a, b) => {
    const h = (s) => [...s].reduce((x, c) => (x * 31 + c.charCodeAt(0)) % 9973, 7);
    return h(a.base + a.cat) - h(b.base + b.cat);
  });

  let filter = 'all';
  let shown = 0;
  let view = [];

  Object.entries(D.galleryLabels).forEach(([key, label], i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.role = 'tab';
    b.textContent = label;
    b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    b.addEventListener('click', () => {
      filter = key;
      $$('button', chips).forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      render(true);
    });
    chips.appendChild(b);
  });

  function render(reset) {
    if (reset) {
      grid.innerHTML = '';
      shown = 0;
      view = filter === 'all' ? shuffled : all.filter((p) => p.cat === filter);
    }
    const slice = view.slice(shown, shown + STEP);
    slice.forEach((p) => {
      const fig = document.createElement('figure');
      const im = document.createElement('img');
      im.src = photo(p.base, 560);
      im.loading = 'lazy';
      im.decoding = 'async';
      im.alt = ({
        lashes: 'Наращивание ресниц',
        brows: 'Оформление и перманент бровей',
        lips: 'Перманентный макияж и увеличение губ',
        face: 'Инъекционная косметология',
        studio: 'Интерьер студии',
      }[p.cat] || 'Работа') + ' — KOKO Studio';
      fig.appendChild(im);
      fig.addEventListener('click', () => openLb(view.indexOf(p)));
      grid.appendChild(fig);
    });
    shown += slice.length;
    moreBtn.hidden = shown >= view.length;
    moreBtn.textContent = `Показать ещё ${Math.min(STEP, view.length - shown)}`;
  }
  moreBtn.addEventListener('click', () => render(false));
  render(true);

  /* ───────── просмотр фото ───────── */
  const lb = $('#lb'), lbImg = $('#lbImg');
  let lbI = 0;
  function openLb(i) {
    lbI = (i + view.length) % view.length;
    lbImg.src = photo(view[lbI].base, 1200);
    lbImg.alt = 'Работа KOKO Studio';
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeLb() { lb.hidden = true; document.body.style.overflow = ''; }
  $('#lbX').addEventListener('click', closeLb);
  $('#lbPrev').addEventListener('click', () => openLb(lbI - 1));
  $('#lbNext').addEventListener('click', () => openLb(lbI + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });

  /* ───────── прайс ───────── */
  const priceOut = $('#priceOut');
  const wrap = document.createElement('div');
  wrap.className = 'price-cols';
  D.price.forEach((g) => {
    const sec = document.createElement('section');
    sec.className = 'pgroup';
    const head = document.createElement('div');
    head.className = 'pgroup__h';
    head.innerHTML = `<h3>${g.group}</h3>`;
    sec.appendChild(head);
    if (g.hint) {
      const h = document.createElement('p');
      h.className = 'pgroup__hint';
      h.textContent = g.hint;
      sec.appendChild(h);
    }
    g.items.forEach((it) => {
      const row = document.createElement('div');
      row.className = 'prow';
      const cost = it.to
        ? `${it.from.toLocaleString('ru-RU').replace(/ /g, ' ')} – ${money(it.to)}`
        : money(it.from);
      row.innerHTML =
        `<p class="prow__name">${it.name}${it.tag ? `<span class="ptag">${it.tag}</span>` : ''}</p>` +
        `<p class="prow__cost">${cost}</p>` +
        (it.time ? `<p class="prow__time">${it.time}</p>` : '');
      sec.appendChild(row);
    });
    wrap.appendChild(sec);
  });
  priceOut.appendChild(wrap);

  /* ───────── мастера ───────── */
  const mOut = $('#mastersList');
  D.masters.forEach((m) => {
    const el = document.createElement('article');
    el.className = 'master';
    el.innerHTML =
      `<div class="master__ava" aria-hidden="true">${m.letter}</div>` +
      `<div><p class="master__name">${m.name}</p><p class="master__role">${m.role}</p>` +
      (m.reviews ? `<p class="master__rev">${m.reviews} ${plural(m.reviews, 'отзыв', 'отзыва', 'отзывов')} на профиле</p>` : `<p class="master__rev">Принимает по записи</p>`) +
      `</div>`;
    mOut.appendChild(el);
  });

  /* ───────── отзывы ───────── */
  const rOut = $('#reviewsList');
  D.reviews.forEach((r) => {
    const el = document.createElement('article');
    el.className = 'review';
    el.innerHTML =
      `<p class="review__text">${r.text}</p>` +
      `<p class="review__meta"><span>${r.author}</span><span>${r.date}</span></p>`;
    rOut.appendChild(el);
  });

  /* ───────── фото студии и ориентиры ───────── */
  const aOut = $('#aboutPics');
  D.gallery.studio.slice(0, 4).forEach((n) => {
    const base = 'gallery-' + String(n).padStart(2, '0');
    const im = document.createElement('img');
    im.src = photo(base, 560);
    im.loading = 'lazy';
    im.alt = 'Интерьер KOKO Studio';
    aOut.appendChild(im);
  });

  const wOut = $('#way');
  D.wayfinding.forEach((base, i) => {
    const im = document.createElement('img');
    im.src = photo(base, 560);
    im.loading = 'lazy';
    im.alt = ['Вход во двор', 'Лестница к студии', 'Дверь студии'][i] || 'Ориентир';
    wOut.appendChild(im);
  });

  /* ───────── онлайн-запись ───────── */
  const modal = $('#modal'), modalBody = $('#modalBody');
  let loaded = false;
  function openModal() {
    if (!loaded) {
      const f = document.createElement('iframe');
      f.src = D.booking;
      f.title = 'Онлайн-запись в KOKO Studio';
      f.allow = 'payment';
      modalBody.appendChild(f);
      loaded = true;
    }
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    $('#modalX').focus();
  }
  function closeModal() { modal.hidden = true; document.body.style.overflow = ''; }
  $$('[data-book]').forEach((b) => b.addEventListener('click', openModal));
  $('#modalX').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeModal(); closeLb(); }
    if (!lb.hidden) {
      if (e.key === 'ArrowLeft') openLb(lbI - 1);
      if (e.key === 'ArrowRight') openLb(lbI + 1);
    }
  });

  /* ───────── мелочи ───────── */
  const bar = $('#bar');
  const io = new IntersectionObserver(
    ([e]) => bar.classList.toggle('is-stuck', !e.isIntersecting),
    { rootMargin: '-1px 0px 0px 0px', threshold: 1 }
  );
  io.observe($('#top'));

  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const t = $(a.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth' });
    })
  );
})();

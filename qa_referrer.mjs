/* Проверяем, ломает ли YCLIENTS запись, когда виджет открыт с чужого домена */
const endpoints = [
  'https://n596014.yclients.com/api/v1/booking/forms/596014/security_levels/',
  'https://n596014.yclients.com/api/v1/booking/forms/596014/custom_fields',
  'https://n596014.yclients.com/api/v1/booking/locations/563183/privacy_policy',
];
const referrers = [
  ['свой домен  ', 'https://n596014.yclients.com/'],
  ['github.io   ', 'https://bmxer32.github.io/'],
  ['без referer ', null],
];

for (const url of endpoints) {
  console.log('\n' + url.replace('https://n596014.yclients.com/api/v1/booking/', '…/'));
  for (const [label, ref] of referrers) {
    const headers = { accept: 'application/json', 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1' };
    if (ref) { headers.referer = ref; headers.origin = new URL(ref).origin; }
    try {
      const r = await fetch(url + (url.endsWith('/') ? `?referrer=${encodeURIComponent(ref || '')}` : ''), { headers });
      const body = (await r.text()).slice(0, 90).replace(/\s+/g, ' ');
      console.log(`  ${label} → ${r.status}  ${body}`);
    } catch (e) {
      console.log(`  ${label} → ошибка ${e.message}`);
    }
  }
}

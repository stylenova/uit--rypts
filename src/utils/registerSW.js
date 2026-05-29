/**
 * Реєстрація Service Worker з автоматичним оновленням.
 *
 * При кожному деплої URL SW включає timestamp (v=...).
 * Браузер бачить новий URL → завантажує нову версію SW → очищає старий кеш.
 */

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  if (process.env.NODE_ENV !== 'production') {
    // В dev — знімаємо SW щоб не заважав HMR
    navigator.serviceWorker.getRegistrations()
      .then(regs => regs.forEach(r => r.unregister()))
      .catch(() => {});
    return;
  }

  window.addEventListener('load', () => {
    // Передаємо унікальну версію в URL — браузер завжди бачить «новий» SW
    const version = (typeof __APP_VERSION__ !== 'undefined')
      ? __APP_VERSION__
      : Date.now();
    const swUrl = `${process.env.BASE_URL || '/'}service-worker.js?v=${version}`;

    navigator.serviceWorker.register(swUrl).then(reg => {
      // Коли новий SW встановився — одразу оновлюємо сторінку
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            // Тихо перезавантажуємо щоб показати нову версію
            window.location.reload();
          }
        });
      });
    }).catch(err => console.warn('SW registration failed:', err));

    // Якщо контролер змінився (інший вхід) — теж оновлюємо
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

export function prefetchTiles(latC, lngC, zoomLevels = [10, 11, 12, 13]) {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;

  const urls = [];
  for (const z of zoomLevels) {
    const x = lon2tile(lngC, z);
    const y = lat2tile(latC, z);
    const r = z >= 13 ? 2 : 1;
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        const tx = x + dx, ty = y + dy;
        if (tx < 0 || ty < 0) continue;
        const sub = ['a', 'b', 'c'][(tx + ty) % 3];
        urls.push(`https://${sub}.tile.openstreetmap.org/${z}/${tx}/${ty}.png`);
      }
    }
  }
  navigator.serviceWorker.controller.postMessage({ type: 'PREFETCH_TILES', urls });
}

function lon2tile(lon, z) {
  return Math.floor((lon + 180) / 360 * Math.pow(2, z));
}
function lat2tile(lat, z) {
  const r = lat * Math.PI / 180;
  return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * Math.pow(2, z));
}

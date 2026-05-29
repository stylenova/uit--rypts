/**
 * Реєстрація Service Worker. Викликаємо в main.js.
 */

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  // У dev-режимі SW не реєструємо — він кешує JS і ламає HMR
  if (process.env.NODE_ENV !== 'production') {
    // Якщо раніше зареєстрували — прибираємо
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(r => r.unregister());
    });
    return;
  }

  if (location.hostname !== 'localhost' && location.protocol !== 'https:') return;

  window.addEventListener('load', () => {
    const swUrl = `${process.env.BASE_URL || '/'}service-worker.js`;
    navigator.serviceWorker.register(swUrl).catch(err => {
      console.warn('SW registration failed:', err);
    });
  });
}

/**
 * Прогрів тайлів OSM для певного квадрата (попередньо завантажуємо у кеш).
 * Викликаємо при «Зберегти офлайн».
 */
export function prefetchTiles(latC, lngC, zoomLevels = [10, 11, 12, 13]) {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;

  const urls = [];
  for (const z of zoomLevels) {
    // Тайл-координати центру
    const x = lon2tile(lngC, z);
    const y = lat2tile(latC, z);
    const r = z >= 13 ? 2 : 1;  // радіус у тайлах
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

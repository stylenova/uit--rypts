/**
 * Service Worker для офлайн-режиму Crypts.
 *
 * Стратегії:
 *   - App shell (HTML/JS/CSS, статичні файли) — cache-first
 *   - Тайли OSM — stale-while-revalidate (показуємо з кешу, оновлюємо у фоні)
 *   - Overpass / Wikipedia / OSRM / BRouter — network-first з фолбеком на кеш
 *
 * Завдяки цьому застосунок працює у горах без інтернету,
 * якщо ви хоча б раз відвідали потрібні села онлайн.
 */

const CACHE_VERSION = 'crypts-v1';
const APP_CACHE = `${CACHE_VERSION}-app`;
const TILES_CACHE = `${CACHE_VERSION}-tiles`;
const API_CACHE = `${CACHE_VERSION}-api`;

// При першому запуску — пробуємо закешувати корінь (далі підвантажимо по запиту)
const CORE_ASSETS = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(APP_CACHE).then(c => c.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => !k.startsWith(CACHE_VERSION))
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  // Тайли OSM: stale-while-revalidate
  if (url.hostname.endsWith('tile.openstreetmap.org')) {
    e.respondWith(staleWhileRevalidate(e.request, TILES_CACHE));
    return;
  }

  // API: Overpass / Wikipedia / OSRM / BRouter — network-first з фолбеком на кеш
  if (
    url.hostname.includes('overpass-api.de') ||
    url.hostname.endsWith('wikipedia.org') ||
    url.hostname.includes('project-osrm.org') ||
    url.hostname.includes('brouter.de')
  ) {
    e.respondWith(networkFirst(e.request, API_CACHE));
    return;
  }

  // Той самий origin (наш застосунок) — cache-first
  if (url.origin === self.location.origin) {
    e.respondWith(cacheFirst(e.request, APP_CACHE));
    return;
  }
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  try {
    const res = await fetch(request);
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch (e) {
    return hit || Response.error();
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(request);
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch (e) {
    const hit = await cache.match(request);
    if (hit) return hit;
    return Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const networkPromise = fetch(request).then(res => {
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  }).catch(() => null);
  return hit || (await networkPromise) || Response.error();
}

// Можна явно прогріти тайли для регіону
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'PREFETCH_TILES' && e.data.urls) {
    const cache = caches.open(TILES_CACHE);
    Promise.all(
      e.data.urls.map(u =>
        fetch(u).then(r => cache.then(c => c.put(u, r))).catch(() => null)
      )
    );
  }
});

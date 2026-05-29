/**
 * Service Worker для офлайн-режиму Crypts.
 * CACHE_VERSION автоматично змінюється при кожному деплої
 * через мітку часу в URL service-worker.js?v=...
 * Завдяки цьому браузер завжди завантажує новий SW.
 */

// Версія читається з параметра URL, який ми додаємо при реєстрації
const CACHE_VERSION = new URL(self.location.href).searchParams.get('v') || 'crypts-v1';
const APP_CACHE   = `${CACHE_VERSION}-app`;
const TILES_CACHE = 'crypts-tiles-v1';   // тайли не скидаємо — вони не змінюються
const API_CACHE   = `${CACHE_VERSION}-api`;

const CORE_ASSETS = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(APP_CACHE)
      .then(c => c.addAll(CORE_ASSETS))
      .catch(() => {})
  );
  // Одразу активуємось — не чекаємо закриття старих вкладок
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k =>
          // Видаляємо всі старі версії, крім поточних
          (k.startsWith('crypts-') && k !== APP_CACHE && k !== TILES_CACHE && k !== API_CACHE)
        ).map(k => caches.delete(k))
      )
    )
  );
  // Одразу беремо контроль над усіма вкладками
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  if (url.hostname.endsWith('tile.openstreetmap.org')) {
    e.respondWith(staleWhileRevalidate(e.request, TILES_CACHE));
    return;
  }

  if (
    url.hostname.includes('overpass-api.de') ||
    url.hostname.endsWith('wikipedia.org') ||
    url.hostname.includes('project-osrm.org') ||
    url.hostname.includes('brouter.de')
  ) {
    e.respondWith(networkFirst(e.request, API_CACHE));
    return;
  }

  if (url.origin === self.location.origin) {
    // index.html — завжди мережа (щоб отримати новий SW при наступному візиті)
    if (url.pathname.endsWith('/') || url.pathname.endsWith('index.html')) {
      e.respondWith(networkFirst(e.request, APP_CACHE));
    } else {
      e.respondWith(cacheFirst(e.request, APP_CACHE));
    }
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
  } catch {
    return Response.error();
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(request);
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    const hit = await cache.match(request);
    return hit || Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const fetchPromise = fetch(request).then(res => {
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  }).catch(() => null);
  return hit || (await fetchPromise) || Response.error();
}

self.addEventListener('message', e => {
  if (e.data?.type === 'PREFETCH_TILES' && e.data.urls) {
    caches.open(TILES_CACHE).then(cache => {
      e.data.urls.forEach(u =>
        fetch(u).then(r => cache.put(u, r)).catch(() => null)
      );
    });
  }
});

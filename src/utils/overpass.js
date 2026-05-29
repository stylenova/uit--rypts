/**
 * Завантажує об'єкти з OpenStreetMap через Overpass API.
 *
 * Це безкоштовний сервіс на основі тих же даних, що під мапою (Leaflet/OSM).
 * Дані заповнюють волонтери; контактні поля можуть бути неповними.
 */

import { cacheFirst } from './persistentCache.js';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// In-memory кеш на сесію — щоб не довбити API повторно при відкритті того ж села
const cache = new Map();

/**
 * Жильё (готелі, гостьові садиби, хостели, шале, кемпінги) в радіусі.
 * @param {number} lat
 * @param {number} lng
 * @param {number} radiusM  радіус у метрах (default 8000)
 */
export async function fetchLodging(lat, lng, radiusM = 8000) {
  const key = `lodging:${lat.toFixed(3)},${lng.toFixed(3)},${radiusM}`;
  if (cache.has(key)) return cache.get(key);

  const result = await cacheFirst(key, async () => {
    const query = `
      [out:json][timeout:15];
      (
        nwr["tourism"~"hotel|guest_house|hostel|apartment|chalet|camp_site|motel|alpine_hut"](around:${radiusM},${lat},${lng});
      );
      out center 40;
    `;
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: query
    });
    if (!res.ok) throw new Error('Overpass ' + res.status);
    const json = await res.json();
    const items = (json.elements || [])
      .map(el => {
        const t = el.tags || {};
        return {
          id: el.id,
          type: 'osm',
          kind: t.tourism,
          title: t.name || t['name:uk'] || t['name:en'],
          phone: t.phone || t['contact:phone'],
          email: t.email || t['contact:email'],
          website: t.website || t['contact:website'] || t.url,
          stars: t.stars,
          addr: [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' '),
          lat: el.lat || (el.center && el.center.lat),
          lng: el.lon || (el.center && el.center.lon)
        };
      })
      .filter(it => it.title && it.lat && it.lng);
    items.forEach(it => {
      it._dist = haversineKm(lat, lng, it.lat, it.lng);
      it._score = scoreLodging(it);
    });
    items.sort((a, b) => (b._score - a._score) || (a._dist - b._dist));
    return items;
  });

  cache.set(key, result.value);
  return result.value;
}

/**
 * Підпис типу для UI.
 */
export const KIND_LABEL = {
  hotel: '🏨 Готель',
  guest_house: '🏡 Садиба',
  hostel: '🛏️ Хостел',
  apartment: '🏠 Апартаменти',
  chalet: '🌲 Шале',
  camp_site: '⛺ Кемпінг',
  motel: '🚗 Мотель',
  alpine_hut: '⛰️ Гірський притулок'
};

/**
 * Визначні місця в радіусі: гори, водоспади, замки, музеї, оглядові майданчики, печери.
 */
/**
 * Оцінка "цікавості" POI на основі сигналів з OSM.
 * Wikipedia-стаття — найсильніший сигнал відомості.
 */
function scoreAttraction(item) {
  let s = 0;
  if (item.wikipedia) s += 30;
  if (item.wikidata) s += 20;
  if (item.website) s += 10;
  if (item.image) s += 8;
  s += (item.langCount || 0) * 3;  // багатомовність = відомість

  const kindWeights = {
    waterfall: 22, lake: 20, peak: 18, cave: 15,
    castle: 28, monastery: 22, museum: 20,
    viewpoint: 14, artwork: 10, church: 8,
    ruins: 12, monument: 10, shrine: 4,
    attraction: 12, landmark: 6
  };
  s += kindWeights[item.kind] || 5;

  // Бонус за висоту (іменовані вершини)
  if (item.kind === 'peak' && item.ele) {
    const e = parseInt(item.ele);
    if (e > 1500) s += 8;
    if (e > 1800) s += 8;
    if (e > 2000) s += 10;
  }

  // Штраф за відстань (далі — менш привабливо)
  s -= (item._dist || 0) * 0.7;

  return s;
}

/**
 * Оцінка якості житла на основі тегів OSM.
 */
function scoreLodging(item) {
  let s = 0;
  if (item.stars) s += parseInt(item.stars) * 10;   // 5 зірок = +50
  if (item.website) s += 12;
  if (item.phone) s += 10;
  if (item.addr) s += 4;
  if (item.email) s += 4;

  const kindWeights = {
    hotel: 18, alpine_hut: 14, chalet: 12,
    guest_house: 10, apartment: 7, motel: 5,
    hostel: 5, camp_site: 4
  };
  s += kindWeights[item.kind] || 5;

  s -= (item._dist || 0) * 0.5;
  return s;
}

export async function fetchAttractions(lat, lng, radiusM = 15000) {
  const key = `attr:${lat.toFixed(3)},${lng.toFixed(3)},${radiusM}`;
  if (cache.has(key)) return cache.get(key);

  const result = await cacheFirst(key, async () => {
    const query = `
      [out:json][timeout:25];
      (
        nwr["tourism"="attraction"](around:${radiusM},${lat},${lng});
        nwr["tourism"="viewpoint"](around:${radiusM},${lat},${lng});
        nwr["tourism"="museum"](around:${radiusM},${lat},${lng});
        nwr["tourism"="artwork"](around:${radiusM},${lat},${lng});
        nwr["natural"="peak"](around:${radiusM},${lat},${lng});
        nwr["natural"="waterfall"](around:${radiusM},${lat},${lng});
        nwr["natural"="cave_entrance"](around:${radiusM},${lat},${lng});
        nwr["historic"~"castle|monument|memorial|ruins|fort|monastery|wayside_shrine"](around:${radiusM},${lat},${lng});
        nwr["amenity"="place_of_worship"]["historic"](around:${radiusM},${lat},${lng});
      );
      out center 80;
    `;
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: query
    });
    if (!res.ok) throw new Error('Overpass ' + res.status);
    const json = await res.json();
    const items = (json.elements || [])
      .map(el => {
        const t = el.tags || {};
        const kind = extractKind(t);
        // Скільки мовних варіантів назви — індикатор відомості
        const langCount = Object.keys(t).filter(k => k.startsWith('name:')).length;
        return {
          id: 'osm-' + el.id,
          name: t.name || t['name:uk'] || t['name:en'],
          kind,
          ele: t.ele,
          wikipedia: t.wikipedia || t['wikipedia:uk'],
          wikidata: t.wikidata,
          website: t.website || t['contact:website'],
          image: t.image,
          langCount,
          lat: el.lat || (el.center && el.center.lat),
          lng: el.lon || (el.center && el.center.lon),
          source: 'osm'
        };
      })
      .filter(it => it.name && it.lat && it.lng);

    const unique = dedupeByName(items);
    unique.forEach(it => {
      it._dist = haversineKm(lat, lng, it.lat, it.lng);
      it._score = scoreAttraction(it);
    });
    // Сортуємо за рейтингом цікавості (топ — найкращі), потім за відстанню
    unique.sort((a, b) => (b._score - a._score) || (a._dist - b._dist));
    return unique;
  });

  cache.set(key, result.value);
  return result.value;
}

function extractKind(t) {
  if (t.natural === 'peak') return 'peak';
  if (t.natural === 'waterfall') return 'waterfall';
  if (t.natural === 'cave_entrance') return 'cave';
  if (t.tourism === 'viewpoint') return 'viewpoint';
  if (t.tourism === 'museum') return 'museum';
  if (t.tourism === 'artwork') return 'artwork';
  if (t.historic === 'castle' || t.historic === 'fort') return 'castle';
  if (t.historic === 'monastery') return 'monastery';
  if (t.historic === 'ruins') return 'ruins';
  if (t.historic === 'monument' || t.historic === 'memorial') return 'monument';
  if (t.historic === 'wayside_shrine') return 'shrine';
  if (t.amenity === 'place_of_worship') return 'church';
  if (t.tourism === 'attraction') return 'attraction';
  return 'landmark';
}

function dedupeByName(arr) {
  const seen = new Set();
  const out = [];
  for (const it of arr) {
    const k = (it.name || '').toLowerCase().trim();
    if (k && !seen.has(k)) {
      seen.add(k);
      out.push(it);
    }
  }
  return out;
}

/**
 * Найближчі N зупинок до заданої точки (з уже завантаженого масиву).
 */
export function findNearestStops(stops, lat, lng, n = 3, maxKm = 2.5) {
  if (!Array.isArray(stops) || !stops.length) return [];
  return stops
    .map(s => ({ ...s, _dist: haversineKm(lat, lng, s.lat, s.lng) }))
    .filter(s => s._dist <= maxKm)
    .sort((a, b) => a._dist - b._dist)
    .slice(0, n);
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Зупинки громадського транспорту (включно з маршрутками) — для розрахунку
 * "як дістатись" до конкретного POI всередині регіону.
 */
export async function fetchBusStops(lat, lng, radiusM = 20000) {
  const key = `bs:${lat.toFixed(3)},${lng.toFixed(3)},${radiusM}`;
  if (cache.has(key)) return cache.get(key);

  const result = await cacheFirst(key, async () => {
    const query = `
      [out:json][timeout:25];
      (
        node["highway"="bus_stop"](around:${radiusM},${lat},${lng});
        node["public_transport"="platform"]["bus"="yes"](around:${radiusM},${lat},${lng});
      );
      out 200;
    `;
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: query
    });
    if (!res.ok) throw new Error('Overpass ' + res.status);
    const json = await res.json();
    return (json.elements || [])
      .map(el => {
        const t = el.tags || {};
        return {
          id: 'bs-' + el.id,
          name: t.name || t['name:uk'] || 'Зупинка',
          shelter: t.shelter === 'yes',
          route_ref: t.route_ref,
          operator: t.operator,
          lat: el.lat,
          lng: el.lon
        };
      })
      .filter(it => it.lat && it.lng);
  });

  cache.set(key, result.value);
  return result.value;
}

/**
 * Транспортні вузли: залізничні станції, автобусні станції, аеродроми.
 * Радіус значно більший — гірські села обслуговуються великими вузлами здалеку.
 */
export async function fetchTransport(lat, lng, radiusM = 40000) {
  const key = `tr:${lat.toFixed(3)},${lng.toFixed(3)},${radiusM}`;
  if (cache.has(key)) return cache.get(key);

  const result = await cacheFirst(key, async () => {
    const query = `
      [out:json][timeout:25];
      (
        nwr["railway"="station"](around:${radiusM},${lat},${lng});
        nwr["railway"="halt"](around:${radiusM},${lat},${lng});
        nwr["amenity"="bus_station"](around:${radiusM},${lat},${lng});
        nwr["aeroway"="aerodrome"](around:${radiusM},${lat},${lng});
        nwr["public_transport"="station"](around:${radiusM},${lat},${lng});
      );
      out center 30;
    `;
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: query
    });
    if (!res.ok) throw new Error('Overpass ' + res.status);
    const json = await res.json();
    const items = (json.elements || [])
      .map(el => {
        const t = el.tags || {};
        let kind;
        if (t.railway === 'station') kind = 'train_station';
        else if (t.railway === 'halt') kind = 'train_halt';
        else if (t.amenity === 'bus_station') kind = 'bus_station';
        else if (t.aeroway === 'aerodrome') kind = 'airport';
        else if (t.public_transport === 'station') kind = 'bus_station';
        else return null;
        return {
          id: 'tr-' + el.id,
          name: t.name || t['name:uk'] || t['name:en'],
          kind,
          operator: t.operator,
          website: t.website || t['contact:website'],
          phone: t.phone || t['contact:phone'],
          wikipedia: t.wikipedia || t['wikipedia:uk'],
          lat: el.lat || (el.center && el.center.lat),
          lng: el.lon || (el.center && el.center.lon)
        };
      })
      .filter(it => it && it.name && it.lat && it.lng);

    items.forEach(it => { it._dist = haversineKm(lat, lng, it.lat, it.lng); });
    items.sort((a, b) => a._dist - b._dist);
    return dedupeByName(items);
  });

  cache.set(key, result.value);
  return result.value;
}

export const TRANSPORT_LABEL = {
  train_station: 'Залізничний вокзал',
  train_halt: 'Зупинка поїзда',
  bus_station: 'Автостанція',
  airport: 'Аеропорт'
};

export const ATTR_EMOJI = {
  peak: '⛰️', waterfall: '💧', cave: '🕳️',
  viewpoint: '🔭', museum: '🏛️', artwork: '🎨',
  castle: '🏰', monastery: '⛪', ruins: '🏚️',
  monument: '🗿', shrine: '🕯️', church: '⛪',
  attraction: '📍', landmark: '📌'
};

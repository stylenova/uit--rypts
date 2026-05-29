/**
 * Кеш у localStorage з TTL.
 *
 * Призначення: офлайн-доступ у горах.
 * Дані з OSM / Wikipedia зберігаються, щоб додаток показував усе
 * навіть без інтернету (наприклад, у походi).
 *
 * TTL — 30 днів. Туристичні об'єкти змінюються нечасто,
 * але часом контакти/назви оновлюються.
 */

const PREFIX = 'crypts.cache.';
const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 днів

function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    // Квота переповнена — спробуємо звільнити місце, прибравши прострочені записи
    if (e.name === 'QuotaExceededError') {
      cleanupExpired();
      try {
        localStorage.setItem(key, value);
        return true;
      } catch {}
    }
    return false;
  }
}

export function getCached(key) {
  const raw = safeGet(PREFIX + key);
  if (!raw) return null;
  try {
    const { value, expires } = JSON.parse(raw);
    if (expires && Date.now() > expires) {
      // прострочено, але повертаємо (як fallback для офлайну)
      return { value, stale: true };
    }
    return { value, stale: false };
  } catch {
    return null;
  }
}

export function setCached(key, value, ttlMs = DEFAULT_TTL_MS) {
  const payload = JSON.stringify({
    value,
    expires: Date.now() + ttlMs,
    savedAt: Date.now()
  });
  return safeSet(PREFIX + key, payload);
}

export function cleanupExpired() {
  const now = Date.now();
  const toRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith(PREFIX)) continue;
    try {
      const { expires } = JSON.parse(localStorage.getItem(k) || '{}');
      if (expires && now > expires + 7 * 24 * 60 * 60 * 1000) {
        // Прибираємо те, що прострочене більш ніж на тиждень
        toRemove.push(k);
      }
    } catch {
      toRemove.push(k);
    }
  }
  toRemove.forEach(k => localStorage.removeItem(k));
}

/**
 * Online-перша стратегія з фолбеком на кеш.
 */
export async function cachedFetch(key, fetcher, { ttlMs = DEFAULT_TTL_MS } = {}) {
  try {
    const fresh = await fetcher();
    if (fresh != null) setCached(key, fresh, ttlMs);
    return { value: fresh, fromCache: false };
  } catch (e) {
    const cached = getCached(key);
    if (cached) return { value: cached.value, fromCache: true, stale: cached.stale };
    throw e;
  }
}

/**
 * Cache-перша: якщо у кеші є — повертаємо одразу, потім тихо оновлюємо.
 * Корисно для офлайну: швидкий показ + фонове оновлення.
 */
export async function cacheFirst(key, fetcher, { ttlMs = DEFAULT_TTL_MS } = {}) {
  const cached = getCached(key);
  if (cached && !cached.stale) {
    // Тихе оновлення у фоні
    fetcher().then(fresh => {
      if (fresh != null) setCached(key, fresh, ttlMs);
    }).catch(() => {});
    return { value: cached.value, fromCache: true, stale: false };
  }
  return cachedFetch(key, fetcher, { ttlMs });
}

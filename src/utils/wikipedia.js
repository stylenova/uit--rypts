/**
 * Підтягує короткий опис статті з Wikipedia REST API.
 *
 * Дзеркало даних — Wikipedia, перевіряні факти від спільноти.
 * Жодних авторських текстів у застосунку немає.
 */

import { cacheFirst } from './persistentCache.js';

const cache = new Map();

/**
 * @param {string} pageRef  формат "uk:Буковель" або просто "Буковель" (=> uk за замовчуванням)
 * @returns {{ extract, thumbnail, pageUrl, lang } | null}
 */
export async function fetchSummary(pageRef) {
  if (!pageRef) return null;
  if (cache.has(pageRef)) return cache.get(pageRef);

  let lang = 'uk';
  let title = pageRef;
  const colon = pageRef.indexOf(':');
  if (colon > 0 && colon <= 5) {
    lang = pageRef.slice(0, colon);
    title = pageRef.slice(colon + 1);
  }

  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  try {
    const result = await cacheFirst(`wiki:${pageRef}`, async () => {
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        extract: data.extract,
        thumbnail: data.thumbnail && data.thumbnail.source,
        pageUrl: data.content_urls && data.content_urls.desktop && data.content_urls.desktop.page,
        lang
      };
    });
    cache.set(pageRef, result.value);
    return result.value;
  } catch (e) {
    cache.set(pageRef, null);
    return null;
  }
}

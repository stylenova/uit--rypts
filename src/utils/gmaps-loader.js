/**
 * Лінивий завантажувач Google Maps JS API.
 * Викликаємо load(apiKey) — отримуємо проміс із глобальним google.maps.
 * Повторні виклики з тим же ключем повертають той самий проміс.
 */

let promise = null;
let loadedKey = null;

export function load(apiKey, libraries = ['places']) {
  if (!apiKey) {
    return Promise.reject(new Error('Не вказано Google Maps API key'));
  }

  if (promise && loadedKey === apiKey) {
    return promise;
  }

  if (loadedKey && loadedKey !== apiKey) {
    return Promise.reject(new Error('Maps вже завантажено з іншим ключем — перезавантажте сторінку'));
  }

  loadedKey = apiKey;

  promise = new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve(window.google.maps);
      return;
    }

    const cbName = `__gmapsCb_${Date.now()}`;
    window[cbName] = () => {
      delete window[cbName];
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Maps SDK не ініціалізувалось'));
      }
    };

    const script = document.createElement('script');
    const libs = libraries.length ? `&libraries=${libraries.join(',')}` : '';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}${libs}&callback=${cbName}&language=uk&region=UA`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Не вдалося завантажити Google Maps (перевірте ключ і ліміти)'));
    document.head.appendChild(script);
  });

  return promise;
}

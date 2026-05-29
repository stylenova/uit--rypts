/**
 * Зведення населених пунктів Карпат і Закарпаття.
 *
 * Кожен запис містить ТІЛЬКИ перевіряні базові факти:
 *   - id, name, region (Карпати / Закарпаття)
 *   - lat, lng — координати центру села (з OSM / Wikipedia)
 *   - wikipedia — назва статті у форматі "<lang>:<title>" для підвантаження summary
 *
 * tier ('green' / 'yellow' / 'red') — це СУБ'ЄКТИВНА редакторська категоризація
 * на основі розміру населеного пункту та розвиненості туристичної інфраструктури.
 * Це НЕ факт, а орієнтир. У UI це позначено.
 *
 * Описи, визначні місця, готелі та гіди НЕ зберігаються тут вручну.
 * Вони підтягуються в реальному часі з відкритих джерел:
 *   - Wikipedia REST API — короткий опис, фото
 *   - Overpass API (OpenStreetMap) — визначні місця, готелі, садиби
 * Це гарантує, що жоден факт не є вигаданим.
 */

const bookingSearchUrl = ({ lat, lng, name }) =>
  `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(name)}&latitude=${lat}&longitude=${lng}`;

const airbnbSearchUrl = ({ name }) =>
  `https://www.airbnb.com/s/${encodeURIComponent(name)}/homes`;

const getYourGuideUrl = ({ name }) =>
  `https://www.getyourguide.com/s/?q=${encodeURIComponent(name)}`;

const komootUrl = ({ lat, lng }) =>
  `https://www.komoot.com/discover/hiking-trails/@${lat},${lng},12z`;

function withLinks(v) {
  return {
    ...v,
    externalLinks: {
      booking: bookingSearchUrl(v),
      airbnb: airbnbSearchUrl(v),
      getyourguide: getYourGuideUrl(v),
      komoot: komootUrl(v),
      googleMaps: `https://www.google.com/maps/search/?api=1&query=${v.lat},${v.lng}`,
      olx: `https://www.olx.ua/uk/nedvizhimost/posutochno-pochasovo/q-${encodeURIComponent(v.name)}/`,
      wikilocArea: `https://www.wikiloc.com/wikiloc/map.do?lt=${v.lat}&ln=${v.lng}&z=12`,
      googleSearchGuide: `https://www.google.com/search?q=${encodeURIComponent('гід ' + v.name + ' Карпати екскурсія')}`,
      tripster: `https://experience.tripster.ru/search/?q=${encodeURIComponent(v.name)}`
    }
  };
}

const raw = [
  // ───── GREEN — найрозвиненіша туристична інфраструктура ─────
  { id: 'bukovel',     name: 'Буковель',   region: 'Карпати',    tier: 'green', lat: 48.3656, lng: 24.4067, wikipedia: 'uk:Буковель' },
  { id: 'yaremche',    name: 'Яремче',     region: 'Карпати',    tier: 'green', lat: 48.4500, lng: 24.5500, wikipedia: 'uk:Яремче' },
  { id: 'vorokhta',    name: 'Ворохта',    region: 'Карпати',    tier: 'green', lat: 48.2833, lng: 24.5667, wikipedia: 'uk:Ворохта' },
  { id: 'mykulychyn',  name: 'Микуличин',  region: 'Карпати',    tier: 'green', lat: 48.4000, lng: 24.5167, wikipedia: 'uk:Микуличин' },
  { id: 'dragobrat',   name: 'Драгобрат',  region: 'Закарпаття', tier: 'green', lat: 48.1833, lng: 24.2667, wikipedia: 'uk:Драгобрат' },
  { id: 'polianytsia', name: 'Поляниця',   region: 'Карпати',    tier: 'green', lat: 48.3500, lng: 24.4167, wikipedia: 'uk:Поляниця_(Богородчанський_район)' },
  { id: 'kosiv',       name: 'Косів',      region: 'Карпати',    tier: 'green', lat: 48.3167, lng: 25.0833, wikipedia: 'uk:Косів' },

  // ───── YELLOW — розвинений туризм, дешевше ─────
  { id: 'yasinia',     name: 'Ясіня',      region: 'Закарпаття', tier: 'yellow', lat: 48.2667, lng: 24.3500, wikipedia: 'uk:Ясіня' },
  { id: 'rakhiv',      name: 'Рахів',      region: 'Закарпаття', tier: 'yellow', lat: 48.0500, lng: 24.2000, wikipedia: 'uk:Рахів' },
  { id: 'verkhovyna',  name: 'Верховина',  region: 'Карпати',    tier: 'yellow', lat: 48.1500, lng: 24.8000, wikipedia: 'uk:Верховина' },
  { id: 'volovets',    name: 'Воловець',   region: 'Закарпаття', tier: 'yellow', lat: 48.7333, lng: 23.1833, wikipedia: 'uk:Воловець' },
  { id: 'tatariv',     name: 'Татарів',    region: 'Карпати',    tier: 'yellow', lat: 48.3833, lng: 24.5667, wikipedia: 'uk:Татарів' },
  { id: 'sheshory',    name: 'Шешори',     region: 'Карпати',    tier: 'yellow', lat: 48.3000, lng: 24.9500, wikipedia: 'uk:Шешори' },

  // ───── RED — мінімальна інфраструктура, бюджетно/нішово ─────
  { id: 'lazeschyna',  name: 'Лазещина',   region: 'Закарпаття', tier: 'red', lat: 48.1500, lng: 24.3000, wikipedia: 'uk:Лазещина' },
  { id: 'kvasy',       name: 'Кваси',      region: 'Закарпаття', tier: 'red', lat: 48.1167, lng: 24.2333, wikipedia: 'uk:Кваси' },
  { id: 'dilove',      name: 'Ділове',     region: 'Закарпаття', tier: 'red', lat: 47.9333, lng: 24.1833, wikipedia: 'uk:Ділове' },
  { id: 'ust-chorna',  name: 'Усть-Чорна', region: 'Закарпаття', tier: 'red', lat: 48.3500, lng: 23.8167, wikipedia: 'uk:Усть-Чорна' },
  { id: 'kolochava',   name: 'Колочава',   region: 'Закарпаття', tier: 'red', lat: 48.4167, lng: 23.7000, wikipedia: 'uk:Колочава' },
  { id: 'synevyr',     name: 'Синевир',    region: 'Закарпаття', tier: 'red', lat: 48.6167, lng: 23.6833, wikipedia: 'uk:Синевир_(село)' },
  { id: 'pylypets',    name: 'Пилипець',   region: 'Закарпаття', tier: 'red', lat: 48.7667, lng: 23.1333, wikipedia: 'uk:Пилипець' }
];

export const villages = raw.map(withLinks);

export const tierMeta = {
  green:  { label: 'Найбільший туризм',   color: '#1f6f3f', bg: '#e6f4ec', dotColor: '#1f6f3f' },
  yellow: { label: 'Розвинений туризм',   color: '#a17a00', bg: '#fbf3df', dotColor: '#d4a017' },
  red:    { label: 'Мінімальна інфра',    color: '#9a3324', bg: '#fbe8e3', dotColor: '#9a3324' }
};

export const tierNote =
  'Рівень — суб’єктивна редакторська оцінка на основі розміру населеного пункту й розвитку туризму. Не факт, а орієнтир.';

export const tiers = ['green', 'yellow', 'red'];

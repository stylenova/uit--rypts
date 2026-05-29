/**
 * SVG-маркери у формі краплі з Lucide-іконкою всередині.
 * Кольори підібрані за категоріями (природа / культура / житло).
 */

import L from 'leaflet';

const COLOR = {
  // природа — холодна гама
  peak: '#5a6e8c', waterfall: '#3b6ea5', lake: '#3b6ea5', river: '#3b6ea5',
  cave: '#5a4e3a',
  // огляд / визначне — зелений
  viewpoint: '#1f6f3f', attraction: '#1f6f3f', landmark: '#1f6f3f',
  // культура — фіолетовий
  museum: '#7a4ca5', artwork: '#7a4ca5',
  castle: '#6b3fa0', monastery: '#6b3fa0', church: '#6b3fa0',
  // історія / руїни — теракот
  ruins: '#9a3324', monument: '#9a3324', shrine: '#9a3324',
  // житло — золотий
  hotel: '#c69100', guest_house: '#c69100', hostel: '#c69100',
  apartment: '#c69100', chalet: '#c69100', motel: '#c69100',
  camp_site: '#a36a00', alpine_hut: '#a36a00',
  // transport — графіт із кольоровим акцентом
  train_station: '#2a5b8c', train_halt: '#2a5b8c',
  bus_station: '#0a6e4a', airport: '#5a4ca5'
};

// Lucide-style SVG paths. viewBox 0 0 24 24.
// Для divIcon ці шляхи інлайнимо як stroke-only графіку всередині pin'а.
const PATHS = {
  peak: `<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>`,
  waterfall: `<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a7 7 0 0 1-11.5 5.3"/>`,
  lake: `<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>`,
  river: `<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>`,
  cave: `<path d="M2.5 16.88a1 1 0 0 1-.32-1.43l9-13.02a1 1 0 0 1 1.64 0l9 13.01a1 1 0 0 1-.32 1.44l-8.51 4.86a2 2 0 0 1-1.98 0Z"/><path d="M12 2v20"/>`,
  viewpoint: `<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>`,
  attraction: `<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>`,
  landmark: `<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>`,
  museum: `<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>`,
  artwork: `<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>`,
  castle: `<path d="M22 20v-9H2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2Z"/><path d="M18 11V4H6v7"/><path d="M15 22v-4a3 3 0 0 0-3-3a3 3 0 0 0-3 3v4"/><path d="M22 11V9"/><path d="M2 11V9"/><path d="M6 4V2"/><path d="M18 4V2"/><path d="M10 4V2"/><path d="M14 4V2"/>`,
  monastery: `<path d="M10 9h4"/><path d="M12 7v5"/><path d="M14 22v-4a2 2 0 0 0-4 0v4"/><path d="m18 22 .002-10.913a2 2 0 0 0-.7-1.523L12 5l-5.302 4.564A2 2 0 0 0 6 11.087V22"/><path d="M18 22H6"/>`,
  church: `<path d="M10 9h4"/><path d="M12 7v5"/><path d="M14 22v-4a2 2 0 0 0-4 0v4"/><path d="m18 22 .002-10.913a2 2 0 0 0-.7-1.523L12 5l-5.302 4.564A2 2 0 0 0 6 11.087V22"/><path d="M18 22H6"/>`,
  ruins: `<path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/>`,
  monument: `<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>`,
  shrine: `<path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h5v5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2z"/>`,
  // lodging
  hotel: `<path d="M10 22v-6.57"/><path d="M12 11h.01"/><path d="M12 7h.01"/><path d="M14 15.43V22"/><path d="M15 16a5 5 0 0 0-6 0"/><path d="M16 11h.01"/><path d="M16 7h.01"/><path d="M8 11h.01"/><path d="M8 7h.01"/><rect x="4" y="2" width="16" height="20" rx="2"/>`,
  guest_house: `<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,
  hostel: `<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>`,
  apartment: `<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,
  chalet: `<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,
  motel: `<path d="M10 22v-6.57"/><path d="M14 15.43V22"/><path d="M15 16a5 5 0 0 0-6 0"/><rect x="4" y="2" width="16" height="20" rx="2"/>`,
  camp_site: `<path d="M3.5 21 14 3"/><path d="M20.5 21 10 3"/><path d="M15.5 21 12 15l-3.5 6"/><path d="M2 21h20"/>`,
  alpine_hut: `<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>`,
  // transport
  train_station: `<rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/>`,
  train_halt: `<rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/>`,
  bus_station: `<path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h20"/><path d="M18 18h2a2 2 0 0 0 2-2v-7a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v7a2 2 0 0 0 2 2h2"/><path d="M9 18h6"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>`,
  airport: `<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>`,
  // дефолт
  default: `<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>`
};

/**
 * Створює Leaflet divIcon — каплевидний pin з іконкою всередині.
 * @param {string} kind  тип POI або житла
 * @param {object} [opts] { size = 'md' | 'sm' | 'lg' }
 */
export function makePinIcon(kind, opts = {}) {
  const size = opts.size || 'md';
  const dims = size === 'lg' ? [40, 50] : size === 'sm' ? [26, 32] : [34, 42];
  const [w, h] = dims;
  const color = COLOR[kind] || '#5a5347';
  const path = PATHS[kind] || PATHS.default;

  // Скейл іконки всередині pin'а (іконка з viewBox 24 → ставимо у круг радіуса ~9-12)
  const iconBox = w * 0.5;
  const iconOffsetX = (w - iconBox) / 2;
  const iconOffsetY = (h * 0.30) - iconBox / 2 + 1;
  const iconScale = iconBox / 24;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <filter id="sh" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" flood-color="#000" flood-opacity="0.35"/>
      </filter>
    </defs>
    <path d="M${w/2} 1 C${w*0.78} 1 ${w-2} ${h*0.18} ${w-2} ${h*0.36} C${w-2} ${h*0.58} ${w/2} ${h-2} ${w/2} ${h-2} C${w/2} ${h-2} 2 ${h*0.58} 2 ${h*0.36} C2 ${h*0.18} ${w*0.22} 1 ${w/2} 1 Z"
      fill="${color}" stroke="#fff" stroke-width="2" filter="url(#sh)"/>
    <circle cx="${w/2}" cy="${h*0.34}" r="${iconBox*0.55}" fill="rgba(255,255,255,0.18)"/>
    <g transform="translate(${iconOffsetX} ${iconOffsetY}) scale(${iconScale})"
       fill="none" stroke="#fff" stroke-width="2.5"
       stroke-linecap="round" stroke-linejoin="round">
      ${path}
    </g>
  </svg>`;

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [w, h],
    iconAnchor: [w / 2, h - 2],
    popupAnchor: [0, -(h - 4)]
  });
}

/**
 * Маркер для самого населеного пункту — кружок із кольором рівня.
 */
export function makeVillageIcon(tierColor) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <circle cx="14" cy="14" r="12" fill="${tierColor}" stroke="#fff" stroke-width="3"
            style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4))"/>
    <circle cx="14" cy="14" r="4" fill="#fff" opacity="0.9"/>
  </svg>`;
  return L.divIcon({
    html: svg, className: '',
    iconSize: [28, 28], iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
}

export function makeUserIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <circle cx="14" cy="14" r="12" fill="#2a6fdb" stroke="#fff" stroke-width="3"/>
    <circle cx="14" cy="14" r="5" fill="#fff"/>
  </svg>`;
  return L.divIcon({
    html: svg, className: '',
    iconSize: [28, 28], iconAnchor: [14, 14]
  });
}

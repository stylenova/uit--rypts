# Crypts — Карпати на карті

Vue 3 додаток для планування відпочинку в Карпатах і Закарпатті.
Показує куровані села (3 цінових/якісних тири), POI навколо, гідів і житло, прокладає маршрути на Google Maps.

[![Vue 3](https://img.shields.io/badge/Vue-3.4-42b883?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Maps](https://img.shields.io/badge/Google%20Maps-JS%20API-blue)](https://developers.google.com/maps)

## Можливості
- 🟢🟡🔴 Куровані села з трирівневим пріоритетом (топ / середні / бюджет)
- 🗺️ Інтерактивна карта з маркерами сіл і POI (Places API: tourist_attraction, natural_feature, park)
- 🚗🥾 Маршрути від вашої локації — авто або пішки (Directions API)
- 🏛️ Картка села: атмосфера, сезон, що подивитись, гіди (телефон/мова), житло (телефон/ціна)
- 🔗 Deep-links: Booking, Airbnb, GetYourGuide, Komoot, Google Maps
- ⭐ Збереження вподобаного у LocalStorage
- 📍 Геолокація користувача

## Стек
| Шар | Технологія |
|---|---|
| Фреймворк | Vue 3 (Options API) |
| Складання | `@vue/cli-service` 5 |
| Карта | Google Maps JS API + Places + Directions |
| Збереження | LocalStorage |
| Тести | `node --test` |
| Деплой | GitHub Pages (`gh-pages`) |

## Запуск

```bash
npm install
npm run serve    # dev на http://localhost:8090
npm run build    # production у dist/
npm test         # unit-тести
npm run deploy   # публікація у гілку gh-pages
```

Потрібен Node.js 18+.

## Google Maps API ключ

1. Створи проєкт у [Google Cloud Console](https://console.cloud.google.com/)
2. Увімкни: **Maps JavaScript API**, **Places API**, **Directions API**
3. Створи API ключ (обмеж його за HTTP-referrer — `localhost:*` та `stylenova.github.io/*`)
4. При першому запуску додаток сам попросить ключ — він збережеться у твоєму браузері (`localStorage`), на сервер нічого не йде

## Структура

```
Crypts/
├── public/index.html
├── src/
│   ├── App.vue                 # каркас: сайдбар + карта + деталі
│   ├── main.js
│   ├── components/
│   │   ├── MapView.vue         # Google Maps + POI + маршрути
│   │   ├── VillagesList.vue    # список сіл з фільтрами
│   │   ├── SavedList.vue       # збережені
│   │   ├── DetailPanel.vue     # права картка села
│   │   └── ApiKeyPrompt.vue    # модалка для введення ключа
│   ├── data/villages.js        # куроване зведення сіл
│   ├── utils/
│   │   ├── gmaps-loader.js     # лінива підвантажка Google Maps SDK
│   │   └── storage.js          # LocalStorage
│   └── styles/global.css
└── tests/
    ├── storage.test.js
    └── villages.test.js
```

## Деплой на GitHub Pages

`package.json` уже містить `homepage` і скрипт `deploy`:

```bash
npm run build && npm run deploy
```

Після цього сайт буде доступний на `https://stylenova.github.io/Crypts/`.

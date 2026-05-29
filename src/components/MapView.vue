<template>
  <div class="map-view">
    <div ref="mapEl" class="map-canvas"></div>

    <div class="map-toolbar">
      <button @click="locateMe" title="Моя локація">
        <Icon name="navigate" :size="16" /> Я
      </button>
      <button v-if="routeLine" class="clear" @click="clearRoute" title="Прибрати маршрут">
        <Icon name="x" :size="16" /> Маршрут
      </button>
      <button v-if="selected" @click="openGoogleMapsRoute" title="Відкрити у Google Maps">
        <Icon name="externalLink" :size="16" /> Google
      </button>
    </div>

    <div v-if="routeInfo" class="route-info" :class="routeInfo.mode">
      <div class="ri-row">
        <Icon :name="routeInfo.mode === 'foot' ? 'foot' : 'car'" :size="18" class="ri-mode" />
        <span class="ri-route"><b>{{ routeInfo.fromName }}</b> → <b>{{ routeInfo.toName }}</b></span>
        <span class="ri-stat">{{ routeInfo.distance }}</span>
        <span class="ri-stat">{{ routeInfo.duration }}</span>
        <span v-if="routeInfo.ascend" class="ri-stat">↑ {{ routeInfo.ascend }}</span>
      </div>
      <div class="ri-verify">
        <span class="warn">
          <Icon name="warn" :size="12" />
          {{ routeInfo.mode === 'foot' ? 'Орієнтовно. Перевірити:' : 'Перевірити:' }}
        </span>
        <a :href="wikilocUrl(routeInfo.toLat, routeInfo.toLng)" target="_blank" rel="noopener">
          <Icon name="foot" :size="12" /> Wikiloc
        </a>
        <a :href="komootUrl(routeInfo.toLat, routeInfo.toLng)" target="_blank" rel="noopener">
          <Icon name="navigate" :size="12" /> Komoot
        </a>
        <a :href="googleDirUrl(routeInfo)" target="_blank" rel="noopener">
          <Icon name="externalLink" :size="12" /> Google
        </a>
      </div>
    </div>

    <div v-if="loading" class="loading-pill">
      <Icon name="loader" :size="14" spin /> Будуємо маршрут…
    </div>
  </div>
</template>

<script>
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { markRaw } from 'vue';
import Icon from './Icon.vue';
import { tierMeta } from '../data/villages.js';
import { makePinIcon, makeVillageIcon, makeUserIcon } from '../utils/markerIcons.js';

const CENTER = [48.35, 24.5];

export default {
  name: 'MapView',
  components: { Icon },
  props: {
    villages: { type: Array, required: true },
    selected: { type: Object, default: null },
    routeRequest: { type: Object, default: null },
    focusRequest: { type: Object, default: null },
    visibleAttractions: { type: Array, default: () => [] },
    visibleLodging: { type: Array, default: () => [] }
  },
  emits: ['select'],
  data() {
    return {
      userLatLng: null,
      routeInfo: null,
      loading: false
    };
  },
  created() {
    this.map = null;
    this.villageMarkers = [];
    this.poiMarkers = [];
    this.lodgingMarkers = [];
    this.userMarker = null;
    this.routeLine = null;
  },
  watch: {
    selected(val) {
      if (!this.map) return;
      this.clearRoute();
      this.clearPoiMarkers();
      this.clearLodgingMarkers();
      if (val) this.map.setView([val.lat, val.lng], 12);
    },
    routeRequest(req) {
      if (!req || !this.selected || !this.map) return;
      this.routeVillageToPoi(this.selected, req.highlight, req.mode);
    },
    focusRequest(req) {
      if (!req || !this.map) return;
      this.focusOnItem(req);
    },
    visibleAttractions(val) { if (this.map) this.renderPoiMarkers(val); },
    visibleLodging(val)     { if (this.map) this.renderLodgingMarkers(val); }
  },
  mounted() {
    this.$nextTick(() => this.initMap());
  },
  beforeUnmount() {
    if (this.map) this.map.remove();
  },
  methods: {
    initMap() {
      this.map = markRaw(L.map(this.$refs.mapEl, {
        center: CENTER,
        zoom: 9,
        zoomControl: true,
        tap: true
      }));

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 19
      }).addTo(this.map);

      this.renderVillageMarkers();

      if (this.selected) {
        this.map.setView([this.selected.lat, this.selected.lng], 12);
      }
    },

    renderVillageMarkers() {
      this.villages.forEach(v => {
        const meta = tierMeta[v.tier];
        const marker = L.marker([v.lat, v.lng], {
          icon: makeVillageIcon(meta.dotColor),
          title: v.name
        });
        marker.bindTooltip(
          `<strong>${v.name}</strong><br><small style="color:#666">${v.region}</small>`,
          { direction: 'top', offset: [0, -10] }
        );
        marker.on('click', () => this.$emit('select', v.id));
        marker.addTo(this.map);
        this.villageMarkers.push({ id: v.id, marker: markRaw(marker) });
      });
    },

    renderPoiMarkers(items) {
      this.clearPoiMarkers();
      items.forEach(a => {
        if (!a.lat || !a.lng) return;
        const marker = L.marker([a.lat, a.lng], {
          icon: makePinIcon(a.kind, { size: 'md' }),
          title: a.name,
          riseOnHover: true
        });
        marker.bindPopup(this.buildPoiPopup(a));
        marker.on('popupopen', e => this.attachPopupActions(e, a, 'attraction'));
        marker.addTo(this.map);
        this.poiMarkers.push({ id: a.id, marker: markRaw(marker) });
      });
      this.fitToVisible();
    },

    renderLodgingMarkers(items) {
      this.clearLodgingMarkers();
      items.forEach(a => {
        if (!a.lat || !a.lng) return;
        const marker = L.marker([a.lat, a.lng], {
          icon: makePinIcon(a.kind, { size: 'sm' }),
          title: a.title,
          riseOnHover: true
        });
        marker.bindPopup(this.buildLodgingPopup(a));
        marker.addTo(this.map);
        this.lodgingMarkers.push({ id: a.id, marker: markRaw(marker) });
      });
      this.fitToVisible();
    },

    focusOnItem(item) {
      // шукаємо існуючий маркер за id
      const existing = [...this.poiMarkers, ...this.lodgingMarkers]
        .find(m => m.id === item.id);
      if (existing) {
        this.map.setView([item.lat, item.lng], 14);
        existing.marker.openPopup();
        return;
      }
      // якщо маркера немає (наприклад, транспорт) — створюємо тимчасовий
      this.map.setView([item.lat, item.lng], 13);
      const tmp = L.popup()
        .setLatLng([item.lat, item.lng])
        .setContent(`<div style="font-family:Segoe UI,Arial;min-width:160px">
          <strong>${item.name}</strong>
        </div>`)
        .openOn(this.map);
    },

    fitToVisible() {
      // Якщо є хоч одна точка POI/житла — підлаштовуємо межі карти
      const all = [...this.poiMarkers, ...this.lodgingMarkers];
      if (!all.length || !this.selected) return;
      const points = all.map(m => m.marker.getLatLng());
      points.push(L.latLng(this.selected.lat, this.selected.lng));
      const bounds = L.latLngBounds(points);
      this.map.fitBounds(bounds, { padding: [80, 80], maxZoom: 13 });
    },

    buildPoiPopup(a) {
      const ele = a.ele ? `<div style="color:#666;font-size:11px">${a.ele} м · ${a._dist ? a._dist.toFixed(1) + ' км' : ''}</div>` : '';
      return `<div style="min-width:180px;font-family:Segoe UI,Arial">
        <strong>${a.name}</strong>
        ${ele}
        <div style="display:flex;gap:5px;margin-top:8px;flex-wrap:wrap">
          <button data-act="drive" style="border:1px solid #1f6f3f;background:#e6f4ec;color:#1f6f3f;border-radius:4px;padding:4px 9px;font-size:12px;cursor:pointer;font-weight:600">🚗 Авто</button>
          <button data-act="foot" style="border:1px solid #9a3324;background:#fbe8e3;color:#9a3324;border-radius:4px;padding:4px 9px;font-size:12px;cursor:pointer;font-weight:600">🥾 Пішки</button>
        </div>
      </div>`;
    },

    buildLodgingPopup(a) {
      const addr = a.addr ? `<div style="color:#666;font-size:11px">${a.addr}</div>` : '';
      const phone = a.phone ? `<a href="tel:${a.phone.replace(/\s+/g,'')}" style="color:#1f6f3f;font-weight:600;display:block;margin-top:6px">📞 ${a.phone}</a>` : '';
      const web = a.website ? `<a href="${a.website}" target="_blank" rel="noopener" style="color:#3b6ea5;display:block;margin-top:4px">🌐 Сайт</a>` : '';
      return `<div style="min-width:180px;font-family:Segoe UI,Arial">
        <strong>${a.title}</strong>
        ${addr}
        ${phone}
        ${web}
      </div>`;
    },

    attachPopupActions(e, item, type) {
      const root = e.popup.getElement();
      root.querySelectorAll('button[data-act]').forEach(btn => {
        btn.addEventListener('click', () => {
          const mode = btn.dataset.act === 'foot' ? 'foot' : 'driving';
          this.routeVillageToPoi(this.selected, item, mode);
          this.map.closePopup();
        });
      });
    },

    clearPoiMarkers() {
      this.poiMarkers.forEach(m => this.map.removeLayer(m.marker));
      this.poiMarkers = [];
    },
    clearLodgingMarkers() {
      this.lodgingMarkers.forEach(m => this.map.removeLayer(m.marker));
      this.lodgingMarkers = [];
    },

    async routeVillageToPoi(village, highlight, mode = 'driving') {
      if (!highlight || !highlight.lat || !highlight.lng) return;
      this.clearRoute();
      await this.fetchRoute(
        { lat: village.lat, lng: village.lng, name: village.name },
        { lat: highlight.lat, lng: highlight.lng, name: highlight.name },
        mode
      );
    },

    async fetchRoute(from, to, mode) {
      this.loading = true;
      try {
        const data = mode === 'foot'
          ? await this.fetchBRouterHiking(from, to)
          : await this.fetchOsrmDriving(from, to);

        const color = mode === 'foot' ? '#9a3324' : '#1f6f3f';
        this.routeLine = markRaw(
          L.polyline(data.coords, {
            color, weight: 5, opacity: 0.88,
            dashArray: mode === 'foot' ? '8,8' : null
          }).addTo(this.map)
        );
        this.map.fitBounds(this.routeLine.getBounds(), { padding: [60, 60] });

        this.routeInfo = {
          mode,
          distance: data.distance,
          duration: data.duration,
          ascend: data.ascend,
          fromName: from.name, toName: to.name,
          fromLat: from.lat, fromLng: from.lng,
          toLat: to.lat, toLng: to.lng
        };
      } catch (e) {
        alert('Не вдалося побудувати маршрут: ' + e.message);
      } finally {
        this.loading = false;
      }
    },

    async fetchOsrmDriving(from, to) {
      const url = `https://router.project-osrm.org/route/v1/driving/` +
        `${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('OSRM ' + res.status);
      const j = await res.json();
      if (!j.routes || !j.routes.length) throw new Error('маршрут не знайдено');
      const r = j.routes[0];
      const km = (r.distance / 1000).toFixed(1);
      const min = Math.round(r.duration / 60);
      return {
        coords: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        distance: `${km} км`,
        duration: min < 60 ? `${min} хв` : `${Math.floor(min / 60)} год ${min % 60} хв`,
        ascend: null
      };
    },

    async fetchBRouterHiking(from, to) {
      const url = `https://brouter.de/brouter` +
        `?lonlats=${from.lng},${from.lat}|${to.lng},${to.lat}` +
        `&profile=hiking-mountain&alternativeidx=0&format=geojson`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('BRouter ' + res.status);
      const j = await res.json();
      const f = j.features && j.features[0];
      if (!f) throw new Error('пішого маршруту не знайдено');
      const p = f.properties || {};
      const km = ((+p['track-length'] || 0) / 1000).toFixed(1);
      const min = Math.round((+p['total-time'] || 0) / 60);
      const asc = +p['filtered ascend'] || 0;
      return {
        coords: f.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        distance: `${km} км`,
        duration: min < 60 ? `${min} хв` : `${Math.floor(min / 60)} год ${min % 60} хв`,
        ascend: asc > 0 ? `${asc} м` : null
      };
    },

    clearRoute() {
      if (this.routeLine) {
        this.map.removeLayer(this.routeLine);
        this.routeLine = null;
      }
      this.routeInfo = null;
    },

    locateMe() {
      if (!navigator.geolocation) {
        alert('Геолокація не підтримується у цьому браузері');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => {
          const ll = [pos.coords.latitude, pos.coords.longitude];
          this.userLatLng = ll;
          if (this.userMarker) this.map.removeLayer(this.userMarker);
          this.userMarker = markRaw(
            L.marker(ll, { icon: makeUserIcon(), zIndexOffset: 1000 })
              .bindTooltip('Ви тут')
              .addTo(this.map)
          );
          if (this.selected) {
            this.fetchRoute(
              { lat: ll[0], lng: ll[1], name: 'Я' },
              { lat: this.selected.lat, lng: this.selected.lng, name: this.selected.name },
              'driving'
            );
          } else {
            this.map.setView(ll, 11);
          }
        },
        err => {
          alert(
            err.code === 1
              ? 'Геолокацію заборонено. На ПК це нормально — використовуйте маршрути село → POI.'
              : 'Не вдалося визначити локацію: ' + err.message
          );
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    },

    openGoogleMapsRoute() {
      if (!this.selected) return;
      const dest = `${this.selected.lat},${this.selected.lng}`;
      const url = this.userLatLng
        ? `https://www.google.com/maps/dir/${this.userLatLng[0]},${this.userLatLng[1]}/${dest}`
        : `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
      window.open(url, '_blank', 'noopener');
    },

    wikilocUrl(lat, lng) { return `https://www.wikiloc.com/wikiloc/map.do?lt=${lat}&ln=${lng}&z=13`; },
    komootUrl(lat, lng) { return `https://www.komoot.com/discover/hiking-trails/@${lat},${lng},13z`; },
    googleDirUrl(r) {
      return `https://www.google.com/maps/dir/${r.fromLat},${r.fromLng}/${r.toLat},${r.toLng}`;
    }
  }
};
</script>

<style scoped>
.map-view { position: relative; width: 100%; height: 100%; }
.map-canvas { width: 100%; height: 100%; }

.map-toolbar {
  position: absolute;
  top: 60px;
  left: 12px;
  display: flex;
  gap: 6px;
  z-index: 1000;
  background: #fff;
  padding: 6px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.22);
  flex-wrap: wrap;
  max-width: calc(100vw - 24px);
}
.map-toolbar button {
  border: 1px solid #d8d3c8;
  background: #fff;
  border-radius: 8px;
  padding: 9px 12px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #2d2a24;
}
.map-toolbar button:hover { background: #f1ede2; }
.map-toolbar button.clear {
  background: #fbe8e3;
  color: #9a3324;
  border-color: #f2c5b9;
}

.route-info {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #fff;
  padding: 10px 14px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.25);
  font-size: 13px;
  z-index: 1000;
  max-width: calc(100vw - 24px);
  border-left: 4px solid #1f6f3f;
}
.route-info.foot { border-left-color: #9a3324; }
.ri-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.ri-mode { color: #1f6f3f; }
.route-info.foot .ri-mode { color: #9a3324; }
.ri-route { font-size: 13px; }
.ri-stat { font-size: 13px; font-weight: 700; }
.ri-verify {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  border-top: 1px dashed #e2ddd3;
  padding-top: 6px;
  font-size: 12px;
}
.ri-verify .warn {
  color: #9a3324;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.route-info.driving .ri-verify .warn { color: #5a5347; }
.ri-verify a {
  background: #f1ede2;
  color: #1f6f3f;
  padding: 4px 9px;
  border-radius: 9px;
  text-decoration: none;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.ri-verify a:hover { background: #e6f4ec; }

.loading-pill {
  position: absolute;
  top: 110px;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  padding: 8px 14px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  font-size: 13px;
  z-index: 1000;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

@media (max-width: 720px) {
  .map-toolbar { top: 54px; left: 8px; padding: 4px; }
  .map-toolbar button { padding: 8px 10px; font-size: 12px; }
  .route-info {
    bottom: 12px;
    font-size: 12px;
    padding: 8px 12px;
    width: calc(100vw - 16px);
  }
  .ri-route {
    width: 100%;
    text-align: center;
    font-size: 12px;
  }
}
</style>

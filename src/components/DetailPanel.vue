<template>
  <aside class="detail-panel" :class="{ expanded, collapsed: !expanded }">
    <!-- Peek-вкладка: тільки на мобілі. Стрілка показує напрямок дії -->
    <button class="peek-tab" @click="$emit('toggle-expand')">
      <span class="grip-bar"></span>
      <span class="tier-dot-peek" :style="{ background: tierMeta[village.tier].dotColor }"></span>
      <strong class="peek-title">{{ village.name }}</strong>
      <span class="peek-region">· {{ village.region }}</span>
      <Icon :name="expanded ? 'chevronDown' : 'chevronUp'" :size="18" class="peek-chev" />
    </button>

    <header class="sticky-head">
      <button class="grip-mobile" @click="$emit('toggle-expand')" title="Згорнути">
        <span class="grip-bar"></span>
      </button>
      <div class="head-row">
        <button class="ic-btn" @click="$emit('close')" title="Закрити">
          <Icon name="x" :size="20" />
        </button>
        <div class="breadcrumb">
          <span class="bc-region">{{ village.region }}</span>
          <Icon name="chevronRight" :size="14" />
          <span class="bc-current">{{ village.name }}</span>
        </div>
        <button class="ic-btn save" :class="{ active: isSaved }" @click="$emit('toggle-save')">
          <Icon :name="isSaved ? 'bookmark' : 'bookmarkPlus'" :size="20" />
        </button>
      </div>
      <div class="tier-strip">
        <span class="tier-dot" :style="{ background: tierMeta[village.tier].dotColor }"></span>
        <span class="tier-label">{{ tierMeta[village.tier].label }}</span>
        <button class="tier-info" @click="showTierNote = !showTierNote" title="Як це визначено">
          <Icon name="info" :size="13" />
        </button>
      </div>
      <p v-if="showTierNote" class="tier-note">{{ tierNote }}</p>
    </header>

    <div class="scroller">
      <!-- WIKIPEDIA -->
      <section v-if="wiki || wikiLoading" class="card section-wiki">
        <h3>
          <span class="h3-ic"><Icon name="wiki" :size="18" /></span>
          Опис
          <small class="src-tag">Wikipedia</small>
        </h3>
        <div v-if="wikiLoading" class="loading-row">
          <Icon name="loader" :size="14" spin /> Завантажуємо опис…
        </div>
        <article v-else class="wiki-card">
          <img v-if="wiki.thumbnail" :src="wiki.thumbnail" :alt="village.name" class="wiki-img" />
          <p>{{ wiki.extract }}</p>
          <a :href="wiki.pageUrl" target="_blank" rel="noopener" class="src-link">
            Читати далі <Icon name="externalLink" :size="12" />
          </a>
        </article>
      </section>

      <!-- POI -->
      <section class="card section-poi">
        <h3>
          <span class="h3-ic"><Icon name="landmark" :size="18" /></span>
          Що подивитись
          <span v-if="osmAttractions.length" class="count">{{ osmAttractions.length }}</span>
        </h3>
        <div class="src-row">
          <Icon name="info" :size="13" />
          <span>З OSM у радіусі 15 км · обране показано і на карті</span>
        </div>

        <div v-if="osmAttrLoading" class="loading-row">
          <Icon name="loader" :size="14" spin /> Шукаємо в OSM…
        </div>

        <div v-if="osmAttractions.length">
          <!-- Швидкі пресети -->
          <div class="filter-block">
            <div class="filter-label">Швидко</div>
            <div class="kind-filters">
              <button
                :class="['kind-chip preset', { active: !selectedAttrKinds.length && attrTop === 3 }]"
                @click="quickPresetAttr(3)"
              >Топ-3</button>
              <button
                :class="['kind-chip preset', { active: !selectedAttrKinds.length && attrTop === 10 }]"
                @click="quickPresetAttr(10)"
              >Топ-10</button>
              <button
                :class="['kind-chip preset', { active: !selectedAttrKinds.length && attrTop === -1 }]"
                @click="quickPresetAttr(-1)"
              >Усі ({{ osmAttractions.length }})</button>
            </div>
          </div>

          <!-- Фільтри типів — multi-select -->
          <div v-if="attractionKinds.length > 1" class="filter-block">
            <div class="filter-label">Тип ({{ selectedAttrKinds.length || 'усі' }})</div>
            <div class="kind-filters">
              <button
                v-for="k in attractionKinds"
                :key="k"
                :class="['kind-chip', { active: isAttrKindActive(k) }]"
                @click="toggleAttrKind(k)"
                :title="kindLabel(k)"
              >
                <Icon :name="iconFor(k)" :size="13" />
                <span class="chip-count">{{ kindCount(osmAttractions, k) }}</span>
              </button>
              <button
                v-if="selectedAttrKinds.length"
                class="kind-chip clear"
                @click="selectedAttrKinds = []"
              >
                <Icon name="x" :size="13" />
              </button>
            </div>
          </div>

          <!-- Скільки показати у списку (на карті — усі відфільтровані) -->
          <div class="top-toggle">
            <span class="filter-label">У списку</span>
            <button
              v-for="n in [3, 10, -1]"
              :key="n"
              :class="['top-chip', { active: attrTop === n }]"
              @click="attrTop = n"
            >{{ n === -1 ? 'Усі' : n }}</button>
            <span class="counter">{{ displayedAttractions.length }} / {{ filteredAttractions.length }}</span>
          </div>

          <ul v-if="displayedAttractions.length" class="item-list">
            <li v-for="a in displayedAttractions" :key="a.id">
              <div class="item-head clickable" @click="focusItem(a)">
                <Icon :name="iconFor(a.kind)" :size="16" class="item-ic" />
                <div class="item-name">
                  <strong>{{ a.name }}</strong>
                  <div class="item-meta">
                    <span v-if="a.ele">{{ a.ele }} м</span>
                    <span>{{ a._dist.toFixed(1) }} км</span>
                  </div>
                </div>
                <Icon name="mapPin" :size="14" class="focus-hint" />
              </div>
              <div class="item-actions">
                <button class="btn-route drive" @click="$emit('route', { highlight: a, mode: 'driving' })">
                  <Icon name="car" :size="14" /> Авто
                </button>
                <button class="btn-route foot" @click="$emit('route', { highlight: a, mode: 'foot' })">
                  <Icon name="foot" :size="14" /> Пішки
                </button>
              </div>

              <div class="item-verify">
                <a :href="wikilocUrl(a.lat, a.lng)" target="_blank" rel="noopener" class="lnk">
                  <Icon name="foot" :size="12" /> Wikiloc
                </a>
                <a :href="komootDiscoverUrl(a.lat, a.lng)" target="_blank" rel="noopener" class="lnk">
                  <Icon name="navigate" :size="12" /> Komoot
                </a>
                <a :href="googleMapsXY(a.lat, a.lng)" target="_blank" rel="noopener" class="lnk">
                  <Icon name="mapPin" :size="12" /> На карті
                </a>
                <a v-if="a.wikipedia" :href="wikiUrl(a.wikipedia)" target="_blank" rel="noopener" class="lnk">
                  <Icon name="wiki" :size="12" /> Wiki
                </a>
              </div>
            </li>
          </ul>
          <p v-else class="muted small">Жодного збігу за обраними типами.</p>
        </div>

        <p v-else-if="!osmAttrLoading" class="muted small">У радіусі 15 км OSM нічого не повертає.</p>
        <div class="ext-links-row">
          <a :href="village.externalLinks.wikilocArea" target="_blank" rel="noopener" class="ext-link">
            <Icon name="foot" :size="14" /> Wikiloc треки навколо
          </a>
          <a :href="village.externalLinks.komoot" target="_blank" rel="noopener" class="ext-link">
            <Icon name="navigate" :size="14" /> Komoot
          </a>
        </div>
      </section>

      <!-- ЖИТЛО -->
      <section class="card section-lodging">
        <h3>
          <span class="h3-ic"><Icon name="hotel" :size="18" /></span>
          Житло
          <span v-if="osmLodging.length" class="count">{{ osmLodging.length }}</span>
        </h3>
        <div class="src-row">
          <Icon name="info" :size="13" />
          <span>З OSM у радіусі 8 км. Контакти можуть бути неповними.</span>
        </div>

        <div v-if="osmLoading" class="loading-row">
          <Icon name="loader" :size="14" spin /> Шукаємо в OSM…
        </div>

        <div v-if="osmLodging.length">
          <div class="filter-block">
            <div class="filter-label">Швидко</div>
            <div class="kind-filters">
              <button
                :class="['kind-chip preset', { active: !selectedLodgingKinds.length && lodgingTop === 3 }]"
                @click="quickPresetLodging(3)"
              >Топ-3</button>
              <button
                :class="['kind-chip preset', { active: !selectedLodgingKinds.length && lodgingTop === 10 }]"
                @click="quickPresetLodging(10)"
              >Топ-10</button>
              <button
                :class="['kind-chip preset', { active: !selectedLodgingKinds.length && lodgingTop === -1 }]"
                @click="quickPresetLodging(-1)"
              >Усі ({{ osmLodging.length }})</button>
            </div>
          </div>

          <div v-if="lodgingKinds.length > 1" class="filter-block">
            <div class="filter-label">Тип ({{ selectedLodgingKinds.length || 'усі' }})</div>
            <div class="kind-filters">
              <button
                v-for="k in lodgingKinds"
                :key="k"
                :class="['kind-chip', { active: isLodgingKindActive(k) }]"
                @click="toggleLodgingKind(k)"
                :title="kindLabel(k)"
              >
                <Icon :name="iconFor(k)" :size="13" />
                <span class="chip-count">{{ kindCount(osmLodging, k) }}</span>
              </button>
              <button
                v-if="selectedLodgingKinds.length"
                class="kind-chip clear"
                @click="selectedLodgingKinds = []"
              >
                <Icon name="x" :size="13" />
              </button>
            </div>
          </div>

          <div class="top-toggle">
            <span class="filter-label">У списку</span>
            <button
              v-for="n in [3, 10, -1]"
              :key="n"
              :class="['top-chip', { active: lodgingTop === n }]"
              @click="lodgingTop = n"
            >{{ n === -1 ? 'Усі' : n }}</button>
            <span class="counter">{{ displayedLodging.length }} / {{ filteredLodging.length }}</span>
          </div>

          <ul class="item-list">
            <li v-for="a in displayedLodging" :key="a.id">
              <div class="item-head clickable" @click="focusItem(a)">
                <Icon :name="iconFor(a.kind)" :size="16" class="item-ic lodging-ic" />
                <div class="item-name">
                  <strong>{{ a.title }}</strong>
                  <div class="item-meta">
                    <span>{{ kindLabel(a.kind) }}</span>
                    <span v-if="a.addr">{{ a.addr }}</span>
                    <span v-if="a.stars">★ {{ a.stars }}</span>
                  </div>
                </div>
                <Icon name="mapPin" :size="14" class="focus-hint" />
              </div>
              <div class="item-actions">
                <a v-if="a.phone" :href="'tel:' + a.phone.replace(/\s+/g, '')" class="btn-route phone">
                  <Icon name="phone" :size="14" /> {{ a.phone }}
                </a>
                <a v-if="a.website" :href="a.website" target="_blank" rel="noopener" class="btn-route website">
                  <Icon name="globe" :size="14" /> Сайт
                </a>
                <a :href="googleMapsXY(a.lat, a.lng)" target="_blank" rel="noopener" class="btn-route locate">
                  <Icon name="mapPin" :size="14" /> На карті
                </a>
              </div>
            </li>
          </ul>
        </div>

        <p v-else-if="!osmLoading" class="muted small">
          У радіусі 8 км OSM нічого не знайшов.
        </p>

        <div class="ext-links-row">
          <a :href="village.externalLinks.booking" target="_blank" rel="noopener" class="ext-link">
            <Icon name="hotel" :size="14" /> Booking
          </a>
          <a :href="village.externalLinks.airbnb" target="_blank" rel="noopener" class="ext-link">
            <Icon name="home" :size="14" /> Airbnb
          </a>
          <a :href="village.externalLinks.olx" target="_blank" rel="noopener" class="ext-link">
            <Icon name="list" :size="14" /> OLX
          </a>
        </div>
      </section>

      <!-- ГІДИ -->
      <section class="card section-guides">
        <h3>
          <span class="h3-ic"><Icon name="compass" :size="18" /></span>
          Гіди / екскурсії
        </h3>
        <p class="src-row">
          <Icon name="warn" :size="13" />
          <span>Відкритого API гідів немає. Не зберігаємо вигаданих контактів.</span>
        </p>
        <div class="ext-links-row">
          <a :href="village.externalLinks.getyourguide" target="_blank" rel="noopener" class="ext-link">
            <Icon name="globe" :size="14" /> GetYourGuide
          </a>
          <a :href="village.externalLinks.tripster" target="_blank" rel="noopener" class="ext-link">
            <Icon name="globe" :size="14" /> Tripster
          </a>
          <a :href="village.externalLinks.googleSearchGuide" target="_blank" rel="noopener" class="ext-link">
            <Icon name="search" :size="14" /> Google
          </a>
        </div>
      </section>

      <!-- ТРАНСПОРТ -->
      <section class="card section-transport">
        <h3>
          <span class="h3-ic"><Icon name="train" :size="18" /></span>
          Як дістатись
          <span v-if="transport.length" class="count">{{ transport.length }}</span>
        </h3>
        <div class="src-row">
          <Icon name="info" :size="13" />
          <span>Вокзали, автостанції, аеропорти у радіусі 40 км · з OSM</span>
        </div>

        <div v-if="transportLoading" class="loading-row">
          <Icon name="loader" :size="14" spin /> Шукаємо транспорт…
        </div>

        <div v-if="transport.length">
          <div class="top-toggle">
            <span class="filter-label">У кожній групі</span>
            <button
              v-for="n in [3, 10, -1]"
              :key="n"
              :class="['top-chip', { active: transportTop === n }]"
              @click="transportTop = n"
            >{{ n === -1 ? 'Усі' : n }}</button>
          </div>

          <!-- Розбивка по типах: вокзали / автостанції / аеропорти -->
          <div
            v-for="(items, kind) in transportByKind"
            :key="kind"
            class="tr-group"
          >
            <div class="tr-group-head">
              <Icon :name="iconFor(kind)" :size="14" />
              <strong>{{ transportLabel(kind) }}</strong>
              <span class="tr-count">{{ items.length }}</span>
            </div>
            <ul class="item-list">
              <li v-for="t in items.slice(0, transportTop === -1 ? items.length : transportTop)" :key="t.id">
                <div class="item-head clickable" @click="focusItem(t)">
                  <Icon :name="iconFor(t.kind)" :size="16" class="item-ic tr-ic" />
                  <div class="item-name">
                    <strong>{{ t.name }}</strong>
                    <div class="item-meta">
                      <span>{{ t._dist.toFixed(1) }} км від {{ village.name }}</span>
                      <span v-if="t.operator">{{ t.operator }}</span>
                    </div>
                  </div>
                  <Icon name="mapPin" :size="14" class="focus-hint" />
                </div>
                <div class="item-actions">
                  <button class="btn-route drive" @click="$emit('route', { highlight: t, mode: 'driving' })">
                    <Icon name="car" :size="14" /> Маршрут авто
                  </button>
                  <a v-if="t.phone" :href="'tel:' + t.phone.replace(/\s+/g, '')" class="btn-route phone">
                    <Icon name="phone" :size="14" /> {{ t.phone }}
                  </a>
                  <a v-if="t.website" :href="t.website" target="_blank" rel="noopener" class="btn-route website">
                    <Icon name="globe" :size="14" /> Сайт
                  </a>
                  <a :href="googleMapsXY(t.lat, t.lng)" target="_blank" rel="noopener" class="btn-route locate">
                    <Icon name="mapPin" :size="14" /> На карті
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <p v-else-if="!transportLoading" class="muted small">
          У радіусі 40 км нічого не знайдено. Можливо, найближча станція ще далі — спробуйте Google Maps.
        </p>

        <div class="ext-links-row">
          <a :href="uzUkrZalUrl(village.name)" target="_blank" rel="noopener" class="ext-link">
            <Icon name="train" :size="14" /> Укрзалізниця
          </a>
          <a :href="busfor(village.name)" target="_blank" rel="noopener" class="ext-link">
            <Icon name="bus" :size="14" /> Busfor
          </a>
          <a :href="blablacarUrl(village.name)" target="_blank" rel="noopener" class="ext-link">
            <Icon name="car" :size="14" /> BlaBlaCar
          </a>
        </div>
      </section>

      <footer class="disclaimer">
        <Icon name="warn" :size="14" />
        <span>Дані з OSM / Wikipedia. Перед поїздкою перевіряйте умови погоди, стан доріг і відкритість об’єктів.</span>
      </footer>
    </div>
  </aside>
</template>

<script>
import Icon from './Icon.vue';
import { tierMeta, tierNote } from '../data/villages.js';
import { fetchLodging, fetchAttractions, fetchTransport, KIND_LABEL, TRANSPORT_LABEL } from '../utils/overpass.js';
import { fetchSummary } from '../utils/wikipedia.js';

const KIND_TO_ICON = {
  peak: 'peak', waterfall: 'waterfall', cave: 'cave',
  viewpoint: 'viewpoint', museum: 'museum', artwork: 'artwork',
  castle: 'castle', monastery: 'monastery', ruins: 'ruins',
  monument: 'monument', shrine: 'shrine', church: 'church',
  attraction: 'attraction', landmark: 'landmark',
  hotel: 'hotel', guest_house: 'guest_house', hostel: 'hostel',
  apartment: 'apartment', chalet: 'chalet', camp_site: 'camp_site',
  motel: 'motel', alpine_hut: 'alpine_hut',
  train_station: 'train_station', train_halt: 'train_halt',
  bus_station: 'bus_station', airport: 'airport'
};

export default {
  name: 'DetailPanel',
  components: { Icon },
  props: {
    village: { type: Object, required: true },
    isSaved: { type: Boolean, default: false },
    expanded: { type: Boolean, default: false }
  },
  emits: ['close', 'toggle-save', 'toggle-expand', 'route', 'visible-update', 'focus-item'],
  data() {
    return {
      tierMeta, tierNote,
      showTierNote: false,
      wiki: null,
      wikiLoading: false,
      osmLodging: [],
      osmLoading: false,
      osmAttractions: [],
      osmAttrLoading: false,
      // Фільтри
      selectedAttrKinds: [],   // [] = усі
      attrTop: 3,              // 3 | 10 | -1
      selectedLodgingKinds: [],
      lodgingTop: 3,
      // Транспорт
      transport: [],
      transportLoading: false,
      transportTop: 3
    };
  },
  computed: {
    attractionKinds() {
      return [...new Set(this.osmAttractions.map(a => a.kind))];
    },
    lodgingKinds() {
      return [...new Set(this.osmLodging.map(a => a.kind))];
    },
    filteredAttractions() {
      return this.selectedAttrKinds.length
        ? this.osmAttractions.filter(a => this.selectedAttrKinds.includes(a.kind))
        : this.osmAttractions;
    },
    displayedAttractions() {
      return this.attrTop === -1
        ? this.filteredAttractions
        : this.filteredAttractions.slice(0, this.attrTop);
    },
    filteredLodging() {
      return this.selectedLodgingKinds.length
        ? this.osmLodging.filter(a => this.selectedLodgingKinds.includes(a.kind))
        : this.osmLodging;
    },
    displayedLodging() {
      return this.lodgingTop === -1
        ? this.filteredLodging
        : this.filteredLodging.slice(0, this.lodgingTop);
    },
    displayedTransport() {
      return this.transportTop === -1
        ? this.transport
        : this.transport.slice(0, this.transportTop);
    },
    transportByKind() {
      const groups = {};
      for (const t of this.transport) {
        if (!groups[t.kind]) groups[t.kind] = [];
        groups[t.kind].push(t);
      }
      return groups;
    }
  },
  watch: {
    village: {
      immediate: true,
      handler(v) {
        if (!v) return;
        this.selectedAttrKinds = [];
        this.attrTop = 3;
        this.selectedLodgingKinds = [];
        this.lodgingTop = 3;
        this.transportTop = 3;
        this.showTierNote = false;
        this.loadWiki(v);
        this.loadOsmLodging(v);
        this.loadOsmAttractions(v);
        this.loadTransport(v);
      }
    },
    // Карта показує те ж саме, що список: фільтр + Top-N.
    // Натиснули "Top-3" → 3 маркери. Натиснули "Гори" → лише гори (з тим же Top-N).
    displayedAttractions(val) { this.emitVisible(val, this.displayedLodging); },
    displayedLodging(val)     { this.emitVisible(this.displayedAttractions, val); }
  },
  methods: {
    emitVisible(attractions, lodging) {
      this.$emit('visible-update', {
        attractions: attractions.map(a => ({ ...a, _kind: 'attraction' })),
        lodging: lodging.map(a => ({ ...a, _kind: 'lodging' }))
      });
    },
    async loadWiki(v) {
      this.wiki = null;
      this.wikiLoading = true;
      try {
        const s = await fetchSummary(v.wikipedia || v.name);
        if (this.village.id !== v.id) return;
        this.wiki = s;
      } finally { this.wikiLoading = false; }
    },
    async loadOsmLodging(v) {
      this.osmLodging = [];
      this.osmLoading = true;
      try {
        const items = await fetchLodging(v.lat, v.lng, 8000);
        if (this.village.id !== v.id) return;
        this.osmLodging = items;
      } catch (e) {} finally { this.osmLoading = false; }
    },
    async loadOsmAttractions(v) {
      this.osmAttractions = [];
      this.osmAttrLoading = true;
      try {
        const items = await fetchAttractions(v.lat, v.lng, 15000);
        if (this.village.id !== v.id) return;
        this.osmAttractions = items;
      } catch (e) {} finally { this.osmAttrLoading = false; }
    },
    async loadTransport(v) {
      this.transport = [];
      this.transportLoading = true;
      try {
        const items = await fetchTransport(v.lat, v.lng, 40000);
        if (this.village.id !== v.id) return;
        this.transport = items;
      } catch (e) {} finally { this.transportLoading = false; }
    },
    focusItem(item) {
      this.$emit('focus-item', {
        id: item.id,
        lat: item.lat,
        lng: item.lng,
        name: item.name || item.title,
        ts: Date.now()
      });
    },
    transportLabel(k) { return TRANSPORT_LABEL[k] || 'Зупинка'; },
    quickPresetAttr(n) {
      this.selectedAttrKinds = [];
      this.attrTop = n;
    },
    quickPresetLodging(n) {
      this.selectedLodgingKinds = [];
      this.lodgingTop = n;
    },
    toggleAttrKind(k) {
      this.selectedAttrKinds = this.selectedAttrKinds.includes(k)
        ? this.selectedAttrKinds.filter(x => x !== k)
        : [...this.selectedAttrKinds, k];
    },
    isAttrKindActive(k) { return this.selectedAttrKinds.includes(k); },
    toggleLodgingKind(k) {
      this.selectedLodgingKinds = this.selectedLodgingKinds.includes(k)
        ? this.selectedLodgingKinds.filter(x => x !== k)
        : [...this.selectedLodgingKinds, k];
    },
    isLodgingKindActive(k) { return this.selectedLodgingKinds.includes(k); },
    iconFor(kind) { return KIND_TO_ICON[kind] || 'landmark'; },
    kindLabel(kind) { return (KIND_LABEL[kind] || '').replace(/^.\s/, '') || 'Житло'; },
    kindCount(list, k) { return list.filter(a => a.kind === k).length; },
    wikilocUrl(lat, lng) { return `https://www.wikiloc.com/wikiloc/map.do?lt=${lat}&ln=${lng}&z=13`; },
    komootDiscoverUrl(lat, lng) { return `https://www.komoot.com/discover/hiking-trails/@${lat},${lng},13z`; },
    googleMapsXY(lat, lng) { return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`; },
    uzUkrZalUrl(name) {
      return `https://booking.uz.gov.ua/?to=${encodeURIComponent(name)}`;
    },
    busfor(name) {
      return `https://busfor.ua/uk/avtobus?TO=${encodeURIComponent(name)}`;
    },
    blablacarUrl(name) {
      return `https://www.blablacar.ua/search?fn=${encodeURIComponent(name)}`;
    },
    wikiUrl(tag) {
      if (!tag) return '#';
      const i = tag.indexOf(':');
      const lang = i > 0 ? tag.slice(0, i) : 'uk';
      const title = i > 0 ? tag.slice(i + 1) : tag;
      return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s/g, '_'))}`;
    }
  }
};
</script>

<style scoped>
.detail-panel {
  position: absolute;
  top: 0; right: 0; bottom: 0;
  width: 420px;
  max-width: 92vw;
  background: #fff;
  border-left: 2px solid #1f6f3f;
  box-shadow: -10px 0 28px rgba(0,0,0,0.22);
  z-index: 1500;
  display: flex;
  flex-direction: column;
}

.sticky-head {
  position: sticky; top: 0; z-index: 2;
  background: #fff;
  border-bottom: 1px solid #ece8de;
  padding: 8px 12px 10px;
}
.grip-mobile { display: none; }
.head-row { display: flex; align-items: center; gap: 6px; }
.ic-btn {
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  width: 36px; height: 36px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #5a5347;
  flex-shrink: 0;
}
.ic-btn:hover { background: #f1ede2; }
.ic-btn.save.active { color: #d4a017; }
.breadcrumb { flex: 1; display: flex; align-items: center; gap: 4px; font-size: 13px; min-width: 0; }
.bc-region { color: #7a7363; white-space: nowrap; }
.bc-current { font-weight: 700; font-size: 15px; color: #2d2a24; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tier-strip { display: flex; align-items: center; gap: 7px; margin-top: 6px; font-size: 12px; color: #5a5347; }
.tier-dot { width: 10px; height: 10px; border-radius: 50%; }
.tier-label { font-weight: 600; }
.tier-info { border: none; background: transparent; cursor: pointer; color: #7a7363; display: inline-flex; padding: 2px; }
.tier-note {
  background: #fff8e6;
  border: 1px solid #f0c36d;
  border-radius: 6px;
  padding: 7px 10px;
  font-size: 12px;
  color: #5a4500;
  margin: 6px 0 0;
}

.scroller {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px 28px;
  -webkit-overflow-scrolling: touch;
  background: #f5f3ef;
}
section { margin-top: 14px; }
section:first-of-type { margin-top: 0; }

/* === Сучасні картки секцій === */
.card {
  background: #fff;
  border: 1px solid #ece8de;
  border-radius: 14px;
  padding: 14px 14px 16px;
  margin-top: 14px;
  position: relative;
  overflow: hidden;
}
.card::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, var(--accent, #1f6f3f), var(--accent-end, #1f6f3f));
  border-radius: 0 4px 4px 0;
}

/* Тематичні акценти по секціях */
.section-wiki      { --accent: #7a4ca5; --accent-end: #5a3a85; }
.section-poi       { --accent: #1f6f3f; --accent-end: #155a30; }
.section-lodging   { --accent: #c69100; --accent-end: #a36a00; }
.section-guides    { --accent: #3b6ea5; --accent-end: #2a5b8c; }
.section-transport { --accent: #2a5b8c; --accent-end: #1d4570; }

h3 {
  margin: 0 0 12px;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.2px;
  color: #1a1814;
  display: flex;
  align-items: center;
  gap: 9px;
  padding-left: 6px;
}
.h3-ic {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: var(--accent, #1f6f3f);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0,0,0,0.12);
}
h3 .count {
  background: rgba(0,0,0,0.05);
  color: var(--accent, #1f6f3f);
  font-size: 12px;
  padding: 3px 9px;
  border-radius: 9px;
  font-weight: 700;
  margin-left: auto;
}
h3 .src-tag {
  margin-left: auto;
  font-size: 11px;
  background: rgba(0,0,0,0.05);
  color: #5a5347;
  padding: 3px 8px;
  border-radius: 9px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.src-row {
  display: flex; align-items: center; gap: 6px;
  color: #7a7363; font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin: 0 0 10px;
}

.loading-row { display: flex; align-items: center; gap: 8px; color: #5a5347; font-size: 13px; padding: 8px 0; }

.wiki-card { background: transparent; border: none; padding: 0; font-size: 14px; line-height: 1.5; }
.wiki-card p { margin: 0 0 8px; color: #2d2a24; }
.wiki-img { width: 100%; height: 140px; object-fit: cover; border-radius: 6px; margin-bottom: 10px; }
.src-link { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: #1f6f3f; text-decoration: none; font-weight: 600; }
.src-link:hover { text-decoration: underline; }

/* === Фільтри === */
.filter-block { margin-bottom: 10px; }
.filter-label {
  font-size: 11px;
  font-weight: 700;
  color: #7a7363;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 5px;
  display: inline-block;
  margin-right: 8px;
}
.kind-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.kind-chip {
  border: 1px solid #d8d3c8;
  background: #fff;
  border-radius: 14px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
  color: #5a5347;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 32px;
  transition: all 0.12s;
}
.kind-chip .chip-count { font-weight: 700; }
.kind-chip:hover { background: #f1ede2; }
.kind-chip.active {
  background: #1f6f3f;
  color: #fff;
  border-color: #1f6f3f;
  box-shadow: 0 2px 6px rgba(31, 111, 63, 0.3);
}
.kind-chip.clear {
  border-color: #f2c5b9;
  background: #fbe8e3;
  color: #9a3324;
}
.kind-chip.clear:hover { background: #f5d7cd; }
.kind-chip.preset {
  font-weight: 700;
  border-color: #b4c9bd;
  background: #f1ede2;
}
.kind-chip.preset.active {
  background: #1f6f3f;
  color: #fff;
  border-color: #1f6f3f;
}

.top-toggle {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 10px 0 12px;
  flex-wrap: wrap;
}
.top-chip {
  border: 1px solid #d8d3c8;
  background: #fff;
  border-radius: 14px;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
  color: #5a5347;
  font-weight: 600;
}
.top-chip.active {
  background: #1f6f3f;
  color: #fff;
  border-color: #1f6f3f;
}
.counter {
  margin-left: auto;
  font-size: 11px;
  color: #9a9382;
  font-weight: 600;
}

/* === Items === */
.item-list { list-style: none; padding: 0; margin: 0; }
.item-list li {
  background: #fafaf7;
  border: 1px solid #ece8de;
  border-radius: 10px;
  padding: 11px 12px;
  margin-bottom: 8px;
}
.item-head { display: flex; gap: 9px; align-items: flex-start; margin-bottom: 8px; }
.item-head.clickable {
  cursor: pointer;
  margin: -4px -4px 6px;
  padding: 6px;
  border-radius: 6px;
  transition: background 0.12s;
}
.item-head.clickable:hover { background: #f1ede2; }
.focus-hint {
  color: #b4ad9c;
  margin-left: auto;
  flex-shrink: 0;
  margin-top: 4px;
}
.item-head.clickable:hover .focus-hint { color: #1f6f3f; }

.btn-route.bus-link {
  background: #e8eef7;
  border-color: #3b6ea5;
  color: #3b6ea5;
  text-decoration: none;
}
.btn-route.bus-link:hover { background: #d5e1f2; }
.bus-stops {
  background: #e8eef7;
  border: 1px solid #cdd7e6;
  border-radius: 8px;
  padding: 10px 12px;
  margin-top: 8px;
}
.bus-stops-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #2a5b8c;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}
.bus-stops-list { list-style: none; padding: 0; margin: 0 0 8px; }
.bus-stops-list li {
  background: #fff;
  border-radius: 6px;
  padding: 7px 10px;
  margin-bottom: 5px;
  font-size: 12.5px;
}
.bs-name {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.bs-name strong { color: #2d2a24; }
.bs-dist {
  background: #e6f4ec;
  color: #1f6f3f;
  padding: 2px 7px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}
.bs-routes {
  font-size: 11px;
  color: #5a5347;
  margin-top: 3px;
}
.bs-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: #3b6ea5;
  text-decoration: none;
  margin-top: 4px;
}
.bus-stops-ext {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  padding-top: 6px;
  border-top: 1px dashed #cdd7e6;
}
.item-ic { color: #1f6f3f; margin-top: 2px; flex-shrink: 0; }
.item-ic.lodging-ic { color: #a17a00; }
.item-ic.tr-ic { color: #2a5b8c; }

.tr-group { margin-bottom: 14px; }
.tr-group-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0 6px;
  font-size: 12.5px;
  color: #2d2a24;
}
.tr-group-head strong { font-weight: 700; }
.tr-count {
  background: #e8eef7;
  color: #2a5b8c;
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 8px;
  font-weight: 700;
  margin-left: auto;
}
.item-name { flex: 1; min-width: 0; }
.item-name strong { display: block; font-size: 14px; color: #2d2a24; }
.item-meta {
  display: flex; gap: 10px; flex-wrap: wrap;
  margin-top: 2px; font-size: 11.5px; color: #7a7363;
}
.item-actions { display: flex; flex-wrap: wrap; gap: 6px; }
.btn-route {
  border: 1px solid;
  border-radius: 7px;
  padding: 6px 10px;
  font-size: 12.5px;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
  min-height: 32px;
}
.btn-route.drive { background: #e6f4ec; border-color: #1f6f3f; color: #1f6f3f; }
.btn-route.drive:hover { background: #d2ead9; }
.btn-route.foot { background: #fbe8e3; border-color: #9a3324; color: #9a3324; }
.btn-route.foot:hover { background: #f5d7cd; }
.btn-route.phone { background: #fff; border-color: #1f6f3f; color: #1f6f3f; }
.btn-route.website,
.btn-route.locate { background: #fff; border-color: #d8d3c8; color: #5a5347; }

.item-verify {
  display: flex; flex-wrap: wrap; gap: 4px;
  margin-top: 8px; padding-top: 8px;
  border-top: 1px dashed #e2ddd3;
}
.lnk {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; color: #5a5347;
  background: #fff; border: 1px solid #d8d3c8;
  padding: 4px 7px; border-radius: 6px;
  text-decoration: none;
}
.lnk:hover { background: #f1ede2; color: #1f6f3f; }

.ext-links-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
.ext-link {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 11px;
  background: #f1ede2;
  border-radius: 8px;
  text-decoration: none;
  font-size: 13px;
  color: #1f6f3f;
  font-weight: 600;
}
.ext-link:hover { background: #e6f4ec; }

.muted { color: #7a7363; font-size: 13px; margin: 8px 0 0; display: flex; align-items: center; gap: 6px; }
.muted.small { font-size: 12px; }

.disclaimer {
  margin-top: 28px;
  padding: 12px;
  background: #fff8e6;
  border: 1px solid #f0c36d;
  border-radius: 8px;
  color: #5a4500;
  font-size: 12px;
  line-height: 1.45;
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

/* === Peek-вкладка прихована на desktop === */
.peek-tab { display: none; }
.tier-dot-peek { display: none; }

@media (max-width: 720px) {
  .detail-panel {
    top: auto; left: 0; right: 0; bottom: 0;
    width: 100vw; max-width: none;
    height: 90vh;
    border-left: none;
    border-top: none;
    border-radius: 18px 18px 0 0;
    box-shadow: 0 -12px 32px rgba(0,0,0,0.28);
    transition: height 0.28s cubic-bezier(0.32, 0.72, 0.2, 1);
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
  /* Згорнутий стан — велика peek-вкладка, видима поверх системного бару */
  .detail-panel.collapsed {
    height: calc(96px + env(safe-area-inset-bottom, 0));
    overflow: hidden;
  }

  /* Peek-вкладка — повноцінна кнопка, видима тільки на мобілі */
  .peek-tab {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    border: none;
    background: #fff;
    cursor: pointer;
    padding: 18px 18px 16px;
    flex-shrink: 0;
    border-bottom: 1px solid #ece8de;
    position: relative;
    min-height: 88px;
  }
  .peek-tab::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 48px;
    height: 5px;
    background: #c4beaf;
    border-radius: 3px;
  }
  .peek-tab .grip-bar { display: none; }
  .tier-dot-peek {
    display: inline-block;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 0 0 3px rgba(0,0,0,0.06);
  }
  .peek-title {
    font-size: 18px;
    font-weight: 800;
    color: #1a1814;
    flex: 1;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    letter-spacing: -0.2px;
  }
  .peek-region {
    font-size: 12px;
    color: #7a7363;
    flex-shrink: 0;
  }
  .peek-chev {
    color: #fff;
    background: #1f6f3f;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    padding: 6px;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(31, 111, 63, 0.35);
  }

  /* Sticky-head і scroller сховані у згорнутому стані */
  .detail-panel.collapsed .sticky-head,
  .detail-panel.collapsed .scroller { display: none; }

  /* Звичайний sticky-head: ховаємо grip коли peek є */
  .grip-mobile { display: none; }

  .scroller { padding-bottom: 80px; }
}
</style>

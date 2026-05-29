<template>
  <div class="app-shell">
    <MapView
      class="map-layer"
      :villages="villages"
      :selected="selectedVillage"
      :route-request="routeRequest"
      :focus-request="focusRequest"
      :visible-attractions="visibleAttractions"
      :visible-lodging="visibleLodging"
      @select="onSelect"
      @map-interaction="onMapInteraction"
    />

    <!-- Top bar — постійно бачимо назву додатку та контекст -->
    <header class="topbar">
      <button class="logo-btn" @click="drawerOpen = true" title="Список сіл">
        <Icon name="mountain" :size="20" />
        <span class="logo-text">Crypts</span>
      </button>
      <div v-if="selectedVillage" class="ctx-breadcrumb">
        <Icon name="chevronRight" :size="14" />
        <span class="ctx-region">{{ selectedVillage.region }}</span>
        <Icon name="chevronRight" :size="14" />
        <strong>{{ selectedVillage.name }}</strong>
      </div>
      <div v-else class="ctx-tagline">Карпати &amp; Закарпаття</div>
      <span v-if="isOffline" class="offline-pill" title="Немає інтернету — працюємо з кешу">
        <Icon name="warn" :size="14" /> офлайн
      </span>
      <button v-if="savedIds.length" class="saved-btn" @click="openDrawer('saved')" title="Збережені">
        <Icon name="bookmark" :size="18" />
        <span>{{ savedIds.length }}</span>
      </button>
    </header>

    <!-- Floating list button -->
    <button class="fab-list" @click="drawerOpen = true"
            :class="{ hidden: drawerOpen || (selectedVillage && detailExpanded) }">
      <Icon name="list" :size="20" />
      <span>Сёла ({{ villages.length }})</span>
    </button>

    <!-- Drawer -->
    <transition name="drawer">
      <div v-if="drawerOpen" class="drawer-backdrop" @click="drawerOpen = false">
        <aside class="drawer" @click.stop>
          <header class="drawer-head">
            <div class="logo">
              <Icon name="mountain" :size="22" />
              <div>
                <div class="logo-name">Crypts</div>
                <small>Карпати на карті</small>
              </div>
            </div>
            <button class="close-x" @click="drawerOpen = false">
              <Icon name="x" :size="20" />
            </button>
          </header>
          <nav class="tabs">
            <button :class="{ active: tab === 'villages' }" @click="tab = 'villages'">
              <Icon name="list" :size="16" /> Сёла
            </button>
            <button :class="{ active: tab === 'saved' }" @click="tab = 'saved'">
              <Icon name="bookmark" :size="16" /> Збережені
              <span v-if="savedIds.length" class="badge">{{ savedIds.length }}</span>
            </button>
          </nav>
          <VillagesList
            v-if="tab === 'villages'"
            :villages="villages"
            :selected-id="selectedId"
            @select="onSelectFromDrawer"
          />
          <SavedList
            v-else
            :villages="savedVillages"
            :selected-id="selectedId"
            @select="onSelectFromDrawer"
            @remove="toggleSave"
          />
        </aside>
      </div>
    </transition>

    <DetailPanel
      v-if="selectedVillage"
      :village="selectedVillage"
      :is-saved="isSaved(selectedVillage.id)"
      :expanded="detailExpanded"
      @close="onCloseDetail"
      @toggle-save="toggleSave(selectedVillage.id)"
      @toggle-expand="detailExpanded = !detailExpanded"
      @route="onRouteRequest"
      @visible-update="onVisibleUpdate"
      @focus-item="onFocusItem"
    />
  </div>
</template>

<script>
import VillagesList from './components/VillagesList.vue';
import SavedList from './components/SavedList.vue';
import MapView from './components/MapView.vue';
import DetailPanel from './components/DetailPanel.vue';
import Icon from './components/Icon.vue';
import { villages } from './data/villages.js';
import { loadSaved, saveSaved } from './utils/storage.js';
import { fetchLodging, fetchAttractions } from './utils/overpass.js';
import { fetchSummary } from './utils/wikipedia.js';
import { prefetchTiles } from './utils/registerSW.js';

export default {
  name: 'App',
  components: { VillagesList, SavedList, MapView, DetailPanel, Icon },
  data() {
    return {
      villages,
      tab: 'villages',
      selectedId: null,
      savedIds: loadSaved(),
      drawerOpen: false,
      detailExpanded: false,
      routeRequest: null,
      focusRequest: null,
      visibleAttractions: [],
      visibleLodging: [],
      isOffline: !navigator.onLine
    };
  },
  mounted() {
    window.addEventListener('online',  () => { this.isOffline = false; });
    window.addEventListener('offline', () => { this.isOffline = true; });
  },
  computed: {
    selectedVillage() {
      return this.villages.find(v => v.id === this.selectedId) || null;
    },
    savedVillages() {
      return this.savedIds
        .map(id => this.villages.find(v => v.id === id))
        .filter(Boolean);
    }
  },
  methods: {
    onSelect(id) {
      this.selectedId = id;
      this.detailExpanded = true;   // одразу розгорнуто на 90%
    },
    onSelectFromDrawer(id) {
      this.selectedId = id;
      this.detailExpanded = true;
      this.drawerOpen = false;
    },
    onMapInteraction() {
      // Клік / drag по карті — згортаємо панель у peek-вкладку
      if (this.selectedVillage) this.detailExpanded = false;
    },
    openDrawer(tab) {
      this.tab = tab;
      this.drawerOpen = true;
    },
    isSaved(id) {
      return this.savedIds.includes(id);
    },
    toggleSave(id) {
      const wasSaved = this.isSaved(id);
      this.savedIds = wasSaved
        ? this.savedIds.filter(x => x !== id)
        : [...this.savedIds, id];
      saveSaved(this.savedIds);
      // При збереженні — прогріваємо кеш для офлайну
      if (!wasSaved) this.prefetchVillageForOffline(id);
    },
    async prefetchVillageForOffline(id) {
      const v = this.villages.find(x => x.id === id);
      if (!v) return;
      // Тихо у фоні: підвантажуємо дані щоб вони лягли у persistentCache
      Promise.allSettled([
        fetchSummary(v.wikipedia || v.name),
        fetchLodging(v.lat, v.lng, 8000),
        fetchAttractions(v.lat, v.lng, 15000)
      ]);
      // Прогріваємо тайли карти навколо села (для офлайну в горах)
      prefetchTiles(v.lat, v.lng, [10, 11, 12, 13]);
    },
    onRouteRequest({ highlight, mode }) {
      this.routeRequest = { highlight, mode, ts: Date.now() };
      this.detailExpanded = false;  // показуємо маршрут — згортаємо панель
    },
    onVisibleUpdate({ attractions, lodging }) {
      this.visibleAttractions = attractions;
      this.visibleLodging = lodging;
    },
    onFocusItem(item) {
      this.focusRequest = item;
    },
    onCloseDetail() {
      this.selectedId = null;
      this.visibleAttractions = [];
      this.visibleLodging = [];
    }
  }
};
</script>

<style scoped>
.app-shell {
  position: relative;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: #f5f3ef;
}
.map-layer {
  position: absolute;
  inset: 0;
}

/* === Top bar === */
.topbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: rgba(255,255,255,0.96);
  border-bottom: 1px solid #ece8de;
  backdrop-filter: blur(8px);
  height: 48px;
}
.logo-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #1f6f3f;
  font-weight: 800;
  font-size: 17px;
  padding: 5px 8px;
  border-radius: 8px;
}
.logo-btn:hover { background: #e6f4ec; }
.ctx-breadcrumb {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #5a5347;
  min-width: 0;
  overflow: hidden;
}
.ctx-breadcrumb strong {
  color: #2d2a24;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ctx-region {
  color: #7a7363;
}
.ctx-tagline {
  flex: 1;
  font-size: 13px;
  color: #7a7363;
}
.saved-btn {
  border: 1px solid #e2ddd3;
  background: #fff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 11px;
  border-radius: 18px;
  color: #a17a00;
  font-weight: 700;
  font-size: 13px;
}
.saved-btn:hover { background: #fbf3df; }

.offline-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #fbe8e3;
  color: #9a3324;
  border: 1px solid #f2c5b9;
  padding: 4px 9px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 700;
}

/* === Floating list button === */
.fab-list {
  position: absolute;
  z-index: 1100;
  border: none;
  background: #1f6f3f;
  color: #fff;
  border-radius: 28px;
  padding: 12px 18px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0,0,0,0.3);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  bottom: 22px;
  right: 22px;
  transition: opacity 0.2s, transform 0.2s;
}
.fab-list:hover { background: #185a32; }
.fab-list.hidden {
  opacity: 0;
  pointer-events: none;
  transform: translateY(10px);
}

/* === Drawer === */
.drawer-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 1300;
  display: flex;
  justify-content: flex-end;
}
.drawer {
  background: #f5f3ef;
  width: 380px;
  max-width: 100vw;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 24px rgba(0,0,0,0.25);
}
.drawer-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: #fff;
  border-bottom: 1px solid #e2ddd3;
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #1f6f3f;
}
.logo-name {
  font-size: 17px;
  font-weight: 800;
  line-height: 1.1;
  color: #1f6f3f;
}
.logo small {
  font-size: 11.5px;
  color: #7a7363;
}
.close-x {
  border: none;
  background: transparent;
  cursor: pointer;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #5a5347;
}
.close-x:hover { background: #f1ede2; }
.tabs {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #e2ddd3;
}
.tabs button {
  flex: 1;
  padding: 12px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 13.5px;
  color: #5a5347;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 46px;
}
.tabs button.active {
  color: #1f6f3f;
  border-bottom-color: #1f6f3f;
  font-weight: 700;
}
.badge {
  display: inline-block;
  min-width: 18px;
  padding: 0 6px;
  background: #1f6f3f;
  color: #fff;
  border-radius: 9px;
  font-size: 11px;
  line-height: 18px;
  text-align: center;
}

.drawer-enter-active .drawer,
.drawer-leave-active .drawer { transition: transform 0.28s ease; }
.drawer-enter-from .drawer,
.drawer-leave-to .drawer { transform: translateX(100%); }
.drawer-enter-active,
.drawer-leave-active { transition: opacity 0.28s ease; }
.drawer-enter-from,
.drawer-leave-to { opacity: 0; }

@media (max-width: 720px) {
  .drawer { width: 100vw; }
  .topbar { padding: 6px 8px; height: 44px; }
  .logo-text { display: none; }
  .ctx-breadcrumb { font-size: 12px; gap: 3px; }
  .ctx-breadcrumb strong { font-size: 13px; }
  .fab-list { bottom: 16px; right: 16px; padding: 12px 16px; }
  .fab-list span { display: none; }
  .fab-list { border-radius: 50%; width: 56px; height: 56px; justify-content: center; }
}
</style>

<template>
  <div class="villages-list">
    <div class="filters">
      <label>
        <span>Регіон:</span>
        <select v-model="region">
          <option value="">Усі</option>
          <option value="Карпати">Карпати</option>
          <option value="Закарпаття">Закарпаття</option>
        </select>
      </label>
      <div class="tier-filters">
        <button
          v-for="t in tiersOrder"
          :key="t"
          :class="['chip', { active: activeTiers.includes(t) }]"
          :style="{ '--c': tierMeta[t].color, '--bg': tierMeta[t].bg }"
          @click="toggleTier(t)"
          :title="tierMeta[t].label"
        >
          <span class="dot-mini" :style="{ background: tierMeta[t].dotColor }"></span>
          {{ tierMeta[t].label }}
        </button>
      </div>
    </div>

    <ul class="list">
      <li
        v-for="v in filtered"
        :key="v.id"
        :class="{ selected: v.id === selectedId }"
        @click="$emit('select', v.id)"
      >
        <span class="dot" :style="{ background: tierMeta[v.tier].dotColor }"></span>
        <div class="row-text">
          <strong>{{ v.name }}</strong>
          <small>{{ v.region }}</small>
        </div>
        <Icon name="chevronRight" :size="16" class="chev" />
      </li>
      <li v-if="!filtered.length" class="empty">
        За цими фільтрами нічого не знайдено
      </li>
    </ul>
  </div>
</template>

<script>
import Icon from './Icon.vue';
import { tierMeta, tiers } from '../data/villages.js';

export default {
  name: 'VillagesList',
  components: { Icon },
  props: {
    villages: { type: Array, required: true },
    selectedId: { type: String, default: null }
  },
  emits: ['select'],
  data() {
    return {
      region: '',
      activeTiers: ['green', 'yellow', 'red'],
      tierMeta,
      tiersOrder: tiers
    };
  },
  computed: {
    filtered() {
      return this.villages.filter(v =>
        (!this.region || v.region === this.region) &&
        this.activeTiers.includes(v.tier)
      );
    }
  },
  methods: {
    toggleTier(t) {
      this.activeTiers = this.activeTiers.includes(t)
        ? this.activeTiers.filter(x => x !== t)
        : [...this.activeTiers, t];
    }
  }
};
</script>

<style scoped>
.villages-list { flex: 1; overflow-y: auto; }
.filters {
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e2ddd3;
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: sticky;
  top: 0;
  z-index: 1;
}
.filters label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #5a5347;
}
.filters select {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #d8d3c8;
  border-radius: 6px;
  font: inherit;
  background: #fff;
}
.tier-filters {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}
.chip {
  border: 1px solid var(--c);
  background: #fff;
  color: var(--c);
  border-radius: 16px;
  padding: 6px 11px;
  font-size: 12px;
  cursor: pointer;
  opacity: 0.55;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
}
.chip.active {
  background: var(--bg);
  opacity: 1;
  font-weight: 600;
}
.dot-mini {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.list { list-style: none; margin: 0; padding: 0; }
.list li {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #ece8de;
  cursor: pointer;
  transition: background 0.12s;
  min-height: 60px;
}
.list li:hover { background: #f1ede2; }
.list li.selected { background: #e6f4ec; }
.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}
.row-text { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.row-text strong { font-size: 15px; color: #2d2a24; }
.row-text small { color: #7a7363; font-size: 12.5px; margin-top: 2px; }
.chev { color: #b4ad9c; flex-shrink: 0; }
.empty { color: #9a9382; font-size: 13px; padding: 24px; text-align: center; }
</style>

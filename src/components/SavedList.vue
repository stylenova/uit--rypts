<template>
  <div class="saved-list">
    <ul v-if="villages.length" class="list">
      <li
        v-for="v in villages"
        :key="v.id"
        :class="{ selected: v.id === selectedId }"
      >
        <div class="row" @click="$emit('select', v.id)">
          <span class="dot" :style="{ background: tierMeta[v.tier].dotColor }"></span>
          <div class="row-text">
            <strong>{{ v.name }}</strong>
            <small>{{ v.region }}</small>
          </div>
        </div>
        <button class="rm" @click.stop="$emit('remove', v.id)" title="Прибрати">
          <Icon name="x" :size="16" />
        </button>
      </li>
    </ul>
    <div v-else class="empty">
      <Icon name="bookmark" :size="24" />
      <p>Тут зʼявляться збережені села</p>
      <p class="hint">Виберіть село і натисніть закладку</p>
    </div>
  </div>
</template>

<script>
import Icon from './Icon.vue';
import { tierMeta } from '../data/villages.js';

export default {
  name: 'SavedList',
  components: { Icon },
  props: {
    villages: { type: Array, required: true },
    selectedId: { type: String, default: null }
  },
  emits: ['select', 'remove'],
  data() { return { tierMeta }; }
};
</script>

<style scoped>
.saved-list { flex: 1; overflow-y: auto; }
.list { list-style: none; margin: 0; padding: 0; }
.list li {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #ece8de;
}
.list li.selected { background: #e6f4ec; }
.row {
  flex: 1;
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  min-height: 60px;
}
.row:hover { background: #f1ede2; }
.dot { width: 12px; height: 12px; border-radius: 50%; }
.row-text { display: flex; flex-direction: column; flex: 1; }
.row-text strong { font-size: 15px; color: #2d2a24; }
.row-text small { color: #7a7363; font-size: 12.5px; margin-top: 2px; }
.rm {
  border: none;
  background: transparent;
  color: #9a3324;
  padding: 0 14px;
  cursor: pointer;
  height: 36px;
}
.rm:hover { color: #6e1f12; }
.empty {
  padding: 50px 20px;
  text-align: center;
  color: #7a7363;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.empty p { margin: 0; }
.hint { font-size: 12px; color: #9a9382; }
</style>

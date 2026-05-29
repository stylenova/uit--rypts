<template>
  <div class="key-prompt">
    <div class="card">
      <h2>🔑 Google Maps API ключ</h2>
      <p>
        Щоб побачити карту, введіть особистий ключ Google Maps JavaScript API.
        Ключ збережеться у вашому браузері — на сервер нічого не йде.
      </p>
      <ol>
        <li>Зайдіть на <a href="https://console.cloud.google.com/" target="_blank" rel="noopener">console.cloud.google.com</a></li>
        <li>Створіть проєкт і увімкніть <b>Maps JavaScript API</b>, <b>Places API</b>, <b>Directions API</b></li>
        <li>Скопіюйте ключ → вставте сюди</li>
      </ol>
      <input
        v-model="key"
        type="text"
        placeholder="AIzaSy..."
        @keyup.enter="submit"
      />
      <button :disabled="!key.trim()" @click="submit">Зберегти і запустити</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ApiKeyPrompt',
  emits: ['save'],
  data() {
    return { key: '' };
  },
  methods: {
    submit() {
      if (this.key.trim()) this.$emit('save', this.key.trim());
    }
  }
};
</script>

<style scoped>
.key-prompt {
  position: absolute;
  inset: 0;
  background: rgba(245, 243, 239, 0.96);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}
.card {
  background: #fff;
  border: 1px solid #e2ddd3;
  border-radius: 12px;
  max-width: 440px;
  padding: 24px 26px;
  box-shadow: 0 6px 28px rgba(0,0,0,0.08);
}
h2 { margin: 0 0 8px; font-size: 18px; }
p { color: #5a5347; line-height: 1.5; margin: 0 0 12px; }
ol { color: #4a443a; padding-left: 20px; line-height: 1.7; font-size: 14px; }
input {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #d8d3c8;
  border-radius: 6px;
  font: inherit;
  margin: 14px 0 10px;
}
button {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 6px;
  background: #1f6f3f;
  color: #fff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
button:disabled { background: #b8c8be; cursor: not-allowed; }
</style>

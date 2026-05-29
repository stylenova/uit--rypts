import { createApp } from 'vue';
import App from './App.vue';
import './styles/global.css';
import { registerServiceWorker } from './utils/registerSW.js';

createApp(App).mount('#app');
registerServiceWorker();

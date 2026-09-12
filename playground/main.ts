import { createApp } from 'vue'
import App from './App.vue'
// The published stylesheet pulls this in itself; the playground loads both
// the same way a consuming app does.
import '../src/styles/fonts.css'
import '../src/styles/index.scss'
import './playground.scss'

createApp(App).mount('#app')

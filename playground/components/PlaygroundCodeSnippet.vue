<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    code: string
    title?: string
    lang?: string
    defaultExpanded?: boolean
  }>(),
  {
    title: 'Contoh Kode',
    lang: 'vue',
    defaultExpanded: true,
  },
)

const copied = ref(false)
const showCode = ref(props.defaultExpanded)

async function copyCode() {
  try {
    await navigator.clipboard.writeText(props.code.trim())
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (e) {
    console.error('Gagal menyalin kode:', e)
  }
}
</script>

<template>
  <div class="pg-code-snippet">
    <div class="pg-code-snippet__header">
      <div class="pg-code-snippet__title">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
        <span>{{ title }}</span>
        <span v-if="lang" class="pg-code-snippet__lang">{{ lang }}</span>
      </div>
      <div class="pg-code-snippet__actions">
        <button
          type="button"
          class="pg-code-snippet__toggle"
          :title="showCode ? 'Sembunyikan kode' : 'Tampilkan kode'"
          @click="showCode = !showCode"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            :style="{
              transform: showCode ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
            }"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
          <span>{{ showCode ? 'Tutup' : 'Lihat Kode' }}</span>
        </button>
        <button
          type="button"
          class="pg-code-snippet__copy"
          :class="{ 'pg-code-snippet__copy--copied': copied }"
          title="Salin ke clipboard"
          @click="copyCode"
        >
          <svg
            v-if="!copied"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <svg
            v-else
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>{{ copied ? 'Tersalin!' : 'Salin' }}</span>
        </button>
      </div>
    </div>
    <div v-show="showCode" class="pg-code-snippet__body">
      <pre><code>{{ code.trim() }}</code></pre>
    </div>
  </div>
</template>

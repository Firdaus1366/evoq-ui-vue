<script setup lang="ts">
import { computed } from 'vue'
import { EvLogo } from '../../src'

export interface ComponentEntry {
  id: string
  name: string
  tag: string
}

export interface CategoryItem {
  id: string
  name: string
  icon: string
  components: ComponentEntry[]
}

const props = defineProps<{
  categories: CategoryItem[]
  activeId: string
  searchQuery: string
  theme: 'auto' | 'light' | 'dark'
  brand: 'blue' | 'lightblue' | 'green' | 'orange'
  isMobileOpen?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:searchQuery', val: string): void
  (e: 'select', id: string): void
  (e: 'set-theme', theme: 'auto' | 'light' | 'dark'): void
  (e: 'set-brand', brand: 'blue' | 'lightblue' | 'green' | 'orange'): void
  (e: 'close-mobile'): void
}>()

const totalComponents = computed(() => {
  return props.categories.reduce((acc, cat) => acc + cat.components.length, 0)
})

const filteredCategories = computed(() => {
  if (!props.searchQuery.trim()) return props.categories
  const q = props.searchQuery.toLowerCase().trim()
  return props.categories
    .map((cat) => ({
      ...cat,
      components: cat.components.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.tag.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q),
      ),
    }))
    .filter((cat) => cat.components.length > 0)
})

const brands = ['blue', 'lightblue', 'green', 'orange'] as const
const themes = [
  { id: 'auto', label: 'Auto' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
] as const

function handleSelect(id: string) {
  emit('select', id)
  emit('close-mobile')
}
</script>

<template>
  <aside class="pg-sidebar" :class="{ 'pg-sidebar--open': isMobileOpen }">
    <!-- Brand Header -->
    <div class="pg-sidebar__brand">
      <EvLogo class="pg-sidebar__logo" :size="48" />
      <span class="pg-sidebar__badge">{{ totalComponents }}</span>
    </div>

    <!-- Search Input -->
    <div class="pg-sidebar__search">
      <svg
        class="pg-sidebar__search-icon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <input
        type="text"
        :value="searchQuery"
        placeholder="Cari komponen..."
        @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
      />
      <button
        v-if="searchQuery"
        type="button"
        class="pg-sidebar__search-clear"
        title="Hapus pencarian"
        @click="emit('update:searchQuery', '')"
      >
        ✕
      </button>
    </div>

    <!-- Quick Preferences (Theme & Brand) -->
    <div class="pg-sidebar__controls">
      <div class="pg-sidebar__control-group">
        <span class="pg-sidebar__control-label">Tema</span>
        <div class="pg-sidebar__button-group">
          <button
            v-for="t in themes"
            :key="t.id"
            type="button"
            class="pg-sidebar__control-btn"
            :class="{ 'pg-sidebar__control-btn--active': theme === t.id }"
            @click="emit('set-theme', t.id)"
          >
            {{ t.label }}
          </button>
        </div>
      </div>

      <div class="pg-sidebar__control-group">
        <span class="pg-sidebar__control-label">Warna Brand</span>
        <div class="pg-sidebar__brand-pills">
          <button
            v-for="b in brands"
            :key="b"
            type="button"
            class="pg-sidebar__brand-pill"
            :class="[
              `pg-sidebar__brand-pill--${b}`,
              { 'pg-sidebar__brand-pill--active': brand === b },
            ]"
            :title="`Brand ${b}`"
            @click="emit('set-brand', b)"
          />
        </div>
      </div>
    </div>

    <!-- Overview Link -->
    <button
      type="button"
      class="pg-sidebar__all-btn"
      :class="{ 'pg-sidebar__all-btn--active': activeId === 'all' }"
      @click="handleSelect('all')"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
        <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
        <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
        <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
      </svg>
      <span>Tampilkan Semua</span>
      <span class="pg-sidebar__all-badge">{{ totalComponents }}</span>
    </button>

    <!-- Category Nav list -->
    <nav class="pg-sidebar__nav">
      <div v-for="cat in filteredCategories" :key="cat.id" class="pg-sidebar__category">
        <div class="pg-sidebar__category-title">
          <span class="pg-sidebar__category-icon">{{ cat.icon }}</span>
          <span>{{ cat.name }}</span>
          <span class="pg-sidebar__category-count">{{ cat.components.length }}</span>
        </div>
        <ul class="pg-sidebar__list">
          <li v-for="comp in cat.components" :key="comp.id">
            <button
              type="button"
              class="pg-sidebar__item"
              :class="{ 'pg-sidebar__item--active': activeId === comp.id }"
              @click="handleSelect(comp.id)"
            >
              <span class="pg-sidebar__item-name">{{ comp.name }}</span>
              <span class="pg-sidebar__item-tag">&lt;{{ comp.tag }}&gt;</span>
            </button>
          </li>
        </ul>
      </div>

      <div v-if="filteredCategories.length === 0" class="pg-sidebar__empty">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <span>Tidak ada komponen yang cocok</span>
      </div>
    </nav>
  </aside>
</template>

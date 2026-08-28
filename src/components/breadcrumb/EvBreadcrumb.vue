<script setup lang="ts">
import { computed, ref } from 'vue'
import type { BreadcrumbItem } from '../../types'

defineOptions({
  name: 'EvBreadcrumb',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    items: BreadcrumbItem[]
    /**
     * Collapse the middle of the trail once there are more crumbs than this,
     * matching Figma's `Ellipsis` variant. `0` never collapses.
     */
    maxItems?: number
    /** Accessible name for the trail. */
    label?: string
  }>(),
  {
    maxItems: 0,
    label: 'Breadcrumb',
  },
)

const emit = defineEmits<{
  select: [item: BreadcrumbItem, index: number]
}>()

const dropdownOpen = ref(false)

const collapsed = computed(() => props.maxItems > 0 && props.items.length > props.maxItems)

type HiddenCrumb = { item: BreadcrumbItem; index: number }

type Entry =
  | { kind: 'crumb'; item: BreadcrumbItem; index: number; last: boolean }
  | { kind: 'ellipsis'; count: number; hiddenItems: HiddenCrumb[] }

/**
 * One flat list to render, so the template never has to look an item's index
 * back up - `indexOf` would pick the wrong crumb whenever two share a label.
 *
 * The first and last crumbs always survive collapsing: they are the root and
 * the page you are on.
 */
const entries = computed<Entry[]>(() => {
  const all = props.items.map((item, index) => ({
    kind: 'crumb' as const,
    item,
    index,
    last: index === props.items.length - 1,
  }))

  // Collapsing needs a root, a tail and something in between to hide.
  if (!collapsed.value || all.length < 3) return all
  const first = all[0]
  const last = all[all.length - 1]
  if (!first || !last) return all

  const hiddenItems: HiddenCrumb[] = all.slice(1, -1).map((e) => ({ item: e.item, index: e.index }))

  return [first, { kind: 'ellipsis', count: hiddenItems.length, hiddenItems }, last]
})

function onSelect(entry: Extract<Entry, { kind: 'crumb' }>, event: MouseEvent) {
  if (entry.last) return
  if (!entry.item.href) event.preventDefault()
  emit('select', entry.item, entry.index)
}

function selectHidden(hidden: HiddenCrumb, event: MouseEvent) {
  dropdownOpen.value = false
  if (!hidden.item.href) event.preventDefault()
  emit('select', hidden.item, hidden.index)
}
</script>

<template>
  <nav v-bind="$attrs" class="ev-breadcrumb" :aria-label="label">
    <ol class="ev-breadcrumb__list">
      <li v-for="(entry, i) in entries" :key="i" class="ev-breadcrumb__item">
        <span v-if="i > 0" class="ev-breadcrumb__separator" aria-hidden="true">
          <svg viewBox="0 0 16 16" focusable="false">
            <path
              d="M6 3.5L10.5 8 6 12.5"
              stroke="currentColor"
              stroke-width="1.5"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>

        <div v-if="entry.kind === 'ellipsis'" class="ev-breadcrumb__ellipsis-container">
          <button
            type="button"
            class="ev-breadcrumb__ellipsis"
            :aria-label="`Tampilkan ${entry.count} tautan tersembunyi`"
            :aria-expanded="dropdownOpen"
            @click="dropdownOpen = !dropdownOpen"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <circle cx="3" cy="8" r="1.4" fill="currentColor" />
              <circle cx="8" cy="8" r="1.4" fill="currentColor" />
              <circle cx="13" cy="8" r="1.4" fill="currentColor" />
            </svg>
          </button>

          <div
            v-if="dropdownOpen"
            class="ev-breadcrumb__dropdown"
            role="menu"
            aria-label="Langkah tersembunyi"
          >
            <component
              :is="hidden.item.href ? 'a' : 'button'"
              v-for="hidden in entry.hiddenItems"
              :key="hidden.index"
              class="ev-breadcrumb__dropdown-item"
              :href="hidden.item.href"
              role="menuitem"
              @click="selectHidden(hidden, $event)"
            >
              {{ hidden.item.label }}
            </component>
          </div>
        </div>

        <component
          :is="entry.item.href && !entry.last ? 'a' : 'span'"
          v-else
          class="ev-breadcrumb__link"
          :class="{ 'ev-breadcrumb__link--current': entry.last }"
          :href="entry.last ? undefined : entry.item.href"
          :aria-current="entry.last ? 'page' : undefined"
          @click="onSelect(entry, $event)"
        >
          <svg
            v-if="entry.item.icon"
            class="ev-breadcrumb__icon"
            viewBox="0 0 16 16"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M2.5 7L8 2.5 13.5 7v6a.5.5 0 01-.5.5H3a.5.5 0 01-.5-.5z"
              stroke="currentColor"
              stroke-width="1.4"
              fill="none"
              stroke-linejoin="round"
            />
          </svg>
          <template v-else>{{ entry.item.label }}</template>
        </component>
      </li>
    </ol>
  </nav>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `Breadcrumb` component set in Figma (Default and Ellipsis).
 *
 * Every crumb but the last is `text/secondary`; the last is `text/primary` and
 * is not a link, because it is the page you are already on.
 */
.ev-breadcrumb {
  &__list {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--ev-spacing-xs);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__item {
    display: inline-flex;
    align-items: center;
    gap: var(--ev-spacing-xs);
  }

  &__link {
    display: inline-flex;
    align-items: center;
    gap: var(--ev-spacing-xs);
    color: var(--ev-text-secondary);
    text-decoration: none;

    @include type.style('body/regular');

    &:focus-visible {
      outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
      outline-offset: var(--ev-focus-ring-offset);
    }
  }

  &__link--current {
    color: var(--ev-text-primary);
  }

  &__icon {
    width: 16px;
    height: 16px;
    color: var(--ev-icon-secondary);
  }

  &__separator {
    display: inline-flex;
    color: var(--ev-icon-secondary);

    svg {
      width: 16px;
      height: 16px;
    }
  }

  &__ellipsis {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ev-icon-secondary);
    cursor: pointer;

    svg {
      width: 16px;
      height: 16px;
    }

    &:focus-visible {
      outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
      outline-offset: var(--ev-focus-ring-offset);
    }
  }

  &__ellipsis-container {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  &__dropdown {
    position: absolute;
    top: calc(100% + var(--ev-spacing-2xs));
    left: 0;
    z-index: 100;
    display: flex;
    flex-direction: column;
    min-width: 140px;
    padding: var(--ev-spacing-2xs);
    border: var(--ev-stroke-xs) solid var(--ev-border-primary);
    border-radius: var(--ev-radius-xs);
    background-color: var(--ev-bg-primary);
    box-shadow: 0 4px 12px rgb(var(--ev-shadow-tint) / 0.1);
  }

  &__dropdown-item {
    display: flex;
    align-items: center;
    padding: var(--ev-spacing-xs) var(--ev-spacing-sm);
    border: 0;
    border-radius: var(--ev-radius-2xs);
    background: none;
    color: var(--ev-text-secondary);
    text-decoration: none;
    text-align: left;
    cursor: pointer;

    @include type.style('body/small');

    &:hover {
      background-color: var(--ev-bg-subtler);
      color: var(--ev-text-primary);
    }

    &:focus-visible {
      outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
      outline-offset: -1px;
    }
  }
}
</style>

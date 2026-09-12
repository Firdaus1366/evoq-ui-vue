<script setup lang="ts">
import { computed } from 'vue'
import EvButton from '../../atoms/button/EvButton.vue'
import EvPaginationItem from '../../atoms/pagination-item/EvPaginationItem.vue'
import type { PaginationVariant } from '../../types'

defineOptions({
  name: 'EvPagination',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    /** `Variant` of the Figma `Pagination` set. */
    variant?: PaginationVariant
    /** The page on screen, 1-based. */
    page?: number
    pageCount?: number
    /** How many pages sit either side of the current one before an ellipsis. */
    siblingCount?: number
    /** `Pagination Display`: the number in the rows-per-page button. */
    rowsPerPage?: number
    rowsPerPageLabel?: string
    previousLabel?: string
    nextLabel?: string
    /** `Pagination Step`: the caption. Left unset it reads "Step 2 of 5". */
    stepLabel?: string
    label?: string
  }>(),
  {
    variant: 'display',
    page: 1,
    pageCount: 1,
    siblingCount: 1,
    rowsPerPage: 10,
    rowsPerPageLabel: 'Rows per page',
    previousLabel: 'Previous',
    nextLabel: 'Next',
    stepLabel: undefined,
    label: 'Halaman',
  },
)

const emit = defineEmits<{
  'update:page': [page: number]
  previous: []
  next: []
  /** The rows-per-page button was pressed - open your own menu from here. */
  'rows-per-page': []
}>()

defineSlots<{
  /** Figma's `Slot` inside the number row, after the tiles. */
  default?: () => unknown
}>()

const atStart = computed(() => props.page <= 1)
const atEnd = computed(() => props.page >= props.pageCount)
const caption = computed(() => props.stepLabel ?? `Step ${props.page} of ${props.pageCount}`)

/**
 * The tiles between the two arrows: first page, last page, a window around
 * the current one, and an ellipsis wherever that leaves a gap.
 */
const tiles = computed<(number | 'more-start' | 'more-end')[]>(() => {
  const total = Math.max(1, props.pageCount)
  const current = Math.min(Math.max(1, props.page), total)
  const first = Math.max(2, current - props.siblingCount)
  const last = Math.min(total - 1, current + props.siblingCount)

  const out: (number | 'more-start' | 'more-end')[] = [1]
  if (first > 2) out.push('more-start')
  for (let p = first; p <= last; p += 1) out.push(p)
  if (last < total - 1) out.push('more-end')
  if (total > 1) out.push(total)
  return out
})

function go(page: number) {
  if (page < 1 || page > props.pageCount || page === props.page) return
  emit('update:page', page)
}

function previous() {
  emit('previous')
  go(props.page - 1)
}

function next() {
  emit('next')
  go(props.page + 1)
}
</script>

<template>
  <nav
    v-bind="$attrs"
    class="ev-pagination"
    :class="`ev-pagination--${variant}`"
    :aria-label="label"
  >
    <!-- Variant=Pagination Display -->
    <template v-if="variant === 'display'">
      <div class="ev-pagination__wrapper ev-pagination__wrapper--rows">
        <span class="ev-pagination__caption">{{ rowsPerPageLabel }}</span>
        <EvButton
          class="ev-pagination__rows"
          variant="outline"
          size="small"
          @click="emit('rows-per-page')"
        >
          {{ rowsPerPage }}
          <template #iconRight>
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path
                d="M4 6l4 4 4-4"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </template>
        </EvButton>
      </div>

      <div class="ev-pagination__wrapper ev-pagination__wrapper--steps">
        <EvButton variant="ghost" size="small" :disabled="atStart" @click="previous">
          <template #iconLeft>
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path
                d="M10 3.5L5.5 8l4.5 4.5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </template>
          {{ previousLabel }}
        </EvButton>
        <EvButton variant="ghost" size="small" :disabled="atEnd" @click="next">
          {{ nextLabel }}
          <template #iconRight>
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path
                d="M6 3.5L10.5 8 6 12.5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </template>
        </EvButton>
      </div>
    </template>

    <!-- Variant=Pagination Step -->
    <template v-else-if="variant === 'step'">
      <span class="ev-pagination__caption">{{ caption }}</span>
      <div class="ev-pagination__wrapper ev-pagination__wrapper--steps">
        <EvButton variant="secondary-light" :disabled="atStart" @click="previous">
          {{ previousLabel }}
        </EvButton>
        <EvButton variant="secondary-light" :disabled="atEnd" @click="next">
          {{ nextLabel }}
        </EvButton>
      </div>
    </template>

    <!-- Variant=Pagination Number -->
    <template v-else>
      <EvButton
        class="ev-pagination__arrow"
        variant="ghost"
        size="small"
        icon-only
        :disabled="atStart"
        :aria-label="previousLabel"
        @click="previous"
      >
        <template #iconLeft>
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path
              d="M10 3.5L5.5 8l4.5 4.5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </template>
      </EvButton>

      <div class="ev-pagination__tiles">
        <template v-for="(tile, index) in tiles" :key="`${tile}-${index}`">
          <EvPaginationItem v-if="typeof tile !== 'number'" more />
          <EvPaginationItem v-else :page="tile" :active="tile === page" @click="go(tile)" />
        </template>
        <slot />
      </div>

      <EvButton
        class="ev-pagination__arrow"
        variant="ghost"
        size="small"
        icon-only
        :disabled="atEnd"
        :aria-label="nextLabel"
        @click="next"
      >
        <template #iconLeft>
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path
              d="M6 3.5L10.5 8 6 12.5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </template>
      </EvButton>
    </template>
  </nav>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `Pagination` component set in Figma (3 Variants). Every
 * control on it is an instance, so all three compose EvButton and
 * EvPaginationItem rather than redrawing them.
 *
 * Node tree, in board order:
 *   Variant=Pagination Display  HORIZONTAL, space-between, 32 tall
 *     Wrapper  gap 11 - "Rows per page" + a Button (outline / small)
 *     Wrapper  gap 16 - Previous and Next Buttons (ghost / small)
 *   Variant=Pagination Step     HORIZONTAL, space-between, gap 10, 40 tall
 *     "Step 1 of 5"
 *     Wrapper  gap 16 - Prev and Next Buttons (secondary-light / default)
 *   Variant=Pagination Number   HORIZONTAL, gap 8, 32 tall
 *     Frame 5  a Button (ghost / small / icon only)
 *     Frame 3  gap 8, centred - .StepNumber tiles, then Slot
 *     Frame 4  a Button (ghost / small / icon only)
 *
 * Off-system colour: both captions are painted #333f47, which is in no EVOQ
 * ramp and no library ramp. It is asserted as a literal rather than rounded
 * to text/primary (#071437) or text/secondary (#78829d), neither of which it
 * is close to.
 *
 * The 11px gap in the rows-per-page wrapper is off the spacing scale as well
 * (8 then 12) and is likewise kept as drawn.
 */
.ev-pagination {
  box-sizing: border-box;
  display: flex;
  align-items: center;

  &__caption {
    /* Off-system - see the note above. */
    color: #333f47;

    @include type.style('body/regular');
  }

  &__wrapper {
    display: flex;
    align-items: center;

    &--rows {
      gap: 11px;
    }

    &--steps {
      gap: var(--ev-spacing-lg);
    }
  }

  &--display,
  &--step {
    justify-content: space-between;
  }

  &--display {
    min-height: 32px;
  }

  &--step {
    gap: 10px;
    min-height: 40px;
  }

  &--number {
    gap: var(--ev-spacing-sm);
    min-height: 32px;
  }

  &__tiles {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--ev-spacing-sm);
  }

  /* The board's arrows are 32px square Buttons, not 32px wide ones. */
  & &__arrow {
    width: 32px;
    min-width: 32px;
  }

  /* Every glyph on this set is 16px, on the tiles and inside the Buttons. */
  .ev-button svg {
    width: 16px;
    height: 16px;
  }
}
</style>

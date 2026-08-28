import { onBeforeUnmount, watch, type Ref } from 'vue'

/** Elements that can hold focus, in tab order. */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export interface UseOverlayOptions {
  /** Whether the overlay is currently on screen. */
  open: Ref<boolean>
  /** The panel to trap focus inside. */
  panel: Ref<HTMLElement | null>
  /** Called when Escape is pressed. */
  onEscape: () => void
  /** Set false for overlays that do not block the page, such as a popover. */
  lockScroll?: boolean
  /** Set false to leave focus where it is. */
  trapFocus?: boolean
}

/**
 * The behaviour every blocking overlay needs and none of them should
 * re-implement: Escape to close, focus moved into the panel and trapped there,
 * focus restored to whatever opened it, and the page behind held still.
 *
 * Modal, Drawer and Alert Dialog share this. Popover opts out of the scroll
 * lock and the trap, because it does not block the page.
 */
export function useOverlay(options: UseOverlayOptions) {
  const { open, panel, onEscape, lockScroll = true, trapFocus = true } = options

  let previouslyFocused: HTMLElement | null = null
  let previousOverflow = ''

  function focusables(): HTMLElement[] {
    if (!panel.value) return []
    return Array.from(panel.value.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    )
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onEscape()
      return
    }

    if (event.key !== 'Tab' || !trapFocus) return

    const items = focusables()
    if (!items.length) {
      // Nothing to move to, so keep focus on the panel rather than losing it
      // to the page behind.
      event.preventDefault()
      panel.value?.focus()
      return
    }

    const first = items[0]
    const last = items[items.length - 1]
    if (!first || !last) return

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  function activate() {
    previouslyFocused = document.activeElement as HTMLElement | null

    if (lockScroll) {
      previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }

    document.addEventListener('keydown', onKeydown, true)

    if (trapFocus) {
      // Wait for the panel to be in the DOM before reaching into it.
      requestAnimationFrame(() => {
        const items = focusables()
        ;(items[0] ?? panel.value)?.focus()
      })
    }
  }

  function deactivate() {
    document.removeEventListener('keydown', onKeydown, true)

    if (lockScroll) document.body.style.overflow = previousOverflow

    // Returning focus is what makes an overlay usable by keyboard - without
    // it focus falls back to the top of the document on close.
    previouslyFocused?.focus?.()
    previouslyFocused = null
  }

  watch(open, (isOpen) => (isOpen ? activate() : deactivate()), { immediate: true })

  onBeforeUnmount(() => {
    if (open.value) deactivate()
  })
}

/**
 * jsdom implements almost none of the SVG layout API, and Unovis measures its
 * axes with `getBBox` and its containers with `ResizeObserver`. Without these
 * stubs a chart test throws before it can assert anything.
 *
 * They return zeroes on purpose: these tests check the wrapper's contract, not
 * the geometry Unovis computes. Pretending to have real measurements would
 * invite assertions that mean nothing.
 */
const ZERO_BOX = { x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 }

if (typeof SVGElement !== 'undefined') {
  const svg = SVGElement.prototype as unknown as Record<string, unknown>
  if (!svg.getBBox) svg.getBBox = () => ({ ...ZERO_BOX })
  if (!svg.getComputedTextLength) svg.getComputedTextLength = () => 0
  if (!svg.getScreenCTM) svg.getScreenCTM = () => null
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

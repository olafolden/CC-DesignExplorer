import { describe, it, expect } from 'vitest'

/**
 * Tests for the camera lock logic in ModelViewer.
 *
 * The camera lock pattern:
 * - First model load: preserveCamera = false (auto-fit)
 * - Subsequent loads: preserveCamera = true (lock camera)
 * - On viewer restart (viewerReady): reset to first-load behavior
 * - Empty URL (deselect): does not reset the first-load flag
 */

/** Simulates the hasLoadedFirst ref logic from ModelViewer */
function createCameraLockTracker() {
  let hasLoadedFirst = false

  return {
    /** Returns the message payload for a loadModel call */
    buildLoadMessage(url: string | null) {
      const preserveCamera = hasLoadedFirst
      if (url) hasLoadedFirst = true
      return { type: 'loadModel' as const, url: url ?? '', preserveCamera }
    },
    /** Resets state when viewer reinitializes */
    onViewerReady() {
      hasLoadedFirst = false
    },
    get hasLoadedFirst() {
      return hasLoadedFirst
    },
  }
}

describe('Camera lock logic', () => {
  it('sends preserveCamera: false on first model load', () => {
    const tracker = createCameraLockTracker()
    const msg = tracker.buildLoadMessage('/test/design_0.glb')

    expect(msg.preserveCamera).toBe(false)
    expect(msg.url).toBe('/test/design_0.glb')
  })

  it('sends preserveCamera: true on subsequent model loads', () => {
    const tracker = createCameraLockTracker()

    // First load
    tracker.buildLoadMessage('/test/design_0.glb')

    // Second load — camera should be preserved
    const msg = tracker.buildLoadMessage('/test/design_1.glb')
    expect(msg.preserveCamera).toBe(true)
  })

  it('sends preserveCamera: true for all loads after the first', () => {
    const tracker = createCameraLockTracker()

    tracker.buildLoadMessage('/test/design_0.glb') // first
    const msg2 = tracker.buildLoadMessage('/test/design_1.glb')
    const msg3 = tracker.buildLoadMessage('/test/design_2.glb')
    const msg4 = tracker.buildLoadMessage('/test/design_3.glb')

    expect(msg2.preserveCamera).toBe(true)
    expect(msg3.preserveCamera).toBe(true)
    expect(msg4.preserveCamera).toBe(true)
  })

  it('resets preserveCamera after viewer reinitializes', () => {
    const tracker = createCameraLockTracker()

    // First load
    tracker.buildLoadMessage('/test/design_0.glb')
    expect(tracker.hasLoadedFirst).toBe(true)

    // Viewer restarts
    tracker.onViewerReady()
    expect(tracker.hasLoadedFirst).toBe(false)

    // Next load should be treated as first again
    const msg = tracker.buildLoadMessage('/test/design_1.glb')
    expect(msg.preserveCamera).toBe(false)
  })

  it('does not set hasLoadedFirst when URL is null (deselect)', () => {
    const tracker = createCameraLockTracker()

    // Deselect before any real load
    const msg = tracker.buildLoadMessage(null)
    expect(msg.preserveCamera).toBe(false)
    expect(tracker.hasLoadedFirst).toBe(false)
  })

  it('preserves camera after deselect if a model was previously loaded', () => {
    const tracker = createCameraLockTracker()

    // First load
    tracker.buildLoadMessage('/test/design_0.glb')

    // Deselect (null URL) — hasLoadedFirst stays true
    const deselect = tracker.buildLoadMessage(null)
    expect(deselect.preserveCamera).toBe(true)

    // Re-select — still preserves camera
    const reselect = tracker.buildLoadMessage('/test/design_2.glb')
    expect(reselect.preserveCamera).toBe(true)
  })

  it('handles viewer restart followed by deselect then load', () => {
    const tracker = createCameraLockTracker()

    tracker.buildLoadMessage('/test/design_0.glb')
    tracker.onViewerReady()

    // Deselect after restart
    tracker.buildLoadMessage(null)
    expect(tracker.hasLoadedFirst).toBe(false)

    // First real load after restart
    const msg = tracker.buildLoadMessage('/test/design_1.glb')
    expect(msg.preserveCamera).toBe(false)
  })
})

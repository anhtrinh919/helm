import { describe, expect, it, vi } from 'vitest'
import {
  INSTALL_SCRIPT,
  PointCaptureService,
  REMOVE_SCRIPT,
  type CaptureGeometry,
  type GuestView,
  type PointCaptureDeps,
} from '../point-capture-service'

const RECT = { x: 10, y: 20, width: 120, height: 40 }

function fakeGuest(): GuestView & {
  injected: string[]
  emitConsole: (line: string) => void
  consoleSubscribers: number
} {
  const subscribers = new Set<(line: string) => void>()
  const injected: string[] = []
  return {
    injected,
    get consoleSubscribers() {
      return subscribers.size
    },
    emitConsole: (line: string) => subscribers.forEach((cb) => cb(line)),
    executeJavaScript: async (code: string) => {
      injected.push(code)
      return undefined
    },
    captureRegion: async () => 'ZmFrZWNyb3A=',
    onConsole: (cb) => {
      subscribers.add(cb)
      return () => subscribers.delete(cb)
    },
  }
}

function makeService(opts?: { live?: boolean; guest?: ReturnType<typeof fakeGuest> }): {
  service: PointCaptureService
  guest: ReturnType<typeof fakeGuest>
  captures: { projectId: string; geometry: CaptureGeometry }[]
  exits: string[]
} {
  const guest = opts?.guest ?? fakeGuest()
  const live = opts?.live ?? true
  const deps: PointCaptureDeps = {
    listGuests: () => [{ url: 'http://localhost:4444/some/page', view: guest }],
    previewUrl: () => (live ? 'http://localhost:4444' : null),
  }
  const captures: { projectId: string; geometry: CaptureGeometry }[] = []
  const exits: string[] = []
  const service = new PointCaptureService(
    deps,
    (projectId, geometry) => captures.push({ projectId, geometry }),
    (projectId) => exits.push(projectId),
  )
  return { service, guest, captures, exits }
}

const clickLine = (): string =>
  '__HELM_POINT__' +
  JSON.stringify({ selector: 'main > button#submit', rect: RECT, px: 0.42, py: 0.61 })

describe('PointCaptureService', () => {
  it('activate injects the capture script into the matching live guest', () => {
    const { service, guest } = makeService()
    expect(service.activate('p1')).toBe(true)
    expect(guest.injected).toEqual([INSTALL_SCRIPT])
    expect(service.isActive('p1')).toBe(true)
  })

  it('activate is a no-op false when the preview is not live', () => {
    const { service, guest } = makeService({ live: false })
    expect(service.activate('p1')).toBe(false)
    expect(guest.injected).toEqual([])
    expect(service.isActive('p1')).toBe(false)
  })

  it('activate twice injects once', () => {
    const { service, guest } = makeService()
    service.activate('p1')
    service.activate('p1')
    expect(guest.injected).toEqual([INSTALL_SCRIPT])
  })

  it('a guest click stores the pending capture and reports geometry only', async () => {
    const { service, guest, captures } = makeService()
    service.activate('p1')
    guest.emitConsole(clickLine())
    await vi.waitFor(() => expect(captures).toHaveLength(1))

    // Renderer-bound geometry: no selector, no screenshot.
    expect(captures[0]).toEqual({
      projectId: 'p1',
      geometry: { boundingBox: RECT, pinX: 0.42, pinY: 0.61 },
    })

    // Main-side pending capture: full visual context, consumed exactly once.
    const pending = service.consumePending('p1')
    expect(pending).toEqual({
      selector: 'main > button#submit',
      boundingBox: RECT,
      screenshotCrop: 'ZmFrZWNyb3A=',
      pinX: 0.42,
      pinY: 0.61,
    })
    expect(service.consumePending('p1')).toBeNull()
  })

  it('a capture failure still files the comment (empty crop)', async () => {
    const guest = fakeGuest()
    guest.captureRegion = async () => ''
    const { service, captures } = makeService({ guest })
    service.activate('p1')
    guest.emitConsole(clickLine())
    await vi.waitFor(() => expect(captures).toHaveLength(1))
    expect(service.consumePending('p1')?.screenshotCrop).toBe('')
  })

  it('malformed guest output is ignored', async () => {
    const { service, guest, captures } = makeService()
    service.activate('p1')
    guest.emitConsole('__HELM_POINT__{not json')
    guest.emitConsole('random app log line')
    await new Promise((r) => setTimeout(r, 10))
    expect(captures).toHaveLength(0)
    expect(service.consumePending('p1')).toBeNull()
  })

  it('Esc in the guest exits point mode and removes the listeners', async () => {
    const { service, guest, exits } = makeService()
    service.activate('p1')
    guest.emitConsole('__HELM_EXIT__')
    await vi.waitFor(() => expect(exits).toEqual(['p1']))
    expect(service.isActive('p1')).toBe(false)
    expect(guest.injected).toEqual([INSTALL_SCRIPT, REMOVE_SCRIPT])
  })

  it('deactivate removes the script and stops listening to the guest', async () => {
    const { service, guest, captures } = makeService()
    service.activate('p1')
    service.deactivate('p1')
    expect(guest.injected).toEqual([INSTALL_SCRIPT, REMOVE_SCRIPT])
    expect(guest.consoleSubscribers).toBe(0)
    guest.emitConsole(clickLine())
    await new Promise((r) => setTimeout(r, 10))
    expect(captures).toHaveLength(0)
  })
})

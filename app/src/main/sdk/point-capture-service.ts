import type { BoundingBox } from '../../shared/ipc-schemas'

/**
 * Point-mode capture (Phase 3). Injects a hover-highlight + click-capture
 * script into the EMBEDDED APP (the <webview> guest) and returns what the user
 * pointed at: a CSS selector path, the element's bounding box, a screenshot
 * crop, and the pin position. The guest needs NO privileges — the script is
 * plain DOM code and reports back over a prefix-guarded console channel, so the
 * user's built app stays fully sandboxed.
 *
 * SELECTOR ASYMMETRY (documented honestly): point-capture's selector + screenshot
 * NEVER leave the main process — the renderer is told only the geometry (for
 * anchoring the comment box), and `points:register` merges the main-side pending
 * capture. Inline TEXT-EDIT is different by necessity: the browser-proxy path
 * surfaces the edited element's selector to the renderer (the same-origin proxy
 * exposes it), so inline-edit selectors are request-carried (renderer→core) in
 * `points:register-text-edit`, UNLIKE point-capture's main-only selector. The
 * browser point-capture path likewise carries its selector in the request (an
 * optional field on `points:register`); the Electron point-capture path keeps the
 * main-only pending-capture merge unchanged.
 */

/** What a click in the guest produces. Internal to main. */
export interface ElementCapture {
  selector: string | null
  boundingBox: BoundingBox | null
  screenshotCrop: string
  pinX: number | null
  pinY: number | null
}

/** Renderer-safe geometry pushed when a selection locks. */
export interface CaptureGeometry {
  boundingBox: BoundingBox
  pinX: number
  pinY: number
}

/** The minimal view surface the service drives. Production adapts a real guest
 *  WebContents; tests pass a fake. */
export interface GuestView {
  executeJavaScript(code: string): Promise<unknown>
  /** Capture a viewport region; resolve to a base64 PNG already resized to fit
   *  512×512. Resolve '' on failure — capture problems never block the comment. */
  captureRegion(rect: BoundingBox): Promise<string>
  /** Subscribe to console lines from the guest. Returns unsubscribe. */
  onConsole(cb: (line: string) => void): () => void
}

export interface PointCaptureDeps {
  /** Every currently-attached embedded-app view, with its current URL. */
  listGuests: () => { url: string; view: GuestView }[]
  /** The project's live preview URL (null unless the preview is `live`). */
  previewUrl: (projectId: string) => string | null
  /**
   * Optional: subscribe to a guest reload/navigation (Electron's
   * `did-start-loading` / `did-navigate`). The service uses it to tear down any
   * active capture/edit mode the moment the embedded app reloads, so a mid-edit
   * HMR/reload never leaves a stale injected editor. Returns an unsubscribe.
   */
  onGuestReload?: (cb: () => void) => () => void
}

const POINT_PREFIX = '__HELM_POINT__'
const EXIT_PREFIX = '__HELM_EXIT__'
const TEXTEDIT_PREFIX = '__HELM_TEXTEDIT__'

/** Raw payload the injected script logs on click. */
interface GuestClickPayload {
  selector: string
  rect: BoundingBox
  px: number
  py: number
}

export const INSTALL_SCRIPT = `(() => {
  if (window.__helmPoint) return;
  const S = (window.__helmPoint = { last: null, lastOutline: '', lastOffset: '' });
  S.clear = () => {
    if (S.last) {
      S.last.style.outline = S.lastOutline;
      S.last.style.outlineOffset = S.lastOffset;
      S.last = null;
    }
  };
  S.move = (e) => {
    const el = e.target;
    if (!(el instanceof Element) || el === document.documentElement || el === document.body) {
      S.clear();
      return;
    }
    if (S.last === el) return;
    S.clear();
    S.last = el;
    S.lastOutline = el.style.outline;
    S.lastOffset = el.style.outlineOffset;
    el.style.outline = '2px solid rgba(27,18,8,0.85)';
    el.style.outlineOffset = '2px';
  };
  S.click = (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    const el = e.target instanceof Element ? e.target : document.body;
    const r = el.getBoundingClientRect();
    const parts = [];
    let n = el;
    while (n && n !== document.body && parts.length < 8) {
      let p = n.tagName.toLowerCase();
      if (n.id) {
        parts.unshift(p + '#' + n.id);
        break;
      }
      const parent = n.parentElement;
      const sibs = parent ? Array.from(parent.children).filter((c) => c.tagName === n.tagName) : [];
      if (sibs.length > 1) p += ':nth-of-type(' + (sibs.indexOf(n) + 1) + ')';
      parts.unshift(p);
      n = parent;
    }
    console.log(
      '${POINT_PREFIX}' +
        JSON.stringify({
          selector: parts.join(' > '),
          rect: { x: r.x, y: r.y, width: r.width, height: r.height },
          px: Math.min(1, Math.max(0, (r.x + r.width / 2) / window.innerWidth)),
          py: Math.min(1, Math.max(0, (r.y + r.height / 2) / window.innerHeight)),
        }),
    );
  };
  S.key = (e) => {
    if (e.key === 'Escape') console.log('${EXIT_PREFIX}');
  };
  addEventListener('mousemove', S.move, true);
  addEventListener('click', S.click, true);
  addEventListener('keydown', S.key, true);
})();`

export const REMOVE_SCRIPT = `(() => {
  const S = window.__helmPoint;
  if (!S) return;
  S.clear();
  removeEventListener('mousemove', S.move, true);
  removeEventListener('click', S.click, true);
  removeEventListener('keydown', S.key, true);
  delete window.__helmPoint;
})();`

/**
 * Inline text-edit mode. Mirrors the point-capture lifecycle but instead of just
 * reporting geometry it makes the hovered/clicked element directly editable: on
 * click the element becomes contentEditable and its original text is recorded; on
 * blur or Enter (commit) the new text is read and `__HELM_TEXTEDIT__{selector,
 * oldText, newText}` is logged over the same prefix-guarded console channel. Esc
 * cancels the in-flight edit and exits the mode (no report). The selector is
 * built with the SAME algorithm as point-capture so it resolves to the identical
 * element server-side.
 */
export const TEXT_EDIT_INSTALL_SCRIPT = `(() => {
  if (window.__helmTextEdit) return;
  const S = (window.__helmTextEdit = {
    last: null, lastOutline: '', lastOffset: '',
    editing: null, original: '', prevEditable: '',
  });
  const selectorOf = (el) => {
    const parts = [];
    let n = el;
    while (n && n !== document.body && parts.length < 8) {
      let p = n.tagName.toLowerCase();
      if (n.id) { parts.unshift(p + '#' + n.id); break; }
      const parent = n.parentElement;
      const sibs = parent ? Array.from(parent.children).filter((c) => c.tagName === n.tagName) : [];
      if (sibs.length > 1) p += ':nth-of-type(' + (sibs.indexOf(n) + 1) + ')';
      parts.unshift(p);
      n = parent;
    }
    return parts.join(' > ');
  };
  S.clearHi = () => {
    if (S.last) {
      S.last.style.outline = S.lastOutline;
      S.last.style.outlineOffset = S.lastOffset;
      S.last = null;
    }
  };
  S.move = (e) => {
    if (S.editing) return;
    const el = e.target;
    if (!(el instanceof Element) || el === document.documentElement || el === document.body) {
      S.clearHi();
      return;
    }
    if (S.last === el) return;
    S.clearHi();
    S.last = el;
    S.lastOutline = el.style.outline;
    S.lastOffset = el.style.outlineOffset;
    el.style.outline = '2px dashed rgba(27,18,8,0.85)';
    el.style.outlineOffset = '2px';
  };
  S.commit = () => {
    const el = S.editing;
    if (!el) return;
    const selector = S.selector;
    const newText = (el.textContent || '').trim();
    const oldText = S.original;
    el.contentEditable = S.prevEditable;
    el.blur();
    S.editing = null;
    S.selector = '';
    console.log('${TEXTEDIT_PREFIX}' + JSON.stringify({ selector, oldText, newText }));
  };
  S.cancel = () => {
    const el = S.editing;
    if (el) {
      el.textContent = S.original;
      el.contentEditable = S.prevEditable;
      el.blur();
    }
    S.editing = null;
    S.selector = '';
  };
  S.click = (e) => {
    if (S.editing) return; // let the user click within the editable element
    e.preventDefault();
    e.stopImmediatePropagation();
    const el = e.target instanceof Element ? e.target : null;
    if (!el || el === document.body || el === document.documentElement) return;
    S.clearHi();
    S.editing = el;
    S.selector = selectorOf(el);
    S.original = (el.textContent || '').trim();
    S.prevEditable = el.getAttribute('contenteditable') || 'inherit';
    el.contentEditable = 'true';
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    if (sel) { sel.removeAllRanges(); sel.addRange(range); }
  };
  S.blur = (e) => {
    if (S.editing && e.target === S.editing) S.commit();
  };
  S.key = (e) => {
    if (e.key === 'Escape') {
      if (S.editing) { S.cancel(); return; }
      console.log('${EXIT_PREFIX}');
      return;
    }
    if (e.key === 'Enter' && S.editing && !e.shiftKey) {
      e.preventDefault();
      S.commit();
    }
  };
  addEventListener('mousemove', S.move, true);
  addEventListener('click', S.click, true);
  addEventListener('blur', S.blur, true);
  addEventListener('keydown', S.key, true);
})();`

export const TEXT_EDIT_REMOVE_SCRIPT = `(() => {
  const S = window.__helmTextEdit;
  if (!S) return;
  S.cancel();
  S.clearHi();
  removeEventListener('mousemove', S.move, true);
  removeEventListener('click', S.click, true);
  removeEventListener('blur', S.blur, true);
  removeEventListener('keydown', S.key, true);
  delete window.__helmTextEdit;
})();`

interface ActiveCapture {
  view: GuestView
  unsubscribe: () => void
}

export class PointCaptureService {
  private active = new Map<string, ActiveCapture>()
  /** The last locked capture per project, waiting for its points:register. */
  private pending = new Map<string, ElementCapture>()
  /** Inline text-edit mode. Only the install/remove lifecycle lives in main; the
   *  edited selector + text are carried renderer→core in points:register-text-edit
   *  (see the SELECTOR ASYMMETRY note in the header), so there is no main-side
   *  pending edit to track. */
  private textEditActive = new Map<string, ActiveCapture>()

  constructor(
    private deps: PointCaptureDeps,
    private onCapture: (projectId: string, geometry: CaptureGeometry) => void,
    private onExit: (projectId: string) => void,
  ) {
    // A guest reload destroys any injected editor; tear our state down on the
    // main side so a mid-edit reload always cleans up (requirements: inline-edit
    // cleanup on reload). Over-teardown is safe — the modes simply re-arm.
    deps.onGuestReload?.(() => this.teardownAll())
  }

  /** Deactivate every active point + text-edit session. Fired on guest reload. */
  private teardownAll(): void {
    for (const projectId of [...this.active.keys()]) this.deactivate(projectId)
    for (const projectId of [...this.textEditActive.keys()]) this.deactivateTextEdit(projectId)
  }

  /** Find the attached guest currently showing this project's live app. */
  private resolveGuest(projectId: string): GuestView | null {
    const url = this.deps.previewUrl(projectId)
    if (!url) return null
    const match = this.deps.listGuests().find((g) => g.url.startsWith(url))
    return match?.view ?? null
  }

  isActive(projectId: string): boolean {
    return this.active.has(projectId)
  }

  /** Turn point mode on. Returns false when no live guest is attached (preview
   *  not live / webview not mounted) — the renderer treats that as a no-op. */
  activate(projectId: string): boolean {
    if (this.active.has(projectId)) return true
    const view = this.resolveGuest(projectId)
    if (!view) return false
    const unsubscribe = view.onConsole((line) => void this.handleConsole(projectId, view, line))
    void view.executeJavaScript(INSTALL_SCRIPT)
    this.active.set(projectId, { view, unsubscribe })
    return true
  }

  /** Turn point mode off and remove the guest-side listeners. */
  deactivate(projectId: string): void {
    const entry = this.active.get(projectId)
    if (!entry) return
    this.active.delete(projectId)
    entry.unsubscribe()
    void entry.view.executeJavaScript(REMOVE_SCRIPT)
  }

  private async handleConsole(projectId: string, view: GuestView, line: string): Promise<void> {
    if (line.startsWith(EXIT_PREFIX)) {
      this.deactivate(projectId)
      this.onExit(projectId)
      return
    }
    // Note: the inline-edit script also logs `__HELM_TEXTEDIT__…`, but main does
    // NOT consume it — inline-edit selectors are request-carried (renderer→core),
    // so that console line is intentionally ignored here. The browser-proxy relay
    // forwards the commit to the renderer via postMessage instead.
    if (line.startsWith(TEXTEDIT_PREFIX)) return
    if (!line.startsWith(POINT_PREFIX)) return
    let payload: GuestClickPayload
    try {
      payload = JSON.parse(line.slice(POINT_PREFIX.length)) as GuestClickPayload
    } catch {
      return // malformed guest output — ignore, never crash point mode
    }
    const crop = await view.captureRegion(payload.rect)
    this.pending.set(projectId, {
      selector: payload.selector || null,
      boundingBox: payload.rect,
      screenshotCrop: crop,
      pinX: payload.px,
      pinY: payload.py,
    })
    this.onCapture(projectId, { boundingBox: payload.rect, pinX: payload.px, pinY: payload.py })
  }

  /** Hand the last locked capture to points:register and clear it. */
  consumePending(projectId: string): ElementCapture | null {
    const capture = this.pending.get(projectId) ?? null
    this.pending.delete(projectId)
    return capture
  }

  /* ------------------------- inline text edit ------------------------- */

  isTextEditActive(projectId: string): boolean {
    return this.textEditActive.has(projectId)
  }

  /** Turn inline text-edit mode on. Returns false when no live guest is attached
   *  (preview not live / webview not mounted) — the caller maps that to
   *  `webview_not_ready`. */
  activateTextEdit(projectId: string): boolean {
    if (this.textEditActive.has(projectId)) return true
    const view = this.resolveGuest(projectId)
    if (!view) return false
    const unsubscribe = view.onConsole((line) => void this.handleConsole(projectId, view, line))
    void view.executeJavaScript(TEXT_EDIT_INSTALL_SCRIPT)
    this.textEditActive.set(projectId, { view, unsubscribe })
    return true
  }

  /** Turn inline text-edit mode off and tear down the injected editor. Idempotent
   *  — safe to fire from a webview reload/navigation handler mid-edit. */
  deactivateTextEdit(projectId: string): void {
    const entry = this.textEditActive.get(projectId)
    if (!entry) return
    this.textEditActive.delete(projectId)
    entry.unsubscribe()
    void entry.view.executeJavaScript(TEXT_EDIT_REMOVE_SCRIPT)
  }
}

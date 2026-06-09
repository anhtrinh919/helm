/* HELM KIT — shared chrome + primitives. Exports to window. */
const { useState } = React;

/* ---- Phosphor glyph injection (name -> codepoint). We set real characters as
   text because this environment strips CSS \hex escapes from `content`. ---- */
const PH = {
  "sparkle":0xe6a2,"gear-six":0xe272,"compass-tool":0xea0e,"arrow-down-right":0xe042,
  "pencil-simple-line":0xebc6,"arrow-right":0xe06c,"download-simple":0xe20c,"books":0xe758,
  "coffee":0xe1c2,"calendar-check":0xe712,"arrow-left":0xe058,"target":0xe47c,
  "users-three":0xe68e,"users-four":0xe68c,"question":0xe3e8,"pencil-simple":0xe3b4,
  "arrow-bend-down-right":0xe01a,"check":0xe182,"caret-right":0xe13a,"tray":0xe4aa,
  "sign-out":0xe42a,"lock-simple":0xe308,"circle-notch":0xeb44,"rocket-launch":0xe3fe,
  "eye":0xe220,"flag-checkered":0xea38,"check-circle":0xe184,"arrow-u-up-left":0xe08a,
  "cursor-click":0xe7c8,"caret-up-down":0xe140,"squares-four":0xe464,"git-branch":0xe278,
  "chart-line-up":0xe156,"book-open":0xe0e6,"database":0xe1de,"house":0xe2c2,
  "caret-down":0xe136,"plus":0xe3d4,"dots-three":0xe1fe,"circle-dashed":0xe602,
  "arrow-counter-clockwise":0xe038,"arrow-clockwise":0xe036,"arrow-square-out":0xe5de,
  "hand-tap":0xec90,"plus-circle":0xe3d6,"x":0xe4f6,"text-aa":0xe6ee,
  "chat-teardrop-text":0xe178,"warning":0xe4e0,"warning-circle":0xe4e2,"info":0xe2ce,
  "users":0xe4d6,"hand-pointing":0xe29a
};
function fillIcons(root) {
  (root || document).querySelectorAll && (root || document).querySelectorAll('i.ph').forEach(el => {
    if (el.getAttribute('data-phf')) return;
    const cls = [...el.classList].find(c => c.startsWith('ph-') && c !== 'ph');
    const cp = cls && PH[cls.slice(3)];
    if (cp) { el.textContent = String.fromCodePoint(cp); el.setAttribute('data-phf', '1'); }
  });
}
if (typeof MutationObserver !== 'undefined') {
  const obs = new MutationObserver(muts => {
    for (const m of muts) for (const n of m.addedNodes) if (n.nodeType === 1) fillIcons(n);
  });
  const start = () => { fillIcons(document); obs.observe(document.body, { childList: true, subtree: true }); };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  setInterval(() => fillIcons(document), 400);
}

/* ---------- atoms ---------- */
function Icon({ n, s }) { return <i className={"ph ph-" + n} style={s ? { fontSize: s } : undefined} />; }

function ClaudeSignal({ inline }) {
  return (
    <div className={"hm-claude" + (inline ? " hm-claude--inline" : "")}>
      <span className="hm-claude__spark"><i className="ph ph-sparkle" /></span>
      <span className="hm-claude__txt">Running on <b>your Claude subscription</b><br />No usage meter, no extra bill.</span>
    </div>
  );
}

function Mark({ accent, big }) {
  return <span className="hm-mark" style={accent ? { background: "var(--accent)" } : (big ? { width: 36, height: 36, fontSize: 24, borderRadius: 10 } : undefined)}>H</span>;
}

/* ---------- working-surface side rail ---------- */
function SideRail({ active = "Cockpit", project = "Reading Room", live = true, mode = "Iterate" }) {
  const items = [
    { k: "Cockpit", i: "squares-four" },
    { k: "Decisions", i: "git-branch", c: 6 },
    { k: "Progress", i: "chart-line-up" },
    { k: "Docs", i: "book-open" },
  ];
  return (
    <aside className="hm-rail">
      <div className="hm-rail__brand"><Mark /><span className="hm-wordmark">Helm</span></div>

      <div className="hm-projpill">
        <span className="hm-projpill__dot" style={!live ? { background: "var(--ink-4)", boxShadow: "none" } : undefined} />
        <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
          <span className="hm-projpill__name">{project}</span>
          <span className="hm-projpill__meta">{live ? "Live · " : ""}{mode} mode</span>
        </span>
        <i className="ph ph-caret-up-down" style={{ marginLeft: "auto", color: "var(--ink-3)", fontSize: 15 }} />
      </div>

      <div className="hm-rail__group">
        <div className="hm-rail__label">This project</div>
        {items.map(it => (
          <div key={it.k} className={"hm-navitem" + (it.k === active ? " is-active" : "")}>
            <i className={"ph ph-" + it.i} />{it.k}
            {it.c != null && <span className="hm-navitem__count">{it.c}</span>}
          </div>
        ))}
        <div className="hm-navitem" style={{ color: "var(--ink-4)", cursor: "default" }}>
          <i className="ph ph-database" style={{ color: "var(--ink-4)" }} />Data
          <span className="hm-soontag" style={{ marginLeft: "auto" }}>Phase 3</span>
        </div>
      </div>

      <div className="hm-rail__spacer" />
      <ClaudeSignal />
    </aside>
  );
}

/* ---------- top bar (working surfaces) ---------- */
function TopBar({ crumbs = ["Reading Room"], showReserved = true, right }) {
  return (
    <div className="hm-top">
      <div className="hm-top__back"><i className="ph ph-arrow-left" /></div>
      <div className="hm-crumb">
        <i className="ph ph-house" style={{ color: "var(--ink-3)", fontSize: 16 }} />
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <i className="ph ph-caret-right sep" />}
            <b style={i === crumbs.length - 1 ? undefined : { fontWeight: 500, color: "var(--ink-2)" }}>{c}</b>
          </React.Fragment>
        ))}
      </div>
      <div className="hm-top__spacer" />
      {right}
      {showReserved && <div className="hm-slot-reserved"><i className="ph ph-rocket-launch" />Publish · Phase 2</div>}
    </div>
  );
}

/* ---------- work card (the core primitive) ---------- */
const STATE_META = {
  planned:  { label: "Planned",  icon: "circle-dashed", cls: "" },
  upnext:   { label: "Up next",  icon: "arrow-bend-down-right", cls: "is-upnext" },
  building: { label: "Building", icon: "circle-notch", cls: "is-building" },
  needs:    { label: "Needs you", icon: "hand-tap", cls: "is-needs" },
  fail:     { label: "Couldn’t finish", icon: "warning-circle", cls: "is-fail" },
  done:     { label: "Done", icon: "check-circle", cls: "" },
};
function WorkCard({ state = "planned", title, outcome, children, style }) {
  const m = STATE_META[state] || STATE_META.planned;
  return (
    <div className={"hm-card " + m.cls} style={style}>
      <div className="hm-card__top">
        <span className="hm-card__state"><i className={"ph ph-" + m.icon} style={{ fontSize: 14 }} />{m.label}</span>
        <i className="ph ph-dots-three hm-card__menu" />
      </div>
      <div className="hm-card__title">{title}</div>
      <div className="hm-card__outcome"><i className="ph ph-arrow-bend-down-right" /><span>{outcome}</span></div>
      {state === "building" && <div className="hm-buildbar"><i /></div>}
      {children}
    </div>
  );
}

/* condensed done row */
function DoneRow({ title, outcome }) {
  return (
    <div className="hm-card hm-card--done">
      <span className="hm-check"><i className="ph ph-check" /></span>
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.3, minWidth: 0 }}>
        <span className="t">{title}</span>
        <span className="o">{outcome}</span>
      </span>
      <i className="ph ph-arrow-counter-clockwise" style={{ marginLeft: "auto", color: "var(--ink-4)", fontSize: 15 }} />
    </div>
  );
}

/* ---------- journey step ---------- */
function Step({ n, total, title, desc, state = "locked", last }) {
  const node = state === "done" ? <i className="ph ph-check" /> : n;
  return (
    <div className={"hm-step is-" + state}>
      <div className="hm-step__rail">
        <div className="hm-step__node">{node}</div>
        {!last && <div className="hm-step__line" />}
      </div>
      <div className="hm-step__body">
        <div className="hm-step__title">{title}</div>
        {desc && <div className="hm-step__desc">{desc}</div>}
      </div>
    </div>
  );
}

/* ---------- placeholder live app (a calm reading-room app being built) ---------- */
function FakeApp({ dim }) {
  return (
    <div style={{ width: "100%", height: "100%", background: "#fff", opacity: dim ? .45 : 1, filter: dim ? "saturate(.7)" : "none", transition: "opacity .3s", overflow: "hidden", fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
      <div style={{ height: 54, borderBottom: "1px solid #ECECEC", display: "flex", alignItems: "center", padding: "0 26px" }}>
        <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 21, color: "#1c2433" }}>The Reading Room</span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 22, fontSize: 13.5, color: "#5a6473" }}>
          <span>Browse</span><span>Events</span><span>Join</span>
        </span>
      </div>
      <div style={{ padding: "34px 36px 28px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#9aa3b2", marginBottom: 14 }}>Neighbourhood book club</div>
        <div data-app-text style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 34, lineHeight: 1.12, color: "#1c2433", marginBottom: 14 }}>Find your next great read, together.</div>
        <div style={{ fontSize: 15, color: "#5a6473", lineHeight: 1.55, marginBottom: 22, maxWidth: 460 }}>Pick a book, reserve a seat at the next meet, and swap notes with people on your street.</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 30 }}>
          <span style={{ height: 42, padding: "0 20px", borderRadius: 10, background: "#1c2433", color: "#fff", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center" }}>Reserve a slot</span>
          <span style={{ height: 42, padding: "0 20px", borderRadius: 10, border: "1px solid #d9dde4", color: "#1c2433", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center" }}>See the shelf</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          {["This week","Most loved","New in"].map((t,i) => (
            <div key={i} style={{ border: "1px solid #ECECEC", borderRadius: 12, padding: 14 }}>
              <div style={{ height: 78, borderRadius: 8, background: ["#EAF0FB","#F3ECFB","#FBF0EA"][i], marginBottom: 10 }} />
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1c2433" }}>{t}</div>
              <div style={{ fontSize: 12, color: "#9aa3b2", marginTop: 2 }}>6 titles</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Icon, ClaudeSignal, Mark, SideRail, TopBar, WorkCard, DoneRow, Step, FakeApp, fillIcons });

/* HELM SCREENS — Front Door (default + returning) */

function FDTopBar() {
  return (
    <div className="hm-guide-top">
      <Mark /><span className="hm-wordmark">Helm</span>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
        <ClaudeSignal inline />
        <div className="hm-top__back" style={{ background: "transparent", border: "1px solid var(--line)" }}><i className="ph ph-gear-six" /></div>
      </div>
    </div>
  );
}

function PrimaryDoor() {
  return (
    <div className="hm-door hm-door--primary">
      <div className="hm-door__icon hm-door__icon--accent"><i className="ph ph-compass-tool" /></div>
      <div className="hm-door__title">Build with structure</div>
      <div className="hm-door__desc">Describe what you want. Helm asks a few plain questions, lays out a clear plan, and guides you there one step at a time.</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "auto", paddingTop: 22 }}>
        <div className="hm-subdoor hm-subdoor--cta">
          <span className="hm-subdoor__ic"><i className="ph ph-compass-tool" /></span>
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.35 }}>
            <span className="s-title">Start the guided journey</span>
            <span className="s-sub">A clear plan, one step at a time</span>
          </span>
          <i className="ph ph-arrow-right" style={{ marginLeft: "auto" }} />
        </div>
      </div>
    </div>
  );
}

function IterateDoor() {
  return (
    <div className="hm-door">
      <div className="hm-door__icon hm-door__icon--quiet"><i className="ph ph-pencil-simple-line" /></div>
      <div className="hm-door__title">Build freely</div>
      <div className="hm-door__desc">Jump straight into free-form building, beside your live app — no rails, change anything anytime.</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "auto", paddingTop: 22 }}>
        <div className="hm-subdoor hm-subdoor--cta">
          <span className="hm-subdoor__ic"><i className="ph ph-sparkle" /></span>
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.35 }}>
            <span className="s-title">Start fresh</span>
            <span className="s-sub">Your first request scaffolds the app</span>
          </span>
          <i className="ph ph-arrow-right" style={{ marginLeft: "auto" }} />
        </div>
        <div className="hm-subdoor is-soon">
          <span className="hm-subdoor__ic"><i className="ph ph-download-simple" /></span>
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.35 }}>
            <span className="s-title">Bring an existing app</span>
            <span className="s-sub">Continue something you started elsewhere</span>
          </span>
          <span className="hm-soontag">Phase 5</span>
        </div>
      </div>
    </div>
  );
}

function FrontDoorDefault() {
  return (
    <div className="hm hm-guide">
      <FDTopBar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 40px" }}>
        <div style={{ width: "100%", maxWidth: 920 }}>
          <div style={{ textAlign: "center", marginBottom: 38 }}>
            <span className="hm-eyebrow hm-eyebrow--prompt" style={{ justifyContent: "center" }}>Welcome to Helm</span>
            <div className="hm-display hm-h-l" style={{ marginTop: 14 }}>What would you like to <span className="hm-hl">build</span>?<span className="hm-caret" /></div>
            <div style={{ fontSize: 16, color: "var(--ink-2)", marginTop: 12 }}>Two ways in. Pick the one that fits — you can always change course.</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, alignItems: "stretch" }}>
            <PrimaryDoor />
            <IterateDoor />
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 30 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "var(--ink-3)" }}>
              <span className="hm-claude__spark" style={{ width: 18, height: 18 }}><i className="ph ph-sparkle" /></span>
              Running on <b style={{ color: "var(--ink-2)" }}>your Claude subscription</b> — no usage meter, no extra bill.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FrontDoorReturning() {
  const recents = [
    { n: "Reading Room", m: "Iterate · Live now", i: "books", live: true },
    { n: "Coffee Subscriptions", m: "Journey · Step 3 of 5", i: "coffee", live: false },
    { n: "Studio Booking", m: "Completed · 2 days ago", i: "calendar-check", live: false },
  ];
  return (
    <div className="hm hm-guide">
      <FDTopBar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 40px" }}>
        <div style={{ width: "100%", maxWidth: 920 }}>
          <div style={{ marginBottom: 26 }}>
            <span className="hm-eyebrow hm-eyebrow--prompt">Welcome back, Mira</span>
            <div className="hm-display hm-h-m" style={{ marginTop: 12 }}>Pick up where you left off, or start fresh.</div>
          </div>

          <div style={{ marginBottom: 30 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink-3)" }}>Jump back in</span>
              <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--accent-text)", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>All projects <i className="ph ph-arrow-right" /></span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {recents.map((r, i) => (
                <div key={i} className="hm-recent">
                  <span className="hm-recent__thumb"><i className={"ph ph-" + r.i} /></span>
                  <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.35, minWidth: 0 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.n}</span>
                    <span style={{ fontSize: 12.5, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 6 }}>
                      {r.live && <span className="hm-dot hm-dot--live" />}{r.m}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
            <PrimaryDoor />
            <IterateDoor />
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { FrontDoorDefault, FrontDoorReturning });

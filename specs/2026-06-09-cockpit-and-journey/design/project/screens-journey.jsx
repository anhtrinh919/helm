/* HELM SCREENS — Build Journey (3 layout directions) + checkpoint */

const JSTEPS = [
  { t: "Set up the look & shell", d: "Your club's calm home page", state: "done" },
  { t: "The sign-up form", d: "Put your name down for a meet", state: "done" },
  { t: "Show the next meeting", d: "Date, book and place at a glance", state: "current" },
  { t: "A simple seat count", d: "Shows spots left so it won't overfill", state: "locked" },
  { t: "Tidy & review together", d: "Try the whole thing end-to-end", state: "locked" },
];

function ShelfBadge() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 13px", borderRadius: "var(--r3)", border: "1px solid var(--parked-border)", background: "var(--parked-weak)", cursor: "pointer" }}>
      <i className="ph ph-tray" style={{ color: "var(--parked)", fontSize: 18 }} />
      <span style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 500 }}>For-later shelf</span>
      <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "#fff", background: "var(--parked)", borderRadius: 999, minWidth: 20, height: 20, display: "grid", placeItems: "center", padding: "0 6px" }}>2</span>
    </div>
  );
}

function EscapeHatch({ block }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontSize: 13, color: "var(--ink-3)", cursor: "pointer", padding: block ? "10px" : 0 }}>
      <i className="ph ph-sign-out" /> Leave the journey
    </div>
  );
}

/* the building preview (last-good content, dimmed, with a calm narration overlay) */
function BuildingPreview({ note = "Adding the next-meeting banner…" }) {
  return (
    <div className="hm-preview" style={{ flex: 1, minHeight: 0 }}>
      <div className="hm-preview__bar">
        <span className="hm-dot hm-dot--success" />
        <div className="hm-urlpill"><i className="ph ph-lock-simple" style={{ fontSize: 12 }} />readingroom.local</div>
        <span className="hm-chip hm-chip--accent"><i className="ph ph-circle-notch" />Updating</span>
      </div>
      <div className="hm-preview__stage" style={{ position: "relative" }}>
        <div className="hm-preview__frame"><FakeApp dim /></div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 18, display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 999, background: "rgba(38,34,29,.92)", color: "#fff", fontSize: 13, boxShadow: "var(--sh3)" }}>
            <span className="hm-thinking"><i style={{ background: "#fff" }} /><i style={{ background: "#fff" }} /><i style={{ background: "#fff" }} /></span>
            {note}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ A — SPINE */
function JourneyA() {
  return (
    <div className="hm">
      <div className="hm-top">
        <div className="hm-top__back"><i className="ph ph-arrow-left" /></div>
        <div className="hm-crumb"><Mark /><b>Reading Room</b><i className="ph ph-caret-right sep" /><span style={{ color: "var(--ink-2)" }}>Guided build</span></div>
        <div className="hm-top__spacer" />
        <ClaudeSignal inline />
      </div>
      <div className="hm-shell">
        {/* journey column */}
        <aside style={{ width: 372, flex: "0 0 372px", borderRight: "1px solid var(--line)", background: "var(--surface)", display: "flex", flexDirection: "column", padding: "22px 22px 18px" }}>
          <div style={{ marginBottom: 6 }}>
            <span className="hm-progresslabel">Step 3 of 5</span>
            <div style={{ fontSize: 13.5, color: "var(--ink-3)", marginTop: 4 }}>to your working sign-up page</div>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: "var(--accent-weak-2)", margin: "14px 0 8px", overflow: "hidden" }}>
            <div style={{ width: "50%", height: "100%", background: "var(--accent)", borderRadius: 999 }} />
          </div>
          <div style={{ flex: 1, overflow: "hidden", marginTop: 6 }}>
            {JSTEPS.map((s, i) => <Step key={i} n={i + 1} title={s.t} desc={s.state === "current" ? s.d : null} state={s.state} last={i === JSTEPS.length - 1} />)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
            <ShelfBadge />
            <div className="hm-divider" />
            <EscapeHatch />
          </div>
        </aside>
        {/* focus + preview */}
        <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "var(--surface-2)" }}>
          <div style={{ padding: "24px 28px 20px" }}>
            <span className="hm-eyebrow hm-eyebrow--accent"><span className="hm-dot hm-dot--idle" style={{ background: "var(--accent)" }} />Now building</span>
            <div className="hm-display hm-h-m" style={{ marginTop: 10 }}>Show the next meeting</div>
            <div style={{ fontSize: 15, color: "var(--ink-2)", marginTop: 8, maxWidth: "60ch", lineHeight: 1.5 }}>I'm adding a clear banner up top with the date, the book you're reading and where you'll meet — so members know at a glance.</div>
          </div>
          <div style={{ flex: 1, minHeight: 0, display: "flex", padding: "0 28px 28px" }}>
            <div style={{ flex: 1, display: "flex", borderRadius: "var(--r3)", overflow: "hidden", border: "1px solid var(--line)", boxShadow: "var(--sh1)" }}>
              <BuildingPreview />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ============================================================ B — STAGE (ceremonial) */
function JourneyB() {
  return (
    <div className="hm hm-guide">
      <div className="hm-guide-top">
        <div className="hm-top__back" style={{ background: "#fff" }}><i className="ph ph-arrow-left" /></div>
        <Mark /><span className="hm-wordmark">Helm</span>
        <span style={{ marginLeft: 8, fontSize: 14, color: "var(--ink-2)" }}>Reading Room · guided build</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <ShelfBadge /><EscapeHatch />
        </div>
      </div>
      {/* horizontal stepper */}
      <div style={{ padding: "20px 48px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span className="hm-progresslabel" style={{ marginBottom: 14 }}>Step 3 of 5</span>
        <div style={{ display: "flex", alignItems: "center", width: "100%", maxWidth: 760 }}>
          {JSTEPS.map((s, i) => (
            <React.Fragment key={i}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: "0 0 auto", width: 84 }}>
                <span style={{ width: 30, height: 30, borderRadius: 999, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700,
                  background: s.state === "done" ? "var(--success)" : s.state === "current" ? "var(--accent)" : "var(--surface-2)",
                  color: s.state === "locked" ? "var(--ink-4)" : "#fff",
                  border: s.state === "locked" ? "2px solid var(--line-2)" : "none",
                  boxShadow: s.state === "current" ? "var(--ring)" : "none" }}>
                  {s.state === "done" ? <i className="ph ph-check" /> : i + 1}
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: s.state === "current" ? "var(--ink)" : "var(--ink-3)", textAlign: "center", lineHeight: 1.2, whiteSpace: "nowrap" }}>{s.t.split(" ").slice(0, 2).join(" ")}</span>
              </div>
              {i < JSTEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < 2 ? "var(--success)" : "var(--line-2)", marginTop: -20 }} />}
            </React.Fragment>
          ))}
        </div>
      </div>
      {/* centered focus */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", padding: "26px 48px 36px" }}>
        <div style={{ textAlign: "center", maxWidth: 620, marginBottom: 20 }}>
          <span className="hm-eyebrow hm-eyebrow--accent" style={{ justifyContent: "center" }}>Now building</span>
          <div className="hm-display hm-h-l" style={{ marginTop: 10 }}>Show the next meeting</div>
          <div style={{ fontSize: 15.5, color: "var(--ink-2)", marginTop: 10, lineHeight: 1.5 }}>A clear banner with the date, book and place — so members know where to be at a glance.</div>
        </div>
        <div style={{ flex: 1, minHeight: 0, width: "100%", maxWidth: 980, display: "flex", borderRadius: "var(--r4)", overflow: "hidden", border: "1px solid var(--line)", boxShadow: "var(--sh3)" }}>
          <BuildingPreview />
        </div>
      </div>
    </div>
  );
}

/* ============================================================ C — SPLIT (working, preview-dominant) */
function JourneyC() {
  return (
    <div className="hm">
      <div className="hm-top">
        <div className="hm-top__back"><i className="ph ph-arrow-left" /></div>
        <div className="hm-crumb"><Mark /><b>Reading Room</b></div>
        <span className="hm-chip hm-chip--accent" style={{ marginLeft: 10 }}><i className="ph ph-compass-tool" />Step 3 of 5</span>
        <div className="hm-top__spacer" />
        <EscapeHatch />
        <div className="hm-slot-reserved"><i className="ph ph-rocket-launch" />Publish · Phase 2</div>
      </div>
      <div className="hm-shell">
        {/* compact journey column */}
        <aside style={{ width: 290, flex: "0 0 290px", borderRight: "1px solid var(--line)", background: "var(--surface)", display: "flex", flexDirection: "column", padding: "18px 16px 14px" }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)", padding: "4px 6px 12px" }}>Your journey</div>
          <div style={{ flex: 1 }}>
            {JSTEPS.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 8px", borderRadius: 0, background: s.state === "current" ? "var(--accent-weak)" : "transparent", border: s.state === "current" ? "1.5px solid var(--frame)" : "1.5px solid transparent", marginBottom: 2 }}>
                <span style={{ width: 22, height: 22, borderRadius: 0, flex: "0 0 auto", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, fontFamily: "var(--display)",
                  background: s.state === "done" ? "var(--ink)" : s.state === "current" ? "var(--lime)" : "var(--surface-2)",
                  color: s.state === "done" ? "var(--lime)" : s.state === "current" ? "var(--ink)" : "var(--ink-4)", border: "1.5px solid " + (s.state === "locked" ? "var(--line-2)" : "var(--frame)") }}>
                  {s.state === "done" ? <i className="ph ph-check" style={{ fontSize: 11 }} /> : i + 1}
                </span>
                <span style={{ fontSize: 13.5, fontWeight: s.state === "current" ? 700 : 500, color: s.state === "locked" ? "var(--ink-4)" : s.state === "current" ? "var(--ink)" : "var(--ink-2)", lineHeight: 1.25 }}>{s.t}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <ShelfBadge />
            <ClaudeSignal />
          </div>
        </aside>
        {/* preview dominant */}
        <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "var(--surface-2)" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 14, background: "var(--surface)" }}>
            <span style={{ width: 38, height: 38, borderRadius: 0, background: "var(--lime)", color: "var(--ink)", border: "1.5px solid var(--frame)", display: "grid", placeItems: "center", fontSize: 19, flex: "0 0 auto" }}><i className="ph ph-circle-notch" /></span>
            <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.35 }}>
              <span style={{ fontSize: 15.5, fontWeight: 600 }}>Building: Show the next meeting</span>
              <span style={{ fontSize: 13.5, color: "var(--ink-2)", display: "flex", gap: 7 }}><i className="ph ph-arrow-bend-down-right" style={{ color: "var(--accent-text)" }} />So members know the date, book and place at a glance</span>
            </span>
            <button className="hm-btn hm-btn--sm" style={{ marginLeft: "auto" }}><i className="ph ph-eye" />Watch it work</button>
          </div>
          <div style={{ flex: 1, minHeight: 0, display: "flex" }}><BuildingPreview /></div>
        </main>
      </div>
    </div>
  );
}

/* ============================================================ CHECKPOINT — the hard stop */
function JourneyCheckpoint() {
  const built = [
    "A banner at the top of your page",
    "Shows the date, the book and the place",
    "Updates itself when you change the next meet",
  ];
  return (
    <div className="hm">
      <div className="hm-top">
        <div className="hm-top__back"><i className="ph ph-arrow-left" /></div>
        <div className="hm-crumb"><Mark /><b>Reading Room</b><i className="ph ph-caret-right sep" /><span style={{ color: "var(--ink-2)" }}>Guided build</span></div>
        <span className="hm-chip hm-chip--success" style={{ marginLeft: 10 }}><i className="ph ph-flag-checkered" />Checkpoint · Step 3 of 5</span>
        <div className="hm-top__spacer" />
        <ClaudeSignal inline />
      </div>
      <div className="hm-shell">
        {/* left: what was built + continue */}
        <aside style={{ width: 440, flex: "0 0 440px", borderRight: "1px solid var(--line)", background: "var(--surface)", display: "flex", flexDirection: "column", padding: "30px 32px" }}>
          <span className="hm-eyebrow hm-eyebrow--accent">Step 3 done — your turn</span>
          <div className="hm-display hm-h-m" style={{ marginTop: 12 }}>Have a look at the next-meeting banner.</div>
          <div style={{ fontSize: 15, color: "var(--ink-2)", marginTop: 10, lineHeight: 1.5 }}>I added it to your live page on the right. Try it out, then tell me if it's right before we move on.</div>

          <div style={{ marginTop: 22, marginBottom: 4, fontSize: 12.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink-3)" }}>What I built</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 10 }}>
            {built.map((b, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ width: 20, height: 20, borderRadius: 999, background: "var(--success-weak)", color: "var(--success)", display: "grid", placeItems: "center", fontSize: 12, flex: "0 0 auto", marginTop: 1 }}><i className="ph ph-check" /></span>
                <span style={{ fontSize: 14.5, color: "var(--ink-2)", lineHeight: 1.4 }}>{b}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 13.5, color: "var(--ink-2)", marginBottom: 8 }}>Anything to change? <span style={{ color: "var(--ink-3)" }}>(optional)</span></div>
            <textarea className="hm-input" rows={2} placeholder="e.g. make the date bigger, or use a warmer colour…" />
          </div>

          <div className="hm-rail__spacer" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
            <button className="hm-btn hm-btn--primary hm-btn--lg hm-btn--block"><i className="ph ph-check-circle" />Looks good — continue to step 4</button>
            <button className="hm-btn hm-btn--block hm-btn--quiet"><i className="ph ph-arrow-u-up-left" />Something's not right</button>
          </div>
        </aside>
        {/* right: live preview to try */}
        <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "var(--surface-2)" }}>
          <div className="hm-preview" style={{ flex: 1, minHeight: 0, borderLeft: "none" }}>
            <div className="hm-preview__bar">
              <span className="hm-dot hm-dot--live" />
              <div className="hm-urlpill"><i className="ph ph-lock-simple" style={{ fontSize: 12 }} />readingroom.local</div>
              <span className="hm-chip hm-chip--success"><i className="ph ph-check" />Live · try it</span>
            </div>
            <div className="hm-preview__stage">
              <div className="hm-preview__frame"><FakeApp /></div>
            </div>
            <div style={{ padding: "0 18px 18px", display: "flex", justifyContent: "center" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-3)" }}><i className="ph ph-cursor-click" />Click around — this is your real app.</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

Object.assign(window, { JourneyA, JourneyB, JourneyC, JourneyCheckpoint });

/* HELM — Foundations panels for the canvas */

function Swatch({ c, n, hex, dark }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ height: 56, borderRadius: 0, background: c, border: "1.5px solid var(--frame)" }} />
      <div style={{ lineHeight: 1.3 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700 }}>{n}</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-3)", fontFamily: "var(--mono)" }}>{hex}</div>
      </div>
    </div>
  );
}

function FoundationColor() {
  return (
    <div className="hm" style={{ padding: 32, background: "var(--surface)", display: "block", height: "auto" }}>
      <span className="hm-eyebrow">Foundation</span>
      <div className="hm-display hm-h-m" style={{ marginTop: 8, marginBottom: 4 }}>Palette</div>
      <div style={{ fontSize: 14, color: "var(--ink-2)", marginBottom: 22, maxWidth: "60ch" }}>Bone-paper foundation, near-black ink, sharp black frames. The lime is a <b>highlighter/fill</b> (never coloured text) reserved for the live thread — “act here”. Semantics are scarce and square.</div>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink-3)", margin: "0 0 12px" }}>Neutrals</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 14, marginBottom: 24 }}>
        <Swatch c="#E7E7DB" n="Canvas" hex="#E7E7DB" />
        <Swatch c="#ECECE1" n="Recessed" hex="#ECECE1" />
        <Swatch c="#FAFAF1" n="Surface" hex="#FAFAF1" />
        <Swatch c="#FCFCF5" n="Elevated" hex="#FCFCF5" />
        <Swatch c="#34362B" n="Ink-2" hex="#34362B" />
        <Swatch c="#14150E" n="Ink / Frame" hex="#14150E" />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink-3)", margin: "0 0 12px" }}>Lime &amp; semantics</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 14 }}>
        <Swatch c="#C2EE2A" n="Lime (fill)" hex="#C2EE2A" />
        <Swatch c="#EDF7C2" n="Lime weak" hex="#EDF7C2" />
        <Swatch c="#2F7D4F" n="Done" hex="#2F7D4F" />
        <Swatch c="#A66A12" n="Needs you" hex="#A66A12" />
        <Swatch c="#BA4630" n="Failed" hex="#BA4630" />
        <Swatch c="#6E7064" n="Parked" hex="#6E7064" />
      </div>
    </div>
  );
}

function FoundationType() {
  return (
    <div className="hm" style={{ padding: 32, background: "var(--surface)", display: "block", height: "auto" }}>
      <span className="hm-eyebrow">Foundation</span>
      <div className="hm-display hm-h-m" style={{ marginTop: 8, marginBottom: 22 }}>Type — all monospace</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 14 }}>Space Mono · oversized guiding titles</div>
          <div className="hm-display" style={{ fontSize: 40, lineHeight: 1.04, textTransform: "uppercase", letterSpacing: "-.03em" }}>What would you<br />like to <span className="hm-hl">build</span>?</div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 12, fontFamily: "var(--mono)" }}>front door · journey titles · checkpoint · celebration</div>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 14 }}>JetBrains Mono · all working UI</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>Card title · 22 / 700</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Section heading · 16 / 700</div>
            <div style={{ fontSize: 14, color: "var(--ink-2)" }}>Body &amp; outcome copy · 14 / 400 — legible mono, the working voice everywhere.</div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ink-3)" }}>&gt; Eyebrow / step label · uppercase</div>
            <div style={{ fontSize: 13, color: "var(--ink-2)", fontFamily: "var(--mono)" }}>readingroom.local · same family for URLs</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FoundationCards() {
  return (
    <div className="hm" style={{ padding: 32, background: "var(--surface-2)", display: "block", height: "auto" }}>
      <span className="hm-eyebrow">Core primitive</span>
      <div className="hm-display hm-h-m" style={{ marginTop: 8, marginBottom: 4 }}>The work card</div>
      <div style={{ fontSize: 14, color: "var(--ink-2)", marginBottom: 22, maxWidth: "64ch" }}>One primitive, every surface: a full board card, a journey milestone, and a condensed done row. The plain-language <b>outcome</b> is a first-class line — never a caption.</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
        <WorkCard state="planned" title="Photos from past meets" outcome={<span>Gives newcomers a <b>feel for the club</b></span>} />
        <WorkCard state="upnext" title="Confirmation message" outcome={<span>Reassures their <b>seat is saved</b></span>} />
        <WorkCard state="building" title="Waitlist when full" outcome={<span>Lets extra people <b>join a waitlist</b></span>} />
        <WorkCard state="needs" title="Member emails" outcome={<span>Lets you <b>tell members</b> of changes</span>} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        <div className="hm-card hm-card--fail is-fail" style={{ alignSelf: "start" }}>
          <div className="hm-card__top"><span className="hm-card__state"><i className="ph ph-warning-circle" style={{ fontSize: 14 }} />Couldn’t finish</span><i className="ph ph-dots-three hm-card__menu" /></div>
          <div className="hm-card__title">Map of the venue</div>
          <div className="hm-card__outcome"><i className="ph ph-arrow-bend-down-right" /><span>Shows people <b>where to find you</b></span></div>
          <div className="hm-callout hm-callout--fail" style={{ marginTop: 13, padding: "11px 13px", fontSize: 13 }}><span className="hm-callout__ic"><i className="ph ph-info" /></span><span>The map needs an address Helm doesn’t have yet. <b>Try again</b> or skip for now.</span></div>
        </div>
        <div style={{ background: "var(--surface-3)", border: "1.5px solid var(--frame)", borderRadius: 0, padding: "8px 10px", alignSelf: "start" }}>
          <div style={{ padding: "6px 6px", fontSize: 12.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--ink-3)" }}>Done — condensed history rows</div>
          <DoneRow title="Seat count" outcome="Shows how many spots are left" />
          <DoneRow title="Next-meeting banner" outcome="Date, book and place up top" />
          <DoneRow title="Sign-up form" outcome="Put your name down for a meet" />
        </div>
      </div>
    </div>
  );
}

function FoundationAtoms() {
  return (
    <div className="hm" style={{ padding: 32, background: "var(--surface)", display: "block", height: "auto" }}>
      <span className="hm-eyebrow">Foundation</span>
      <div className="hm-display hm-h-m" style={{ marginTop: 8, marginBottom: 22 }}>Progress, signal &amp; controls</div>
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 36 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 14 }}>Two distinct progress treatments</div>
          <div style={{ display: "flex", gap: 30 }}>
            <div style={{ flex: 1 }}>
              <span className="hm-progresslabel">Step 3 of 5</span>
              <div style={{ marginTop: 10 }}>
                <Step n={2} title="The sign-up form" state="done" />
                <Step n={3} title="Show the next meeting" desc="The current step" state="current" />
                <Step n={4} title="A simple seat count" state="locked" last />
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>Journey · lime current, ink done</div>
            </div>
            <div style={{ flex: 1 }}>
              <WizardProgress n={2} total={4} />
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Wizard · neutral dots — deliberately not the journey’s rail.</div>
            </div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 14 }}>The Claude signal &amp; controls</div>
          <ClaudeSignal />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
            <button className="hm-btn hm-btn--primary">Primary action</button>
            <button className="hm-btn">Secondary</button>
            <button className="hm-btn hm-btn--ghost">Ghost</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
            <span className="hm-chip hm-chip--accent"><i className="ph ph-compass-tool" />Up next</span>
            <span className="hm-chip hm-chip--success"><i className="ph ph-check" />Done</span>
            <span className="hm-chip hm-chip--needs"><i className="ph ph-hand-tap" />Needs you</span>
            <span className="hm-chip hm-chip--fail"><i className="ph ph-warning" />Failed</span>
            <span className="hm-chip hm-chip--parked"><i className="ph ph-tray" />Parked</span>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { FoundationColor, FoundationType, FoundationCards, FoundationAtoms });

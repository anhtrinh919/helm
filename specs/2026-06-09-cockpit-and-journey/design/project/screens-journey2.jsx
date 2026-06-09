/* HELM SCREENS — Group B completion: journey states, For-Later shelf, celebration.
   Dot-Matrix language. Self-contained (uses helm.css classes + window kit). */

/* ---- compact guiding shell for state screens ---- */
function GShell({ chip, crumb = "Reading Room", children }) {
  return (
    <div className="hm hm-guide">
      <div className="hm-top">
        <div className="hm-top__back"><i className="ph ph-arrow-left" /></div>
        <div className="hm-crumb"><Mark /><b>{crumb}</b><i className="ph ph-caret-right sep" /><span style={{ color: "var(--ink-2)" }}>Guided build</span></div>
        {chip}
        <div className="hm-top__spacer" />
        <ClaudeSignal inline />
      </div>
      {children}
    </div>
  );
}

/* ============================================================ 20 · CELEBRATION */
function JourneyComplete() {
  const built = ["Set up the look & shell", "The sign-up form", "Show the next meeting", "A simple seat count", "Tidy & review together"];
  const sq = [[12, 18, 8], [86, 14, 12], [22, 78, 10], [92, 70, 9], [50, 8, 7], [70, 88, 11]];
  return (
    <div className="hm hm-guide">
      {sq.map((s, i) => (
        <span key={i} style={{ position: "absolute", left: s[0] + "%", top: s[1] + "%", width: s[2], height: s[2], background: i % 2 ? "var(--ink)" : "var(--lime)", border: "1.5px solid var(--frame)", transform: `rotate(${i * 18}deg)`, opacity: .8 }} />
      ))}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 40px", position: "relative" }}>
        <div style={{ width: 64, height: 64, background: "var(--lime)", border: "1.5px solid var(--frame)", boxShadow: "var(--hard-lg)", display: "grid", placeItems: "center", marginBottom: 26 }}>
          <i className="ph ph-flag-checkered" style={{ fontSize: 32, color: "var(--ink)" }} />
        </div>
        <span className="hm-eyebrow hm-eyebrow--prompt">Journey complete</span>
        <div className="hm-display hm-h-l" style={{ textAlign: "center", marginTop: 14, maxWidth: "20ch" }}>Your app now does what you set out to <span className="hm-hl">build</span>.</div>
        <div style={{ fontSize: 15, color: "var(--ink-2)", marginTop: 14, textAlign: "center", maxWidth: "52ch", lineHeight: 1.55 }}>All five steps are done and tested. Your neighbourhood book-club sign-up is live and ready to share.</div>

        <div className="hm-panel" style={{ marginTop: 26, padding: "8px 16px", display: "flex", flexWrap: "wrap", gap: "6px 20px", justifyContent: "center", maxWidth: 720 }}>
          {built.map((b, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 4px", fontSize: 13, color: "var(--ink-2)" }}>
              <span style={{ width: 18, height: 18, background: "var(--ink)", color: "var(--lime)", display: "grid", placeItems: "center", fontSize: 11, border: "1.5px solid var(--frame)" }}><i className="ph ph-check" /></span>{b}
            </span>
          ))}
        </div>

        <button className="hm-btn hm-btn--accent hm-btn--lg" style={{ marginTop: 30 }}><i className="ph ph-squares-four" />Open your cockpit<i className="ph ph-arrow-right" /></button>
        <div style={{ marginTop: 16, fontSize: 12.5, color: "var(--ink-3)" }}>The journey folds into a strip you can reopen anytime.</div>
      </div>
    </div>
  );
}

/* ============================================================ 21 · COLLAPSED STRIP */
function JourneyStripStandalone() {
  return (
    <div className="hm" style={{ background: "var(--surface-2)", padding: 0 }}>
      <div style={{ padding: 28 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 12 }}>After completion — the journey folds to a strip</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "var(--lime-weak)", border: "1.5px solid var(--frame)", boxShadow: "var(--hard)" }}>
          <span style={{ width: 30, height: 30, background: "var(--ink)", color: "var(--lime)", display: "grid", placeItems: "center", border: "1.5px solid var(--frame)", flex: "0 0 auto" }}><i className="ph ph-check" /></span>
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
            <span style={{ fontSize: 14.5, fontWeight: 700 }}>Book-club sign-up</span>
            <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>Guided journey · 5 of 5 steps · <b>Completed</b></span>
          </span>
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "var(--ink)", textTransform: "uppercase", letterSpacing: ".04em" }}>Expand to history <i className="ph ph-caret-down" /></span>
        </div>
        <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--ink-3)" }}>Sits quietly above the cockpit — click to reopen the full step history.</div>
      </div>
    </div>
  );
}

/* ============================================================ 18/19 · FOR-LATER SHELF */
function ShelfPanel({ empty }) {
  const items = [
    { t: "Add a dark mode", d: "“also add a dark mode toggle”", from: "Parked from step 3" },
    { t: "Email members when a meet changes", d: "“can it email everyone if the date moves”", from: "Parked from step 4" },
  ];
  return (
    <div style={{ width: "100%", height: "100%", background: "var(--surface)", display: "flex", flexDirection: "column", fontFamily: "var(--sans)", border: "1.5px solid var(--frame)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "16px 18px", borderBottom: "1.5px solid var(--frame)" }}>
        <span style={{ width: 32, height: 32, background: "var(--parked-weak)", border: "1.5px solid var(--frame)", display: "grid", placeItems: "center", flex: "0 0 auto" }}><i className="ph ph-tray" style={{ color: "var(--parked)", fontSize: 17 }} /></span>
        <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.3, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap" }}>For-Later shelf</span>
          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{empty ? "Nothing parked" : "2 parked requests"}</span>
        </span>
        <i className="ph ph-x" style={{ marginLeft: "auto", color: "var(--ink-3)", fontSize: 18, cursor: "pointer" }} />
      </div>

      {empty ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 30, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, border: "1.5px dashed var(--line-2)", display: "grid", placeItems: "center", marginBottom: 18 }}><i className="ph ph-tray" style={{ fontSize: 26, color: "var(--ink-4)" }} /></div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Your shelf is clear</div>
          <div style={{ fontSize: 13.5, color: "var(--ink-2)", marginTop: 8, maxWidth: "34ch", lineHeight: 1.55 }}>Stray ideas you have mid-build get parked here, so the journey never derails. Nothing is lost — promote them whenever you’re ready.</div>
        </div>
      ) : (
        <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 12, overflow: "hidden" }}>
          <div style={{ fontSize: 12.5, color: "var(--ink-2)" }}>Parked so the journey kept moving. Promote to the board or dismiss.</div>
          {items.map((it, i) => (
            <div key={i} className="hm-shelfitem" style={{ alignItems: "flex-start", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, width: "100%" }}>
                <span className="hm-shelfitem__ic"><i className="ph ph-tray" /></span>
                <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.4, flex: 1 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 700 }}>{it.t}</span>
                  <span style={{ fontSize: 13, color: "var(--ink-2)", fontFamily: "var(--mono)", marginTop: 2 }}>{it.d}</span>
                  <span style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 4, textTransform: "uppercase", letterSpacing: ".04em" }}>{it.from}</span>
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, width: "100%" }}>
                <button className="hm-btn hm-btn--accent hm-btn--sm"><i className="ph ph-plus-circle" />Promote to board</button>
                <button className="hm-btn hm-btn--sm hm-btn--quiet"><i className="ph ph-x" />Dismiss</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================ 16 · ESCAPE-HATCH CONFIRM */
function EscapeConfirm() {
  return (
    <div style={{ width: "100%", height: "100%", background: "var(--surface-2)", display: "grid", placeItems: "center", fontFamily: "var(--sans)", backgroundImage: "radial-gradient(var(--dotcol) 1.1px, transparent 1.5px)", backgroundSize: "7px 7px" }}>
      <div className="hm-panel" style={{ width: 440, padding: 26, boxShadow: "var(--hard-lg)" }}>
        <div style={{ width: 44, height: 44, background: "var(--surface-2)", border: "1.5px solid var(--frame)", display: "grid", placeItems: "center", marginBottom: 16 }}><i className="ph ph-sign-out" style={{ fontSize: 22 }} /></div>
        <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 21, letterSpacing: "-.01em" }}>Leave the guided journey?</div>
        <div style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 10, lineHeight: 1.55 }}>You’ll switch to free building, where you steer everything yourself. You can come back, and:</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
          {["Your 2 finished steps stay done", "Your For-Later shelf carries over"].map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: "var(--ink-2)" }}>
              <span style={{ width: 18, height: 18, background: "var(--lime)", border: "1.5px solid var(--frame)", display: "grid", placeItems: "center", fontSize: 11, color: "var(--ink)", flex: "0 0 auto" }}><i className="ph ph-check" /></span>{t}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button className="hm-btn hm-btn--block">Stay on the journey</button>
          <button className="hm-btn hm-btn--primary hm-btn--block"><i className="ph ph-sign-out" />Leave for free building</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ 14 · STEP FAILED MID-STEP */
function StepFailed() {
  return (
    <GShell chip={<span className="hm-chip hm-chip--fail" style={{ marginLeft: 10 }}><i className="ph ph-warning-circle" />Step 3 hit a snag</span>}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 40px" }}>
        <div style={{ width: "100%", maxWidth: 560 }}>
          <div className="hm-callout hm-callout--fail" style={{ flexDirection: "column", gap: 10, boxShadow: "var(--hard)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <span className="hm-callout__ic"><i className="ph ph-warning-circle" /></span>
              <span style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>This step didn’t finish</span>
            </div>
            <div style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55 }}>While building <b>“Show the next meeting”</b>, Helm lost its connection partway through. Nothing earlier was affected — your finished steps are safe.</div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button className="hm-btn hm-btn--accent hm-btn--lg" style={{ flex: 1 }}><i className="ph ph-arrow-clockwise" />Try this step again</button>
            <button className="hm-btn hm-btn--lg"><i className="ph ph-sign-out" />Leave the journey</button>
          </div>
          <div style={{ marginTop: 14, fontSize: 12.5, color: "var(--ink-3)", textAlign: "center" }}>If it keeps happening, leaving for free building lets you work around it.</div>
        </div>
      </div>
    </GShell>
  );
}

/* ============================================================ 10/11 · MID-JOURNEY TRIAGE */
function TriageCard({ kind }) {
  const parked = kind === "parked";
  return (
    <div style={{ background: "var(--surface-3)", border: "1.5px solid var(--frame)", padding: 18, boxShadow: "var(--hard)" }}>
      {/* the user's request */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <span style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--ink)", color: "var(--paper)", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, flex: "0 0 auto" }}>M</span>
        <div style={{ fontSize: 13.5, color: "var(--ink-2)", fontFamily: "var(--mono)", lineHeight: 1.5, paddingTop: 3 }}>
          {parked ? "“Oh, can you also add a dark mode toggle?”" : "“The sign-up button text should say Reserve, not Sign up.”"}
        </div>
      </div>
      {/* helm's triage response */}
      <div style={{ display: "flex", gap: 10 }}>
        <span style={{ width: 26, height: 26, background: "var(--lime)", border: "1.5px solid var(--frame)", display: "grid", placeItems: "center", fontSize: 13, flex: "0 0 auto" }}><i className="ph ph-sparkle" style={{ color: "var(--ink)" }} /></span>
        <div style={{ flex: 1 }}>
          {parked ? (
            <div>
              <span className="hm-chip hm-chip--parked"><i className="ph ph-tray" />Parked for later</span>
              <div style={{ fontSize: 13.5, color: "var(--ink-2)", marginTop: 9, lineHeight: 1.5 }}>That’s a bigger idea, so I’ve set it aside so we don’t lose the thread of your current step. It’s waiting on your shelf.</div>
              <button className="hm-btn hm-btn--sm" style={{ marginTop: 11 }}><i className="ph ph-tray" />View shelf (3)</button>
            </div>
          ) : (
            <div>
              <span className="hm-chip hm-chip--accent"><i className="ph ph-circle-notch" />Fixing now</span>
              <div style={{ fontSize: 13.5, color: "var(--ink-2)", marginTop: 9, lineHeight: 1.5 }}>Small change — I’m doing it right now without leaving this step. You’ll see it update in the preview.</div>
              <div className="hm-buildbar" style={{ marginTop: 11, maxWidth: 220 }}><i /></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function MidJourneyTriage() {
  return (
    <div style={{ width: "100%", height: "100%", background: "var(--surface-2)", padding: 28, fontFamily: "var(--sans)", backgroundImage: "radial-gradient(var(--dotcol) 1.1px, transparent 1.5px)", backgroundSize: "7px 7px" }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 6 }}>Mid-journey requests are triaged</div>
      <div style={{ fontSize: 13.5, color: "var(--ink-2)", marginBottom: 20, maxWidth: "60ch" }}>Small fixes happen now; bigger or unrelated ideas are parked — so the journey never derails and nothing is lost.</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--accent-text)", marginBottom: 10 }}>Handled now</div>
          <TriageCard kind="now" />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--parked)", marginBottom: 10 }}>Parked for later</div>
          <TriageCard kind="parked" />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { JourneyComplete, JourneyStripStandalone, ShelfPanel, EscapeConfirm, StepFailed, MidJourneyTriage });

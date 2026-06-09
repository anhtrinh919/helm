/* HELM SCREENS — Cockpit board (2 directions) + point-and-fix */

/* live preview with the point-and-fix idle entry */
function LivePreview({ hint = true }) {
  return (
    <div className="hm-preview" style={{ flex: 1, minHeight: 0 }}>
      <div className="hm-preview__bar">
        <span className="hm-dot hm-dot--live" />
        <div className="hm-urlpill"><i className="ph ph-lock-simple" style={{ fontSize: 12 }} />readingroom.local</div>
        <button className="hm-btn hm-btn--sm hm-btn--quiet"><i className="ph ph-arrow-clockwise" /></button>
        <button className="hm-btn hm-btn--sm hm-btn--quiet"><i className="ph ph-arrow-square-out" /></button>
      </div>
      <div className="hm-preview__stage">
        <div className="hm-preview__frame"><FakeApp /></div>
      </div>
      {hint && (
        <div style={{ padding: "0 18px 18px", display: "flex", justifyContent: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-2)", background: "var(--surface-3)", border: "1px solid var(--line)", padding: "8px 14px", borderRadius: 999, boxShadow: "var(--sh1)" }}>
            <i className="ph ph-cursor-click" style={{ color: "var(--accent-text)" }} />Click any part of your app to change it
          </span>
        </div>
      )}
    </div>
  );
}

/* collapsed journey strip (post-completion) */
function JourneyStrip() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 24px", background: "var(--success-weak)", borderBottom: "1px solid var(--success-border)" }}>
      <span style={{ width: 26, height: 26, borderRadius: 999, background: "var(--success)", color: "#fff", display: "grid", placeItems: "center", fontSize: 14, flex: "0 0 auto" }}><i className="ph ph-check" /></span>
      <span style={{ fontSize: 14, color: "var(--ink)" }}><b style={{ fontWeight: 600 }}>Your sign-up page is built.</b> <span style={{ color: "var(--ink-2)" }}>The guided journey is complete.</span></span>
      <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: "var(--success)", cursor: "pointer" }}>View journey history <i className="ph ph-caret-down" /></span>
    </div>
  );
}

/* ============================================================ A — build mode, spine + preview */
function CockpitA() {
  return (
    <div className="hm">
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <SideRail active="Cockpit" mode="Build" />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <TopBar crumbs={["Reading Room"]} />
          <JourneyStrip />
          <div className="hm-shell" style={{ background: "var(--surface-2)" }}>
            {/* card spine */}
            <section style={{ width: 392, flex: "0 0 392px", borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", minHeight: 0 }}>
              <div style={{ display: "flex", alignItems: "center", padding: "18px 20px 12px" }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Work</span>
                <span className="hm-chip" style={{ marginLeft: 9 }}>4 open</span>
                <button className="hm-btn hm-btn--sm" style={{ marginLeft: "auto" }}><i className="ph ph-plus" />Add</button>
              </div>
              <div style={{ flex: 1, overflow: "hidden", padding: "4px 20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                <WorkCard state="building" title="Waitlist when full"
                  outcome={<span>Lets extra people <b>join a waitlist</b> once every seat is taken</span>} />
                <WorkCard state="upnext" title="Confirmation message"
                  outcome={<span>Reassures someone their <b>seat is saved</b> right after they sign up</span>} />
                <WorkCard state="planned" title="Photos from past meets"
                  outcome={<span>Gives newcomers a <b>feel for the club</b> before they join</span>} />
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", fontSize: 12.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                    <i className="ph ph-check-circle" />Done <span style={{ color: "var(--ink-4)" }}>· 3</span>
                  </div>
                  <DoneRow title="Seat count" outcome="Shows how many spots are left" />
                  <DoneRow title="Next-meeting banner" outcome="Date, book and place up top" />
                  <DoneRow title="Sign-up form" outcome="Put your name down for a meet" />
                </div>
              </div>
            </section>
            {/* live preview */}
            <main style={{ flex: 1, minWidth: 0, display: "flex" }}><LivePreview /></main>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ B — iterate mode, board grid + needs-you headline */
function CockpitB() {
  return (
    <div className="hm">
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <SideRail active="Cockpit" mode="Iterate" />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <TopBar crumbs={["Reading Room"]} />
          <div className="hm-shell" style={{ background: "var(--surface-2)" }}>
            {/* board */}
            <section style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
              {/* needs-you headline rises to the top */}
              <div style={{ padding: "18px 24px 0" }}>
                <div className="hm-callout hm-callout--needs" style={{ alignItems: "center" }}>
                  <span className="hm-callout__ic"><i className="ph ph-hand-tap" /></span>
                  <span style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--needs)" }}>Needs you</span>
                    <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>Before I build “Member emails”, should people have to enter an email to sign up?</div>
                  </span>
                  <span style={{ display: "flex", gap: 8 }}>
                    <button className="hm-btn hm-btn--sm hm-btn--quiet">Keep it optional</button>
                    <button className="hm-btn hm-btn--sm hm-btn--primary">Yes, require it</button>
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", padding: "18px 24px 12px" }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Board</span>
                <span style={{ marginLeft: 10, fontSize: 13, color: "var(--ink-3)" }}>Every card says what it's for.</span>
                <button className="hm-btn hm-btn--sm" style={{ marginLeft: "auto" }}><i className="ph ph-plus" />Add a request</button>
              </div>
              <div style={{ flex: 1, overflow: "hidden", padding: "0 24px 24px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignContent: "start" }}>
                  <WorkCard state="needs" title="Member emails"
                    outcome={<span>Lets you <b>tell members</b> when the next meet changes</span>} />
                  <WorkCard state="building" title="Waitlist when full"
                    outcome={<span>Lets extra people <b>join a waitlist</b> once seats run out</span>} />
                  <WorkCard state="upnext" title="Confirmation message"
                    outcome={<span>Reassures someone their <b>seat is saved</b></span>} />
                  <WorkCard state="planned" title="Photos from past meets"
                    outcome={<span>Gives newcomers a <b>feel for the club</b></span>} />
                  {/* add-card tile */}
                  <div style={{ border: "1.5px dashed var(--line-2)", borderRadius: "var(--r3)", display: "grid", placeItems: "center", minHeight: 120, color: "var(--ink-3)", cursor: "pointer", gap: 6, background: "rgba(255,255,255,.4)" }}>
                    <i className="ph ph-plus-circle" style={{ fontSize: 24 }} />
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>Add a request</span>
                  </div>
                </div>
              </div>
            </section>
            {/* docked live preview */}
            <aside style={{ width: 420, flex: "0 0 420px", display: "flex", borderLeft: "1px solid var(--line)" }}>
              <LivePreview hint={false} />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ POINT-AND-FIX — text element selected */
function PointAndFix() {
  return (
    <div className="hm">
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <SideRail active="Cockpit" mode="Iterate" />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <TopBar crumbs={["Reading Room"]} />
          <div className="hm-shell" style={{ background: "var(--surface-2)" }}>
            <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
              <div className="hm-preview" style={{ flex: 1, minHeight: 0, borderLeft: "none" }}>
                <div className="hm-preview__bar">
                  <span className="hm-chip hm-chip--accent"><i className="ph ph-cursor-click" />Point &amp; fix · on</span>
                  <div className="hm-urlpill" style={{ flex: 1 }}><i className="ph ph-lock-simple" style={{ fontSize: 12 }} />readingroom.local</div>
                  <button className="hm-btn hm-btn--sm hm-btn--quiet"><i className="ph ph-x" />Done</button>
                </div>
                <div className="hm-preview__stage" style={{ position: "relative" }}>
                  <div className="hm-preview__frame"><FakeApp /></div>
                  {/* selection highlight over the hero heading */}
                  <div style={{ position: "absolute", left: 48, top: 130, width: 360, height: 92, border: "2px solid var(--ink)", borderRadius: 0, boxShadow: "0 0 0 4px rgba(194,238,42,.45)", pointerEvents: "none" }}>
                    <span style={{ position: "absolute", top: -22, left: -2, fontSize: 11, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--ink)", background: "var(--lime)", padding: "2px 7px", borderRadius: 0, border: "1.5px solid var(--frame)" }}>Heading · text</span>
                  </div>
                  {/* floating action popover */}
                  <div style={{ position: "absolute", left: 420, top: 132, width: 256, background: "var(--surface-3)", border: "1.5px solid var(--frame)", borderRadius: 0, boxShadow: "var(--hard)", padding: 8 }}>
                    <div style={{ padding: "8px 10px 10px", fontSize: 12.5, color: "var(--ink-3)", borderBottom: "1px solid var(--line)" }}>You picked a piece of <b style={{ color: "var(--ink-2)", fontWeight: 600 }}>text</b>.</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 10px", borderRadius: "var(--r2)", background: "var(--accent-weak)", cursor: "pointer" }}>
                        <i className="ph ph-text-aa" style={{ color: "var(--ink)", fontSize: 19 }} />
                        <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
                          <span style={{ fontSize: 14, fontWeight: 600 }}>Edit the text here</span>
                          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Type the new words in place</span>
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 10px", borderRadius: "var(--r2)", cursor: "pointer" }}>
                        <i className="ph ph-chat-teardrop-text" style={{ color: "var(--ink-2)", fontSize: 19 }} />
                        <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
                          <span style={{ fontSize: 14, fontWeight: 600 }}>Describe a fix</span>
                          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Tell Helm what to change</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CockpitA, CockpitB, PointAndFix });

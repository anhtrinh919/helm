/* HELM SCREENS — New project wizard */

function WizardShell({ children, step }) {
  return (
    <div className="hm hm-guide">
      <div className="hm-guide-top">
        <div className="hm-top__back" style={{ background: "#fff" }}><i className="ph ph-arrow-left" /></div>
        <Mark /><span className="hm-wordmark">Helm</span>
        <span className="hm-chip" style={{ marginLeft: 6 }}><i className="ph ph-compass-tool" />New project</span>
        <div style={{ marginLeft: "auto" }}><ClaudeSignal inline /></div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 40px" }}>
        <div style={{ width: "100%", maxWidth: 680 }}>{children}</div>
      </div>
    </div>
  );
}

/* the wizard's progress — deliberately DIFFERENT from the journey's step nodes:
   a quiet row of dots, neutral colour, labelled "Question N of M" */
function WizardProgress({ n, total }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
      <span className="hm-progresslabel hm-progresslabel--wizard">Question {n} of {total}</span>
      <div style={{ display: "flex", gap: 6 }}>
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} style={{ width: i + 1 === n ? 22 : 8, height: 8, borderRadius: 999, background: i + 1 < n ? "var(--ink-3)" : i + 1 === n ? "var(--ink)" : "var(--line-2)", transition: "all .2s" }} />
        ))}
      </div>
    </div>
  );
}

function GoalPin({ children }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "8px 14px", borderRadius: 999, background: "var(--surface-3)", border: "1px solid var(--line)", boxShadow: "var(--sh1)", marginBottom: 24 }}>
      <i className="ph ph-target" style={{ color: "var(--accent-text)", fontSize: 16 }} />
      <span style={{ fontSize: 13.5, color: "var(--ink-2)" }}>Building:&nbsp;<b style={{ color: "var(--ink)", fontWeight: 600 }}>{children}</b></span>
    </div>
  );
}

/* 3 — idea input */
function WizardIdea() {
  return (
    <WizardShell>
      <span className="hm-eyebrow">Step one · the idea</span>
      <div className="hm-display hm-h-l" style={{ marginTop: 14, marginBottom: 12 }}>What do you want to build?</div>
      <div style={{ fontSize: 16, color: "var(--ink-2)", marginBottom: 22, lineHeight: 1.5 }}>One plain sentence is enough. No jargon, no features list — just the idea. Helm will ask the rest.</div>
      <div style={{ position: "relative" }}>
        <textarea className="hm-input hm-input--lg" rows={3} defaultValue="A sign-up page for my neighbourhood book club, where people can reserve a seat at the next meet." />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
        <span style={{ fontSize: 13, color: "var(--ink-3)", alignSelf: "center" }}>Try:</span>
        {["a booking page for my studio", "a simple online shop", "a club sign-up"].map(s => (
          <span key={s} className="hm-chip" style={{ cursor: "pointer" }}>{s}</span>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", marginTop: 30 }}>
        <span style={{ fontSize: 13, color: "var(--ink-3)" }}>Helm will ask a few quick questions next.</span>
        <button className="hm-btn hm-btn--primary hm-btn--lg" style={{ marginLeft: "auto" }}>Continue <i className="ph ph-arrow-right" /></button>
      </div>
    </WizardShell>
  );
}

/* 4 — scoping Q&A, thinking */
function WizardThinking() {
  return (
    <WizardShell>
      <GoalPin>A sign-up page for my book club</GoalPin>
      <WizardProgress n={2} total={4} />
      <div className="hm-panel" style={{ padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--ink-2)", fontSize: 15 }}>
          <span className="hm-claude__spark" style={{ width: 24, height: 24 }}><i className="ph ph-sparkle" /></span>
          Thinking through your idea <span className="hm-thinking" style={{ marginLeft: 4 }}><i /><i /><i /></span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
          <div style={{ height: 14, borderRadius: 6, background: "var(--surface-2)", width: "70%" }} />
          <div style={{ height: 14, borderRadius: 6, background: "var(--surface-2)", width: "92%" }} />
          <div style={{ height: 14, borderRadius: 6, background: "var(--surface-2)", width: "48%" }} />
        </div>
      </div>
      <div style={{ textAlign: "center", fontSize: 13, color: "var(--ink-3)", marginTop: 18 }}>This usually takes a few seconds. You can keep your idea in mind — nothing is locked in yet.</div>
    </WizardShell>
  );
}

/* 5 — scoping Q&A, question ready */
function WizardQuestion() {
  const opts = [
    { t: "Just a handful at a time", d: "A small club — under ~30 people", ic: "users-three", sel: true },
    { t: "A busy night", d: "Could be 100+ during a popular event", ic: "users-four" },
    { t: "I'm not sure yet", d: "Helm will keep it flexible", ic: "question" },
  ];
  return (
    <WizardShell>
      <GoalPin>A sign-up page for my book club</GoalPin>
      <WizardProgress n={2} total={4} />
      <div className="hm-display hm-h-m" style={{ marginBottom: 10, lineHeight: 1.12 }}>How many people might sign up at once?</div>
      <div style={{ fontSize: 15, color: "var(--ink-2)", marginBottom: 22, lineHeight: 1.5 }}>This helps Helm decide how sturdy the sign-up needs to be. There's no wrong answer.</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {opts.map((o, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 16px", borderRadius: "var(--r3)", border: "1.5px solid " + (o.sel ? "var(--frame)" : "var(--line-2)"), background: o.sel ? "var(--accent-weak)" : "var(--surface-3)", cursor: "pointer", boxShadow: o.sel ? "var(--hard)" : "none" }}>
            <span style={{ width: 40, height: 40, borderRadius: 0, display: "grid", placeItems: "center", background: o.sel ? "var(--lime)" : "var(--surface-2)", color: o.sel ? "var(--ink)" : "var(--ink-2)", fontSize: 20, flex: "0 0 auto", border: "1.5px solid " + (o.sel ? "var(--frame)" : "var(--line-2)") }}><i className={"ph ph-" + o.ic} /></span>
            <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.35 }}>
              <span style={{ fontSize: 15.5, fontWeight: 600 }}>{o.t}</span>
              <span style={{ fontSize: 13.5, color: "var(--ink-3)" }}>{o.d}</span>
            </span>
            <span style={{ marginLeft: "auto", width: 20, height: 20, borderRadius: 999, border: "2px solid " + (o.sel ? "var(--ink)" : "var(--line-2)"), display: "grid", placeItems: "center" }}>
              {o.sel && <span style={{ width: 9, height: 9, borderRadius: 999, background: "var(--ink)" }} />}
            </span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 13.5, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
        <i className="ph ph-pencil-simple" /> Or describe it in your own words
      </div>
      <div style={{ display: "flex", alignItems: "center", marginTop: 28 }}>
        <button className="hm-btn hm-btn--ghost"><i className="ph ph-arrow-left" /> Back</button>
        <button className="hm-btn hm-btn--primary hm-btn--lg" style={{ marginLeft: "auto" }}>Continue <i className="ph ph-arrow-right" /></button>
      </div>
    </WizardShell>
  );
}

/* 6 — plan review */
function WizardPlan() {
  const ms = [
    { t: "Set up the look & shell", o: "Gives your club a calm home page people recognise" },
    { t: "The sign-up form", o: "Lets a visitor put their name down for the next meet" },
    { t: "Show the next meeting", o: "So people know the date, book and place at a glance" },
    { t: "A simple seat count", o: "Shows how many spots are left so it doesn't overfill" },
    { t: "Tidy & review together", o: "We try the whole thing end-to-end before you share it" },
  ];
  return (
    <WizardShell>
      <span className="hm-eyebrow hm-eyebrow--accent">The plan</span>
      <div className="hm-display hm-h-l" style={{ marginTop: 12, marginBottom: 10 }}>Here's how we'll get there.</div>
      <div style={{ fontSize: 15.5, color: "var(--ink-2)", marginBottom: 22, lineHeight: 1.5 }}>Five steps to a working sign-up page. We'll do them in order and stop after each one so you can try it.</div>
      <div className="hm-panel" style={{ padding: 10 }}>
        {ms.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 14, padding: "14px 14px", borderBottom: i < ms.length - 1 ? "1px solid var(--line)" : "none" }}>
            <span style={{ width: 28, height: 28, borderRadius: 999, background: "var(--surface-2)", border: "1px solid var(--line)", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, color: "var(--ink-2)", flex: "0 0 auto" }}>{i + 1}</span>
            <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.4 }}>
              <span style={{ fontSize: 15.5, fontWeight: 600 }}>{m.t}</span>
              <span style={{ fontSize: 13.5, color: "var(--ink-2)", display: "flex", gap: 7, marginTop: 2 }}><i className="ph ph-arrow-bend-down-right" style={{ color: "var(--accent-text)", fontSize: 15 }} />{m.o}</span>
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 24 }}>
        <button className="hm-btn"><i className="ph ph-pencil-simple" /> Revise the plan</button>
        <button className="hm-btn hm-btn--primary hm-btn--lg" style={{ marginLeft: "auto" }}><i className="ph ph-check" /> Approve &amp; start building</button>
      </div>
    </WizardShell>
  );
}

Object.assign(window, { WizardIdea, WizardThinking, WizardQuestion, WizardPlan });

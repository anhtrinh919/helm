/* HELM — Chroma · Terminal exploration. Retro/typewriter evolution of Option C.
   Retro is a *visual style* only — copy stays plain-language (no code, no
   filenames, no command lines, per the product constraints). */

const TI = {
  compass: "M12 2a10 10 0 100 20 10 10 0 000-20zM15.5 8.5l-2 5-5 2 2-5 5-2z",
  pencil: "M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4",
  spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z",
  download: "M12 3v12m0 0l-4-4m4 4l4-4M5 21h14",
};
if (typeof document !== "undefined" && !document.getElementById("hmt-kf")) {
  const s = document.createElement("style"); s.id = "hmt-kf";
  s.textContent = "@keyframes hmtBlink{0%,49%{opacity:1}50%,100%{opacity:0}}";
  document.head.appendChild(s);
}
function TSvg({ d, size = 22, sw = 1.7, c }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c || "currentColor"} strokeWidth={sw} strokeLinecap="square" strokeLinejoin="miter" style={{ display: "block" }}>{d.split("|").map((p, i) => <path key={i} d={p} />)}</svg>;
}

/* blinking block cursor */
function Caret({ c }) {
  return <span style={{ display: "inline-block", width: ".58em", height: "1.0em", background: c, transform: "translateY(.13em)", marginLeft: ".12em", animation: "hmtBlink 1.05s steps(1) infinite" }} />;
}

function TerminalFrontDoor({ t }) {
  const hl = { background: t.limeBlock, color: t.limeInk, padding: "0 .14em", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" };
  return (
    <div style={{ width: "100%", height: "100%", background: t.bg, color: t.ink, fontFamily: t.body, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* scanlines + optional dot grid */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: t.tex, backgroundSize: t.texSize, opacity: t.texOpacity, mixBlendMode: t.texBlend || "normal", zIndex: 3 }} />
      {t.vignette && <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: t.vignette, zIndex: 3 }} />}

      {/* terminal chrome bar */}
      <div style={{ height: 38, flex: "0 0 auto", display: "flex", alignItems: "center", gap: 10, padding: "0 16px", borderBottom: `${t.bw}px solid ${t.frame}`, background: t.barBg, zIndex: 4 }}>
        <span style={{ width: 13, height: 13, background: t.lime, border: `${t.bw}px solid ${t.frame}` }} />
        <span style={{ fontFamily: t.display, fontWeight: 700, fontSize: 13, letterSpacing: "0", color: t.ink }}>HELM</span>
        <span style={{ marginLeft: 14, fontSize: 11.5, color: t.dim, letterSpacing: ".02em" }}>new project</span>
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: t.dim, letterSpacing: ".02em" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: t.lime, boxShadow: t.dotGlow }} />
          running on <span style={{ color: t.ink2 }}>your Claude subscription</span>
        </span>
      </div>

      {/* body */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 40px", zIndex: 4 }}>
        <div style={{ maxWidth: 660 }}>
          <div style={{ fontSize: 11.5, letterSpacing: ".22em", color: t.eyebrow, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: t.lime2 }}>&gt;</span> WELCOME TO HELM
          </div>
          <div style={{ fontFamily: t.display, fontSize: t.h1, lineHeight: 1.05, fontWeight: 700, letterSpacing: t.track, color: t.ink, textTransform: t.upper ? "uppercase" : "none", textShadow: t.textGlow ? "0 0 18px rgba(174,240,0,.35)" : "none" }}>
            What would you like to <span style={hl}>build</span>?<Caret c={t.lime} />
          </div>
          <div style={{ fontSize: 13.5, color: t.dim, marginTop: 18, lineHeight: 1.6, letterSpacing: ".01em" }}>
            Two ways in. Pick the one that fits — you can always change course.
          </div>

          {/* doors */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 30 }}>
            {/* primary */}
            <div style={{ background: t.primBg, border: `${t.bw}px solid ${t.primBorder}`, borderRadius: t.rad, padding: 20, position: "relative", boxShadow: t.primShadow }}>
              <div style={{ width: 40, height: 40, borderRadius: t.iconRad, background: t.lime, color: t.limeInk, display: "grid", placeItems: "center", marginBottom: 16, border: `${t.bw}px solid ${t.primIconBorder}` }}><TSvg d={TI.compass} size={21} /></div>
              <div style={{ fontFamily: t.display, fontSize: 17, fontWeight: 700, letterSpacing: "0", color: t.primInk }}>Build something new</div>
              <div style={{ fontSize: 12.5, color: t.primDim, lineHeight: 1.5, marginTop: 7 }}>Describe what you want. Helm asks a few plain questions and guides you there.</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 15, fontSize: 12, fontWeight: 700, color: t.primCue, letterSpacing: ".02em" }}>START THE GUIDED JOURNEY <span>&#9656;</span></div>
            </div>
            {/* iterate */}
            <div style={{ background: t.doorBg, border: `${t.bw}px solid ${t.frame}`, borderRadius: t.rad, padding: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: t.iconRad, background: t.chipBg, color: t.ink2, display: "grid", placeItems: "center", marginBottom: 16, border: `${t.bw}px solid ${t.frame}` }}><TSvg d={TI.pencil} size={20} /></div>
              <div style={{ fontFamily: t.display, fontSize: 17, fontWeight: 700, color: t.ink }}>Iterate on an app</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", borderRadius: t.iconRad, border: `${t.bw}px solid ${t.frame}`, background: t.rowBg }}>
                  <span style={{ color: t.lime2 }}><TSvg d={TI.spark} size={15} /></span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: t.ink }}>Start fresh</span>
                  <span style={{ marginLeft: "auto", color: t.dim, fontSize: 13 }}>&#9656;</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", borderRadius: t.iconRad, border: `${t.bw}px solid ${t.frame}`, background: t.rowBg, opacity: .72 }}>
                  <span style={{ color: t.dim }}><TSvg d={TI.download} size={15} /></span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: t.dim }}>Bring an existing app</span>
                  <span style={{ marginLeft: "auto", fontSize: 9.5, fontWeight: 700, letterSpacing: ".08em", color: t.dim, border: `${t.bw}px solid ${t.frame}`, padding: "2px 6px" }}>PHASE 5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* label */}
      <div style={{ position: "absolute", left: 16, bottom: 14, display: "flex", alignItems: "center", gap: 9, zIndex: 4 }}>
        <span style={{ width: 8, height: 8, background: t.lime }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: t.ink }}>{t.name}</span>
        <span style={{ fontSize: 11.5, color: t.dim }}>· {t.tagline}</span>
      </div>
    </div>
  );
}

const SCAN = "repeating-linear-gradient(0deg, rgba(0,0,0,.05) 0 1px, transparent 1px 3px)";
const DOTS = "radial-gradient(rgba(0,0,0,.10) 1px, transparent 1.4px)";

const TTHEMES = {
  /* 1 — restrained paper teletype */
  teletype: {
    name: "Teletype", tagline: "paper · restrained mono",
    bg: "#F1F0E6", ink: "#15160F", ink2: "#3A3C30", dim: "#74766A", eyebrow: "#5E6043",
    lime: "#C6F032", lime2: "#6E8410", limeBlock: "#C6F032", limeInk: "#15160F",
    display: "'Space Mono', monospace", body: "'JetBrains Mono', monospace",
    h1: 42, track: "-.02em", upper: false,
    frame: "#15160F", bw: 1.5, rad: 4, iconRad: 3,
    barBg: "#F6F5EC", dotGlow: "none",
    doorBg: "#FBFBF3", chipBg: "#ECEBE0", rowBg: "#F6F5EC",
    primBg: "#15160F", primBorder: "#15160F", primInk: "#F7F7EE", primDim: "rgba(247,247,238,.72)", primCue: "#C6F032", primIconBorder: "#15160F", primShadow: "none",
    tex: SCAN, texSize: "auto", texOpacity: .35, texBlend: "normal",
  },
  /* 2 — graphic dot-matrix with hard offset */
  dotmatrix: {
    name: "Dot-Matrix", tagline: "graphic · dot-grid + hard edges",
    bg: "#ECECE1", ink: "#14150E", ink2: "#34362B", dim: "#6E7064", eyebrow: "#566012",
    lime: "#C2EE2A", lime2: "#5E6E0C", limeBlock: "#C2EE2A", limeInk: "#14150E",
    display: "'Space Mono', monospace", body: "'JetBrains Mono', monospace",
    h1: 46, track: "-.03em", upper: true,
    frame: "#14150E", bw: 2, rad: 0, iconRad: 0,
    barBg: "#E4E4D7", dotGlow: "none",
    doorBg: "#FAFAF1", chipBg: "#E7E7DA", rowBg: "#F2F2E7",
    primBg: "#14150E", primBorder: "#14150E", primInk: "#F6F6EC", primDim: "rgba(246,246,236,.7)", primCue: "#C2EE2A", primIconBorder: "#C2EE2A", primShadow: "5px 5px 0 #14150E",
    tex: DOTS, texSize: "7px 7px", texOpacity: .5, texBlend: "normal",
  },
  /* 3 — dark CRT phosphor */
  crt: {
    name: "CRT", tagline: "dark phosphor · full retro",
    bg: "radial-gradient(120% 100% at 50% 50%, #11160E 60%, #080B06 100%)", ink: "#D8F2BE", ink2: "#A6C98C", dim: "#6E8A5C", eyebrow: "#7FA85C",
    lime: "#AEF000", lime2: "#C7FF3A", limeBlock: "#AEF000", limeInk: "#0B1006",
    display: "'Space Mono', monospace", body: "'JetBrains Mono', monospace",
    h1: 44, track: "-.01em", upper: false,
    frame: "#2C3A22", bw: 1.5, rad: 4, iconRad: 3,
    barBg: "rgba(20,28,15,.7)", dotGlow: "0 0 6px #AEF000",
    doorBg: "#121810", chipBg: "#1B2416", rowBg: "#151C11",
    primBg: "#16200F", primBorder: "#3F5A2A", primInk: "#E6FBC8", primDim: "rgba(230,251,200,.66)", primCue: "#C7FF3A", primIconBorder: "#AEF000", primShadow: "0 0 24px rgba(174,240,0,.12)",
    tex: "repeating-linear-gradient(0deg, rgba(0,0,0,.28) 0 1px, transparent 1px 3px)", texSize: "auto", texOpacity: .5, texBlend: "normal",
    vignette: "radial-gradient(120% 90% at 50% 50%, transparent 62%, rgba(0,0,0,.5))",
    textGlow: true,
  },
};

Object.assign(window, { TerminalFrontDoor, TTHEMES });

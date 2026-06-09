/* HELM — BOLD design-language exploration. Self-contained themed Front Door.
   Four daring, distinct aesthetics: dark cockpit, saturated color-fields,
   oversized type, high contrast. Same layout so the *language* is the variable. */

const I = {
  compass: "M12 2a10 10 0 100 20 10 10 0 000-20zM15.5 8.5l-2 5-5 2 2-5 5-2z",
  pencil: "M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4",
  spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z",
  download: "M12 3v12m0 0l-4-4m4 4l4-4M5 21h14",
  arrowDR: "M7 7h10v10M7 17L17 7",
  arrowR: "M5 12h14M13 6l6 6-6 6",
};
function Svg({ d, size = 22, sw = 1.6, fill }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill || "none"} stroke="currentColor"
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
      {d.split("|").map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

function ThemedFrontDoor({ t }) {
  const accentWord = t.hlBg
    ? <span style={{ background: t.hlBg, color: t.hlText, padding: "0 .12em", borderRadius: 4, boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>build</span>
    : <span style={{ color: t.accentText, fontStyle: t.accentItalic, fontWeight: t.accentWeight }}>build</span>;
  return (
    <div style={{ width: "100%", height: "100%", background: t.bg, fontFamily: t.sans, color: t.text, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      {/* top bar */}
      <div style={{ height: 60, display: "flex", alignItems: "center", padding: "0 28px", gap: 11, zIndex: 1 }}>
        <span style={{ width: 28, height: 28, borderRadius: t.markRadius, background: t.markBg, color: t.markText, display: "grid", placeItems: "center", fontFamily: t.markFont || t.display, fontSize: 17, fontWeight: 700, paddingBottom: t.markPad }}>H</span>
        <span style={{ fontFamily: t.display, fontSize: 21, letterSpacing: t.wordTrack, fontWeight: t.wordWeight, color: t.wordmarkColor }}>Helm</span>
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: t.claudeText }}>
          <span style={{ width: 16, height: 16, borderRadius: 5, background: "radial-gradient(circle at 30% 30%, #F0C9A8, #C9683F)", color: "#fff", display: "grid", placeItems: "center" }}><Svg d={I.spark} size={9} sw={2} /></span>
          Running on <b style={{ color: t.claudeStrong, fontWeight: 600 }}>your Claude subscription</b>
        </span>
      </div>

      {/* center */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 34px", zIndex: 1 }}>
        <div style={{ width: "100%", maxWidth: 610 }}>
          <div style={{ textAlign: t.center ? "center" : "left", marginBottom: 30 }}>
            <span style={t.eyebrow}>{t.eyebrowText || "Welcome to Helm"}</span>
            <div style={{ fontFamily: t.display, fontSize: t.h1, lineHeight: t.h1lh, fontWeight: t.dispWeight, letterSpacing: t.dispTrack, marginTop: 14, color: t.headline, textTransform: t.dispCase || "none" }}>
              What would you like to {accentWord}?
            </div>
            <div style={{ fontSize: 15, color: t.sub, marginTop: 15, maxWidth: t.center ? "none" : "46ch" }}>Two ways in. Pick the one that fits — you can always change course.</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "stretch" }}>
            {/* primary door */}
            <div style={{ background: t.doorPrimaryBg, border: `${t.border}px solid ${t.doorPrimaryBorder}`, borderRadius: t.doorRadius, padding: 24, boxShadow: t.soft, position: "relative", overflow: "hidden" }}>
              <div style={{ width: 46, height: 46, borderRadius: t.iconRadius, background: t.primaryIconBg, color: t.primaryIconText, display: "grid", placeItems: "center", marginBottom: 18 }}><Svg d={I.compass} size={24} sw={t.iconSw} /></div>
              <div style={{ fontFamily: t.doorTitleFont, fontSize: 21, fontWeight: t.doorTitleWeight, lineHeight: 1.1, letterSpacing: t.doorTrack, color: t.primaryTitle }}>Build something new</div>
              <div style={{ fontSize: 13.5, color: t.primaryDesc, lineHeight: 1.5, marginTop: 8 }}>Describe what you want. Helm asks a few plain questions and guides you there.</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 16, fontSize: 13, fontWeight: 700, color: t.cue }}>Start the guided journey <Svg d={I.arrowDR} size={15} sw={2.1} /></div>
            </div>
            {/* iterate door */}
            <div style={{ background: t.doorBg, border: `${t.border}px solid ${t.doorBorder}`, borderRadius: t.doorRadius, padding: 24, boxShadow: t.soft }}>
              <div style={{ width: 46, height: 46, borderRadius: t.iconRadius, background: t.secIconBg, color: t.secIconText, border: `1px solid ${t.secIconBorder}`, display: "grid", placeItems: "center", marginBottom: 18 }}><Svg d={I.pencil} size={22} sw={t.iconSw} /></div>
              <div style={{ fontFamily: t.doorTitleFont, fontSize: 21, fontWeight: t.doorTitleWeight, lineHeight: 1.1, letterSpacing: t.doorTrack, color: t.doorTitle }}>Iterate on an app</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: t.btnRadius, border: `1px solid ${t.subRowBorder}`, background: t.subRowBg }}>
                  <span style={{ color: t.accent }}><Svg d={I.spark} size={17} sw={1.7} /></span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: t.subRowText }}>Start fresh</span>
                  <span style={{ marginLeft: "auto", color: t.doorDesc }}><Svg d={I.arrowR} size={15} sw={1.7} /></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: t.btnRadius, border: `1px solid ${t.subRowBorder}`, background: t.subRowBg, opacity: .82 }}>
                  <span style={{ color: t.doorDesc }}><Svg d={I.download} size={17} sw={1.7} /></span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: t.doorDesc }}>Bring an existing app</span>
                  <span style={{ marginLeft: "auto", fontSize: 9.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: t.soonText, background: t.soonBg, border: `1px solid ${t.soonBorder}`, padding: "3px 7px", borderRadius: 999 }}>Phase 5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* direction label */}
      <div style={{ position: "absolute", left: 28, bottom: 18, display: "flex", alignItems: "center", gap: 9, zIndex: 1 }}>
        <span style={{ width: 9, height: 9, borderRadius: 3, background: t.accent }} />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: t.text, letterSpacing: ".01em" }}>{t.name}</span>
        <span style={{ fontSize: 12, color: t.sub }}>· {t.tagline}</span>
      </div>
    </div>
  );
}

/* ============================ FOUR BOLD DIRECTIONS ============================ */
const THEMES = {
  /* 1 — dark warm cockpit, molten-amber accent, glow */
  nocturne: {
    name: "Nocturne", tagline: "dark cockpit · molten amber",
    bg: "radial-gradient(90% 70% at 86% -12%, rgba(240,178,60,.13), transparent 56%), radial-gradient(70% 60% at 4% 112%, rgba(240,178,60,.06), transparent 55%), #16140F",
    text: "#F3EEE3", sub: "#A39B8B", headline: "#F8F3E9", claudeText: "#8C8473", claudeStrong: "#D8CFBE",
    accent: "#F0B23C", accentText: "#F4BE4E", accentItalic: "normal", accentWeight: 800,
    eyebrow: { fontSize: 11.5, fontWeight: 800, letterSpacing: ".22em", textTransform: "uppercase", color: "#C39A40" },
    wordmarkColor: "#F8F3E9", markBg: "#F0B23C", markText: "#16140F", markRadius: 8, markPad: 0, markFont: "'Hanken Grotesk', sans-serif",
    display: "'Hanken Grotesk', sans-serif", sans: "'Hanken Grotesk', sans-serif",
    h1: 42, h1lh: 1.05, dispWeight: 800, dispTrack: "-.025em", center: true,
    doorTitleFont: "'Hanken Grotesk', sans-serif", doorTitleWeight: 700, doorTrack: "-.01em",
    doorBg: "#211D16", doorBorder: "#332E24", doorTitle: "#F8F3E9", doorDesc: "#A39B8B",
    doorPrimaryBg: "linear-gradient(180deg,#2A2418,#211D16)", doorPrimaryBorder: "#5C4A22", primaryTitle: "#F8F3E9", primaryDesc: "#A39B8B",
    primaryIconBg: "#F0B23C", primaryIconText: "#16140F", secIconBg: "#2A251D", secIconText: "#D8CFBE", secIconBorder: "#3A342A",
    subRowBg: "#1B1812", subRowBorder: "#332E24", subRowText: "#E6DECD", cue: "#F4BE4E",
    soonBg: "#2A251D", soonText: "#8C8473", soonBorder: "#3A342A",
    doorRadius: 16, btnRadius: 9, iconRadius: 13, border: 1,
    soft: "0 1px 2px rgba(0,0,0,.4), 0 24px 56px -24px rgba(0,0,0,.7)", iconSw: 1.7,
  },

  /* 2 — saturated vermillion poster, ivory cards, oversized */
  vermillion: {
    name: "Vermillion", tagline: "saturated poster · ivory cards",
    bg: "radial-gradient(100% 80% at 90% -20%, #EF6A30, transparent 60%), #DE3F1A",
    text: "#FFF1E9", sub: "rgba(255,241,233,.86)", headline: "#FFF7F1", claudeText: "rgba(255,241,233,.78)", claudeStrong: "#FFF7F1",
    accent: "#DE3F1A", accentText: "#FFD27A", accentItalic: "normal", accentWeight: 800,
    eyebrow: { fontSize: 11.5, fontWeight: 800, letterSpacing: ".24em", textTransform: "uppercase", color: "rgba(255,241,233,.82)" },
    wordmarkColor: "#FFF7F1", markBg: "#FFF7F1", markText: "#DE3F1A", markRadius: 8, markPad: 0, markFont: "'Hanken Grotesk', sans-serif",
    display: "'Hanken Grotesk', sans-serif", sans: "'Hanken Grotesk', sans-serif",
    h1: 43, h1lh: 1.08, dispWeight: 800, dispTrack: "-.025em", center: true,
    doorTitleFont: "'Hanken Grotesk', sans-serif", doorTitleWeight: 800, doorTrack: "-.02em",
    doorBg: "#FBF2E6", doorBorder: "rgba(70,20,8,.08)", doorTitle: "#2A160E", doorDesc: "#6E5447",
    doorPrimaryBg: "#FFFFFF", doorPrimaryBorder: "rgba(70,20,8,.1)", primaryTitle: "#2A160E", primaryDesc: "#6E5447",
    primaryIconBg: "#DE3F1A", primaryIconText: "#fff", secIconBg: "#F2E5D4", secIconText: "#6E5447", secIconBorder: "rgba(70,20,8,.08)",
    subRowBg: "#F5EADB", subRowBorder: "rgba(70,20,8,.07)", subRowText: "#3A241A", cue: "#DE3F1A",
    soonBg: "#ECDCC8", soonText: "#7A6452", soonBorder: "rgba(70,20,8,.1)",
    doorRadius: 16, btnRadius: 10, iconRadius: 12, border: 1,
    soft: "0 2px 4px rgba(120,30,10,.18), 0 28px 56px -22px rgba(110,28,8,.5)", iconSw: 1.7,
  },

  /* 3 — bright high-contrast, electric-lime highlighter, inverted black primary door */
  chroma: {
    name: "Chroma", tagline: "high-contrast · lime highlighter",
    bg: "#F3F3EC",
    text: "#15160F", sub: "#5B5D52", headline: "#15160F", claudeText: "#8A8C7E", claudeStrong: "#3A3C32",
    accent: "#7E9A12", accentText: "#15160F", hlBg: "#C6F032", hlText: "#15160F",
    eyebrow: { fontSize: 11.5, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "#7E8A4C" },
    wordmarkColor: "#15160F", markBg: "#15160F", markText: "#C6F032", markRadius: 6, markPad: 0, markFont: "'Schibsted Grotesk', sans-serif",
    display: "'Schibsted Grotesk', sans-serif", sans: "'Schibsted Grotesk', sans-serif",
    h1: 50, h1lh: .98, dispWeight: 800, dispTrack: "-.035em", center: false,
    doorTitleFont: "'Schibsted Grotesk', sans-serif", doorTitleWeight: 800, doorTrack: "-.02em",
    doorBg: "#FCFCF7", doorBorder: "#E2E2D6", doorTitle: "#15160F", doorDesc: "#5B5D52",
    doorPrimaryBg: "#15160F", doorPrimaryBorder: "#15160F", primaryTitle: "#FCFCF7", primaryDesc: "rgba(252,252,247,.72)",
    primaryIconBg: "#C6F032", primaryIconText: "#15160F", secIconBg: "#EFEFE7", secIconText: "#15160F", secIconBorder: "#E2E2D6",
    subRowBg: "#F7F7F1", subRowBorder: "#E2E2D6", subRowText: "#15160F", cue: "#C6F032",
    soonBg: "#EAEAE0", soonText: "#7A7C6E", soonBorder: "#DADACE",
    doorRadius: 7, btnRadius: 7, iconRadius: 9, border: 1.5,
    soft: "0 1px 2px rgba(21,22,15,.05), 0 16px 34px -18px rgba(21,22,15,.22)", iconSw: 1.8,
  },

  /* 4 — deep electric cobalt field, white cards, refined serif accent */
  cobalt: {
    name: "Cobalt", tagline: "electric blue field · serif accent",
    bg: "radial-gradient(100% 80% at 12% -16%, #2E54E0, transparent 58%), #1B36BE",
    text: "#E7EDFF", sub: "rgba(231,237,255,.82)", headline: "#FFFFFF", claudeText: "rgba(231,237,255,.78)", claudeStrong: "#FFFFFF",
    accent: "#1B36BE", accentText: "#8FE6FF", accentItalic: "italic", accentWeight: 500,
    eyebrow: { fontSize: 11.5, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: "rgba(231,237,255,.8)" },
    wordmarkColor: "#FFFFFF", markBg: "#FFFFFF", markText: "#1B36BE", markRadius: 8, markPad: 2, markFont: "'Newsreader', serif",
    display: "'Newsreader', serif", sans: "'Hanken Grotesk', sans-serif",
    h1: 46, h1lh: 1.04, dispWeight: 500, dispTrack: "0", center: true,
    doorTitleFont: "'Hanken Grotesk', sans-serif", doorTitleWeight: 700, doorTrack: "-.01em",
    doorBg: "#FFFFFF", doorBorder: "rgba(8,16,60,.06)", doorTitle: "#101A3A", doorDesc: "#566089",
    doorPrimaryBg: "#FFFFFF", doorPrimaryBorder: "rgba(8,16,60,.08)", primaryTitle: "#101A3A", primaryDesc: "#566089",
    primaryIconBg: "#1B36BE", primaryIconText: "#fff", secIconBg: "#EEF2FF", secIconText: "#3A4680", secIconBorder: "rgba(8,16,60,.07)",
    subRowBg: "#F3F6FF", subRowBorder: "rgba(8,16,60,.06)", subRowText: "#26305A", cue: "#1B36BE",
    soonBg: "#E7ECFB", soonText: "#5A6494", soonBorder: "rgba(8,16,60,.09)",
    doorRadius: 16, btnRadius: 10, iconRadius: 12, border: 1,
    soft: "0 2px 4px rgba(8,18,80,.2), 0 28px 56px -22px rgba(8,18,80,.55)", iconSw: 1.6,
  },
};

Object.assign(window, { ThemedFrontDoor, THEMES });

/* global React */

function Hero() {
  return (
    <section style={heroStyles.root}>
      <div style={heroStyles.dotPattern} />
      <div style={heroStyles.glow} />
      <div style={heroStyles.orb} />
      <div style={heroStyles.inner}>
        <div style={heroStyles.eyebrow}>Studio · Estúdio de software</div>
        <h1 style={heroStyles.title}>
          Software,
          <br />
          <span style={heroStyles.italic}>{"{sewn to fit}"}</span>.
        </h1>
        <p style={heroStyles.lede}>
          We build what your team would build, if they had the time. Bespoke
          product engineering — designed, sewn, and shipped around your problem.
        </p>
        <div style={heroStyles.actions}>
          <a href="#contact" style={heroStyles.primary}>
            Start a project →
          </a>
          <a href="#work" style={heroStyles.ghost}>
            See our work
          </a>
        </div>
        <div style={heroStyles.metaRow}>
          <div style={heroStyles.meta}>
            <strong style={heroStyles.metaNum}>147</strong>
            <span style={heroStyles.metaLbl}>products shipped</span>
          </div>
          <div style={heroStyles.meta}>
            <strong style={heroStyles.metaNum}>9 yrs</strong>
            <span style={heroStyles.metaLbl}>weaving code</span>
          </div>
          <div style={heroStyles.meta}>
            <strong style={heroStyles.metaNum}>3</strong>
            <span style={heroStyles.metaLbl}>verticals served</span>
          </div>
        </div>
      </div>
    </section>
  );
}

const heroStyles = {
  root: {
    position: "relative",
    overflow: "hidden",
    background: "#0B134F",
    color: "#fff",
    padding: "120px 28px 140px",
  },
  dotPattern: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "radial-gradient(rgba(129,39,232,0.55) 1px, transparent 1.2px)",
    backgroundSize: "14px 14px",
    opacity: 0.7,
  },
  glow: {
    position: "absolute",
    top: "-30%",
    left: "-20%",
    width: "70%",
    height: "160%",
    background:
      "radial-gradient(ellipse at center, rgba(129,39,232,0.85) 0%, rgba(129,39,232,0.3) 35%, transparent 70%)",
    filter: "blur(30px)",
    pointerEvents: "none",
  },
  orb: {
    position: "absolute",
    right: "-8%",
    top: "15%",
    width: 480,
    height: 480,
    borderRadius: "50%",
    background:
      "radial-gradient(circle at 32% 35%, #ffffff 0%, #D5B5FB 18%, #8127E8 55%, #2B1170 90%)",
    boxShadow: "0 40px 80px rgba(129,39,232,0.45)",
    pointerEvents: "none",
  },
  inner: {
    position: "relative",
    zIndex: 2,
    maxWidth: 1200,
    margin: "0 auto",
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    fontWeight: 600,
    color: "rgba(255,255,255,0.65)",
  },
  title: {
    margin: "20px 0 18px",
    fontSize: 84,
    lineHeight: 1.02,
    letterSpacing: "-0.025em",
    fontWeight: 600,
  },
  italic: {
    fontFamily: "Georgia, serif",
    fontStyle: "italic",
    fontWeight: 400,
    color: "#CDA8F8",
  },
  lede: {
    margin: "0 0 32px",
    maxWidth: 540,
    fontSize: 19,
    lineHeight: 1.55,
    fontWeight: 300,
    color: "rgba(255,255,255,0.82)",
  },
  actions: { display: "flex", gap: 14, marginBottom: 64 },
  primary: {
    background: "#FF6600",
    color: "#fff",
    textDecoration: "none",
    padding: "14px 22px",
    borderRadius: 10,
    fontWeight: 500,
    fontSize: 15,
    boxShadow: "0 12px 28px rgba(255,102,0,0.35)",
  },
  ghost: {
    color: "#fff",
    textDecoration: "none",
    padding: "14px 22px",
    borderRadius: 10,
    fontWeight: 500,
    fontSize: 15,
    border: "1px solid rgba(255,255,255,0.25)",
  },
  metaRow: { display: "flex", gap: 56, marginTop: 8 },
  meta: { display: "flex", flexDirection: "column", gap: 4 },
  metaNum: {
    fontSize: 28,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    color: "#fff",
  },
  metaLbl: {
    fontSize: 12,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.55)",
    fontWeight: 600,
  },
};

window.Hero = Hero;

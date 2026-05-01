/* global React */

function CTASection() {
  return (
    <section id="contact" style={ctaStyles.root}>
      <div style={ctaStyles.glow} />
      <div style={ctaStyles.inner}>
        <div style={ctaStyles.eyebrow}>Get in touch</div>
        <h2 style={ctaStyles.title}>
          Have something to <span style={ctaStyles.italic}>{"{weave}"}</span>?
        </h2>
        <p style={ctaStyles.lede}>
          Tell us what you're building and we'll come back within two business
          days with a short, honest read on whether we're the right team for it.
        </p>
        <form style={ctaStyles.form} onSubmit={(e) => e.preventDefault()}>
          <input style={ctaStyles.input} placeholder="you@yourcompany.com" />
          <button style={ctaStyles.btn} type="submit">
            Start a project →
          </button>
        </form>
        <div style={ctaStyles.fine}>
          No spam. We read every message ourselves.
        </div>
      </div>
    </section>
  );
}

const ctaStyles = {
  root: {
    position: "relative",
    overflow: "hidden",
    background: "#0B134F",
    color: "#fff",
    padding: "120px 28px",
  },
  glow: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(129,39,232,0.55) 0%, rgba(129,39,232,0.15) 40%, transparent 75%)",
    filter: "blur(10px)",
    pointerEvents: "none",
  },
  inner: {
    position: "relative",
    maxWidth: 720,
    margin: "0 auto",
    textAlign: "center",
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    fontWeight: 600,
    color: "rgba(255,255,255,0.65)",
  },
  title: {
    margin: "16px 0 18px",
    fontSize: 64,
    lineHeight: 1.05,
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
    margin: "0 auto 32px",
    maxWidth: 540,
    fontSize: 17,
    lineHeight: 1.55,
    fontWeight: 300,
    color: "rgba(255,255,255,0.82)",
  },
  form: { display: "flex", gap: 10, maxWidth: 480, margin: "0 auto" },
  input: {
    flex: 1,
    fontFamily: "inherit",
    fontSize: 15,
    padding: "13px 16px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    outline: "none",
  },
  btn: {
    background: "#FF6600",
    color: "#fff",
    border: "none",
    padding: "13px 22px",
    borderRadius: 12,
    fontWeight: 500,
    fontSize: 14,
    cursor: "pointer",
    boxShadow: "0 12px 28px rgba(255,102,0,0.35)",
  },
  fine: { marginTop: 18, fontSize: 12, color: "rgba(255,255,255,0.55)" },
};

window.CTASection = CTASection;

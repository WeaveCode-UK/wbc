/* global React */

function CaseStudy() {
  return (
    <section id="work" style={csStyles.root}>
      <div style={csStyles.inner}>
        <div style={csStyles.head}>
          <div style={csStyles.eyebrow}>Selected work</div>
          <h2 style={csStyles.title}>Built by us, run by them.</h2>
        </div>
        <div style={csStyles.grid}>
          <a href="#" style={csStyles.feature}>
            <div style={csStyles.featureGlow} />
            <div style={csStyles.featureTag}>Health · Brazil</div>
            <h3 style={csStyles.featureTitle}>
              A clinic OS that audit teams ask for by name.
            </h3>
            <p style={csStyles.featureBody}>
              From scheduling to billing, sewn into one calm interface. 14k
              patients, 6 states, zero downtime in 18 months.
            </p>
            <span style={csStyles.featureLink}>Read the case →</span>
          </a>
          <div style={csStyles.col}>
            <a href="#" style={csStyles.minor}>
              <div style={csStyles.minorTag}>Beauty</div>
              <div style={csStyles.minorTitle}>
                Booking flow that beats the salon down the street.
              </div>
              <div style={csStyles.minorMeta}>+38% bookings · 4.9★</div>
            </a>
            <a href="#" style={csStyles.minor}>
              <div style={csStyles.minorTag}>Business</div>
              <div style={csStyles.minorTitle}>
                An ops dashboard that retired three spreadsheets.
              </div>
              <div style={csStyles.minorMeta}>240 users · 11 integrations</div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

const csStyles = {
  root: { background: "#F9F9F9", padding: "120px 28px" },
  inner: { maxWidth: 1200, margin: "0 auto" },
  head: { marginBottom: 48, maxWidth: 720 },
  eyebrow: {
    fontSize: 12,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    fontWeight: 600,
    color: "#6E6E83",
  },
  title: {
    margin: "14px 0 0",
    fontSize: 48,
    lineHeight: 1.1,
    letterSpacing: "-0.02em",
    fontWeight: 600,
    color: "#0E0E16",
  },
  grid: { display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 },
  feature: {
    position: "relative",
    overflow: "hidden",
    background: "#0B134F",
    color: "#fff",
    backgroundImage:
      "radial-gradient(rgba(129,39,232,0.55) 1px, transparent 1.2px)",
    backgroundSize: "14px 14px",
    borderRadius: 24,
    padding: "40px 36px",
    minHeight: 380,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    textDecoration: "none",
  },
  featureGlow: {
    position: "absolute",
    right: "-15%",
    bottom: "-30%",
    width: 460,
    height: 460,
    borderRadius: "50%",
    background:
      "radial-gradient(circle at 35% 35%, #8127E8 0%, #2B1170 50%, transparent 80%)",
    filter: "blur(8px)",
  },
  featureTag: {
    position: "relative",
    alignSelf: "flex-start",
    fontSize: 11,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontWeight: 600,
    color: "#fff",
    background: "rgba(255,255,255,0.12)",
    padding: "5px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.18)",
  },
  featureTitle: {
    position: "relative",
    margin: "12px 0 0",
    fontSize: 36,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    lineHeight: 1.15,
    maxWidth: 520,
  },
  featureBody: {
    position: "relative",
    margin: 0,
    fontSize: 16,
    lineHeight: 1.6,
    fontWeight: 300,
    color: "rgba(255,255,255,0.78)",
    maxWidth: 460,
  },
  featureLink: {
    position: "relative",
    marginTop: "auto",
    fontSize: 14,
    fontWeight: 500,
    color: "#FF6600",
  },
  col: { display: "flex", flexDirection: "column", gap: 16 },
  minor: {
    background: "#fff",
    borderRadius: 20,
    padding: "24px 22px",
    boxShadow: "0 6px 14px rgba(11,19,79,0.06)",
    border: "1px solid #F1F1F4",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    textDecoration: "none",
    color: "#0E0E16",
    flex: 1,
  },
  minorTag: {
    alignSelf: "flex-start",
    fontSize: 10,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontWeight: 600,
    color: "#531896",
    background: "#F4ECFE",
    padding: "4px 10px",
    borderRadius: 999,
  },
  minorTitle: {
    fontSize: 18,
    fontWeight: 500,
    letterSpacing: "-0.01em",
    lineHeight: 1.3,
  },
  minorMeta: {
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "0.04em",
    color: "#6E6E83",
    marginTop: "auto",
  },
};

window.CaseStudy = CaseStudy;

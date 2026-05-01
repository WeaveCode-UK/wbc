/* global React */

function Verticals() {
  const verticals = [
    {
      name: "Beauty",
      color: "#D161B9",
      soft: "#F8DCEF",
      dark: "#7A2A66",
      tag: "Salons, brands, ecom",
      desc: "Booking, inventory and storefronts for beauty operators.",
    },
    {
      name: "Health",
      color: "#00C479",
      soft: "#CFF5E3",
      dark: "#005C39",
      tag: "Clinics & telehealth",
      desc: "Patient records, scheduling and telehealth flows that pass audit.",
    },
    {
      name: "Business",
      color: "#0030B7",
      soft: "#D6DEF6",
      dark: "#001F75",
      tag: "B2B operations",
      desc: "Internal tools, CRMs and operations dashboards built to last.",
    },
  ];
  return (
    <section id="products" style={vStyles.root}>
      <div style={vStyles.dotPattern} />
      <div style={vStyles.inner}>
        <div style={vStyles.head}>
          <div style={vStyles.eyebrow}>Products · Verticais</div>
          <h2 style={vStyles.title}>Three verticals, one studio.</h2>
          <p style={vStyles.lede}>
            We've built deep playbooks in three industries. Each comes with
            battle-tested patterns, integrations and design language.
          </p>
        </div>
        <div style={vStyles.grid}>
          {verticals.map((v) => (
            <a
              key={v.name}
              href={`#${v.name.toLowerCase()}`}
              style={{ ...vStyles.card, borderColor: "rgba(255,255,255,0.08)" }}
            >
              <div style={{ ...vStyles.dot, background: v.color }} />
              <div
                style={{
                  ...vStyles.cardEyebrow,
                  background: v.soft,
                  color: v.dark,
                }}
              >
                {v.tag}
              </div>
              <div style={vStyles.cardName}>{v.name}</div>
              <div style={vStyles.cardDesc}>{v.desc}</div>
              <div style={{ ...vStyles.cardArrow, color: v.color }}>
                Explore →
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

const vStyles = {
  root: {
    position: "relative",
    background: "#8127E8",
    padding: "120px 28px",
    color: "#fff",
    overflow: "hidden",
  },
  dotPattern: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "radial-gradient(rgba(11,19,79,0.45) 1px, transparent 1.2px)",
    backgroundSize: "14px 14px",
    opacity: 0.5,
  },
  inner: { position: "relative", zIndex: 2, maxWidth: 1200, margin: "0 auto" },
  head: { marginBottom: 48, maxWidth: 640 },
  eyebrow: {
    fontSize: 12,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    fontWeight: 600,
    color: "rgba(255,255,255,0.7)",
  },
  title: {
    margin: "14px 0 14px",
    fontSize: 48,
    lineHeight: 1.1,
    letterSpacing: "-0.02em",
    fontWeight: 600,
  },
  lede: {
    margin: 0,
    fontSize: 17,
    lineHeight: 1.55,
    fontWeight: 300,
    color: "rgba(255,255,255,0.85)",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 },
  card: {
    background: "rgba(11,19,79,0.55)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    borderRadius: 20,
    padding: "26px 24px",
    textDecoration: "none",
    color: "#fff",
    border: "1px solid",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    minHeight: 220,
    position: "relative",
  },
  dot: { width: 12, height: 12, borderRadius: "50%" },
  cardEyebrow: {
    alignSelf: "flex-start",
    fontSize: 11,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: 999,
  },
  cardName: { fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em" },
  cardDesc: {
    fontSize: 14,
    fontWeight: 300,
    lineHeight: 1.55,
    color: "rgba(255,255,255,0.78)",
  },
  cardArrow: { marginTop: "auto", fontSize: 14, fontWeight: 500 },
};

window.Verticals = Verticals;

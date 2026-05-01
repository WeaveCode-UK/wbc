/* global React */

function Services() {
  const items = [
    {
      tag: "Engineering",
      title: "Bespoke product engineering",
      body: "Small teams, sewn around your problem. Designed, built, deployed end-to-end with a senior bench.",
    },
    {
      tag: "Design",
      title: "Product & brand design",
      body: "Interfaces and identity systems that hold their shape under real users. Calm, technical, considered.",
    },
    {
      tag: "Strategy",
      title: "Discovery & roadmaps",
      body: "Before we sew, we measure twice. A short, sharp engagement to surface the real shape of the work.",
    },
  ];
  return (
    <section id="services" style={servicesStyles.root}>
      <div style={servicesStyles.inner}>
        <div style={servicesStyles.head}>
          <div style={servicesStyles.eyebrow}>Services</div>
          <h2 style={servicesStyles.title}>
            Three ways we <span style={servicesStyles.italic}>{"{weave}"}</span>
            .
          </h2>
        </div>
        <div style={servicesStyles.grid}>
          {items.map((it) => (
            <article key={it.title} style={servicesStyles.card}>
              <div style={servicesStyles.cardEyebrow}>{it.tag}</div>
              <h3 style={servicesStyles.cardTitle}>{it.title}</h3>
              <p style={servicesStyles.cardBody}>{it.body}</p>
              <a href="#" style={servicesStyles.cardLink}>
                Learn more →
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const servicesStyles = {
  root: { background: "#F9F9F9", padding: "120px 28px" },
  inner: { maxWidth: 1200, margin: "0 auto" },
  head: { marginBottom: 56, maxWidth: 720 },
  eyebrow: {
    fontSize: 12,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "#6E6E83",
    fontWeight: 600,
  },
  title: {
    margin: "14px 0 0",
    fontSize: 48,
    lineHeight: 1.1,
    letterSpacing: "-0.02em",
    fontWeight: 600,
    color: "#0E0E16",
  },
  italic: {
    fontFamily: "Georgia, serif",
    fontStyle: "italic",
    fontWeight: 400,
    color: "#8127E8",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: "28px 26px 26px",
    boxShadow: "0 6px 14px rgba(11,19,79,0.06), 0 2px 4px rgba(11,19,79,0.04)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    transition: "transform 180ms cubic-bezier(.22,1,.36,1), box-shadow 180ms",
    border: "1px solid #F1F1F4",
  },
  cardEyebrow: {
    alignSelf: "flex-start",
    fontSize: 11,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    fontWeight: 600,
    color: "#531896",
    background: "#F4ECFE",
    padding: "4px 10px",
    borderRadius: 999,
  },
  cardTitle: {
    margin: "6px 0 0",
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    color: "#0E0E16",
    lineHeight: 1.25,
  },
  cardBody: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.6,
    fontWeight: 300,
    color: "#4A4A5C",
  },
  cardLink: {
    marginTop: "auto",
    color: "#8127E8",
    fontSize: 14,
    fontWeight: 500,
    textDecoration: "none",
    paddingTop: 12,
  },
};

window.Services = Services;

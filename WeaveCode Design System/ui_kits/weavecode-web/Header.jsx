/* global React */
const { useState } = React;

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header style={headerStyles.root}>
      <div style={headerStyles.inner}>
        <a href="#" style={headerStyles.brand}>
          <img
            src="../../assets/logos/weavecode-mark-w-braces.png"
            alt="WeaveCode"
            style={{ height: 28 }}
          />
          <span style={headerStyles.brandWord}>weavecode</span>
        </a>
        <nav style={headerStyles.nav}>
          <a href="#services" style={headerStyles.link}>
            Services
          </a>
          <a href="#products" style={headerStyles.link}>
            Products
          </a>
          <a href="#work" style={headerStyles.link}>
            Work
          </a>
          <a href="#about" style={headerStyles.link}>
            About
          </a>
        </nav>
        <div style={headerStyles.actions}>
          <a href="#login" style={headerStyles.linkSubtle}>
            Log in
          </a>
          <a href="#contact" style={headerStyles.cta}>
            Get in touch <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </header>
  );
}

const headerStyles = {
  root: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(11, 19, 79, 0.78)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    color: "#fff",
  },
  inner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "14px 28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#fff",
    textDecoration: "none",
    fontWeight: 600,
    letterSpacing: "-0.01em",
  },
  brandWord: { fontSize: 18, fontWeight: 600 },
  nav: { display: "flex", gap: 28 },
  link: {
    color: "rgba(255,255,255,0.78)",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 400,
    transition: "color 180ms",
  },
  actions: { display: "flex", alignItems: "center", gap: 16 },
  linkSubtle: {
    color: "rgba(255,255,255,0.7)",
    textDecoration: "none",
    fontSize: 14,
  },
  cta: {
    background: "#FF6600",
    color: "#fff",
    textDecoration: "none",
    padding: "9px 16px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
};

window.Header = Header;

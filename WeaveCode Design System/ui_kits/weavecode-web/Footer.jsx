/* global React */

function Footer() {
  return (
    <footer style={footerStyles.root}>
      <div style={footerStyles.inner}>
        <div style={footerStyles.brandCol}>
          <img
            src="../../assets/logos/weavecode-mark-w-braces.png"
            alt="WeaveCode"
            style={footerStyles.mark}
          />
          <div style={footerStyles.tagline}>
            <span style={footerStyles.italic}>{"{code}"}</span>, sewn
            deliberately.
          </div>
          <div style={footerStyles.fine}>
            © {new Date().getFullYear()} WeaveCode Ltd.
          </div>
        </div>
        <div style={footerStyles.linksGrid}>
          <div>
            <div style={footerStyles.colTitle}>Studio</div>
            <a style={footerStyles.link} href="#">
              Services
            </a>
            <a style={footerStyles.link} href="#">
              Process
            </a>
            <a style={footerStyles.link} href="#">
              Team
            </a>
          </div>
          <div>
            <div style={footerStyles.colTitle}>Verticals</div>
            <a style={footerStyles.link} href="#">
              Beauty
            </a>
            <a style={footerStyles.link} href="#">
              Health
            </a>
            <a style={footerStyles.link} href="#">
              Business
            </a>
          </div>
          <div>
            <div style={footerStyles.colTitle}>Contact</div>
            <a style={footerStyles.link} href="#">
              hello@weavecode.co.uk
            </a>
            <a style={footerStyles.link} href="#">
              LinkedIn
            </a>
            <a style={footerStyles.link} href="#">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

const footerStyles = {
  root: {
    background: "#06092B",
    color: "rgba(255,255,255,0.78)",
    padding: "64px 28px 40px",
  },
  inner: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1.1fr 2fr",
    gap: 64,
  },
  brandCol: { display: "flex", flexDirection: "column", gap: 14 },
  mark: {
    height: 40,
    width: "auto",
    filter: "brightness(0) invert(1)",
    alignSelf: "flex-start",
  },
  tagline: { fontSize: 18, fontWeight: 400, color: "#fff" },
  italic: {
    fontFamily: "Georgia, serif",
    fontStyle: "italic",
    color: "#CDA8F8",
  },
  fine: { fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 12 },
  linksGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 32,
  },
  colTitle: {
    fontSize: 11,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    fontWeight: 600,
    color: "#fff",
    marginBottom: 14,
  },
  link: {
    display: "block",
    color: "rgba(255,255,255,0.7)",
    textDecoration: "none",
    fontSize: 14,
    padding: "5px 0",
    fontWeight: 300,
  },
};

window.Footer = Footer;

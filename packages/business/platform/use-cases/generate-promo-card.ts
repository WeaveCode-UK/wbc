// F11.E10: server-side SVG renderer for promotional cards. Returns a
// 1080×1080 SVG string. The plan suggests four design templates plus
// PNG render via `sharp` and CDN upload — that requires a native
// install (sharp) and a configured CDN bucket, both backlog. The MVP
// here returns SVG inline so the consultora can paste it into a
// campaign or right-click → save as PNG via the browser.

export type PromoTemplate = "minimal" | "bold" | "festive" | "elegant";

export interface PromoCardInput {
  template: PromoTemplate;
  title: string;
  price?: number;
  brand?: string;
  callToAction?: string;
}

const escapeXml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const PALETTES: Record<
  PromoTemplate,
  { bg: string; primary: string; accent: string; text: string }
> = {
  minimal: {
    bg: "#FFFBFC",
    primary: "#1A0F33",
    accent: "#8127E8",
    text: "#1A0F33",
  },
  bold: {
    bg: "#1A0F33",
    primary: "#8127E8",
    accent: "#FF6B35",
    text: "#FFFFFF",
  },
  festive: {
    bg: "#E91E8C",
    primary: "#FFFFFF",
    accent: "#FFE600",
    text: "#FFFFFF",
  },
  elegant: {
    bg: "#150A10",
    primary: "#E91E8C",
    accent: "#F2C879",
    text: "#FFFBFC",
  },
};

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function generatePromoCardSvg(input: PromoCardInput): string {
  const palette = PALETTES[input.template];
  const title = escapeXml(input.title);
  const brand = input.brand ? escapeXml(input.brand) : "";
  const cta = escapeXml(input.callToAction ?? "Fale comigo no WhatsApp");
  const priceLabel = input.price ? formatBRL(input.price) : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <rect width="1080" height="1080" fill="${palette.bg}" />
  <circle cx="900" cy="180" r="220" fill="${palette.accent}" opacity="0.15" />
  <circle cx="180" cy="900" r="280" fill="${palette.primary}" opacity="0.12" />

  <g font-family="Inter, system-ui, sans-serif">
    ${
      brand
        ? `<text x="80" y="180" font-size="38" font-weight="500" fill="${palette.accent}" letter-spacing="6">${brand.toUpperCase()}</text>`
        : ""
    }

    <text x="80" y="380" font-size="84" font-weight="700" fill="${palette.text}">
      <tspan x="80" dy="0">${title.slice(0, 28)}</tspan>
      ${title.length > 28 ? `<tspan x="80" dy="100">${title.slice(28, 56)}</tspan>` : ""}
    </text>

    ${
      priceLabel
        ? `<text x="80" y="780" font-size="120" font-weight="800" fill="${palette.primary}">${priceLabel}</text>`
        : ""
    }

    <rect x="80" y="900" width="920" height="100" rx="50" fill="${palette.primary}" />
    <text x="540" y="965" font-size="42" font-weight="600" fill="${palette.bg}" text-anchor="middle">${cta}</text>
  </g>
</svg>`;
}

export function svgToDataUrl(svg: string): string {
  const encoded = Buffer.from(svg, "utf-8").toString("base64");
  return `data:image/svg+xml;base64,${encoded}`;
}

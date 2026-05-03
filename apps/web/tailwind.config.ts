import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Legacy theme tokens — bridged onto WeaveCode tokens via themes.css.
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          surface: "var(--color-primary-surface)",
          "surface-hover": "var(--color-primary-surface-hover)",
        },
        accent: "var(--color-accent)",
        "bg-primary": "var(--color-bg-primary)",
        "bg-secondary": "var(--color-bg-secondary)",
        "bg-tertiary": "var(--color-bg-tertiary)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-tertiary": "var(--color-text-tertiary)",
        "border-primary": "var(--color-border-primary)",
        "border-secondary": "var(--color-border-secondary)",
        "border-tertiary": "var(--color-border-tertiary)",
        success: {
          DEFAULT: "var(--color-success)",
          bg: "var(--color-success-bg)",
          text: "var(--color-success-text)",
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          bg: "var(--color-warning-bg)",
          text: "var(--color-warning-text)",
        },
        danger: {
          DEFAULT: "var(--color-danger)",
          bg: "var(--color-danger-bg)",
          text: "var(--color-danger-text)",
        },
        info: {
          DEFAULT: "var(--color-info)",
          bg: "var(--color-info-bg)",
          text: "var(--color-info-text)",
        },
        abc: {
          a: "var(--color-abc-a)",
          "a-bg": "var(--color-abc-a-bg)",
          b: "var(--color-abc-b)",
          "b-bg": "var(--color-abc-b-bg)",
          c: "var(--color-abc-c)",
          "c-bg": "var(--color-abc-c-bg)",
        },

        // WeaveCode Design System — full token surface for new code.
        wc: {
          purple: {
            DEFAULT: "var(--wc-purple)",
            50: "var(--wc-purple-50)",
            100: "var(--wc-purple-100)",
            200: "var(--wc-purple-200)",
            300: "var(--wc-purple-300)",
            400: "var(--wc-purple-400)",
            500: "var(--wc-purple-500)",
            600: "var(--wc-purple-600)",
            700: "var(--wc-purple-700)",
            800: "var(--wc-purple-800)",
            900: "var(--wc-purple-900)",
          },
          blue: {
            DEFAULT: "var(--wc-deep-blue)",
            50: "var(--wc-blue-50)",
            100: "var(--wc-blue-100)",
            200: "var(--wc-blue-200)",
            300: "var(--wc-blue-300)",
            400: "var(--wc-blue-400)",
            500: "var(--wc-blue-500)",
            600: "var(--wc-blue-600)",
            700: "var(--wc-blue-700)",
            800: "var(--wc-blue-800)",
            900: "var(--wc-blue-900)",
          },
          orange: "var(--wc-orange)",
          white: "var(--wc-white)",
          beauty: "var(--wc-beauty)",
          health: "var(--wc-health)",
          business: "var(--wc-business)",
          neutral: {
            0: "var(--wc-neutral-0)",
            50: "var(--wc-neutral-50)",
            100: "var(--wc-neutral-100)",
            200: "var(--wc-neutral-200)",
            300: "var(--wc-neutral-300)",
            400: "var(--wc-neutral-400)",
            500: "var(--wc-neutral-500)",
            600: "var(--wc-neutral-600)",
            700: "var(--wc-neutral-700)",
            800: "var(--wc-neutral-800)",
            900: "var(--wc-neutral-900)",
          },
          fg: {
            1: "var(--wc-fg-1)",
            2: "var(--wc-fg-2)",
            3: "var(--wc-fg-3)",
            muted: "var(--wc-fg-muted)",
          },
          bg: {
            DEFAULT: "var(--wc-bg)",
            elevated: "var(--wc-bg-elevated)",
            muted: "var(--wc-bg-muted)",
          },
          border: {
            DEFAULT: "var(--wc-border)",
            strong: "var(--wc-border-strong)",
          },
          success: "var(--wc-success)",
          warning: "var(--wc-warning)",
          error: "var(--wc-error)",
          info: "var(--wc-info)",
        },
      },
      fontFamily: {
        // Default sans = Inter (WeaveCode brand). Inter is registered via
        // @font-face in src/weavecode/colors_and_type.css.
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        // Georgia — used only inside `{moments}` per brand rules.
        serif: ["Georgia", '"Times New Roman"', "Times", "serif"],
        display: ["Inter", "system-ui", "sans-serif"],
        mono: [
          "ui-monospace",
          '"JetBrains Mono"',
          '"SF Mono"',
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      fontSize: {
        // Legacy WBC tokens (used widely across the app).
        "heading-1": ["24px", { lineHeight: "1.3", fontWeight: "500" }],
        "heading-2": ["18px", { lineHeight: "1.3", fontWeight: "500" }],
        "heading-3": ["15px", { lineHeight: "1.4", fontWeight: "500" }],
        body: ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-small": ["13px", { lineHeight: "1.5", fontWeight: "400" }],
        caption: ["11px", { lineHeight: "1.4", fontWeight: "400" }],
        overline: [
          "10px",
          { lineHeight: "1.2", fontWeight: "500", letterSpacing: "0.5px" },
        ],

        // WeaveCode display scale.
        "wc-display": [
          "72px",
          { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "600" },
        ],
        "wc-h1": [
          "48px",
          { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" },
        ],
        "wc-h2": [
          "36px",
          { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" },
        ],
        "wc-h3": ["28px", { lineHeight: "1.2", fontWeight: "500" }],
        "wc-h4": ["22px", { lineHeight: "1.3", fontWeight: "500" }],
        "wc-body-lg": ["18px", { lineHeight: "1.65", fontWeight: "300" }],
        "wc-body": ["16px", { lineHeight: "1.45", fontWeight: "300" }],
        "wc-small": ["14px", { lineHeight: "1.45", fontWeight: "400" }],
        "wc-caption": [
          "12px",
          { lineHeight: "1.45", fontWeight: "500", letterSpacing: "0.08em" },
        ],
      },
      spacing: {
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "5": "20px",
        "6": "24px",
        "8": "32px",
        "12": "48px",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        full: "9999px",
        "wc-xs": "var(--wc-radius-xs)",
        "wc-sm": "var(--wc-radius-sm)",
        "wc-md": "var(--wc-radius-md)",
        "wc-lg": "var(--wc-radius-lg)",
        "wc-xl": "var(--wc-radius-xl)",
        "wc-2xl": "var(--wc-radius-2xl)",
      },
      borderWidth: {
        DEFAULT: "0.5px",
        "2": "2px",
      },
      boxShadow: {
        "wc-xs": "var(--wc-shadow-xs)",
        "wc-sm": "var(--wc-shadow-sm)",
        "wc-md": "var(--wc-shadow-md)",
        "wc-lg": "var(--wc-shadow-lg)",
        "wc-xl": "var(--wc-shadow-xl)",
        "wc-glow": "var(--wc-shadow-glow)",
        "wc-focus": "var(--wc-shadow-focus)",
      },
      transitionTimingFunction: {
        "wc-out": "cubic-bezier(0.22, 1, 0.36, 1)",
        "wc-in-out": "cubic-bezier(0.65, 0, 0.35, 1)",
        "wc-spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      transitionDuration: {
        "wc-1": "120ms",
        "wc-2": "180ms",
        "wc-3": "240ms",
        "wc-4": "320ms",
      },
      backgroundImage: {
        "wc-glow-navy": "var(--wc-grad-glow-navy)",
        "wc-glow-purple": "var(--wc-grad-glow-purple)",
        "wc-orb-dark": "var(--wc-grad-orb-dark)",
        "wc-orb-light": "var(--wc-grad-orb-light)",
        "wc-purple-band": "var(--wc-grad-purple-band)",
        "wc-purple-orange": "var(--wc-grad-purple-orange)",
        "wc-dot-pattern":
          "radial-gradient(rgba(129, 39, 232, 0.55) 1px, transparent 1.2px)",
      },
      backgroundSize: {
        "wc-dot": "14px 14px",
      },
    },
  },
  plugins: [],
};

export default config;

export const typography = {
  fonts: {
    headline: 'Epilogue',
    body: 'Sora',
    label: 'Manrope',
    display: 'Epilogue',
    fallbackWeb: 'system-ui, -apple-system, sans-serif',
    fallbackMobile: undefined,
    mono: "'SF Mono', 'Fira Code', monospace",
  },
  scale: {
    'display-lg': { size: 32, weight: '800' as const, lineHeight: 1.2, font: 'headline' as const },
    'heading-1': { size: 24, weight: '700' as const, lineHeight: 1.3, font: 'headline' as const },
    'heading-2': { size: 18, weight: '700' as const, lineHeight: 1.3, font: 'headline' as const },
    'heading-3': { size: 15, weight: '600' as const, lineHeight: 1.4, font: 'body' as const },
    body: { size: 14, weight: '400' as const, lineHeight: 1.5, font: 'body' as const },
    'body-small': { size: 13, weight: '400' as const, lineHeight: 1.5, font: 'body' as const },
    caption: { size: 11, weight: '400' as const, lineHeight: 1.4, font: 'label' as const },
    overline: { size: 10, weight: '700' as const, lineHeight: 1.2, letterSpacing: 1.5, textTransform: 'uppercase' as const, font: 'label' as const },
  },
} as const;

export type TypographyToken = keyof typeof typography.scale;

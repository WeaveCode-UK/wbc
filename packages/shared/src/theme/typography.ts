export const typography = {
  fonts: {
    primary: 'Sora',
    display: 'Azonix',
    fallbackWeb: 'system-ui, -apple-system, sans-serif',
    fallbackMobile: undefined,
    mono: "'SF Mono', 'Fira Code', monospace",
  },
  scale: {
    'heading-1': { size: 24, weight: '500' as const, lineHeight: 1.3 },
    'heading-2': { size: 18, weight: '500' as const, lineHeight: 1.3 },
    'heading-3': { size: 15, weight: '500' as const, lineHeight: 1.4 },
    body: { size: 14, weight: '400' as const, lineHeight: 1.5 },
    'body-small': { size: 13, weight: '400' as const, lineHeight: 1.5 },
    caption: { size: 11, weight: '400' as const, lineHeight: 1.4 },
    overline: { size: 10, weight: '500' as const, lineHeight: 1.2, letterSpacing: 0.5, textTransform: 'uppercase' as const },
  },
} as const;

export type TypographyToken = keyof typeof typography.scale;

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: 'var(--color-primary)', hover: 'var(--color-primary-hover)', surface: 'var(--color-primary-surface)', 'surface-hover': 'var(--color-primary-surface-hover)' },
        accent: 'var(--color-accent)',
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-tertiary': 'var(--color-bg-tertiary)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        'border-primary': 'var(--color-border-primary)',
        'border-secondary': 'var(--color-border-secondary)',
        'border-tertiary': 'var(--color-border-tertiary)',
        success: { DEFAULT: 'var(--color-success)', bg: 'var(--color-success-bg)', text: 'var(--color-success-text)' },
        warning: { DEFAULT: 'var(--color-warning)', bg: 'var(--color-warning-bg)', text: 'var(--color-warning-text)' },
        danger: { DEFAULT: 'var(--color-danger)', bg: 'var(--color-danger-bg)', text: 'var(--color-danger-text)' },
        info: { DEFAULT: 'var(--color-info)', bg: 'var(--color-info-bg)', text: 'var(--color-info-text)' },
        abc: { a: 'var(--color-abc-a)', 'a-bg': 'var(--color-abc-a-bg)', b: 'var(--color-abc-b)', 'b-bg': 'var(--color-abc-b-bg)', c: 'var(--color-abc-c)', 'c-bg': 'var(--color-abc-c-bg)' },
      },
      fontFamily: {
        sans: ['Sora', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Azonix', 'Sora', 'sans-serif'],
        mono: ['SF Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'heading-1': ['24px', { lineHeight: '1.3', fontWeight: '500' }],
        'heading-2': ['18px', { lineHeight: '1.3', fontWeight: '500' }],
        'heading-3': ['15px', { lineHeight: '1.4', fontWeight: '500' }],
        'body': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-small': ['13px', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['11px', { lineHeight: '1.4', fontWeight: '400' }],
        'overline': ['10px', { lineHeight: '1.2', fontWeight: '500', letterSpacing: '0.5px' }],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '12': '48px',
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '12px',
        'xl': '16px',
        'full': '9999px',
      },
      borderWidth: {
        DEFAULT: '0.5px',
        '2': '2px',
      },
    },
  },
  plugins: [],
};

export default config;

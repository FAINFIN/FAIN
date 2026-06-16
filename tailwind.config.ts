import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'monospace'],
        georgian: ['var(--font-georgian)', 'sans-serif'],
      },
      colors: {
        tan: {
          9:  'var(--tan-9)',
          10: 'var(--tan-10)',
          11: 'var(--tan-11)',
          soft: 'var(--tan-soft)',
        },
        stone: {
          3:  'var(--stone-3)',
          4:  'var(--stone-4)',
          6:  'var(--stone-6)',
          7:  'var(--stone-7)',
          8:  'var(--stone-8)',
          9:  'var(--stone-9)',
          11: 'var(--stone-11)',
          12: 'var(--stone-12)',
        },
      },
      borderRadius: {
        card:  'var(--r-card)',
        panel: 'var(--r-panel)',
        pill:  'var(--r-pill)',
      },
      boxShadow: {
        sm:   'var(--sh-sm)',
        card: 'var(--sh-card)',
        lift: 'var(--sh-lift)',
      },
    },
  },
  plugins: [],
}

export default config

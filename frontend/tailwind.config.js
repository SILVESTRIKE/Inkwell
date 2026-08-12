/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian: 'var(--color-bg)',
        charcoal: 'var(--color-bg-raised)',
        sunken: 'var(--color-bg-sunken)',
        paper: 'var(--color-text)',
        muted: 'var(--color-text-muted)',
        faint: 'var(--color-text-faint)',
        oxide: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          soft: 'var(--color-accent-soft)',
        },
        rule: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
        },
        success: 'var(--color-success)',
        error: {
          DEFAULT: 'var(--color-error)',
          bg: 'var(--color-error-bg)',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Source Serif 4"', 'Georgia', 'serif'],
        ui: ['Inter', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        xs: '2px',
        sm: '3px',
        md: '4px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
    },
  },
  plugins: [],
};

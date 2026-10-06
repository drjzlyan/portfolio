import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#06070b', 900: '#0b0d14', 800: '#12151f', 700: '#1b1f2d' },
        paper: '#f3efe6',
        mute: '#8b8f9c',
        accent: 'var(--accent)',
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'serif'],
        mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'monospace'],
        body: ['"Geist Variable"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

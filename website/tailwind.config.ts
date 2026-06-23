import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B1020',
        slate2: '#5B6478',
        bg: '#F6F8FF',
        blue: '#3B82F6',
        indigo: '#6366F1',
        cyan: '#06B6D4',
        lime: '#84CC16',
        green: '#22C55E',
        orange: '#FB923C',
        amber: '#F59E0B',
        pink: '#EC4899',
        purple: '#8B5CF6',
        rose: '#F43F5E',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
      },
      maxWidth: { wide: '1200px' },
      borderRadius: { '4xl': '2rem' },
    },
  },
  plugins: [],
};

export default config;

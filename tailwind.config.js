/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cyan: { DEFAULT: '#00E5D4' },
        magenta: { DEFAULT: '#FF0080' },
        gold: '#FFD700',
      },
      fontFamily: {
        display: ['Syne', 'system-ui', 'sans-serif'],
        marquee: ['Monoton', 'system-ui', 'sans-serif'],
        sans: ['"Familjen Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

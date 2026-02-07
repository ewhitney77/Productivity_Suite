/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0F1117',
          surface: '#1A1D2B',
          card: '#222639',
          border: '#2E3348',
          hover: '#2A2F45',
        },
        accent: {
          green: '#4ADE80',
          mint: '#34D399',
          purple: '#7C5CFC',
        },
        text: {
          primary: '#E8ECF1',
          secondary: '#8892A7',
          muted: '#5A6178',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

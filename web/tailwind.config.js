/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darsil: {
          obsidian: '#080a0f',
          dark: '#0c1018',
          card: '#121724',
          cardHover: '#182032',
          border: '#1e2638',
          borderLight: '#2a354d',
          navy: '#0f294a',
          blue: '#1b3252',
          gold: '#e5a93c',
          goldHover: '#f59e0b',
          goldLight: '#fde68a',
          chrome: '#94a3b8',
          silver: '#cbd5e1',
          titanium: '#f1f5f9'
        }
      },
      boxShadow: {
        'gold-glow': '0 0 20px -5px rgba(229, 169, 60, 0.3)',
        'card-dark': '0 8px 30px rgba(0, 0, 0, 0.45)'
      }
    },
  },
  plugins: [],
}

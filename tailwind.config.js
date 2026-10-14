/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './*.{ts,tsx}', './components/**/*.{ts,tsx}', './hooks/**/*.{ts,tsx}', './services/**/*.{ts,tsx}', './utils/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'blood-red': '#8a0303',
        'blood-dark': '#4a0101',
        'gold-antique': '#c5a059',
        'gold-dark': '#8a6e36',
        parchment: '#f0e6d2',
        'parchment-dark': '#dcd0b9',
        'dark-metal': '#1a1b1e',
        'darker-metal': '#0f1012',
      },
      fontFamily: {
        fantasy: ['"MedievalSharp"', 'cursive'],
        header: ['"Cinzel"', 'serif'],
        body: ['"Merriweather"', 'serif'],
      },
      boxShadow: {
        'glow-gold': '0 0 15px rgba(197, 160, 89, 0.3)',
        'glow-red': '0 0 20px rgba(138, 3, 3, 0.4)',
      },
      dropShadow: {
        glow: '0 0 12px rgba(197, 160, 89, 0.45)',
      },
    },
  },
  plugins: [],
};

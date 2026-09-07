import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F8F5F0',
        'cream-dark': '#EFE9DF',
        gold: '#C5A059',
        'gold-light': '#DFCA88',
        'gold-dark': '#9E7D3B',
        navy: '#1B2A4A',
        'navy-light': '#283D6A',
      },
      fontFamily: {
        'alex-brush': ['"Alex Brush"', 'cursive'],
        'montserrat': ['Montserrat', 'sans-serif'],
        'playfair': ['"Playfair Display"', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
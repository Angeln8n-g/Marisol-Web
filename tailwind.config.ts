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
        gold: '#72e436ff',
        navy: '#048a04b2',
        'navy-light': '#1a057aff',
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
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F7F3FA',
          100: '#EFE7F5',
          200: '#DCCCE8',
          300: '#C5A8D6',
          400: '#B08BC4',
          500: '#9D7BB0', // Primary Brand Lilac
          600: '#855E98',
          700: '#6B477F',
          800: '#533663',
          900: '#2E1D36', // Deep Plum Charcoal
        },
        cream: {
          50: '#FFFEFA',
          100: '#FDFBF4',
          200: '#FBF5E5', // Buttercream Gold Tint
          300: '#F5EAC8',
          400: '#EED99E',
          500: '#E2C474',
        },
        rose: {
          50: '#FDF7F9',
          100: '#F8ECF0',
          200: '#F0D5DF',
          300: '#E1B3C4',
          400: '#C98B9E', // Dusty Mauve
          500: '#B06E83',
          600: '#935368',
        },
        canvas: {
          bg: '#FAF7F2',
          card: '#FFFFFF',
          subtle: '#F4EFE7',
          border: '#EAE1D5',
        }
      },
      fontFamily: {
        serif: ['var(--font-serif)', '"Playfair Display"', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'cozy': '0 4px 20px -2px rgba(46, 29, 54, 0.08), 0 2px 6px -1px rgba(46, 29, 54, 0.04)',
        'cozy-lg': '0 10px 30px -4px rgba(46, 29, 54, 0.12), 0 4px 12px -2px rgba(46, 29, 54, 0.06)',
      }
    },
  },
  plugins: [],
};

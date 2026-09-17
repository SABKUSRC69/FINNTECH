/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          950: '#022c22',
        },
        navy: {
          800: '#111827',
          850: '#0d1320',
          900: '#0b0f19',
          950: '#06080d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Prompt', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

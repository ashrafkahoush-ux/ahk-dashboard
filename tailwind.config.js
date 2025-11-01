/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ahk: {
          navy: {
            50: '#e6eaed',
            100: '#ccd4da',
            200: '#99a9b5',
            300: '#667f90',
            400: '#33546b',
            500: '#0A192F',
            600: '#081426',
            700: '#060f1c',
            800: '#040a13',
            900: '#020509',
          },
          gold: {
            50: '#faf8f0',
            100: '#f5f1e1',
            200: '#ebe3c3',
            300: '#e1d5a5',
            400: '#d7c787',
            500: '#D4AF37',
            600: '#aa8c2c',
            700: '#7f6921',
            800: '#554616',
            900: '#2a230b',
          },
          slate: {
            50: '#f1f2f4',
            100: '#e3e5e8',
            200: '#c7cbd1',
            300: '#abb1ba',
            400: '#8f97a3',
            500: '#8892B0',
            600: '#6d758d',
            700: '#52586a',
            800: '#373b46',
            900: '#1b1d23',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

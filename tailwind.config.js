/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0288D1',
          50: '#E0F7FA',
          100: '#B2EBF2',
          500: '#0288D1',
          600: '#0277BD',
        },
        background: '#E0F7FA',
        gray: {
          50: '#F8F9FA',
          100: '#E0E0E0',
          300: '#999999',
          400: '#666666',
          500: '#374151',
          700: '#333333',
          900: '#111827',
        },
        success: '#4CAF50',
        border: '#B0E4E7',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}


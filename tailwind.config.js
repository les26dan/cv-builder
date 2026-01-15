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
          DEFAULT: '#0277BD',
          50: '#E0F7FA',
          100: '#B2EBF2',
          500: '#0277BD',
          600: '#025596',
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
      animation: {
        slideInRight: 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}


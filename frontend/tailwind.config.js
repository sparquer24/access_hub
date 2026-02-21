/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Teal Theme (Option 2)
        primary: '#0D9488',
        'primary-light': '#14B8A6',
        'primary-dark': '#0F766E',
        'primary-50': '#F0FDFA',
        'primary-100': '#CCFBF1',
        'primary-200': '#99F6E4',
        'primary-300': '#5EEAD4',
        'primary-400': '#2DD4BF',
        'primary-500': '#14B8A6',
        'primary-600': '#0D9488',
        'primary-700': '#0F766E',
        'primary-800': '#115E59',
        'primary-900': '#134E4A',

        // Teal variations for gradients and accents
        teal: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },

        // Status colors
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
      },
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-in',
        'slideIn': 'slideIn 0.3s ease-out',
        'spin': 'spin 1s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      boxShadow: {
        'teal': '0 4px 14px 0 rgba(13, 148, 136, 0.15)',
        'teal-lg': '0 10px 25px 0 rgba(13, 148, 136, 0.2)',
      },
    },
  },
  plugins: [],
}
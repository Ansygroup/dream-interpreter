/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        arabic: ['"Noto Naskh Arabic"', 'serif'],
        cn: ['"Noto Serif SC"', 'serif'],
      },
      colors: {
        cosmic: {
          50: '#f4f3ff',
          100: '#ebe8ff',
          200: '#d6cfff',
          300: '#b5a8ff',
          400: '#8e7aff',
          500: '#6a4cff',
          600: '#5231eb',
          700: '#3f23c4',
          800: '#2e1a91',
          900: '#1d1154',
          950: '#0a0628',
        },
        starlight: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
        }
      },
      animation: {
        'twinkle': 'twinkle 4s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'fade-in-up': 'fadeInUp 0.8s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(106, 76, 255, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(106, 76, 255, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}

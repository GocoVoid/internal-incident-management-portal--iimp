/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
      },
      colors: {
        indigo: {
          50:  '#f5f5fc',
          100: '#eeeef8',
          200: '#c5c5e8',
          300: '#a0a0d5',
          400: '#7a7ac3',
          500: '#6363b8',
          600: '#4f4fa3',
          700: '#3c3c8c',
          800: '#252568',
          900: '#1a1a4e',
        },
        purple: {
          50:  '#faf3fa',
          100: '#f3e8f3',
          200: '#ddb8dd',
          400: '#b07ab0',
          600: '#8c4e8c',
          700: '#783c78',
          800: '#5a1e5a',
        },
        cyan: {
          50:  '#edf8fc',
          100: '#d6f0f8',
          200: '#a8ddf0',
          400: '#28b8dc',
          500: '#14a0c8',
          600: '#0080b0',
          700: '#00648c',
        },
      },
      boxShadow: {
        'pratiti-sm': '0 1px 3px rgba(60,60,140,0.08), 0 1px 2px rgba(60,60,140,0.04)',
        'pratiti-md': '0 4px 16px rgba(60,60,140,0.10), 0 2px 6px rgba(60,60,140,0.06)',
        'pratiti-lg': '0 12px 40px rgba(60,60,140,0.14), 0 4px 12px rgba(60,60,140,0.08)',
        'pratiti-xl': '0 24px 64px rgba(60,60,140,0.18), 0 8px 24px rgba(60,60,140,0.10)',
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#182033',
        muted: '#737d91',
        brand: { 50: '#f1f0ff', 100: '#e7e5ff', 500: '#6258e8', 600: '#5146d8', 700: '#4439bf' }
      },
      boxShadow: {
        soft: '0 10px 35px rgba(27, 35, 63, 0.06)',
        card: '0 2px 8px rgba(27, 35, 63, 0.035)'
      }
    }
  },
  plugins: []
};

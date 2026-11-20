/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#0f0f0f',
          gray: '#1c1c1c',
          gold: { 400: '#e5c158', 500: '#d4af37', 600: '#b5952f' },
          muted: '#bfbfbf',
          white: '#ffffff'
        }
      },
      fontFamily: { 
        sans: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif']
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, rgba(15, 15, 15, 0.9) 0%, rgba(28, 28, 28, 0.7) 100%)',
        'card-gradient': 'linear-gradient(to bottom, transparent 40%, rgba(15,15,15,0.95) 100%)',
      },
      boxShadow: {
        'luxury': '0 10px 40px -10px rgba(0,0,0,0.5)',
        'luxury-hover': '0 20px 40px -10px rgba(212,175,55,0.15)',
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta principal del restaurante
        beige: {
          50: '#FDFDFB',
          100: '#FAF9F5',
          200: '#F5F5DC', // Principal
          300: '#E8E6C8',
          400: '#D9D6AD',
          500: '#C9C590',
          600: '#B5B070',
          700: '#969154',
          800: '#74713F',
          900: '#53512E',
        },
        oliva: {
          50: '#F4F6F3',
          100: '#E6EBE4',
          200: '#C9D4C5',
          300: '#A8BAA2',
          400: '#889E81', // Principal
          500: '#6B8464',
          600: '#556A50',
          700: '#445441',
          800: '#384435',
          900: '#2D372B',
        },
        terracota: {
          50: '#FDF5F3',
          100: '#FCEAE5',
          200: '#F9D2C8',
          300: '#F3B3A1',
          400: '#E98A70',
          500: '#CB6D51', // Principal
          600: '#B95A40',
          700: '#9A4833',
          800: '#7E3D2D',
          900: '#683529',
        },
        cafe: {
          50: '#F6F3F2',
          100: '#EAE5E3',
          200: '#D6CDC9',
          300: '#BBADA6',
          400: '#9A857B',
          500: '#7F6A5F',
          600: '#6A574C',
          700: '#574740',
          800: '#4E342E', // Principal
          900: '#3E2A25',
          950: '#2A1C19',
        },
        // Estados
        estado: {
          disponible: '#4ADE80',
          ocupada: '#FBBF24',
          reservada: '#60A5FA',
          cuenta: '#F87171',
          pendiente: '#FCD34D',
          preparando: '#FB923C',
          listo: '#4ADE80',
          entregado: '#94A3B8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'touch': ['1.125rem', { lineHeight: '1.75rem' }],
        'touch-lg': ['1.25rem', { lineHeight: '1.75rem' }],
      },
      spacing: {
        'touch': '44px', // Tamaño mínimo para touch
        'touch-lg': '56px',
      },
      borderRadius: {
        'card': '12px',
        'button': '8px',
      },
      boxShadow: {
        'card': '0 2px 8px -2px rgba(78, 52, 46, 0.1), 0 4px 16px -4px rgba(78, 52, 46, 0.1)',
        'card-hover': '0 4px 12px -2px rgba(78, 52, 46, 0.15), 0 8px 24px -4px rgba(78, 52, 46, 0.15)',
        'modal': '0 8px 32px -8px rgba(78, 52, 46, 0.2), 0 16px 48px -8px rgba(78, 52, 46, 0.15)',
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slide-in 0.3s ease-out',
        'slide-out': 'slide-out 0.3s ease-in',
        'bounce-soft': 'bounce-soft 0.5s ease-in-out',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-out': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        'bounce-soft': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
      screens: {
        'tablet': '768px',
        'tablet-lg': '1024px',
        'desktop': '1280px',
        'cocina': '1200px', // Pantalla de cocina
      },
    },
  },
  plugins: [],
}

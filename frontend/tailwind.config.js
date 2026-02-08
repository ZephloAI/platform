/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        // Apple-inspired neutral palette with warmth
        surface: {
          primary: '#FBFBFD',
          secondary: '#F5F5F7',
          tertiary: '#EDEDF0',
        },
        accent: {
          DEFAULT: '#0071E3',
          hover: '#0077ED',
          light: '#EBF5FF',
          subtle: 'rgba(0, 113, 227, 0.08)',
        },
        label: {
          primary: '#1D1D1F',
          secondary: '#6E6E73',
          tertiary: '#86868B',
          quaternary: '#AEAEB2',
        },
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      boxShadow: {
        'glass': '0 0 0 1px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.04)',
        'glass-hover': '0 0 0 1px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.06)',
        'glass-lg': '0 0 0 1px rgba(0, 0, 0, 0.03), 0 4px 8px rgba(0, 0, 0, 0.04), 0 16px 48px rgba(0, 0, 0, 0.06)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.5)',
      },
      backdropBlur: {
        'glass': '20px',
        'glass-lg': '40px',
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
};

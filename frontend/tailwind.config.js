/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'DM Sans',
          '-apple-system',
          'BlinkMacSystemFont',
          'Helvetica Neue',
          'sans-serif',
        ],
        display: [
          'Plus Jakarta Sans',
          '-apple-system',
          'BlinkMacSystemFont',
          'Helvetica Neue',
          'sans-serif',
        ],
      },
      colors: {
        surface: {
          primary: '#FAF9F7',
          secondary: '#F4F3F0',
          tertiary: '#ECEAE6',
        },
        accent: {
          DEFAULT: '#1275CA',
          hover: '#0E5FA6',
          light: '#EBF4FB',
          subtle: 'rgba(18, 117, 202, 0.08)',
        },
        ink: {
          DEFAULT: '#1A1A2E',
          secondary: '#3D3D56',
          muted: '#6B6B80',
        },
        label: {
          primary: '#1A1A2E',
          secondary: '#5C5C6F',
          tertiary: '#8A8A9A',
          quaternary: '#B0B0BC',
        },
        separator: 'rgba(0, 0, 0, 0.06)',
        sage: {
          50: '#F0F5F1',
          100: '#D9E8DC',
          500: '#6B8F71',
          600: '#5A7D60',
        },
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(26, 26, 46, 0.04), 0 4px 12px rgba(26, 26, 46, 0.03)',
        'card-hover': '0 2px 6px rgba(26, 26, 46, 0.06), 0 8px 24px rgba(26, 26, 46, 0.05)',
        'card-lg': '0 4px 8px rgba(26, 26, 46, 0.04), 0 16px 48px rgba(26, 26, 46, 0.06)',
        'glow': '0 0 0 1px rgba(18, 117, 202, 0.15), 0 4px 16px rgba(18, 117, 202, 0.1)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
};

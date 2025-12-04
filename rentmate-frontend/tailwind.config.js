/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0072BC',
        secondary: '#F1F3F5',
        success: '#7ED321',
        danger: '#FF3B30',
        brand: {
          DEFAULT: '#001F3F',
          light: '#5DE0E6',
          dark: '#041026',
        },
        accent: '#FFD400',
        muted: '#F8F9FA',
      },
      borderRadius: {
        xl: '10px',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Be Vietnam Pro"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'floating-card': '0 25px 60px rgba(4, 16, 38, 0.08)',
        'soft-glow': '0 20px 45px rgba(0, 168, 232, 0.25)',
      },
      backgroundImage: {
        'gradient-primary':
          'linear-gradient(120deg, #0072BC 0%, #00A8E8 48%, #FFD400 100%)',
        'gradient-card':
          'linear-gradient(135deg, rgba(0,114,188,0.12), rgba(93,224,230,0.12))',
        'gradient-soft':
          'radial-gradient(circle at 0% 0%, rgba(0,114,188,0.22), transparent 65%)',
      },
    },
  },
  plugins: [],
};

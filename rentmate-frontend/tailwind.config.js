/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2C7BE5',
        secondary: '#F4F4F4',
        success: '#00B894',
        danger: '#E74C3C',
      },
      borderRadius: {
        xl: '10px',
      },
    },
  },
  plugins: [],
};

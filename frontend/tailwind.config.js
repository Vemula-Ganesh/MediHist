/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB', // Trustworthy Royal Blue
          light: '#3B82F6',
          dark: '#1D4ED8',
        },
        secondary: {
          DEFAULT: '#1E293B', // Sleek Dark Slate
          light: '#334155',
          dark: '#0F172A',
        },
        accent: {
          DEFAULT: '#06B6D4', // Vibrant Cyan Highlight
          light: '#22D3EE',
          dark: '#0891B2',
        },
        brandBg: '#F8FAFC', // Slate Background Canvas
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'medihist': '12px',
      }
    },
  },
  plugins: [],
}

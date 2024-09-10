/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // This enables dark mode
  theme: {
    extend: {
      // You can define custom colors here
      colors: {
        primary: {
          light: '#3498db',
          dark: '#2980b9',
        },
        // ... other custom colors
      },
    },
  },
  plugins: [],
}


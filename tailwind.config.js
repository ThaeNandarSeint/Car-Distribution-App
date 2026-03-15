/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        base:     '#0A0A0F',
        surface:  '#12121A',
        elevated: '#1A1A26',
        border:   '#252535',
        brand: {
          DEFAULT: '#5B5FEF',
          light:   '#7B7FF5',
          dark:    '#3D40C9',
        },
        accent: {
          DEFAULT: '#F5A623',
          dark:    '#D4891A',
        },
        transit:   '#3B82F6',
        arrived:   '#10B981',
        inspected: '#8B5CF6',
        released:  '#06B6D4',
        hold:      '#F59E0B',
        damaged:   '#EF4444',
        primary:   '#F1F1F8',
        secondary: '#8888A8',
        muted:     '#55556A',
      },
      // No custom fontFamily — avoids "not loaded through expo-font" warnings
    },
  },
  plugins: [],
};
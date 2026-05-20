/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // डार्क मोड को चालू करेगा
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand color
        primary: {
          DEFAULT: '#4318FF',
          light: '#8B72FF',
        },
        // Text colors
        heading: {
          DEFAULT: '#1B2559',
          dark: '#E2E8F0',
        },
        text: {
          DEFAULT: '#475467',   // मुख्य टेक्स्ट के लिए गहरा रंग ताकि आसानी से पढ़ा जा सके
          secondary: '#A3AED0', // छोटे लेबल्स और सब-हेडिंग्स के लिए हल्का रंग
          dark: '#94A3B8',
          darker: '#E2E8F0',
        },
        // Background colors
        background: {
          light: '#F4F7FE',
          dark: '#1E293B',
          darker: '#131620',
        },
        // Border colors
        border: {
          light: '#E9EDF7',
          dark: '#2B3041',
        },
        // Specific UI element colors
        info: '#0095FF',
        success: '#4CAF50',
        warning: '#FF9800',
        danger: '#EF4444',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // These are defined in theme.css but we might want them here too or rely on CSS vars
        // If we rely on CSS vars, we can just use text-primary (if mapped) or just use standard utility classes
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./styles/**/*.{css,scss}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: "#FF0080",
          magenta: "#C026D3",
          purple: "#7C3AED",
          blue: "#3B82F6",
          dark: "#000000",
          surface: "#0A0A0A",
          border: "#1F1F22",
          text: "#E5E5E5",
        },
      },
    },
  },
  plugins: [],
};

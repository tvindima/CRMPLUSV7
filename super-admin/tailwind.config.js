/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366F1',      // Indigo - diferente do vermelho dos tenants
        secondary: '#8B5CF6',    // Purple
        background: '#0F0F12',
        'background-secondary': '#1A1A1F',
        'text-primary': '#FFFFFF',
        'text-muted': '#9CA3AF',
        border: '#2A2A2E',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
    },
  },
  plugins: [],
};

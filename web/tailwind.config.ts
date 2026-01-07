import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          500: "#0F3D5C",
          400: "#16658A",
          DEFAULT: "var(--color-primary)",
        },
        // Cores dinâmicas do tema
        theme: {
          primary: "var(--color-primary)",
          secondary: "var(--color-secondary)",
          background: "var(--color-background)",
          "background-secondary": "var(--color-background-secondary)",
          text: "var(--color-text)",
          "text-muted": "var(--color-text-muted)",
          border: "var(--color-border)",
          accent: "var(--color-accent)",
        },
      },
      backgroundColor: {
        'theme': 'var(--color-background)',
        'theme-secondary': 'var(--color-background-secondary)',
      },
      textColor: {
        'theme': 'var(--color-text)',
        'theme-muted': 'var(--color-text-muted)',
        'theme-primary': 'var(--color-primary)',
      },
      borderColor: {
        'theme': 'var(--color-border)',
      },
    },
  },
  plugins: [],
};

export default config;

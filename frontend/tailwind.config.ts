import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0f172a', // كحلي غامق (مثال: slate-900)
          light: '#1e293b',
        },
        secondary: {
          DEFAULT: '#d4af37', // ذهبي
          hover: '#b4941f',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans Arabic', 'sans-serif'], // خط البراند
      },
    },
  },
  plugins: [],
};
export default config;
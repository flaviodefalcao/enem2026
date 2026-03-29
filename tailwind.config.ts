import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/data/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#2A4E7A",
        sand: "#FFFFFF",
        clay: "#6AA5E8",
        gold: "#6AA5E8",
        mist: "#F5F9FF",
      },
      boxShadow: {
        card: "0 24px 60px rgba(42, 78, 122, 0.10)",
      },
      fontFamily: {
        sans: ['"Avenir Next"', '"Segoe UI"', "sans-serif"],
        display: ['"Iowan Old Style"', '"Palatino Linotype"', "serif"],
      },
      backgroundImage: {
        "page-glow":
          "radial-gradient(circle at top left, rgba(106,165,232,0.18), transparent 28%), radial-gradient(circle at top right, rgba(214,230,255,0.85), transparent 34%), linear-gradient(180deg, #ffffff 0%, #f5f9ff 100%)",
      },
    },
  },
  plugins: [],
};

export default config;

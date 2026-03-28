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
        ink: "#102033",
        sand: "#f5efe6",
        clay: "#d96c3f",
        gold: "#e2b95b",
        mist: "#eef5fb",
      },
      boxShadow: {
        card: "0 24px 60px rgba(16, 32, 51, 0.08)",
      },
      fontFamily: {
        sans: ['"Avenir Next"', '"Segoe UI"', "sans-serif"],
        display: ['"Iowan Old Style"', '"Palatino Linotype"', "serif"],
      },
      backgroundImage: {
        "page-glow":
          "radial-gradient(circle at top left, rgba(226,185,91,0.24), transparent 28%), linear-gradient(180deg, #f7f2ea 0%, #eef5fb 100%)",
      },
    },
  },
  plugins: [],
};

export default config;

/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
/* global module, require */
const path = require("node:path");

module.exports = {
  content: [path.join(__dirname, "index.html"), path.join(__dirname, "src/**/*.{ts,tsx}")],
  theme: {
    extend: {
      colors: {
        ink: "#0B1220",
        midnight: "#111A2E",
        cloud: "#F7F9FC",
        "abuja-blue": "#246BFD",
        "abuja-purple": "#6B5CFF",
        mint: "#DDF8EF",
        amber: "#F6B84B",
      },
      boxShadow: {
        card: "0 18px 50px rgba(15, 26, 50, 0.08)",
        lift: "0 18px 34px rgba(36, 107, 253, 0.18)",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Plus Jakarta Sans", "ui-sans-serif", "sans-serif"],
      },
    },
  },
  plugins: [],
};

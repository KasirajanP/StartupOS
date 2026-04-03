/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        mist: "#eef2ff",
        clay: "#cbd5e1",
        ember: "#c2410c",
        pine: "#14532d",
        skyglass: "#dbeafe",
      },
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        panel: "0 24px 60px -30px rgba(15, 23, 42, 0.35)",
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top left, rgba(194, 65, 12, 0.18), transparent 28%), radial-gradient(circle at bottom right, rgba(37, 99, 235, 0.16), transparent 32%)",
      },
    },
  },
  plugins: [],
};

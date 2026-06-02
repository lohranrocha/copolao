import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pitch: "#0F7B4B",
        night: "#111827",
        trophy: "#D7A129",
        coral: "#E45D45",
        skyline: "#E7F0F7"
      },
      boxShadow: {
        soft: "0 16px 40px rgba(17, 24, 39, 0.10)"
      }
    }
  },
  plugins: []
} satisfies Config;

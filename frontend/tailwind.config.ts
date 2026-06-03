import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pitch: "#0F7B4B",
        night: "#111827",
        trophy: "#D7A129",
        gold: "#D6A437",
        obsidian: "#080808",
        graphite: "#171717",
        champagne: "#F4EFE2",
        felt: "#121318",
        limebet: "#21F766",
        mintbet: "#00D98B",
        ink: "#050506",
        steel: "#8B95A8",
        coral: "#E45D45",
        skyline: "#E7F0F7"
      },
      boxShadow: {
        soft: "0 16px 40px rgba(17, 24, 39, 0.10)",
        glow: "0 0 40px rgba(33, 247, 102, 0.22)"
      }
    }
  },
  plugins: []
} satisfies Config;

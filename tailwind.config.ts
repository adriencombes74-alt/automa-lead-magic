import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      fontFamily: {
        display: ["General Sans", "DM Sans", "system-ui", "sans-serif"],
        body: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: "hsl(var(--surface))",
        neutral: "hsl(var(--neutral))",
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        "card-hover": "0 8px 30px rgba(0,0,0,0.08)",
        "primary-glow": "0 4px 12px rgba(99,102,241,0.35)",
        "ring-focus": "0 0 0 3px rgba(99,102,241,0.12)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "aurora-drift": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)", filter: "hue-rotate(0deg)" },
          "50%": { transform: "translate3d(40px, -30px, 0) scale(1.08)", filter: "hue-rotate(-8deg)" },
        },
        "aurora-drift-alt": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1.05)", filter: "hue-rotate(0deg)" },
          "50%": { transform: "translate3d(-50px, 25px, 0) scale(0.95)", filter: "hue-rotate(8deg)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.7", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.15)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "halo-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(99, 102, 241, 0.45), 0 4px 12px rgba(99, 102, 241, 0.35)" },
          "50%": { boxShadow: "0 0 0 14px rgba(99, 102, 241, 0), 0 4px 18px rgba(99, 102, 241, 0.55)" },
        },
        "dot-ping": {
          "0%": { boxShadow: "0 0 0 0 rgba(16, 185, 129, 0.6)" },
          "70%": { boxShadow: "0 0 0 8px rgba(16, 185, 129, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(16, 185, 129, 0)" },
        },
        "gradient-sweep": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "underline-draw": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        "blink-caret": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "float-y": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-2px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.5s ease-out both",
        "aurora-drift": "aurora-drift 18s ease-in-out infinite",
        "aurora-drift-alt": "aurora-drift-alt 22s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
        "shimmer": "shimmer 6s linear infinite",
        "halo-pulse": "halo-pulse 3s ease-in-out infinite",
        "dot-ping": "dot-ping 2.4s ease-out infinite",
        "gradient-sweep": "gradient-sweep 1.5s linear",
        "underline-draw": "underline-draw 700ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "blink-caret": "blink-caret 1s step-end infinite",
        "float-y": "float-y 4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

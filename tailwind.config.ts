import type { Config } from "tailwindcss";
import { designTokens } from "./src/config/design-tokens";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: designTokens.color.primary,
        "primary-dark": designTokens.color.primaryDark,
        "primary-light": designTokens.color.primaryLight,
        surface: designTokens.color.surface,
        app: {
          bg: designTokens.color.background,
          text: designTokens.color.textPrimary,
          muted: designTokens.color.textSecondary,
          border: designTokens.color.border,
        },
        warning: designTokens.color.warning,
        danger: designTokens.color.danger,
        success: designTokens.color.success,
        info: {
          bg: designTokens.color.infoBg,
          text: designTokens.color.infoText,
        },
      },
      fontFamily: {
        sans: ["var(--font-app-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: designTokens.radius.sm,
        md: designTokens.radius.md,
        lg: designTokens.radius.lg,
        pill: designTokens.radius.pill,
      },
      boxShadow: {
        card: designTokens.shadow.card,
        raised: designTokens.shadow.raised,
      },
    },
  },
  plugins: [],
};

export default config;

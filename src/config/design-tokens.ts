/**
 * Theme colours from "Option 2 — Modern Sage" in "AGRO — WEBSITE COLOUR OPTIONS.jpeg"
 * (project root). Layout and typography still follow references/ui-theme.png.
 *
 * Status colours (success, warning, danger, info) are deliberately kept independent of
 * the theme palette so delivery statuses stay visually distinct.
 */
export const designTokens = {
  color: {
    primary: "#2E7D32",
    primaryDark: "#1B5E20",
    primaryLight: "#E3F2E5",
    background: "#F5FDF7",
    surface: "#FFFFFF",
    textPrimary: "#1F2D21",
    textSecondary: "#667085",
    border: "#E8F1EA",
    warning: "#B5742A",
    danger: "#B23B3B",
    success: "#3F6B35",
    infoBg: "#DBEAFE",
    infoText: "#1E40AF",
  },
  font: {
    // Close visual substitute for the rounded geometric sans seen in the reference
    // image. Not confirmed as the brand's actual licensed typeface.
    family: "var(--font-app-sans)",
  },
  radius: {
    sm: "8px",
    md: "14px",
    lg: "22px",
    pill: "999px",
  },
  shadow: {
    card: "0 2px 10px rgba(31, 45, 33, 0.08)",
    raised: "0 6px 20px rgba(31, 45, 33, 0.12)",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },
} as const;

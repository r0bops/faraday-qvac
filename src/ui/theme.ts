import { useSettingsStore, type ThemeName } from "../store/settings";

export const colors = {
  bg: "#0a0a0a",
  surface: "#141414",
  surfaceAlt: "#1c1c1c",
  border: "#2a2a2a",
  text: "#e4e4e4",
  textMuted: "#888888",
  accent: "#d4a853",
  accentMuted: "#8b6914",
  danger: "#e05555",
  dangerMuted: "#6b2020",
  success: "#4a9e5c",
  successMuted: "#1e4428",
  warning: "#d4a853",
  overlay: "rgba(0,0,0,0.7)",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  heading: {
    fontSize: 28,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 20,
    fontWeight: "600" as const,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 13,
    fontWeight: "400" as const,
    color: colors.textMuted,
  },
  mono: {
    fontSize: 14,
    fontFamily: "monospace" as const,
    lineHeight: 20,
  },
};

export function getTheme() {
  return { colors, spacing, typography };
}

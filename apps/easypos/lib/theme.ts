import { DefaultTheme, type Theme } from "@react-navigation/native";

// ── Raw brand palette ──────────────────────────────────────────────
export const BRAND = {
  brand:    "#00B25A",
  darkest:  "#2D313F",
  dark:     "#5C6277",
  mid:      "#B4BEC5",
  light:    "#D9E3E9",
  lightest: "#FFFFFF",
  yellow:   "#F59E0B",
  orange:   "#F97316",
  red:      "#EF4444",
} as const;

// ── Semantic theme tokens ──────────────────────────────────────────
export const THEME = {
  light: {
    background:         "hsl(0 0% 100%)",
    foreground:         "hsl(228 17% 21%)",
    card:               "hsl(0 0% 100%)",
    cardForeground:     "hsl(228 17% 21%)",
    popover:            "hsl(0 0% 100%)",
    popoverForeground:  "hsl(228 17% 21%)",
    primary:            "hsl(149 100% 35%)",
    primaryForeground:  "hsl(0 0% 100%)",
    secondary:          "hsl(38 92% 50%)",
    secondaryForeground:"hsl(228 17% 21%)",
    muted:              "hsl(203 24% 88%)",
    mutedForeground:    "hsl(228 13% 41%)",
    accent:             "hsl(203 24% 88%)",
    accentForeground:   "hsl(228 17% 21%)",
    destructive:        "hsl(0 84% 60%)",
    warning:            "hsl(28 96% 55%)",
    border:             "hsl(203 24% 88%)",
    input:              "hsl(203 24% 88%)",
    ring:               "hsl(149 100% 35%)",
  },
} as const;

export const NAV_THEME: Record<"light", Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background:   THEME.light.background,
      border:       THEME.light.border,
      card:         THEME.light.card,
      notification: THEME.light.destructive,
      primary:      THEME.light.primary,
      text:         THEME.light.foreground,
    },
  },
};

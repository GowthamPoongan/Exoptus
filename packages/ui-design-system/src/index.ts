/**
 * @exoptus/ui-design-system
 *
 * Shared UI components and design tokens for EXOPTUS apps
 * Follows the premium, calm UX design principles
 */

// Design Tokens
export const colors = {
  // Primary Colors
  primary: {
    50: "#f0f5ff",
    100: "#e0ebff",
    200: "#c7d7fe",
    300: "#a4bdfc",
    400: "#7a99f8",
    500: "#5570f0",
    600: "#4152e4",
    700: "#3640ca",
    800: "#2f37a3",
    900: "#2b3381",
  },
  // Neutrals for dark theme
  neutral: {
    50: "#fafafa",
    100: "#f4f4f5",
    200: "#e4e4e7",
    300: "#d4d4d8",
    400: "#a1a1aa",
    500: "#71717a",
    600: "#52525b",
    700: "#3f3f46",
    800: "#27272a",
    900: "#18181b",
    950: "#0a0a0b",
  },
  // Accent colors
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 24,
  full: 9999,
} as const;

export const typography = {
  fontFamily: {
    regular: "Inter-Regular",
    medium: "Inter-Medium",
    semibold: "Inter-SemiBold",
    bold: "Inter-Bold",
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  },
} as const;

// Re-export types
export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Typography = typeof typography;

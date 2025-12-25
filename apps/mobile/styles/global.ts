// Global styles for EXOPTUS app
import { StyleSheet } from "react-native";

export const globalStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeArea: {
    flex: 1,
  },

  // Typography
  heading1: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1E293B",
    letterSpacing: -0.5,
  },
  heading2: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1E293B",
    letterSpacing: -0.3,
  },
  heading3: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1E293B",
  },
  bodyLarge: {
    fontSize: 18,
    fontWeight: "400",
    color: "#64748B",
    lineHeight: 28,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: "400",
    color: "#64748B",
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: "400",
    color: "#94A3B8",
    lineHeight: 20,
  },

  // Shadows
  shadowSm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  shadowMd: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  shadowLg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
});

// Animation timing configurations
export const animationConfig = {
  // Timing for smooth animations
  fast: 150,
  normal: 300,
  slow: 500,

  // Spring configurations for natural feel
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },

  // Gentle spring for subtle movements
  gentleSpring: {
    damping: 20,
    stiffness: 100,
    mass: 1,
  },
};

// Color palette (matching tailwind.config.js)
export const colors = {
  primary: {
    DEFAULT: "#2563EB",
    light: "#3B82F6",
    dark: "#1D4ED8",
  },
  secondary: {
    DEFAULT: "#8B5CF6",
    light: "#A78BFA",
    dark: "#7C3AED",
  },
  accent: {
    DEFAULT: "#EC4899",
    light: "#F472B6",
    dark: "#DB2777",
  },
  background: {
    DEFAULT: "#FFFFFF",
    soft: "#F8FAFC",
    muted: "#F1F5F9",
  },
  text: {
    DEFAULT: "#1E293B",
    secondary: "#64748B",
    muted: "#94A3B8",
  },
};

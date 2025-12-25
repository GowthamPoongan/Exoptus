/**
 * Glass Card Component
 *
 * A reusable glassmorphism card component for EXOPTUS dark theme.
 * Features frosted glass effect with subtle blur and glow.
 *
 * UX Intent:
 * - Premium, liquid-glass aesthetic
 * - Subtle depth without harsh shadows
 * - Consistent glass styling across app
 */

import React from "react";
import { View, StyleSheet, ViewStyle, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: "light" | "medium" | "heavy";
  glowColor?: string;
  borderRadius?: number;
  padding?: number;
  noPadding?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = "medium",
  glowColor,
  borderRadius = 20,
  padding = 16,
  noPadding = false,
}) => {
  const getIntensityValue = () => {
    switch (intensity) {
      case "light":
        return 20;
      case "heavy":
        return 60;
      default:
        return 40;
    }
  };

  const getBackgroundOpacity = () => {
    switch (intensity) {
      case "light":
        return 0.08;
      case "heavy":
        return 0.18;
      default:
        return 0.12;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius,
          ...(glowColor && {
            shadowColor: glowColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
          }),
        },
        style,
      ]}
    >
      {Platform.OS === "ios" ? (
        <BlurView
          intensity={getIntensityValue()}
          tint="dark"
          style={[
            styles.blurView,
            { borderRadius, padding: noPadding ? 0 : padding },
          ]}
        >
          <View style={styles.gradientOverlay}>
            <LinearGradient
              colors={[
                `rgba(255, 255, 255, ${getBackgroundOpacity()})`,
                `rgba(255, 255, 255, ${getBackgroundOpacity() * 0.5})`,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius }]}
            />
          </View>
          {children}
        </BlurView>
      ) : (
        <View
          style={[
            styles.androidFallback,
            {
              borderRadius,
              padding: noPadding ? 0 : padding,
              backgroundColor: `rgba(30, 30, 46, ${
                getBackgroundOpacity() + 0.7
              })`,
            },
          ]}
        >
          <LinearGradient
            colors={[
              `rgba(255, 255, 255, ${getBackgroundOpacity()})`,
              `rgba(255, 255, 255, ${getBackgroundOpacity() * 0.3})`,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius }]}
          />
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  blurView: {
    overflow: "hidden",
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  androidFallback: {
    overflow: "hidden",
  },
});

export default GlassCard;

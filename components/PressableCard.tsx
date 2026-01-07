/**
 * Pressable Card Component
 *
 * A reusable card with proper touch feedback including:
 * - Scale animation on press
 * - Opacity change
 * - Haptic feedback
 *
 * This solves the "looks premium, interactions feel cheap" problem.
 */

import React, { useCallback } from "react";
import {
  Pressable,
  PressableProps,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableCardProps extends Omit<PressableProps, "style"> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  hapticFeedback?: "light" | "medium" | "heavy" | "none";
  scaleAmount?: number;
  activeOpacity?: number;
}

export const PressableCard: React.FC<PressableCardProps> = ({
  children,
  style,
  onPress,
  disabled = false,
  hapticFeedback = "light",
  scaleAmount = 0.98,
  activeOpacity = 0.9,
  ...props
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(scaleAmount, {
      damping: 15,
      stiffness: 400,
    });
    opacity.value = withTiming(activeOpacity, { duration: 100 });

    if (hapticFeedback !== "none") {
      const feedbackStyle = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      }[hapticFeedback];
      Haptics.impactAsync(feedbackStyle);
    }
  }, [hapticFeedback, scaleAmount, activeOpacity]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 400,
    });
    opacity.value = withTiming(1, { duration: 100 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[styles.base, animatedStyle, style] as StyleProp<ViewStyle>}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
};

// Preset variants for common card types
export const PressableActionCard: React.FC<PressableCardProps> = (props) => (
  <PressableCard
    hapticFeedback="medium"
    scaleAmount={0.97}
    {...props}
    style={[styles.actionCard, props.style] as StyleProp<ViewStyle>}
  />
);

export const PressableMenuItem: React.FC<PressableCardProps> = (props) => (
  <PressableCard
    hapticFeedback="light"
    scaleAmount={0.99}
    activeOpacity={0.7}
    {...props}
    style={[styles.menuItem, props.style] as StyleProp<ViewStyle>}
  />
);

const styles = StyleSheet.create({
  base: {
    // Base styles
  },
  actionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  menuItem: {
    backgroundColor: "transparent",
  },
});

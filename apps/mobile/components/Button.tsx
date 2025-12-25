/**
 * Primary Button Component
 *
 * A versatile, animated button component for EXOPTUS.
 * Supports different variants, sizes, and loading states.
 *
 * UX Intent:
 * - Clear visual hierarchy
 * - Subtle press animations for tactile feedback
 * - Loading state to prevent double-taps
 */

import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  iconPosition = "left",
  style,
  textStyle,
  fullWidth = true,
}) => {
  // Animation value for press feedback
  const scale = useSharedValue(1);

  // Animated style for smooth press effect
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Handle press in - subtle scale down
  const handlePressIn = () => {
    scale.value = withSpring(0.97, {
      damping: 15,
      stiffness: 400,
    });
  };

  // Handle press out - bounce back
  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 400,
    });
  };

  // Get styles based on variant
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: disabled ? "#93C5FD" : "#2563EB",
        };
      case "secondary":
        return {
          backgroundColor: disabled ? "#C4B5FD" : "#8B5CF6",
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: 2,
          borderColor: disabled ? "#CBD5E1" : "#1E293B",
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
        };
      default:
        return {
          backgroundColor: "#2563EB",
        };
    }
  };

  // Get text styles based on variant
  const getTextStyles = (): TextStyle => {
    switch (variant) {
      case "primary":
      case "secondary":
        return {
          color: "#FFFFFF",
        };
      case "outline":
        return {
          color: disabled ? "#94A3B8" : "#1E293B",
        };
      case "ghost":
        return {
          color: disabled ? "#94A3B8" : "#2563EB",
        };
      default:
        return {
          color: "#FFFFFF",
        };
    }
  };

  // Get size styles
  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case "sm":
        return {
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 10,
        };
      case "md":
        return {
          paddingVertical: 14,
          paddingHorizontal: 24,
          borderRadius: 14,
        };
      case "lg":
        return {
          paddingVertical: 18,
          paddingHorizontal: 32,
          borderRadius: 16,
        };
      default:
        return {
          paddingVertical: 14,
          paddingHorizontal: 24,
          borderRadius: 14,
        };
    }
  };

  // Get text size
  const getTextSize = (): TextStyle => {
    switch (size) {
      case "sm":
        return { fontSize: 14 };
      case "md":
        return { fontSize: 16 };
      case "lg":
        return { fontSize: 18 };
      default:
        return { fontSize: 16 };
    }
  };

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.9}
      style={[
        styles.button,
        getVariantStyles(),
        getSizeStyles(),
        fullWidth && styles.fullWidth,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "outline" || variant === "ghost" ? "#2563EB" : "#FFFFFF"
          }
          size="small"
        />
      ) : (
        <>
          {icon && iconPosition === "left" && icon}
          <Text
            style={[
              styles.text,
              getTextStyles(),
              getTextSize(),
              icon && iconPosition === "left" ? { marginLeft: 8 } : undefined,
              icon && iconPosition === "right" ? { marginRight: 8 } : undefined,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === "right" && icon}
        </>
      )}
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    // Shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fullWidth: {
    width: "100%",
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
});

export default Button;

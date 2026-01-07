/**
 * Back Button Component
 *
 * A consistent back navigation button used across screens.
 * Features subtle press animation.
 *
 * UX Intent:
 * - Always accessible, always visible
 * - Clear affordance for navigation
 */

import React from "react";
import {
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Svg, Path } from "react-native-svg";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface BackButtonProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  color?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onPress,
  style,
  color = "#1E293B",
}) => {
  const router = useRouter();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.7}
      style={[styles.button, animatedStyle, style]}
    >
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M15 18L9 12L15 6"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    // Subtle shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default BackButton;

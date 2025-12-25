/**
 * Animated Loader Component
 *
 * A beautiful loading indicator for async operations.
 * Used during verification, evaluation, etc.
 *
 * UX Intent:
 * - Calming, not stressful
 * - Indicates progress without being annoying
 * - Matches the premium feel of the app
 */

import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";

interface AnimatedLoaderProps {
  size?: "sm" | "md" | "lg";
  color?: string;
}

export const AnimatedLoader: React.FC<AnimatedLoaderProps> = ({
  size = "md",
  color = "#2563EB",
}) => {
  // Get dimensions based on size
  const getDimensions = () => {
    switch (size) {
      case "sm":
        return { container: 40, dot: 8 };
      case "md":
        return { container: 60, dot: 12 };
      case "lg":
        return { container: 80, dot: 16 };
      default:
        return { container: 60, dot: 12 };
    }
  };

  const dimensions = getDimensions();

  // Animation values for three dots
  const dot1Scale = useSharedValue(1);
  const dot2Scale = useSharedValue(1);
  const dot3Scale = useSharedValue(1);

  const dot1Opacity = useSharedValue(0.3);
  const dot2Opacity = useSharedValue(0.3);
  const dot3Opacity = useSharedValue(0.3);

  useEffect(() => {
    const duration = 400;
    const delay = 150;

    // Staggered pulsing animation
    dot1Scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    dot1Opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    dot2Scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
    dot2Opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );

    dot3Scale.value = withDelay(
      delay * 2,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
    dot3Opacity.value = withDelay(
      delay * 2,
      withRepeat(
        withSequence(
          withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedDot1Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot1Scale.value }],
    opacity: dot1Opacity.value,
  }));

  const animatedDot2Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot2Scale.value }],
    opacity: dot2Opacity.value,
  }));

  const animatedDot3Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot3Scale.value }],
    opacity: dot3Opacity.value,
  }));

  return (
    <View style={[styles.container, { width: dimensions.container }]}>
      <Animated.View
        style={[
          styles.dot,
          {
            width: dimensions.dot,
            height: dimensions.dot,
            borderRadius: dimensions.dot / 2,
            backgroundColor: color,
          },
          animatedDot1Style,
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            width: dimensions.dot,
            height: dimensions.dot,
            borderRadius: dimensions.dot / 2,
            backgroundColor: color,
          },
          animatedDot2Style,
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            width: dimensions.dot,
            height: dimensions.dot,
            borderRadius: dimensions.dot / 2,
            backgroundColor: color,
          },
          animatedDot3Style,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    // Base styles, dimensions set inline
  },
});

export default AnimatedLoader;

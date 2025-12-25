/**
 * Animated Logo Component
 *
 * The EXOPTUS logo with compass animation.
 * Can be used on splash/welcome screens.
 *
 * UX Intent:
 * - Creates a memorable first impression
 * - Subtle animation that doesn't distract
 * - Communicates "navigation" and "guidance"
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
import { Svg, Path, Circle, G } from "react-native-svg";

const AnimatedG = Animated.createAnimatedComponent(G);

interface AnimatedLogoProps {
  size?: number;
  color?: string;
  animate?: boolean;
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({
  size = 120,
  color = "#FFFFFF",
  animate = true,
}) => {
  // Rotation animation for compass needle
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Entry animation
    opacity.value = withTiming(1, { duration: 600 });
    scale.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.back(1.5)),
    });

    // Subtle continuous rotation for compass feel
    if (animate) {
      rotation.value = withDelay(
        800,
        withRepeat(
          withSequence(
            withTiming(10, {
              duration: 2000,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(-10, {
              duration: 2000,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        )
      );
    }
  }, [animate]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const animatedNeedleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* Outer Circle */}
        <Circle
          cx="50"
          cy="50"
          r="45"
          stroke={color}
          strokeWidth="2"
          fill="none"
        />

        {/* Compass Points */}
        <G>
          {/* North */}
          <Path
            d="M50 10 L50 20"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* East */}
          <Path
            d="M90 50 L80 50"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* South */}
          <Path
            d="M50 90 L50 80"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* West */}
          <Path
            d="M10 50 L20 50"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </G>

        {/* Compass Needle - Arrow pointing up-right */}
        <Animated.View style={[styles.needleContainer, animatedNeedleStyle]}>
          <Svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            style={StyleSheet.absoluteFill}
          >
            <G>
              {/* Main arrow shaft */}
              <Path
                d="M50 50 L70 30"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Arrow head */}
              <Path
                d="M65 30 L70 30 L70 35"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              {/* Secondary line */}
              <Path
                d="M50 50 L35 65"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.5"
              />
            </G>
          </Svg>
        </Animated.View>

        {/* Center dot */}
        <Circle cx="50" cy="50" r="4" fill={color} />

        {/* Inner decorative circle */}
        <Circle
          cx="50"
          cy="50"
          r="25"
          stroke={color}
          strokeWidth="1"
          fill="none"
          opacity="0.3"
        />
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  needleContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
});

export default AnimatedLogo;

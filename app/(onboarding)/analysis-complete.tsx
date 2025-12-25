import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

/**
 * Screen 9: Analysis Complete
 *
 * Transition moment - professional completion confirmation
 * - Space background with stars
 * - Minimal icon animation
 * - Professional messaging
 * - No back button (forward-only)
 */

export default function AnalysisComplete() {
  const router = useRouter();

  const iconScale = useSharedValue(0);
  const iconOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  // Generate random stars
  const stars = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.8 + 0.2,
    }));
  }, []);

  useEffect(() => {
    // Staggered reveal animations
    iconOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    iconScale.value = withDelay(
      200,
      withSpring(1, { damping: 12, stiffness: 80 })
    );
    glowOpacity.value = withDelay(300, withTiming(0.6, { duration: 800 }));
    textOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    buttonOpacity.value = withDelay(1000, withTiming(1, { duration: 500 }));
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: interpolate(glowOpacity.value, [0, 1], [0.8, 1.2]) }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [
      { translateY: interpolate(textOpacity.value, [0, 1], [20, 0]) },
    ],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [
      { translateY: interpolate(buttonOpacity.value, [0, 1], [30, 0]) },
    ],
  }));

  const handleContinue = () => {
    router.push("/(onboarding)/analysis-results" as any);
  };

  return (
    <View style={styles.container}>
      {/* Space Background */}
      <LinearGradient
        colors={["#0D0D1A", "#1A1A2E", "#16213E", "#0D0D1A"]}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Stars */}
      {stars.map((star) => (
        <View
          key={star.id}
          style={[
            styles.star,
            {
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
            },
          ]}
        />
      ))}

      {/* Center Content */}
      <View style={styles.centerContent}>
        {/* Glowing Icon */}
        <View style={styles.iconContainer}>
          <Animated.View style={[styles.iconGlow, glowStyle]} />
          <Animated.View style={[styles.iconCircle, iconStyle]}>
            <LinearGradient
              colors={["#A855F7", "#7C3AED", "#6D28D9"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.iconText}>✓</Text>
          </Animated.View>
        </View>

        {/* Text Content */}
        <Animated.View style={[styles.textContainer, textStyle]}>
          <Text style={styles.title}>Analysis Complete</Text>
          <Text style={styles.subtitle}>
            Here's how your profile compares{"\n"}and where you can grow
          </Text>
        </Animated.View>

        {/* Motivational Quote */}
        <Animated.View style={[styles.quoteContainer, textStyle]}>
          <Text style={styles.quoteText}>
            "The future belongs to those who{"\n"}believe in the beauty of their
            dreams."
          </Text>
          <Text style={styles.quoteAuthor}>— Eleanor Roosevelt</Text>
        </Animated.View>
      </View>

      {/* Continue Button */}
      <Animated.View style={[styles.buttonContainer, buttonStyle]}>
        <TouchableOpacity onPress={handleContinue} activeOpacity={0.9}>
          <LinearGradient
            colors={["#A855F7", "#7C3AED"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D1A",
  },
  star: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGlow: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#7C3AED",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  iconText: {
    fontSize: 36,
    color: "#FFFFFF",
    fontWeight: "300",
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    lineHeight: 24,
  },
  quoteContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderLeftWidth: 3,
    borderLeftColor: "#7C3AED",
    marginTop: 20,
  },
  quoteText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    fontStyle: "italic",
    lineHeight: 26,
    textAlign: "left",
  },
  quoteAuthor: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.4)",
    marginTop: 12,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 50,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

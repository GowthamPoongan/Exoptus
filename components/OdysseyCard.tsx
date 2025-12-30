/**
 * Odyssey AI Card Component
 *
 * Prominent glass card to access the Odyssey AI assistant.
 * Features rotating logo and soft gradient background with sparkle textures.
 *
 * UX Intent:
 * - Calm, inviting presence
 * - Not chatty or pushy
 * - Premium feel with rotating logo animation
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import Svg, {
  Path,
  Circle,
  G,
  Defs,
  RadialGradient,
  Stop,
} from "react-native-svg";

interface OdysseyCardProps {
  onPress: () => void;
}

// Sparkle/Star Icon
const SparkleIcon = ({
  size = 20,
  color = "#FFD700",
}: {
  size?: number;
  color?: string;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
  </Svg>
);

// Odyssey Rotating Logo Component
const OdysseyLogo = () => {
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  React.useEffect(() => {
    // Continuous rotation animation
    rotate.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );
    // Subtle breathing scale effect
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotate.value}deg` },
        { scale: scale.value },
      ] as const,
    };
  });

  return (
    <View style={styles.logoContainer}>
      {/* Outer glow effect */}
      <View style={styles.logoGlow} />

      {/* Rotating logo with image */}
      <Animated.View style={[styles.logoWrapper, animatedStyle]}>
        <Image
          source={require("../assets/images/odyssey-avatar.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};
export const OdysseyCard: React.FC<OdysseyCardProps> = ({ onPress }) => {
  const sparkleOpacity1 = useSharedValue(0.3);
  const sparkleOpacity2 = useSharedValue(0.6);
  const sparkleOpacity3 = useSharedValue(0.4);

  React.useEffect(() => {
    sparkleOpacity1.value = withRepeat(
      withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    sparkleOpacity2.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    sparkleOpacity3.value = withRepeat(
      withTiming(0.9, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const sparkle1Style = useAnimatedStyle(() => ({
    opacity: sparkleOpacity1.value,
  }));

  const sparkle2Style = useAnimatedStyle(() => ({
    opacity: sparkleOpacity2.value,
  }));

  const sparkle3Style = useAnimatedStyle(() => ({
    opacity: sparkleOpacity3.value,
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={styles.container}
    >
      <LinearGradient
        colors={["#F9A8D4", "#FBCFE8", "#FDF2F8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Sparkles */}
        <Animated.View style={[styles.sparkle, styles.sparkle1, sparkle1Style]}>
          <SparkleIcon size={16} color="#EC4899" />
        </Animated.View>
        <Animated.View style={[styles.sparkle, styles.sparkle2, sparkle2Style]}>
          <SparkleIcon size={12} color="#F472B6" />
        </Animated.View>
        <Animated.View style={[styles.sparkle, styles.sparkle3, sparkle3Style]}>
          <SparkleIcon size={14} color="#EC4899" />
        </Animated.View>
        <Animated.View style={[styles.sparkle, styles.sparkle4, sparkle1Style]}>
          <SparkleIcon size={10} color="#F9A8D4" />
        </Animated.View>

        {/* Content */}
        <View style={styles.content}>
          {/* Rotating Odyssey Logo */}
          <OdysseyLogo />

          {/* Text */}
          <View style={styles.textContainer}>
            <Text style={styles.tryText}>Try</Text>
            <Text style={styles.odysseyText}>Odyssey</Text>
            <Text style={styles.subtitleText}>your AI assistant</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#EC4899",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  gradient: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    minHeight: 140,
  },
  sparkle: {
    position: "absolute",
  },
  sparkle1: {
    top: 20,
    right: 30,
  },
  sparkle2: {
    top: 40,
    right: 80,
  },
  sparkle3: {
    bottom: 30,
    right: 40,
  },
  sparkle4: {
    top: 60,
    right: 20,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  // Rotating Logo styles
  logoContainer: {
    width: 75,
    height: 75,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  logoGlow: {
    position: "absolute",
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: "rgba(139, 92, 246, 0.35)",
  },
  logoWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: "hidden",
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
    // Border glow
    borderWidth: 2,
    borderColor: "rgba(139, 92, 246, 0.5)",
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  textContainer: {
    flex: 1,
  },
  tryText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#831843",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  odysseyText: {
    fontSize: 36,
    fontWeight: "700",
    color: "#831843",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
    marginTop: -4,
  },
  subtitleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#BE185D",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
    marginTop: 4,
  },
});

export default OdysseyCard;

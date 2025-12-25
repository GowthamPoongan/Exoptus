/**
 * Odyssey AI Card Component
 *
 * Prominent glass card to access the Odyssey AI assistant.
 * Features soft gradient background with sparkle textures.
 *
 * UX Intent:
 * - Calm, inviting presence
 * - Not chatty or pushy
 * - Premium feel with subtle animation
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

// Odyssey Logo/Orb Component
const OdysseyOrb = () => {
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  React.useEffect(() => {
    rotate.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }, { scale: scale.value }],
  }));

  return (
    <View style={styles.orbContainer}>
      {/* Glow effect */}
      <View style={styles.orbGlow} />

      {/* Orb */}
      <Animated.View style={[styles.orb, animatedStyle]}>
        <LinearGradient
          colors={["#EC4899", "#8B5CF6", "#3B82F6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.orbGradient}
        >
          <Svg width={40} height={40} viewBox="0 0 24 24">
            <Defs>
              <RadialGradient id="starGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            {/* Star shape */}
            <Path
              d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10L12 2Z"
              fill="url(#starGlow)"
              opacity={0.9}
            />
          </Svg>
        </LinearGradient>
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
          {/* Odyssey Orb */}
          <OdysseyOrb />

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
  orbContainer: {
    width: 70,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  orbGlow: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(139, 92, 246, 0.3)",
  },
  orb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
  },
  orbGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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

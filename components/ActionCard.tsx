/**
 * Action Card Component
 *
 * Cards for displaying actionable items on dashboard.
 * Features one action, one sentence, one CTA.
 *
 * UX Intent:
 * - Clear, focused calls to action
 * - Not overwhelming - one thing at a time
 * - Premium glass aesthetic
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import Svg, { Path, Circle } from "react-native-svg";
import { GlassCard } from "./GlassCard";

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  ctaText?: string;
  onPress: () => void;
  type?: "default" | "highlight" | "warning";
}

// Arrow Right Icon
const ArrowRightIcon = ({
  color = "#3B82F6",
  size = 20,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 12H19"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 5L19 12L12 19"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Preset Icons
export const LightbulbIcon = ({
  color = "#FBBF24",
  size = 24,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 21H15"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 3C8.68629 3 6 5.68629 6 9C6 11.2208 7.2066 13.1599 9 14.1973V17C9 17.5523 9.44772 18 10 18H14C14.5523 18 15 17.5523 15 17V14.1973C16.7934 13.1599 18 11.2208 18 9C18 5.68629 15.3137 3 12 3Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ChecklistIcon = ({
  color = "#10B981",
  size = 24,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 11L12 14L22 4"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const TrendUpIcon = ({
  color = "#8B5CF6",
  size = 24,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 6L13.5 15.5L8.5 10.5L1 18"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M17 6H23V12"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon,
  ctaText = "View",
  onPress,
  type = "default",
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const getTypeColors = () => {
    switch (type) {
      case "highlight":
        return { glow: "#3B82F6", accent: "#3B82F6" };
      case "warning":
        return { glow: "#F59E0B", accent: "#F59E0B" };
      default:
        return { glow: undefined, accent: "#3B82F6" };
    }
  };

  const colors = getTypeColors();

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.95}
      style={animatedStyle}
    >
      <GlassCard style={styles.card} glowColor={colors.glow} intensity="light">
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>{icon}</View>

          {/* Text */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          </View>

          {/* CTA */}
          <View style={styles.ctaContainer}>
            <Text style={[styles.ctaText, { color: colors.accent }]}>
              {ctaText}
            </Text>
            <ArrowRightIcon color={colors.accent} size={16} />
          </View>
        </View>
      </GlassCard>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: "#A1A1AA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
    lineHeight: 18,
  },
  ctaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
});

export default ActionCard;

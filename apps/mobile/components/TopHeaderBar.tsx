/**
 * Top Header Bar Component
 *
 * Dynamic top bar similar to Instagram.
 * Shows on scroll up, hides on scroll down.
 * Features brand text, notifications, and calendar access.
 *
 * UX Intent:
 * - Premium, unobtrusive header
 * - Quick access to notifications and calendar
 * - Smooth show/hide animations on scroll
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  SharedValue,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import Svg, { Path, Circle } from "react-native-svg";

interface TopHeaderBarProps {
  scrollY?: SharedValue<number>;
  onNotificationPress?: () => void;
  onCalendarPress?: () => void;
  notificationCount?: number;
  visible?: boolean;
}

// Bell Icon
const BellIcon = ({
  color = "#FFFFFF",
  size = 24,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Calendar Icon
const CalendarIcon = ({
  color = "#FFFFFF",
  size = 24,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 2V6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 2V6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3 10H21"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const TopHeaderBar: React.FC<TopHeaderBarProps> = ({
  scrollY,
  onNotificationPress,
  onCalendarPress,
  notificationCount = 0,
  visible = true,
}) => {
  // Animate based on visibility
  const animatedStyle = useAnimatedStyle(() => {
    if (scrollY) {
      // Hide on scroll down, show on scroll up
      const translateY = interpolate(
        scrollY.value,
        [0, 50, 100],
        [0, 0, -80],
        Extrapolation.CLAMP
      );
      return {
        transform: [{ translateY }],
        opacity: interpolate(
          scrollY.value,
          [0, 50, 100],
          [1, 1, 0],
          Extrapolation.CLAMP
        ),
      };
    }
    return {
      transform: [{ translateY: visible ? 0 : -80 }],
      opacity: visible ? 1 : 0,
    };
  });

  const HeaderContent = () => (
    <View style={styles.content}>
      {/* Brand Text */}
      <Text style={styles.brandText}>Exoptus</Text>

      {/* Right Icons */}
      <View style={styles.iconsContainer}>
        {/* Calendar */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onCalendarPress}
          activeOpacity={0.7}
        >
          <CalendarIcon color="#FFFFFF" size={22} />
        </TouchableOpacity>

        {/* Notifications */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onNotificationPress}
          activeOpacity={0.7}
        >
          <BellIcon color="#FFFFFF" size={22} />
          {notificationCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {notificationCount > 9 ? "9+" : notificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {Platform.OS === "ios" ? (
        <BlurView intensity={50} tint="dark" style={styles.blurView}>
          <LinearGradient
            colors={["rgba(10, 10, 15, 0.8)", "rgba(10, 10, 15, 0.6)"]}
            style={styles.gradient}
          >
            <HeaderContent />
          </LinearGradient>
        </BlurView>
      ) : (
        <View style={styles.androidHeader}>
          <LinearGradient
            colors={["rgba(10, 10, 15, 0.95)", "rgba(10, 10, 15, 0.85)"]}
            style={styles.gradient}
          >
            <HeaderContent />
          </LinearGradient>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: Platform.OS === "ios" ? 50 : 35,
  },
  blurView: {
    overflow: "hidden",
  },
  androidHeader: {
    overflow: "hidden",
  },
  gradient: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandText: {
    fontSize: 26,
    fontWeight: "700",
    color: "#3B82F6",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
    letterSpacing: -0.5,
  },
  iconsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#0A0A0F",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
});

export default TopHeaderBar;

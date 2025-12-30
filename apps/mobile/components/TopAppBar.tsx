/**
 * Top App Bar Component
 *
 * Premium header for Home screen with logo, notifications, and calendar.
 * Features Instagram-style scroll-to-hide behavior.
 *
 * UX Intent:
 * - Premium branding with Exoptus logo image
 * - Functional icons with real actions
 * - Smooth scroll animations
 */

import React from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import * as Haptics from "expo-haptics";

interface TopAppBarProps {
  scrollY: SharedValue<number>;
  unreadCount: number;
  onNotificationsPress: () => void;
  onCalendarPress: () => void;
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
      d="M13.73 21C13.5542 21.3031 13.3018 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
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

export const TopAppBar: React.FC<TopAppBarProps> = ({
  scrollY,
  unreadCount,
  onNotificationsPress,
  onCalendarPress,
}) => {
  // Instagram-style: hide on scroll down, show on scroll up
  const headerStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, 100],
      [0, -100],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollY.value,
      [0, 50],
      [1, 0],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  // Compact header appears when scrolled
  const compactHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [50, 100],
      [0, 1],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [50, 100],
      [-20, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const handleNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onNotificationsPress();
  };

  const handleCalendar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCalendarPress();
  };

  return (
    <>
      {/* Main Header - hides on scroll */}
      <Animated.View style={[styles.header, headerStyle]}>
        <View style={styles.headerContent}>
          {/* Logo Image */}
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/images/Exoptus-title.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Icons */}
          <View style={styles.iconsContainer}>
            {/* Calendar Icon - First (Planning) */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleCalendar}
              activeOpacity={0.7}
            >
              <CalendarIcon color="#FAFAFA" size={22} />
            </TouchableOpacity>

            {/* Notifications Icon - Second (Reactions) */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleNotifications}
              activeOpacity={0.7}
            >
              <BellIcon color="#FAFAFA" size={22} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Animated.Text style={styles.badgeText}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Animated.Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Compact Header - shows when scrolled */}
      <Animated.View style={[styles.compactHeader, compactHeaderStyle]}>
        {Platform.OS === "ios" ? (
          <BlurView intensity={80} tint="dark" style={styles.compactBlur}>
            <Image
              source={require("../assets/images/Exoptus-title.png")}
              style={styles.compactLogo}
              resizeMode="contain"
            />
          </BlurView>
        ) : (
          <View style={styles.compactAndroid}>
            <Image
              source={require("../assets/images/Exoptus-title.png")}
              style={styles.compactLogo}
              resizeMode="contain"
            />
          </View>
        )}
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoContainer: {
    flex: 1,
  },
  logoImage: {
    width: 120,
    height: 32,
    tintColor: "#3B82F6", // Blue tint to match brand
  },
  iconsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  compactHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99,
  },
  compactBlur: {
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingHorizontal: 20,
    paddingBottom: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  compactAndroid: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "rgba(10, 10, 15, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  compactLogo: {
    width: 100,
    height: 28,
    tintColor: "#3B82F6",
  },
});

export default TopAppBar;

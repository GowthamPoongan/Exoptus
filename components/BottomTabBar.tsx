/**
 * Bottom Tab Bar Component
 *
 * Premium glass navigation bar for EXOPTUS.
 * Features a cohesive glassmorphism look with uniform tab distribution.
 *
 * UX Intent:
 * - Clean, unified navigation bar
 * - Dark mode glass aesthetic
 * - Smooth, Instagram-level animations
 */

import React, { useCallback } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path, Circle, G } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { router, usePathname } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface TabItem {
  name: string;
  label: string;
  icon: (props: {
    color: string;
    size: number;
    focused: boolean;
  }) => React.ReactNode;
}

// Custom Icons as SVG components

const HomeIcon = ({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={focused ? `${color}20` : "transparent"}
    />
    <Path
      d="M9 22V12H15V22"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const RoadmapIcon = ({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 19.5C4 19.5 4 15 9 15C14 15 14 11 9 11C4 11 4 6.5 9 6.5H20"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M17 3.5L20 6.5L17 9.5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ExploreIcon = ({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle
      cx="12"
      cy="12"
      r="10"
      stroke={color}
      strokeWidth={2}
      fill={focused ? `${color}15` : "transparent"}
    />
    <Path
      d="M16.24 7.76L14.12 14.12L7.76 16.24L9.88 9.88L16.24 7.76Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={focused ? color : "transparent"}
    />
  </Svg>
);

const ResumeIcon = ({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={focused ? `${color}20` : "transparent"}
    />
    <Path
      d="M14 2V8H20"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 18H12.01"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M12 14H12.01"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M16 14H16.01"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path d="M8 14H8.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path
      d="M16 18H16.01"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path d="M8 18H8.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const ProfileIcon = ({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle
      cx="12"
      cy="7"
      r="4"
      stroke={color}
      strokeWidth={2}
      fill={focused ? `${color}30` : "transparent"}
    />
    <Path
      d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Tabs configuration
const tabs: TabItem[] = [
  { name: "home", label: "Home", icon: HomeIcon },
  { name: "roadmap", label: "Roadmap", icon: RoadmapIcon },
  { name: "explore", label: "Explore", icon: ExploreIcon },
  { name: "resume", label: "Resume", icon: ResumeIcon },
  { name: "profile", label: "Profile", icon: ProfileIcon },
];

interface BottomTabBarProps {
  visible?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Tab Item Component
const TabItem: React.FC<{
  tab: TabItem;
  isActive: boolean;
  onPress: () => void;
}> = ({ tab, isActive, onPress }) => {
  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    });
    onPress();
  }, [onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconColor = isActive ? "#3B82F6" : "#6B7280";

  return (
    <AnimatedTouchable
      style={[styles.tabItem, animatedStyle]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View
        style={[styles.iconContainer, isActive && styles.iconContainerActive]}
      >
        {tab.icon({ color: iconColor, size: 24, focused: isActive })}
      </View>
    </AnimatedTouchable>
  );
};

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  visible = true,
}) => {
  const pathname = usePathname();
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Determine active tab from pathname
  const getActiveTab = () => {
    if (pathname.includes("roadmap")) return "roadmap";
    if (pathname.includes("explore")) return "explore";
    if (pathname.includes("resume")) return "resume";
    if (pathname.includes("profile")) return "profile";
    return "home";
  };

  const activeTab = getActiveTab();

  const onTabPress = (tabName: string) => {
    const routes: Record<string, string> = {
      home: "/(main)/home",
      roadmap: "/(main)/roadmap",
      explore: "/(main)/explore",
      resume: "/(main)/resume",
      profile: "/(main)/profile",
    };
    router.replace(routes[tabName] as any);
  };

  React.useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withSpring(100, { damping: 20, stiffness: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Background bar with BlurView */}
      <View style={styles.tabBarWrapper}>
        {Platform.OS === "ios" ? (
          <BlurView intensity={40} tint="dark" style={styles.blurView}>
            <View style={styles.innerBar}>
              {tabs.map((tab) => (
                <TabItem
                  key={tab.name}
                  tab={tab}
                  isActive={activeTab === tab.name}
                  onPress={() => onTabPress(tab.name)}
                />
              ))}
            </View>
          </BlurView>
        ) : (
          <View style={styles.androidTabBar}>
            <View style={styles.innerBar}>
              {tabs.map((tab) => (
                <TabItem
                  key={tab.name}
                  tab={tab}
                  isActive={activeTab === tab.name}
                  onPress={() => onTabPress(tab.name)}
                />
              ))}
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 30 : 16,
    left: 16,
    right: 16,
    alignItems: "center",
  },
  tabBarWrapper: {
    width: "100%",
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    // Premium shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  blurView: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 32,
  },
  androidTabBar: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  innerBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    height: "100%",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  iconContainerActive: {
    backgroundColor: "#3B82F610",
  },
});

export default BottomTabBar;

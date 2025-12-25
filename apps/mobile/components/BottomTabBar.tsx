/**
 * Bottom Tab Bar Component
 *
 * Liquid-glass floating navigation bar for EXOPTUS.
 * Features smooth animations, haptic feedback, and premium glassmorphism.
 *
 * UX Intent:
 * - Career compass dial - premium and trustworthy
 * - Calm, never distracting navigation
 * - macOS Dock-like hover feel, restrained for mobile
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
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import Svg, { Path, Circle, Rect, G } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { router, usePathname } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TAB_BAR_WIDTH = SCREEN_WIDTH - 40;
const TAB_WIDTH = TAB_BAR_WIDTH / 5;

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
      strokeWidth={focused ? 2.5 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={focused ? color : "none"}
      fillOpacity={focused ? 0.2 : 0}
    />
    <Path
      d="M9 22V12H15V22"
      stroke={color}
      strokeWidth={focused ? 2.5 : 2}
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
      d="M12 2L12 22"
      stroke={color}
      strokeWidth={focused ? 2.5 : 2}
      strokeLinecap="round"
      strokeDasharray={focused ? "0" : "0"}
    />
    <Circle
      cx="12"
      cy="6"
      r="3"
      stroke={color}
      strokeWidth={focused ? 2.5 : 2}
      fill={focused ? color : "none"}
      fillOpacity={focused ? 0.3 : 0}
    />
    <Circle
      cx="12"
      cy="12"
      r="3"
      stroke={color}
      strokeWidth={focused ? 2.5 : 2}
      fill={focused ? color : "none"}
      fillOpacity={focused ? 0.5 : 0}
    />
    <Circle
      cx="12"
      cy="18"
      r="3"
      stroke={color}
      strokeWidth={focused ? 2.5 : 2}
      fill={focused ? color : "none"}
      fillOpacity={focused ? 0.7 : 0}
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
      strokeWidth={focused ? 2.5 : 2}
      fill={focused ? color : "none"}
      fillOpacity={focused ? 0.1 : 0}
    />
    <Path
      d="M16.24 7.76L14.12 14.12L7.76 16.24L9.88 9.88L16.24 7.76Z"
      stroke={color}
      strokeWidth={focused ? 2.5 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={focused ? color : "none"}
      fillOpacity={focused ? 0.3 : 0}
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
      strokeWidth={focused ? 2.5 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={focused ? color : "none"}
      fillOpacity={focused ? 0.15 : 0}
    />
    <Path
      d="M14 2V8H20"
      stroke={color}
      strokeWidth={focused ? 2.5 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 13H8"
      stroke={color}
      strokeWidth={focused ? 2.5 : 2}
      strokeLinecap="round"
    />
    <Path
      d="M16 17H8"
      stroke={color}
      strokeWidth={focused ? 2.5 : 2}
      strokeLinecap="round"
    />
    <Path
      d="M10 9H8"
      stroke={color}
      strokeWidth={focused ? 2.5 : 2}
      strokeLinecap="round"
    />
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
      cy="8"
      r="4"
      stroke={color}
      strokeWidth={focused ? 2.5 : 2}
      fill={focused ? color : "none"}
      fillOpacity={focused ? 0.3 : 0}
    />
    <Path
      d="M20 21C20 18.2386 16.4183 16 12 16C7.58172 16 4 18.2386 4 21"
      stroke={color}
      strokeWidth={focused ? 2.5 : 2}
      strokeLinecap="round"
    />
  </Svg>
);

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

const TabItem: React.FC<{
  tab: TabItem;
  isActive: boolean;
  onPress: () => void;
  index: number;
}> = ({ tab, isActive, onPress, index }) => {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (isActive) {
      scale.value = withSpring(1.05, { damping: 15, stiffness: 200 });
      translateY.value = withSpring(-3, { damping: 15, stiffness: 200 });
      glowOpacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
      glowOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePress = useCallback(() => {
    // Micro haptic feedback
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Press animation
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 }, () => {
      scale.value = withSpring(isActive ? 1.05 : 1, {
        damping: 15,
        stiffness: 200,
      });
    });

    onPress();
  }, [onPress, isActive]);

  const iconColor = isActive ? "#3B82F6" : "#71717A";

  return (
    <AnimatedTouchable
      style={[styles.tabItem, animatedStyle]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Glow effect under active tab */}
      <Animated.View style={[styles.glow, glowStyle]}>
        <LinearGradient
          colors={["rgba(59, 130, 246, 0.4)", "rgba(59, 130, 246, 0)"]}
          style={styles.glowGradient}
        />
      </Animated.View>

      {/* Icon */}
      <View style={styles.iconContainer}>
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
      <View style={styles.tabBarWrapper}>
        {Platform.OS === "ios" ? (
          <BlurView intensity={60} tint="dark" style={styles.blurView}>
            <LinearGradient
              colors={[
                "rgba(255, 255, 255, 0.12)",
                "rgba(255, 255, 255, 0.06)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.gradient}
            >
              <View style={styles.tabsContainer}>
                {tabs.map((tab, index) => (
                  <TabItem
                    key={tab.name}
                    tab={tab}
                    isActive={activeTab === tab.name}
                    onPress={() => onTabPress(tab.name)}
                    index={index}
                  />
                ))}
              </View>
            </LinearGradient>
          </BlurView>
        ) : (
          <View style={styles.androidTabBar}>
            <LinearGradient
              colors={["rgba(30, 30, 46, 0.95)", "rgba(20, 20, 35, 0.98)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.gradient}
            >
              <View style={styles.tabsContainer}>
                {tabs.map((tab, index) => (
                  <TabItem
                    key={tab.name}
                    tab={tab}
                    isActive={activeTab === tab.name}
                    onPress={() => onTabPress(tab.name)}
                    index={index}
                  />
                ))}
              </View>
            </LinearGradient>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 34 : 20,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  tabBarWrapper: {
    width: "100%",
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    // Soft ambient shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
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
  },
  gradient: {
    flex: 1,
    borderRadius: 32,
  },
  tabsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  glow: {
    position: "absolute",
    bottom: 8,
    width: 40,
    height: 20,
    borderRadius: 10,
    overflow: "hidden",
  },
  glowGradient: {
    flex: 1,
    borderRadius: 10,
  },
});

export default BottomTabBar;

/**
 * Premium Bottom Tab Bar Component
 *
 * Dock-style floating navigation bar for EXOPTUS.
 * Features white glassmorphism, subtle lift animation on active,
 * glow effects, and a bullseye target icon for Roadmap.
 *
 * UX Intent:
 * - macOS Dock-like premium feel
 * - Clean white glass blur effect
 * - Active tab lifts up with soft glow (no bounce)
 * - Career OS navigation, not a student app
 */

import React, { useCallback, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path, Circle } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { router, usePathname } from "expo-router";

interface TabItem {
  name: string;
  label: string;
  icon: (props: {
    color: string;
    size: number;
    focused: boolean;
  }) => React.ReactNode;
}

// Premium Home Icon
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
      strokeWidth={focused ? 2 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={focused ? color : "none"}
      fillOpacity={focused ? 0.15 : 0}
    />
    <Path
      d="M9 22V12H15V22"
      stroke={color}
      strokeWidth={focused ? 2 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Target/Bullseye Icon for Roadmap (replacing the old circles)
const TargetIcon = ({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Outer ring */}
    <Circle
      cx="12"
      cy="12"
      r="10"
      stroke={color}
      strokeWidth={focused ? 2 : 1.5}
      fill="none"
    />
    {/* Middle ring */}
    <Circle
      cx="12"
      cy="12"
      r="6"
      stroke={color}
      strokeWidth={focused ? 2 : 1.5}
      fill={focused ? color : "none"}
      fillOpacity={focused ? 0.1 : 0}
    />
    {/* Inner bullseye */}
    <Circle
      cx="12"
      cy="12"
      r="2.5"
      fill={color}
      fillOpacity={focused ? 1 : 0.7}
    />
    {/* Crosshair lines */}
    <Path
      d="M12 2V6"
      stroke={color}
      strokeWidth={focused ? 2 : 1.5}
      strokeLinecap="round"
    />
    <Path
      d="M12 18V22"
      stroke={color}
      strokeWidth={focused ? 2 : 1.5}
      strokeLinecap="round"
    />
    <Path
      d="M2 12H6"
      stroke={color}
      strokeWidth={focused ? 2 : 1.5}
      strokeLinecap="round"
    />
    <Path
      d="M18 12H22"
      stroke={color}
      strokeWidth={focused ? 2 : 1.5}
      strokeLinecap="round"
    />
  </Svg>
);

// Explore/Compass Icon
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
      strokeWidth={focused ? 2 : 1.5}
      fill={focused ? color : "none"}
      fillOpacity={focused ? 0.1 : 0}
    />
    <Path
      d="M16.24 7.76L14.12 14.12L7.76 16.24L9.88 9.88L16.24 7.76Z"
      stroke={color}
      strokeWidth={focused ? 2 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={focused ? color : "none"}
      fillOpacity={focused ? 0.3 : 0}
    />
  </Svg>
);

// Resume/Document Icon
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
      strokeWidth={focused ? 2 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={focused ? color : "none"}
      fillOpacity={focused ? 0.15 : 0}
    />
    <Path
      d="M14 2V8H20"
      stroke={color}
      strokeWidth={focused ? 2 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 13H16"
      stroke={color}
      strokeWidth={focused ? 2 : 1.5}
      strokeLinecap="round"
    />
    <Path
      d="M8 17H12"
      stroke={color}
      strokeWidth={focused ? 2 : 1.5}
      strokeLinecap="round"
    />
  </Svg>
);

// Profile Icon
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
      strokeWidth={focused ? 2 : 1.5}
      fill={focused ? color : "none"}
      fillOpacity={focused ? 0.2 : 0}
    />
    <Path
      d="M20 21C20 18.2386 16.4183 16 12 16C7.58172 16 4 18.2386 4 21"
      stroke={color}
      strokeWidth={focused ? 2 : 1.5}
      strokeLinecap="round"
    />
  </Svg>
);

const tabs: TabItem[] = [
  { name: "home", label: "Home", icon: HomeIcon },
  { name: "roadmap", label: "Roadmap", icon: TargetIcon },
  { name: "explore", label: "Explore", icon: ExploreIcon },
  { name: "resume", label: "Resume", icon: ResumeIcon },
  { name: "profile", label: "Profile", icon: ProfileIcon },
];

interface PremiumBottomTabBarProps {
  visible?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const TabItemComponent: React.FC<{
  tab: TabItem;
  isActive: boolean;
  onPress: () => void;
}> = ({ tab, isActive, onPress }) => {
  const translateY = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      // Lift up with spring (no bounce)
      translateY.value = withSpring(-6, {
        damping: 20,
        stiffness: 300,
        mass: 0.8,
      });
      glowOpacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1.08, { damping: 20, stiffness: 300 });
    } else {
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      glowOpacity.value = withTiming(0, { duration: 150 });
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePress = useCallback(() => {
    // Haptic feedback
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Quick press feedback
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 }, () => {
      scale.value = withSpring(isActive ? 1.08 : 1, {
        damping: 20,
        stiffness: 300,
      });
    });

    onPress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onPress, isActive]);

  // Active color is blue, inactive is muted gray
  const iconColor = isActive ? "#3B82F6" : "#6B7280";

  return (
    <AnimatedTouchable
      style={[styles.tabItem, animatedContainerStyle]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Glow effect under active tab */}
      <Animated.View style={[styles.glowContainer, glowStyle]}>
        <LinearGradient
          colors={["rgba(59, 130, 246, 0.5)", "rgba(59, 130, 246, 0)"]}
          style={styles.glowGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      {/* Icon container with subtle background on active */}
      <View style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}>
        {tab.icon({ color: iconColor, size: 24, focused: isActive })}
      </View>
    </AnimatedTouchable>
  );
};

export const PremiumBottomTabBar: React.FC<PremiumBottomTabBarProps> = ({
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

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withSpring(120, { damping: 20, stiffness: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.tabBarWrapper}>
        {Platform.OS === "ios" ? (
          <BlurView intensity={80} tint="light" style={styles.blurView}>
            <View style={styles.innerContainer}>
              <View style={styles.tabsContainer}>
                {tabs.map((tab) => (
                  <TabItemComponent
                    key={tab.name}
                    tab={tab}
                    isActive={activeTab === tab.name}
                    onPress={() => onTabPress(tab.name)}
                  />
                ))}
              </View>
            </View>
          </BlurView>
        ) : (
          // Android fallback with semi-transparent white
          <View style={styles.androidTabBar}>
            <View style={styles.innerContainer}>
              <View style={styles.tabsContainer}>
                {tabs.map((tab) => (
                  <TabItemComponent
                    key={tab.name}
                    tab={tab}
                    isActive={activeTab === tab.name}
                    onPress={() => onTabPress(tab.name)}
                  />
                ))}
              </View>
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
    bottom: Platform.OS === "ios" ? 34 : 24,
    left: 24,
    right: 24,
    alignItems: "center",
  },
  tabBarWrapper: {
    width: "100%",
    height: 72, // Slightly taller for premium feel
    borderRadius: 36,
    overflow: "hidden",
    // Premium white glass border
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    // Floating shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 12,
  },
  blurView: {
    flex: 1,
    borderRadius: 36,
    overflow: "hidden",
  },
  androidTabBar: {
    flex: 1,
    borderRadius: 36,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    overflow: "hidden",
  },
  innerContainer: {
    flex: 1,
    backgroundColor:
      Platform.OS === "ios" ? "rgba(255, 255, 255, 0.7)" : "transparent",
    borderRadius: 36,
  },
  tabsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  iconWrapperActive: {
    backgroundColor: "rgba(59, 130, 246, 0.08)",
  },
  glowContainer: {
    position: "absolute",
    bottom: -8,
    width: 48,
    height: 24,
    borderRadius: 12,
    overflow: "hidden",
  },
  glowGradient: {
    flex: 1,
    borderRadius: 12,
  },
});

export default PremiumBottomTabBar;

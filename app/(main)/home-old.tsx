/**
 * Home Dashboard Screen
 *
 * The main dashboard featuring JR Score, profile completion,
 * Odyssey AI access, and actionable cards.
 *
 * UX Intent:
 * - Premium dark glass aesthetic
 * - Calm, informative at-a-glance view
 * - Instagram-style smooth scrolling with header animation
 * - Top bar with Exoptus branding (image), notifications & calendar
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  Modal,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  withTiming,
  interpolate,
  FadeIn,
  FadeInUp,
  FadeInDown,
  runOnJS,
} from "react-native-reanimated";
import Svg, { Path, Circle } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

import { useDashboardStore } from "../../store/dashboardStore";
import { useUserStore } from "../../store/userStore";
import { GlassCard } from "../../components/GlassCard";
import { ProfileCompletionCard } from "../../components/ProfileCompletionCard";
import { JRScoreCard } from "../../components/JRScoreCard";
import { OdysseyCard } from "../../components/OdysseyCard";
import { ActionCard } from "../../components/ActionCard";
import { CalendarModal } from "../../components/CalendarModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

// Icons
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

const TargetIcon = ({
  color = "#FFFFFF",
  size = 24,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth={2} />
    <Circle cx="12" cy="12" r="2" stroke={color} strokeWidth={2} />
  </Svg>
);

const ClockIcon = ({
  color = "#FFFFFF",
  size = 24,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path
      d="M12 6V12L16 14"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const TrendingUpIcon = ({
  color = "#FFFFFF",
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

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const scrollY = useSharedValue(0);
  const lastScrollY = useSharedValue(0);

  const {
    jrScore,
    notifications,
    profileSteps,
    fetchUserDashboard,
    isLoading,
  } = useDashboardStore();

  // Get user name from store - use name from onboarding store as fallback
  // "Explorer" is the fallback if no name is set anywhere
  const user = useUserStore((state) => state.user);
  const storeName = useUserStore((state) => state.name);
  const hydrateUser = useUserStore((state) => state.hydrateUser);
  const isHydrated = useUserStore((state) => state.isHydrated);

  // Derive display name with proper fallback chain
  const userName = user?.name || storeName || "Explorer";

  // Hydrate user identity on mount
  useEffect(() => {
    if (!isHydrated) {
      hydrateUser();
    }
  }, [isHydrated, hydrateUser]);

  // PHASE 3: Fetch real dashboard data on mount
  useEffect(() => {
    fetchUserDashboard();
  }, []);

  // Instagram-style scroll handler - hide on scroll down, show on scroll up
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const currentY = event.contentOffset.y;
      const diff = currentY - lastScrollY.value;

      // Only trigger visibility change after threshold
      if (currentY > 50) {
        if (diff > 5) {
          // Scrolling down - hide header
          runOnJS(setHeaderVisible)(false);
        } else if (diff < -5) {
          // Scrolling up - show header
          runOnJS(setHeaderVisible)(true);
        }
      } else {
        // At top - always show
        runOnJS(setHeaderVisible)(true);
      }

      lastScrollY.value = currentY;
      scrollY.value = currentY;
    },
  });

  // Header animation - Instagram-style smooth slide
  const headerStyle = useAnimatedStyle(() => {
    const translateY = withTiming(headerVisible ? 0 : -100, { duration: 250 });
    const opacity = withTiming(headerVisible ? 1 : 0, { duration: 200 });
    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      // Actually fetch fresh data from backend
      await fetchUserDashboard();
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchUserDashboard]);

  const handleOpenCalendar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCalendarVisible(true);
  };

  const handleNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(main)/notifications" as any);
  };

  const handleOdysseyPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(main)/odyssey" as any);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={["#0A0A0F", "#111118", "#0A0A0F"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top App Bar - Instagram-style hide/show */}
      <Animated.View style={[styles.header, headerStyle]}>
        {Platform.OS === "ios" ? (
          <BlurView intensity={60} tint="dark" style={styles.headerBlur}>
            <View style={styles.headerInner}>
              {/* Exoptus Logo/Title Image */}
              <View style={styles.headerLeft}>
                <Image
                  source={require("../../assets/images/Exoptus-title.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>

              {/* Right Icons: Calendar, Notifications */}
              <View style={styles.headerRight}>
                <TouchableOpacity
                  style={styles.headerIcon}
                  onPress={handleNotifications}
                  activeOpacity={0.7}
                >
                  <BellIcon color="#18181B" size={24} />
                  {unreadCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationBadgeText}>
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        ) : (
          <View style={styles.headerAndroid}>
            <View style={styles.headerInner}>
              {/* Exoptus Logo/Title Image */}
              <View style={styles.headerLeft}>
                <Image
                  source={require("../../assets/images/Exoptus-title.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>

              {/* Right Icons: Calendar, Notifications */}
              <View style={styles.headerRight}>
                <TouchableOpacity
                  style={styles.headerIcon}
                  onPress={handleNotifications}
                  activeOpacity={0.7}
                >
                  <BellIcon color="#18181B" size={24} />
                  {unreadCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationBadgeText}>
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Animated.View>

      {/* Main Content */}
      <AnimatedScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8B5CF6"
            colors={["#8B5CF6"]}
          />
        }
      >
        {/* Profile Completion Card */}
        <Animated.View entering={FadeInUp.delay(100).springify()}>
          <ProfileCompletionCard />
        </Animated.View>

        {/* JR Score Card - Pass user name */}
        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <JRScoreCard userName={userName} />
        </Animated.View>

        {/* Odyssey AI Card */}
        <Animated.View entering={FadeInUp.delay(300).springify()}>
          <OdysseyCard onPress={handleOdysseyPress} />
        </Animated.View>

        {/* Action Cards Section */}
        <Animated.View
          entering={FadeInUp.delay(400).springify()}
          style={styles.actionCardsSection}
        >
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <ActionCard
            icon={<TargetIcon color="#4ADE80" size={22} />}
            title="Next Best Step"
            description="Update your LinkedIn headline to match your target role"
            ctaText="Start now"
            type="highlight"
            onPress={() => {}}
          />

          <ActionCard
            icon={<ClockIcon color="#FBBF24" size={22} />}
            title="Pending Tasks"
            description="You have 3 tasks waiting in your roadmap"
            ctaText="View all"
            type="warning"
            onPress={() => router.push("/(main)/roadmap" as any)}
          />

          <ActionCard
            icon={<TrendingUpIcon color="#60A5FA" size={22} />}
            title="Suggested Improvement"
            description="Add 2 more skills to increase your JR Score by 5%"
            ctaText="Add skills"
            type="default"
            onPress={() => {}}
          />
        </Animated.View>

        {/* Insights Section */}
        <Animated.View
          entering={FadeInUp.delay(500).springify()}
          style={styles.insightsSection}
        >
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <GlassCard intensity="medium" style={styles.insightCard}>
            <View style={styles.insightRow}>
              <View style={styles.insightItem}>
                <Text style={styles.insightValue}>12</Text>
                <Text style={styles.insightLabel}>Days Active</Text>
              </View>
              <View style={styles.insightDivider} />
              <View style={styles.insightItem}>
                <Text style={styles.insightValue}>8</Text>
                <Text style={styles.insightLabel}>Tasks Done</Text>
              </View>
              <View style={styles.insightDivider} />
              <View style={styles.insightItem}>
                <Text style={styles.insightValue}>+15%</Text>
                <Text style={styles.insightLabel}>JR Growth</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacer} />
      </AnimatedScrollView>

      {/* Calendar Modal is rendered globally in _layout.tsx */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0F",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerBlur: {
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  headerAndroid: {
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: "rgba(10, 10, 15, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  headerInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flex: 1,
  },
  logoImage: {
    width: 120,
    height: 32,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  notificationBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  scrollContent: {
    paddingTop: Platform.OS === "ios" ? 110 : 90,
    paddingHorizontal: 0,
  },
  actionCardsSection: {
    marginTop: 8,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FAFAFA",
    marginBottom: 12,
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
  },
  insightsSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  insightCard: {
    padding: 20,
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  insightItem: {
    flex: 1,
    alignItems: "center",
  },
  insightValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FAFAFA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
  },
  insightLabel: {
    fontSize: 12,
    color: "#71717A",
    marginTop: 4,
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  insightDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  bottomSpacer: {
    height: 120,
  },
});

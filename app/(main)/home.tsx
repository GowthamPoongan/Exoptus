/**
 * Home Dashboard Screen
 *
 * The main dashboard featuring JR Score, profile completion,
 * Odyssey AI access, and actionable cards.
 *
 * UX Intent:
 * - Premium dark glass aesthetic
 * - Calm, informative at-a-glance view
 * - Smooth scrolling with header animation
 */

import React, { useState, useCallback } from "react";
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
} from "react-native-reanimated";
import Svg, { Path, Circle } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

import { useDashboardStore } from "../../store/dashboardStore";
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
  const scrollY = useSharedValue(0);

  const { jrScore, notifications, profileSteps } = useDashboardStore();

  // Scroll handler for header animation
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Header animation styles
  const headerStyle = useAnimatedStyle(() => {
    const translateY = interpolate(scrollY.value, [0, 100], [0, -80], "clamp");
    const opacity = interpolate(scrollY.value, [0, 60], [1, 0], "clamp");
    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  // Compact header for scrolled state
  const compactHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [60, 100], [0, 1], "clamp");
    return {
      opacity,
    };
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  const handleOpenCalendar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCalendarVisible(true);
  };

  const handleNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to notifications
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

      {/* Large Header - hides on scroll */}
      <Animated.View style={[styles.header, headerStyle]}>
        <View style={styles.headerLeft}>
          <Text style={styles.brandText}>Exoptus</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={handleNotifications}
            activeOpacity={0.7}
          >
            <BellIcon color="#FAFAFA" size={22} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={handleOpenCalendar}
            activeOpacity={0.7}
          >
            <CalendarIcon color="#FAFAFA" size={22} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Compact Header - shows on scroll */}
      <Animated.View style={[styles.compactHeader, compactHeaderStyle]}>
        {Platform.OS === "ios" ? (
          <BlurView intensity={80} tint="dark" style={styles.compactHeaderBlur}>
            <Text style={styles.compactBrandText}>Exoptus</Text>
          </BlurView>
        ) : (
          <View style={styles.compactHeaderAndroid}>
            <Text style={styles.compactBrandText}>Exoptus</Text>
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

        {/* JR Score Card */}
        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <JRScoreCard />
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

      {/* Calendar Modal */}
      <CalendarModal
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
      />
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
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 100,
  },
  headerLeft: {
    flex: 1,
  },
  brandText: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FAFAFA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
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
  compactHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99,
  },
  compactHeaderBlur: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  compactHeaderAndroid: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: "rgba(10, 10, 15, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  compactBrandText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FAFAFA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
    textAlign: "center",
  },
  scrollContent: {
    paddingTop: Platform.OS === "ios" ? 130 : 110,
    paddingHorizontal: 20,
  },
  actionCardsSection: {
    marginTop: 8,
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

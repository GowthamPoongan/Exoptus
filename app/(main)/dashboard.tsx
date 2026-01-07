/**
 * Home Dashboard Screen (Redesigned)
 *
 * Premium dashboard with:
 * - Light theme matching reference design
 * - JR Score with breakdown (tappable)
 * - Roadmap preview
 * - Recent progress
 * - Full touch feedback
 *
 * Design: Credit score style UI
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  RefreshControl,
  Dimensions,
  StatusBar,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import Svg, { Path, Circle } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

import { useDashboardStore } from "../../store/dashboardStore";
import { useUserStore } from "../../store/userStore";
import { JRScoreDashboardCard } from "../../components/JRScoreDashboardCard";
import { PressableCard } from "../../components/PressableCard";
import {
  DashboardScoreSkeleton,
  ActionCardSkeleton,
} from "../../components/Skeleton";
import { BottomTabBar } from "../../components/BottomTabBar";
import { JRScoreBreakdown } from "../../types/jrScore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

// Icons
const BellIcon = ({
  color = "#374151",
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

const ChevronRightIcon = ({
  color = "#9CA3AF",
  size = 20,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18L15 12L9 6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const MapIcon = ({
  color = "#3B82F6",
  size = 24,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 6V22L8 18L16 22L23 18V2L16 6L8 2L1 6Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 2V18"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 6V22"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const FileTextIcon = ({
  color = "#10B981",
  size = 24,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 2V8H20"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 13H8"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 17H8"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10 9H9H8"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SparklesIcon = ({
  color = "#8B5CF6",
  size = 24,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19 15L19.5 17L21.5 17.5L19.5 18L19 20L18.5 18L16.5 17.5L18.5 17L19 15Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TrendingUpIcon = ({
  color = "#F59E0B",
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
  const [headerVisible, setHeaderVisible] = useState(true);
  const scrollY = useSharedValue(0);
  const lastScrollY = useSharedValue(0);

  const {
    jrScore,
    notifications,
    profileCompletion,
    topRole,
    missingSkills,
    fetchUserDashboard,
    isLoading,
  } = useDashboardStore();

  const user = useUserStore((state) => state.user);
  const storeName = useUserStore((state) => state.name);
  const hydrateUser = useUserStore((state) => state.hydrateUser);
  const isHydrated = useUserStore((state) => state.isHydrated);

  const userName = user?.name || storeName || "Explorer";

  useEffect(() => {
    if (!isHydrated) {
      hydrateUser();
    }
  }, [isHydrated, hydrateUser]);

  useEffect(() => {
    fetchUserDashboard();
  }, []);

  // Scroll handler for header animation
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const currentY = event.contentOffset.y;
      const diff = currentY - lastScrollY.value;

      if (currentY > 50) {
        if (diff > 5) {
          runOnJS(setHeaderVisible)(false);
        } else if (diff < -5) {
          runOnJS(setHeaderVisible)(true);
        }
      } else {
        runOnJS(setHeaderVisible)(true);
      }

      lastScrollY.value = currentY;
      scrollY.value = currentY;
    },
  });

  const headerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: withTiming(headerVisible ? 0 : -100, { duration: 250 }) },
    ],
    opacity: withTiming(headerVisible ? 1 : 0, { duration: 200 }),
  }));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await fetchUserDashboard();
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchUserDashboard]);

  const handleNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(main)/notifications" as any);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Generate mock JR Score breakdown (in real app, this comes from backend)
  const scoreBreakdown: JRScoreBreakdown = {
    total: jrScore,
    level:
      jrScore >= 75
        ? "job-ready"
        : jrScore >= 55
        ? "competitive"
        : jrScore >= 30
        ? "developing"
        : "unprepared",
    levelLabel:
      jrScore >= 75
        ? "Job Ready"
        : jrScore >= 55
        ? "Competitive"
        : jrScore >= 30
        ? "Developing"
        : "Unprepared",
    dimensions: {
      clarity: {
        name: "clarity",
        score: Math.round(jrScore * 0.28),
        maxScore: 25,
        label: "Clarity",
        description: "Goal specificity and role selection",
        factors: [],
      },
      consistency: {
        name: "consistency",
        score: Math.round(jrScore * 0.24),
        maxScore: 25,
        label: "Consistency",
        description: "Answer alignment across questions",
        factors: [],
      },
      readiness: {
        name: "readiness",
        score: Math.round(jrScore * 0.26),
        maxScore: 25,
        label: "Readiness",
        description: "Skills vs role requirements",
        factors: [],
      },
      execution: {
        name: "execution",
        score: Math.round(jrScore * 0.22),
        maxScore: 25,
        label: "Execution",
        description: "Completed actions and tasks",
        factors: [],
      },
    },
    lastUpdated: new Date().toISOString(),
    changeFromLast: 6,
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7F5" />

      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <View style={styles.headerInner}>
          <Text style={styles.headerTitle}>EXOPTUS</Text>
          <View style={styles.headerRight}>
            <Pressable style={styles.headerIcon} onPress={handleNotifications}>
              <BellIcon color="#374151" size={22} />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
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
            tintColor="#3B82F6"
            colors={["#3B82F6"]}
          />
        }
      >
        {/* JR Score Dashboard Card */}
        {isLoading ? (
          <DashboardScoreSkeleton />
        ) : (
          <Animated.View entering={FadeInUp.delay(100).springify()}>
            <JRScoreDashboardCard
              score={jrScore || 73}
              scoreBreakdown={scoreBreakdown}
              changeFromLast={6}
              userName={userName}
              lastUpdated="5 Days ago"
            />
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View
          entering={FadeInUp.delay(200).springify()}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          {isLoading ? (
            <>
              <ActionCardSkeleton />
              <ActionCardSkeleton />
            </>
          ) : (
            <>
              {/* Roadmap Action */}
              <PressableCard
                onPress={() => router.push("/(main)/roadmap" as any)}
                style={styles.actionCard}
                hapticFeedback="medium"
              >
                <View
                  style={[styles.actionIcon, { backgroundColor: "#3B82F620" }]}
                >
                  <MapIcon color="#3B82F6" size={22} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>View Roadmap</Text>
                  <Text style={styles.actionDescription}>
                    3 tasks pending this week
                  </Text>
                </View>
                <ChevronRightIcon color="#9CA3AF" size={20} />
              </PressableCard>

              {/* Resume Action */}
              <PressableCard
                onPress={() => router.push("/(main)/resume" as any)}
                style={styles.actionCard}
                hapticFeedback="medium"
              >
                <View
                  style={[styles.actionIcon, { backgroundColor: "#10B98120" }]}
                >
                  <FileTextIcon color="#10B981" size={22} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Preview Resume</Text>
                  <Text style={styles.actionDescription}>
                    {profileCompletion > 0.8
                      ? "Ready for review"
                      : "Draft - needs more data"}
                  </Text>
                </View>
                <ChevronRightIcon color="#9CA3AF" size={20} />
              </PressableCard>

              {/* Odyssey AI Action */}
              <PressableCard
                onPress={() => router.push("/(main)/odyssey" as any)}
                style={styles.actionCard}
                hapticFeedback="medium"
              >
                <View
                  style={[styles.actionIcon, { backgroundColor: "#8B5CF620" }]}
                >
                  <SparklesIcon color="#8B5CF6" size={22} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Talk to Odyssey</Text>
                  <Text style={styles.actionDescription}>
                    AI career guidance
                  </Text>
                </View>
                <ChevronRightIcon color="#9CA3AF" size={20} />
              </PressableCard>
            </>
          )}
        </Animated.View>

        {/* Progress Section */}
        <Animated.View
          entering={FadeInUp.delay(300).springify()}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Your Progress</Text>

          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <View style={styles.progressItem}>
                <Text style={styles.progressValue}>12</Text>
                <Text style={styles.progressLabel}>Days Active</Text>
              </View>
              <View style={styles.progressDivider} />
              <View style={styles.progressItem}>
                <Text style={styles.progressValue}>8</Text>
                <Text style={styles.progressLabel}>Tasks Done</Text>
              </View>
              <View style={styles.progressDivider} />
              <View style={styles.progressItem}>
                <Text style={[styles.progressValue, { color: "#10B981" }]}>
                  +15%
                </Text>
                <Text style={styles.progressLabel}>JR Growth</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Missing Skills */}
        {missingSkills && missingSkills.length > 0 && (
          <Animated.View
            entering={FadeInUp.delay(400).springify()}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>Skills to Develop</Text>
            <View style={styles.skillsCard}>
              <View style={styles.skillsHeader}>
                <TrendingUpIcon color="#F59E0B" size={20} />
                <Text style={styles.skillsTitle}>
                  {missingSkills.length} skills will boost your score
                </Text>
              </View>
              <View style={styles.skillsList}>
                {missingSkills.slice(0, 5).map((skill, index) => (
                  <View key={index} style={styles.skillTag}>
                    <Text style={styles.skillTagText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </AnimatedScrollView>

      {/* Bottom Tab Bar */}
      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7F5",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: "#F5F7F5",
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
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
    color: "#FFF",
  },
  scrollContent: {
    paddingTop: Platform.OS === "ios" ? 110 : 90,
    paddingBottom: 20,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
  progressCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressItem: {
    flex: 1,
    alignItems: "center",
  },
  progressValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  progressLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  progressDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E7EB",
  },
  skillsCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  skillsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  skillsTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginLeft: 8,
  },
  skillsList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  skillTag: {
    backgroundColor: "#F59E0B20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  skillTagText: {
    fontSize: 13,
    color: "#D97706",
    fontWeight: "500",
  },
  bottomSpacer: {
    height: 100,
  },
});

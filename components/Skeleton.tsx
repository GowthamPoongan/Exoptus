/**
 * Skeleton Loading Components
 *
 * Premium skeleton loaders for dashboard, roadmap, and cards.
 * Creates polished loading states that match the app's visual style.
 */

import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Dimensions, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

// Base skeleton with shimmer effect
export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1500 }), -1, false);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          shimmer.value,
          [0, 1],
          [-SCREEN_WIDTH, SCREEN_WIDTH]
        ),
      },
    ],
  }));

  return (
    <View
      style={[
        {
          width: typeof width === "number" ? width : undefined,
          height,
          borderRadius,
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          overflow: "hidden",
        },
        typeof width === "string" && { width: width as any },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmer, animatedStyle]}>
        <LinearGradient
          colors={["transparent", "rgba(255, 255, 255, 0.08)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </View>
  );
};

// Dashboard Score Skeleton
export const DashboardScoreSkeleton: React.FC = () => (
  <View style={styles.scoreCard}>
    <View style={styles.scoreHeader}>
      <View>
        <Skeleton width={120} height={16} style={{ marginBottom: 8 }} />
        <Skeleton width={80} height={28} />
      </View>
      <Skeleton width={60} height={60} borderRadius={30} />
    </View>
    <View style={styles.scoreMeter}>
      <Skeleton width="100%" height={12} borderRadius={6} />
    </View>
    <View style={styles.scoreDimensions}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.dimensionItem}>
          <Skeleton width={60} height={12} />
          <Skeleton width={40} height={16} style={{ marginTop: 4 }} />
        </View>
      ))}
    </View>
  </View>
);

// Roadmap Item Skeleton
export const RoadmapItemSkeleton: React.FC = () => (
  <View style={styles.roadmapItem}>
    <View style={styles.roadmapTimeline}>
      <Skeleton width={16} height={16} borderRadius={8} />
      <View style={styles.roadmapLine} />
    </View>
    <View style={styles.roadmapContent}>
      <Skeleton width="70%" height={18} style={{ marginBottom: 8 }} />
      <Skeleton width="90%" height={14} style={{ marginBottom: 6 }} />
      <View style={styles.roadmapMeta}>
        <Skeleton width={60} height={20} borderRadius={10} />
        <Skeleton width={80} height={14} />
      </View>
    </View>
  </View>
);

// Full Roadmap Skeleton
export const RoadmapSkeleton: React.FC = () => (
  <View style={styles.roadmapContainer}>
    {[1, 2, 3, 4].map((i) => (
      <RoadmapItemSkeleton key={i} />
    ))}
  </View>
);

// Profile Card Skeleton
export const ProfileCardSkeleton: React.FC = () => (
  <View style={styles.profileCard}>
    <View style={styles.profileHeader}>
      <Skeleton width={80} height={80} borderRadius={40} />
      <View style={styles.profileInfo}>
        <Skeleton width={150} height={20} style={{ marginBottom: 8 }} />
        <Skeleton width={120} height={14} />
      </View>
    </View>
    <View style={styles.profileStats}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.statItem}>
          <Skeleton width={40} height={24} />
          <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
        </View>
      ))}
    </View>
  </View>
);

// Action Card Skeleton
export const ActionCardSkeleton: React.FC = () => (
  <View style={styles.actionCard}>
    <Skeleton width={44} height={44} borderRadius={12} />
    <View style={styles.actionContent}>
      <Skeleton width="60%" height={16} style={{ marginBottom: 6 }} />
      <Skeleton width="80%" height={12} />
    </View>
    <Skeleton width={24} height={24} borderRadius={12} />
  </View>
);

const styles = StyleSheet.create({
  shimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shimmerGradient: {
    flex: 1,
    width: "100%",
  },
  scoreCard: {
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  scoreMeter: {
    marginBottom: 20,
  },
  scoreDimensions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dimensionItem: {
    alignItems: "center",
  },
  roadmapContainer: {
    padding: 16,
  },
  roadmapItem: {
    flexDirection: "row",
    marginBottom: 24,
  },
  roadmapTimeline: {
    alignItems: "center",
    marginRight: 16,
  },
  roadmapLine: {
    width: 2,
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginTop: 8,
  },
  roadmapContent: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 16,
    padding: 16,
  },
  roadmapMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  profileCard: {
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 20,
    marginHorizontal: 16,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  statItem: {
    alignItems: "center",
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  actionContent: {
    flex: 1,
    marginLeft: 12,
  },
});

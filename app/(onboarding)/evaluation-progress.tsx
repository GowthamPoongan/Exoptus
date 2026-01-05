import React, { useEffect, useState, useMemo, useCallback } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
  FadeIn,
  runOnJS,
  useDerivedValue,
  useAnimatedReaction,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

/**
 * Screen 8: Evaluation Progress
 *
 * Premium career intelligence visualization
 * - Space-themed background with stars
 * - Large animated percentage
 * - Glassmorphism status card
 * - Professional, analytical feel
 */

const STATUS_ITEMS = [
  "Academic Mapping",
  "Skill Alignment",
  "Role Benchmarking",
  "Readiness Estimation",
  "Career Path Modeling",
];

export default function EvaluationProgress() {
  const router = useRouter();
  // Use shared value for percentage to avoid re-render storm
  const percentageValue = useSharedValue(0);
  const [completedItems, setCompletedItems] = useState<number[]>([]);
  // Only update display text at key thresholds (not every frame)
  const [displayPercentage, setDisplayPercentage] = useState(0);

  const progressWidth = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);

  // Generate random stars for background
  const stars = useMemo(() => {
    return Array.from({ length: 80 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.8 + 0.2,
    }));
  }, []);

  // Callback to update display (called sparingly from worklet)
  const updateDisplayPercentage = useCallback((value: number) => {
    setDisplayPercentage(Math.round(value));
  }, []);

  const markItemComplete = useCallback((index: number) => {
    setCompletedItems((prev) =>
      prev.includes(index) ? prev : [...prev, index]
    );
  }, []);

  const navigateToComplete = useCallback(() => {
    router.push("/(onboarding)/analysis-complete" as any);
  }, [router]);

  // React to percentage changes on UI thread, update display sparingly
  useAnimatedReaction(
    () => Math.round(percentageValue.value),
    (current, previous) => {
      // Only update display every 5% to minimize re-renders
      if (
        previous === null ||
        Math.floor(current / 5) !== Math.floor((previous || 0) / 5)
      ) {
        runOnJS(updateDisplayPercentage)(current);
      }

      // Complete status items at thresholds
      if (current >= 20 && (previous || 0) < 20) runOnJS(markItemComplete)(0);
      if (current >= 40 && (previous || 0) < 40) runOnJS(markItemComplete)(1);
      if (current >= 60 && (previous || 0) < 60) runOnJS(markItemComplete)(2);
      if (current >= 80 && (previous || 0) < 80) runOnJS(markItemComplete)(3);
      if (current >= 97 && (previous || 0) < 97) runOnJS(markItemComplete)(4);

      // Navigate when complete
      if (current >= 100 && (previous || 0) < 100) {
        runOnJS(navigateToComplete)();
      }
    },
    [updateDisplayPercentage, markItemComplete, navigateToComplete]
  );

  useEffect(() => {
    // Animate card entrance
    cardOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));

    // Pulsing glow - pure Reanimated, no setInterval
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1500 }),
        withTiming(0.3, { duration: 1500 })
      ),
      -1, // infinite
      false
    );

    // Animate percentage from 0 to 100 over ~6 seconds
    // Non-linear: slow start, fast middle, slow end using custom easing
    setTimeout(() => {
      // Phase 1: 0-15% slow (1.5s)
      percentageValue.value = withTiming(15, {
        duration: 1500,
        easing: Easing.out(Easing.quad),
      });
      progressWidth.value = withTiming(0.15, {
        duration: 1500,
        easing: Easing.out(Easing.quad),
      });

      // Phase 2: 15-85% fast (2.5s)
      setTimeout(() => {
        percentageValue.value = withTiming(85, {
          duration: 2500,
          easing: Easing.inOut(Easing.quad),
        });
        progressWidth.value = withTiming(0.85, {
          duration: 2500,
          easing: Easing.inOut(Easing.quad),
        });
      }, 1500);

      // Phase 3: 85-100% slow (2s)
      setTimeout(() => {
        percentageValue.value = withTiming(100, {
          duration: 2000,
          easing: Easing.in(Easing.quad),
        });
        progressWidth.value = withTiming(1, {
          duration: 2000,
          easing: Easing.in(Easing.quad),
        });
      }, 4000);
    }, 600);
  }, []);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [
      { translateY: interpolate(cardOpacity.value, [0, 1], [30, 0]) },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Space Background */}
      <LinearGradient
        colors={["#0D0D1A", "#1A1A2E", "#16213E", "#0D0D1A"]}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Stars */}
      {stars.map((star) => (
        <View
          key={star.id}
          style={[
            styles.star,
            {
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
            },
          ]}
        />
      ))}

      {/* Purple glow orbs */}
      <Animated.View style={[styles.glowOrb, styles.glowOrbTop, glowStyle]} />
      <Animated.View
        style={[styles.glowOrb, styles.glowOrbBottom, glowStyle]}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Percentage Display */}
        <View style={styles.percentageContainer}>
          <Text style={styles.percentage}>{displayPercentage}%</Text>

          <Text style={styles.mainText}>We're analyzing your profile</Text>

          <Text style={styles.subText}>
            Aligning your academic background, skills, and career goals
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBg}>
            <Animated.View style={[styles.progressFill, progressBarStyle]}>
              <LinearGradient
                colors={["#7C3AED", "#A855F7", "#C084FC"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.progressGlow} />
            </Animated.View>
          </View>
        </View>

        {/* Status Card - Glassmorphism */}
        <Animated.View style={[styles.statusCard, cardStyle]}>
          <LinearGradient
            colors={["rgba(124, 58, 237, 0.15)", "rgba(139, 92, 246, 0.05)"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Text style={styles.statusTitle}>Analysis Status</Text>

          <View style={styles.statusList}>
            {STATUS_ITEMS.map((item, index) => (
              <StatusItem
                key={item}
                label={item}
                isCompleted={completedItems.includes(index)}
                index={index}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

function StatusItem({
  label,
  isCompleted,
  index,
}: {
  label: string;
  isCompleted: boolean;
  index: number;
}) {
  const checkOpacity = useSharedValue(0);
  const checkScale = useSharedValue(0.5);

  useEffect(() => {
    if (isCompleted) {
      checkOpacity.value = withTiming(1, { duration: 400 });
      checkScale.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.back(2)),
      });
    }
  }, [isCompleted]);

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <View style={styles.statusItem}>
      <Text
        style={[
          styles.statusItemText,
          isCompleted && styles.statusItemTextCompleted,
        ]}
      >
        {label}
      </Text>

      {isCompleted ? (
        <Animated.View style={[styles.checkmark, checkStyle]}>
          <LinearGradient
            colors={["#A855F7", "#7C3AED"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Text style={styles.checkmarkText}>✓</Text>
        </Animated.View>
      ) : (
        <View style={styles.emptyCheck}>
          <View style={styles.emptyCheckInner} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D1A",
  },
  star: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
  },
  glowOrb: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  glowOrbTop: {
    top: -100,
    right: -100,
    backgroundColor: "#7C3AED",
  },
  glowOrbBottom: {
    bottom: -50,
    left: -100,
    backgroundColor: "#4F46E5",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 120,
  },
  percentageContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  percentage: {
    fontSize: 96,
    fontWeight: "200",
    color: "#FFFFFF",
    letterSpacing: -4,
    marginBottom: 16,
  },
  mainText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
  },
  subText: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  progressContainer: {
    marginBottom: 48,
    paddingHorizontal: 8,
  },
  progressBg: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    overflow: "hidden",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  progressGlow: {
    width: 20,
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 3,
  },
  statusCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
    overflow: "hidden",
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 24,
  },
  statusList: {
    gap: 20,
  },
  statusItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusItemText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.4)",
    fontWeight: "500",
  },
  statusItemTextCompleted: {
    color: "#FFFFFF",
  },
  checkmark: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  checkmarkText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "rgba(139, 92, 246, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyCheckInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
  },
});

import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  interpolate,
  FadeIn,
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
  const [percentage, setPercentage] = useState(0);
  const [completedItems, setCompletedItems] = useState<number[]>([]);

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

  useEffect(() => {
    let currentPercent = 0;
    let interval: ReturnType<typeof setInterval> | null = null;

    const animatePercentage = () => {
      interval = setInterval(() => {
        if (currentPercent >= 100) {
          if (interval) clearInterval(interval);
          setTimeout(() => {
            router.push("/(onboarding)/analysis-complete" as any);
          }, 800);
          return;
        }

        // Non-linear easing: slow start, fast middle, slow end
        let increment = 1;
        if (currentPercent < 15) {
          increment = 0.4;
        } else if (currentPercent < 60) {
          increment = 1.5;
        } else if (currentPercent < 85) {
          increment = 1;
        } else {
          increment = 0.25;
        }

        currentPercent = Math.min(100, currentPercent + increment);
        setPercentage(Math.round(currentPercent));

        progressWidth.value = withTiming(currentPercent / 100, {
          duration: 80,
          easing: Easing.linear,
        });

        // Complete status items at thresholds
        if (currentPercent >= 20 && !completedItems.includes(0)) {
          setCompletedItems((prev) => [...prev, 0]);
        }
        if (currentPercent >= 40 && !completedItems.includes(1)) {
          setCompletedItems((prev) => [...prev, 1]);
        }
        if (currentPercent >= 60 && !completedItems.includes(2)) {
          setCompletedItems((prev) => [...prev, 2]);
        }
        if (currentPercent >= 80 && !completedItems.includes(3)) {
          setCompletedItems((prev) => [...prev, 3]);
        }
        if (currentPercent >= 97 && !completedItems.includes(4)) {
          setCompletedItems((prev) => [...prev, 4]);
        }
      }, 45);
    };

    cardOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));

    // Pulsing glow effect
    const pulseGlow = () => {
      glowOpacity.value = withSequence(
        withTiming(0.6, { duration: 1500 }),
        withTiming(0.3, { duration: 1500 })
      );
    };
    pulseGlow();
    const glowInterval = setInterval(pulseGlow, 3000);

    setTimeout(animatePercentage, 600);

    return () => {
      if (interval) clearInterval(interval);
      clearInterval(glowInterval);
    };
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
          <Text style={styles.percentage}>{percentage}%</Text>

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

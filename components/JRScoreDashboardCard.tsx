/**
 * JR Score Dashboard Card
 *
 * Premium score display inspired by credit score UI.
 * Features:
 * - Large score with +/- change indicator
 * - Rainbow gradient meter
 * - Score breakdown by dimension
 * - Recent changes section
 *
 * Design: Light theme matching reference image
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
  Image,
} from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSpring,
  interpolate,
  Easing,
  FadeIn,
  FadeInUp,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { PressableCard } from "./PressableCard";
import { JRScoreBreakdown, getJRScoreLevel } from "../types/jrScore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const METER_WIDTH = SCREEN_WIDTH - 80;

interface JRScoreDashboardCardProps {
  score: number;
  scoreBreakdown?: JRScoreBreakdown;
  changeFromLast?: number;
  userName: string;
  lastUpdated?: string;
  onTapBreakdown?: () => void;
}

// Animated components
const AnimatedRect = Animated.createAnimatedComponent(Rect);

export const JRScoreDashboardCard: React.FC<JRScoreDashboardCardProps> = ({
  score,
  scoreBreakdown,
  changeFromLast = 0,
  userName,
  lastUpdated,
  onTapBreakdown,
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const scoreLevel = getJRScoreLevel(score);

  // Animation values
  const meterProgress = useSharedValue(0);
  const scoreOpacity = useSharedValue(0);

  useEffect(() => {
    // Animate meter fill
    meterProgress.value = withTiming(score / 100, {
      duration: 1500,
      easing: Easing.out(Easing.cubic),
    });
    // Fade in score
    scoreOpacity.value = withTiming(1, { duration: 800 });
  }, [score]);

  // Meter indicator position
  const indicatorStyle = useAnimatedStyle(() => ({
    left: `${interpolate(meterProgress.value, [0, 1], [0, 100])}%`,
  }));

  const handleTapScore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowBreakdown(true);
    onTapBreakdown?.();
  };

  // Get label based on score
  const getScoreLabel = () => {
    if (score >= 75) return "Excellent";
    if (score >= 55) return "Good";
    if (score >= 30) return "Fair";
    return "Needs Work";
  };

  return (
    <View style={styles.container}>
      {/* Welcome Section */}
      <View style={styles.welcomeRow}>
        <View>
          <Text style={styles.welcomeEmoji}>👋</Text>
          <Text style={styles.welcomeText}>Welcome in, {userName}</Text>
        </View>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>Your Dashboard</Text>

      {/* Score Display */}
      <PressableCard
        onPress={handleTapScore}
        style={styles.scoreSection}
        hapticFeedback="medium"
      >
        <View style={styles.scoreRow}>
          <View style={styles.scoreContainer}>
            <Text style={[styles.scoreValue, { color: scoreLevel.color }]}>
              {score}
            </Text>
            {changeFromLast !== 0 && (
              <View
                style={[
                  styles.changeBadge,
                  {
                    backgroundColor:
                      changeFromLast > 0 ? "#10B98120" : "#EF444420",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.changeText,
                    { color: changeFromLast > 0 ? "#10B981" : "#EF4444" },
                  ]}
                >
                  {changeFromLast > 0 ? "+" : ""}
                  {changeFromLast} pts
                </Text>
              </View>
            )}
          </View>
        </View>

        <Text style={[styles.scoreLabel, { color: scoreLevel.color }]}>
          {getScoreLabel()}
        </Text>

        {/* Rainbow Meter */}
        <View style={styles.meterContainer}>
          <Svg
            width={METER_WIDTH}
            height={50}
            viewBox={`0 0 ${METER_WIDTH} 50`}
          >
            <Defs>
              <LinearGradient
                id="meterGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <Stop offset="0%" stopColor="#EF4444" />
                <Stop offset="30%" stopColor="#F97316" />
                <Stop offset="50%" stopColor="#FBBF24" />
                <Stop offset="70%" stopColor="#3B82F6" />
                <Stop offset="100%" stopColor="#10B981" />
              </LinearGradient>
            </Defs>
            {/* Background track */}
            <Rect
              x="0"
              y="15"
              width={METER_WIDTH}
              height="20"
              rx="10"
              fill="#E5E7EB"
            />
            {/* Gradient fill */}
            <Rect
              x="0"
              y="15"
              width={METER_WIDTH}
              height="20"
              rx="10"
              fill="url(#meterGradient)"
            />
          </Svg>

          {/* Score marker */}
          <Animated.View style={[styles.meterIndicator, indicatorStyle]}>
            <View style={styles.indicatorDot} />
            <View style={styles.indicatorLine} />
          </Animated.View>

          {/* Scale labels */}
          <View style={styles.scaleLabels}>
            <Text style={styles.scaleText}>300</Text>
            <Text style={styles.scaleText}>630</Text>
            <Text style={styles.scaleText}>690</Text>
            <Text style={styles.scaleText}>720</Text>
          </View>
        </View>

        {/* Source dropdown */}
        <Pressable style={styles.sourceButton}>
          <Text style={styles.sourceText}>JR Score</Text>
          <Text style={styles.sourceArrow}>▼</Text>
        </Pressable>
      </PressableCard>

      {/* Recent Changes */}
      {lastUpdated && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Changes</Text>
          <View style={styles.updateInfo}>
            <Text style={styles.updateText}>Updated {lastUpdated}</Text>
            <Text style={styles.nextUpdate}>Next update in 2 Days</Text>
          </View>
        </View>
      )}

      {/* Score Breakdown Modal */}
      <Modal
        visible={showBreakdown}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBreakdown(false)}
      >
        <ScoreBreakdownModal
          score={score}
          breakdown={scoreBreakdown}
          onClose={() => setShowBreakdown(false)}
        />
      </Modal>
    </View>
  );
};

// Score Breakdown Modal Component
interface ScoreBreakdownModalProps {
  score: number;
  breakdown?: JRScoreBreakdown;
  onClose: () => void;
}

const ScoreBreakdownModal: React.FC<ScoreBreakdownModalProps> = ({
  score,
  breakdown,
  onClose,
}) => {
  const scoreLevel = getJRScoreLevel(score);

  // Default breakdown if not provided
  const dimensions = breakdown?.dimensions || {
    clarity: {
      name: "clarity",
      score: Math.round(score * 0.25),
      maxScore: 25,
      label: "Clarity",
      description: "Goal specificity and role selection",
      factors: [],
    },
    consistency: {
      name: "consistency",
      score: Math.round(score * 0.25),
      maxScore: 25,
      label: "Consistency",
      description: "Answer alignment across questions",
      factors: [],
    },
    readiness: {
      name: "readiness",
      score: Math.round(score * 0.25),
      maxScore: 25,
      label: "Readiness",
      description: "Skills vs role requirements",
      factors: [],
    },
    execution: {
      name: "execution",
      score: Math.round(score * 0.25),
      maxScore: 25,
      label: "Execution",
      description: "Completed actions and tasks",
      factors: [],
    },
  };

  return (
    <View style={modalStyles.container}>
      <View style={modalStyles.header}>
        <Text style={modalStyles.title}>Score Breakdown</Text>
        <Pressable onPress={onClose} style={modalStyles.closeButton}>
          <Text style={modalStyles.closeText}>✕</Text>
        </Pressable>
      </View>

      <View style={modalStyles.content}>
        {/* Total Score */}
        <Animated.View
          entering={FadeInUp.delay(100)}
          style={modalStyles.totalScore}
        >
          <Text style={[modalStyles.scoreValue, { color: scoreLevel.color }]}>
            {score}
          </Text>
          <Text style={modalStyles.scoreLabel}>{scoreLevel.label}</Text>
        </Animated.View>

        {/* Dimensions */}
        <Text style={modalStyles.sectionTitle}>Score Dimensions</Text>

        {Object.values(dimensions).map((dim, index) => (
          <Animated.View
            key={dim.name}
            entering={FadeInUp.delay(200 + index * 100)}
            style={modalStyles.dimensionCard}
          >
            <View style={modalStyles.dimensionHeader}>
              <Text style={modalStyles.dimensionLabel}>{dim.label}</Text>
              <Text style={modalStyles.dimensionScore}>
                {dim.score}/{dim.maxScore}
              </Text>
            </View>
            <Text style={modalStyles.dimensionDescription}>
              {dim.description}
            </Text>
            <View style={modalStyles.progressBar}>
              <View
                style={[
                  modalStyles.progressFill,
                  { width: `${(dim.score / dim.maxScore) * 100}%` },
                ]}
              />
            </View>
          </Animated.View>
        ))}

        {/* Explanation */}
        <Animated.View
          entering={FadeInUp.delay(600)}
          style={modalStyles.explanation}
        >
          <Text style={modalStyles.explanationTitle}>
            How is this calculated?
          </Text>
          <Text style={modalStyles.explanationText}>
            Your JR Score is calculated based on 4 dimensions measured from your
            profile, onboarding responses, and completed actions. It's updated
            whenever you complete roadmap tasks or update your profile.
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F0F4F0",
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  welcomeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  welcomeEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  avatarContainer: {
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 20,
  },
  scoreSection: {
    backgroundColor: "transparent",
    paddingVertical: 0,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  scoreValue: {
    fontSize: 72,
    fontWeight: "700",
    lineHeight: 80,
  },
  changeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    marginBottom: 16,
  },
  changeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  scoreLabel: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
  },
  meterContainer: {
    position: "relative",
    marginBottom: 16,
  },
  meterIndicator: {
    position: "absolute",
    top: 5,
    alignItems: "center",
    marginLeft: -8,
  },
  indicatorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#10B981",
    borderWidth: 3,
    borderColor: "#FFF",
  },
  indicatorLine: {
    width: 2,
    height: 30,
    backgroundColor: "#10B981",
  },
  scaleLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginTop: 4,
  },
  scaleText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  sourceButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: "flex-end",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sourceText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    marginRight: 8,
  },
  sourceArrow: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  recentSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  updateInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  updateText: {
    fontSize: 14,
    color: "#6B7280",
  },
  nextUpdate: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "500",
  },
});

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    fontSize: 16,
    color: "#6B7280",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  totalScore: {
    alignItems: "center",
    marginBottom: 32,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: "700",
  },
  scoreLabel: {
    fontSize: 18,
    color: "#6B7280",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  dimensionCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dimensionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  dimensionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  dimensionScore: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3B82F6",
  },
  dimensionDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3B82F6",
    borderRadius: 4,
  },
  explanation: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
});

export default JRScoreDashboardCard;

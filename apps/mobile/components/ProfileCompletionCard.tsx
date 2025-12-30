/**
 * Profile Completion Card Component
 *
 * Premium profile completion stepper with animated progress.
 * Features step indicators with check marks, pulse animations,
 * and gradient progress line.
 *
 * UX Intent:
 * - Clear visual progress without overwhelming
 * - Motivate completion with satisfying animations
 * - Premium glass aesthetic matching Career OS design
 */

import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { GlassCard } from "./GlassCard";
import { useDashboardStore } from "../store/dashboardStore";

interface ProfileStep {
  id: string;
  label: string;
  completed: boolean;
}

interface ProfileCompletionCardProps {
  steps?: ProfileStep[];
  currentStep?: number;
  currentStepLabel?: string;
  onPress?: () => void;
}

// Check Icon with better proportions
const CheckIcon = ({
  size = 14,
  color = "#FFFFFF",
}: {
  size?: number;
  color?: string;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17L4 12"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Arrow Right Icon
const ArrowRightIcon = ({
  size = 16,
  color = "#A1A1AA",
}: {
  size?: number;
  color?: string;
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

const StepIndicator: React.FC<{
  step: ProfileStep;
  index: number;
  currentStep: number;
  totalSteps: number;
}> = ({ step, index, currentStep, totalSteps }) => {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);
  const checkScale = useSharedValue(0);

  const isActive = index === currentStep;
  const isCompleted = step.completed;

  useEffect(() => {
    if (isActive) {
      // Pulse animation for active step
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.4, { duration: 1000, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 1000, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 1000, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
      pulseOpacity.value = withTiming(0, { duration: 200 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  useEffect(() => {
    if (isCompleted) {
      checkScale.value = withSpring(1, { damping: 12, stiffness: 200 });
    } else {
      checkScale.value = withTiming(0, { duration: 150 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompleted]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  return (
    <View style={styles.stepContainer}>
      {/* Connector Line Before (except first) */}
      {index > 0 && (
        <View style={styles.connectorWrapper}>
          {index <= currentStep ? (
            <LinearGradient
              colors={["#3B82F6", "#60A5FA"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.connectorFilled}
            />
          ) : (
            <View style={styles.connectorEmpty} />
          )}
        </View>
      )}

      {/* Step Circle */}
      <View style={styles.circleWrapper}>
        {/* Pulse ring for active step */}
        {isActive && <Animated.View style={[styles.pulseRing, pulseStyle]} />}

        <View
          style={[
            styles.circle,
            isCompleted && styles.circleCompleted,
            isActive && styles.circleActive,
            !isCompleted && !isActive && styles.circlePending,
          ]}
        >
          {isCompleted ? (
            <Animated.View style={checkStyle}>
              <CheckIcon size={12} color="#FFFFFF" />
            </Animated.View>
          ) : isActive ? (
            <View style={styles.innerDotActive} />
          ) : (
            <Text style={styles.stepNumber}>{index + 1}</Text>
          )}
        </View>
      </View>

      {/* Connector Line After (except last) */}
      {index < totalSteps - 1 && (
        <View style={styles.connectorWrapper}>
          {index < currentStep ? (
            <LinearGradient
              colors={["#60A5FA", "#3B82F6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.connectorFilled}
            />
          ) : (
            <View style={styles.connectorEmpty} />
          )}
        </View>
      )}
    </View>
  );
};

export const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({
  steps: propSteps,
  currentStep: propCurrentStep,
  currentStepLabel,
  onPress,
}) => {
  // Get from store if not provided
  const storeData = useDashboardStore();
  const steps = propSteps || storeData.profileSteps;
  const currentStep = propCurrentStep ?? steps.findIndex((s) => !s.completed);

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  const currentLabel =
    currentStepLabel || steps[currentStep]?.label || "Get started";

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <GlassCard style={styles.card}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <View style={styles.percentBadge}>
            <Text style={styles.percentText}>{progressPercent}%</Text>
          </View>
        </View>

        {/* Progress Steps */}
        <View style={styles.stepsRow}>
          {steps.map((step, index) => (
            <StepIndicator
              key={step.id}
              step={step}
              index={index}
              currentStep={currentStep >= 0 ? currentStep : steps.length}
              totalSteps={steps.length}
            />
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>
              {currentStep >= 0 && currentStep < steps.length
                ? `Next: ${currentLabel}`
                : "All complete! 🎉"}
            </Text>
          </View>
          {onPress && (
            <ArrowRightIcon size={18} color="rgba(255, 255, 255, 0.5)" />
          )}
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
    letterSpacing: 0.2,
  },
  percentBadge: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
  },
  percentText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#60A5FA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  stepContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  circleWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
  },
  pulseRing: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#3B82F6",
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "transparent",
  },
  circleCompleted: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  circleActive: {
    borderColor: "#3B82F6",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  circlePending: {
    borderColor: "rgba(255, 255, 255, 0.15)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  stepNumber: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.4)",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  innerDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
  },
  connectorWrapper: {
    width: 24,
    height: 2,
  },
  connectorFilled: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
  connectorEmpty: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3B82F6",
  },
  statusText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
});

export default ProfileCompletionCard;

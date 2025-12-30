/**
 * Profile Completion Card Component
 *
 * Premium capsule card showing profile completion status.
 * Features step indicators with check marks, glow effects, and animated pulse.
 *
 * UX Intent:
 * - Clear visual progress without overwhelming
 * - Motivate completion without pressuring
 * - Premium glass aesthetic with inner glow
 */

import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import Svg, { Path, Circle } from "react-native-svg";
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
}

// Check Icon
const CheckIcon = ({
  size = 16,
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

const StepIndicator: React.FC<{
  step: ProfileStep;
  index: number;
  currentStep: number;
  totalSteps: number;
}> = ({ step, index, currentStep, totalSteps }) => {
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  const isActive = index === currentStep;
  const isCompleted = step.completed;
  const isPending = index > currentStep;

  React.useEffect(() => {
    if (isActive) {
      // Animated pulse ring for current step
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.4, { duration: 1000, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 0 })
        ),
        -1,
        false
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 100 }),
          withTiming(0, { duration: 900, easing: Easing.out(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [isActive]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={styles.stepContainer}>
      {/* Connector Line (before, except first) */}
      {index > 0 && (
        <View
          style={[
            styles.connector,
            {
              backgroundColor:
                index <= currentStep ? "#3B82F6" : "rgba(255, 255, 255, 0.15)",
            },
          ]}
        />
      )}

      {/* Step Circle */}
      <View style={styles.circleWrapper}>
        {/* Pulse effect for active step */}
        {isActive && <Animated.View style={[styles.pulse, pulseStyle]} />}

        <View
          style={[
            styles.circle,
            isCompleted && styles.circleCompleted,
            isActive && styles.circleActive,
            isPending && styles.circlePending,
          ]}
        >
          {isCompleted ? (
            <CheckIcon size={14} color="#FFFFFF" />
          ) : isActive ? (
            <View style={styles.innerDotActive} />
          ) : (
            <View style={styles.innerDot} />
          )}
        </View>

        {/* Glow under completed steps */}
        {isCompleted && <View style={styles.completedGlow} />}
      </View>

      {/* Connector Line (after, except last) */}
      {index < totalSteps - 1 && (
        <View
          style={[
            styles.connector,
            {
              backgroundColor:
                index < currentStep ? "#3B82F6" : "rgba(255, 255, 255, 0.15)",
            },
          ]}
        />
      )}
    </View>
  );
};

export const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({
  steps: propSteps,
  currentStep: propCurrentStep,
  currentStepLabel,
}) => {
  // Get from store if not provided
  const storeData = useDashboardStore();
  const steps = propSteps || storeData.profileSteps;
  const currentStep = propCurrentStep ?? steps.findIndex((s) => !s.completed);

  const completedCount = steps.filter((s) => s.completed).length;

  return (
    <View style={styles.cardContainer}>
      {/* Inner glow effect */}
      <LinearGradient
        colors={[
          "rgba(59, 130, 246, 0.1)",
          "transparent",
          "rgba(139, 92, 246, 0.05)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.innerGlow}
      />

      <GlassCard style={styles.card}>
        {/* Header */}
        <Text style={styles.title}>complete your profile</Text>

        {/* Progress Steps */}
        <View style={styles.stepsRow}>
          {steps.map((step, index) => (
            <StepIndicator
              key={step.id}
              step={step}
              index={index}
              currentStep={currentStep}
              totalSteps={steps.length}
            />
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.statusText}>
            {currentStepLabel || steps[currentStep]?.label || "In progress..."}
          </Text>
          <Text style={styles.countText}>
            {completedCount} of {steps.length}
          </Text>
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
  },
  innerGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  card: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 18,
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
    letterSpacing: 0.3,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  stepContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  circleWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#3B82F6",
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.25)",
    backgroundColor: "transparent",
  },
  circleCompleted: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  circleActive: {
    borderColor: "#3B82F6",
    borderWidth: 2.5,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  circlePending: {
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  completedGlow: {
    position: "absolute",
    bottom: -4,
    width: 20,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(59, 130, 246, 0.4)",
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  innerDotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3B82F6",
  },
  connector: {
    width: 24,
    height: 2,
    borderRadius: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusText: {
    fontSize: 13,
    color: "#A1A1AA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
    fontStyle: "italic",
  },
  countText: {
    fontSize: 13,
    color: "#71717A",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
    fontWeight: "500",
  },
});

export default ProfileCompletionCard;

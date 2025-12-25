/**
 * Profile Completion Card Component
 *
 * Horizontal progress indicator showing profile completion status.
 * Features step indicators with check marks and current step highlight.
 *
 * UX Intent:
 * - Clear visual progress without overwhelming
 * - Motivate completion without pressuring
 * - Premium glass aesthetic
 */

import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
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
  const pulseOpacity = useSharedValue(0);

  const isActive = index === currentStep;
  const isCompleted = step.completed;
  const isPending = index > currentStep;

  React.useEffect(() => {
    if (isActive) {
      pulseOpacity.value = withRepeat(
        withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [isActive]);

  const pulseStyle = useAnimatedStyle(() => ({
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
                index <= currentStep ? "#3B82F6" : "rgba(255, 255, 255, 0.2)",
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
          ) : (
            <View
              style={[styles.innerDot, isActive && styles.innerDotActive]}
            />
          )}
        </View>
      </View>

      {/* Connector Line (after, except last) */}
      {index < totalSteps - 1 && (
        <View
          style={[
            styles.connector,
            {
              backgroundColor:
                index < currentStep ? "#3B82F6" : "rgba(255, 255, 255, 0.2)",
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
  );
};

const styles = StyleSheet.create({
  card: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 15,
    fontWeight: "500",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
    letterSpacing: 0.3,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3B82F6",
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "transparent",
  },
  circleCompleted: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  circleActive: {
    borderColor: "#3B82F6",
    borderWidth: 2.5,
  },
  circlePending: {
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  innerDotActive: {
    backgroundColor: "#3B82F6",
  },
  connector: {
    width: 20,
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
  },
  countText: {
    fontSize: 13,
    color: "#71717A",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
});

export default ProfileCompletionCard;

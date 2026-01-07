/**
 * Timeline Roadmap Component
 *
 * Vertical timeline matching the reference design:
 * - Date header with week selector
 * - Vertical timeline with nodes
 * - Actionable task cards
 * - Active task highlight
 *
 * Each node is tappable and updates backend status.
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Dimensions,
  Image,
} from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInLeft,
  FadeInRight,
  Layout,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { PressableCard } from "./PressableCard";
import {
  RoadmapStep,
  RoadmapStepStatus,
  ROADMAP_CATEGORY_CONFIG,
} from "../types/roadmap";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Icons
const CheckIcon = ({ color = "#FFF", size = 16 }) => (
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

const LockIcon = ({ color = "#9CA3AF", size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LoadingIcon = ({ color = "#3B82F6", size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle
      cx="12"
      cy="12"
      r="8"
      stroke={color}
      strokeWidth={2}
      strokeDasharray="25"
    />
  </Svg>
);

interface TimelineRoadmapProps {
  steps: RoadmapStep[];
  currentDate?: Date;
  onStepPress: (step: RoadmapStep) => void;
  onStepComplete: (stepId: string) => void;
}

// Week day selector data
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const TimelineRoadmap: React.FC<TimelineRoadmapProps> = ({
  steps,
  currentDate = new Date(),
  onStepPress,
  onStepComplete,
}) => {
  const [selectedDay, setSelectedDay] = useState(currentDate.getDay() || 7); // 1-7
  const [selectedStep, setSelectedStep] = useState<RoadmapStep | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Get week dates based on current date
  const getWeekDates = () => {
    const today = new Date(currentDate);
    const dayOfWeek = today.getDay() || 7; // Convert Sunday (0) to 7
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + 1);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date.getDate();
    });
  };

  const weekDates = getWeekDates();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleStepPress = useCallback(
    (step: RoadmapStep) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedStep(step);
      setShowDetail(true);
      onStepPress(step);
    },
    [onStepPress]
  );

  const handleComplete = useCallback(
    (stepId: string) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onStepComplete(stepId);
      setShowDetail(false);
    },
    [onStepComplete]
  );

  return (
    <View style={styles.container}>
      {/* Date Header */}
      <View style={styles.dateHeader}>
        <Text style={styles.dateText}>{formatDate(currentDate)}</Text>
        <Text style={styles.todayTitle}>Today</Text>
      </View>

      {/* Week Selector */}
      <View style={styles.weekSelector}>
        {WEEK_DAYS.map((day, index) => {
          const dayNum = index + 1;
          const isSelected = dayNum === selectedDay;
          const isToday = dayNum === (currentDate.getDay() || 7);

          return (
            <Pressable
              key={day}
              style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedDay(dayNum);
              }}
            >
              <Text
                style={[styles.dayName, isSelected && styles.dayNameSelected]}
              >
                {day}
              </Text>
              <Text
                style={[styles.dayDate, isSelected && styles.dayDateSelected]}
              >
                {weekDates[index]}
              </Text>
              {isToday && !isSelected && <View style={styles.todayDot} />}
            </Pressable>
          );
        })}
      </View>

      {/* Timeline */}
      <ScrollView
        style={styles.timeline}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.timelineContent}
      >
        {steps.map((step, index) => (
          <TimelineItem
            key={step.id}
            step={step}
            isLast={index === steps.length - 1}
            onPress={() => handleStepPress(step)}
            onComplete={() => handleComplete(step.id)}
          />
        ))}
      </ScrollView>

      {/* Floating Add Button */}
      <Pressable
        style={styles.addButton}
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
      >
        <Text style={styles.addButtonText}>+</Text>
      </Pressable>

      {/* Detail Modal */}
      <Modal
        visible={showDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetail(false)}
      >
        {selectedStep && (
          <StepDetailModal
            step={selectedStep}
            onClose={() => setShowDetail(false)}
            onComplete={() => handleComplete(selectedStep.id)}
          />
        )}
      </Modal>
    </View>
  );
};

// Timeline Item Component
interface TimelineItemProps {
  step: RoadmapStep;
  isLast: boolean;
  onPress: () => void;
  onComplete: () => void;
}

const TimelineItem: React.FC<TimelineItemProps> = ({
  step,
  isLast,
  onPress,
  onComplete,
}) => {
  const isActive = step.status === "active";
  const isDone = step.status === "done";
  const isLocked = step.status === "locked";

  const getNodeStyle = () => {
    if (isDone) return styles.nodeDone;
    if (isActive) return styles.nodeActive;
    return styles.nodeLocked;
  };

  const getNodeIcon = () => {
    if (isDone) return <CheckIcon color="#FFF" size={14} />;
    if (isLocked) return <LockIcon color="#9CA3AF" size={12} />;
    return null;
  };

  return (
    <Animated.View
      entering={FadeInLeft.delay(step.order * 100).springify()}
      layout={Layout.springify()}
      style={styles.timelineItem}
    >
      {/* Timeline connector */}
      <View style={styles.timelineConnector}>
        <View style={[styles.node, getNodeStyle()]}>{getNodeIcon()}</View>
        {!isLast && (
          <View
            style={[
              styles.line,
              isDone && styles.lineDone,
              isActive && styles.lineActive,
            ]}
          />
        )}
      </View>

      {/* Card */}
      <PressableCard
        onPress={onPress}
        disabled={isLocked}
        style={[
          styles.itemCard,
          isActive && styles.itemCardActive,
          isLocked && styles.itemCardLocked,
        ]}
        hapticFeedback={isLocked ? "none" : "light"}
      >
        <View style={styles.itemHeader}>
          <Text
            style={[
              styles.itemTitle,
              isDone && styles.itemTitleDone,
              isLocked && styles.itemTitleLocked,
            ]}
          >
            {step.title}
          </Text>
          <Text style={styles.itemTime}>{step.estimatedTime}</Text>
        </View>

        <Text
          style={[
            styles.itemDescription,
            isLocked && styles.itemDescriptionLocked,
          ]}
        >
          {step.description}
        </Text>

        {/* Active item extras */}
        {isActive && (
          <View style={styles.activeExtras}>
            {/* Avatar group placeholder */}
            <View style={styles.avatarGroup}>
              {[1, 2, 3, 4].map((i) => (
                <View
                  key={i}
                  style={[styles.miniAvatar, { marginLeft: i > 1 ? -8 : 0 }]}
                >
                  <Text style={styles.miniAvatarText}>🎯</Text>
                </View>
              ))}
            </View>
            <Pressable style={styles.startButton} onPress={onComplete}>
              <LoadingIcon color="#FFF" size={20} />
            </Pressable>
          </View>
        )}
      </PressableCard>
    </Animated.View>
  );
};

// Step Detail Modal
interface StepDetailModalProps {
  step: RoadmapStep;
  onClose: () => void;
  onComplete: () => void;
}

const StepDetailModal: React.FC<StepDetailModalProps> = ({
  step,
  onClose,
  onComplete,
}) => {
  const categoryConfig = ROADMAP_CATEGORY_CONFIG[step.category];

  return (
    <View style={modalStyles.container}>
      <View style={modalStyles.header}>
        <Pressable onPress={onClose} style={modalStyles.closeButton}>
          <Text style={modalStyles.closeText}>←</Text>
        </Pressable>
        <Text style={modalStyles.title}>Task Details</Text>
        <View style={modalStyles.placeholder} />
      </View>

      <ScrollView style={modalStyles.content}>
        {/* Category Badge */}
        <View
          style={[
            modalStyles.categoryBadge,
            { backgroundColor: `${categoryConfig.color}20` },
          ]}
        >
          <Text
            style={[modalStyles.categoryText, { color: categoryConfig.color }]}
          >
            {categoryConfig.label}
          </Text>
        </View>

        {/* Title & Description */}
        <Text style={modalStyles.stepTitle}>{step.title}</Text>
        <Text style={modalStyles.stepDescription}>{step.description}</Text>

        {/* Meta info */}
        <View style={modalStyles.metaRow}>
          <View style={modalStyles.metaItem}>
            <Text style={modalStyles.metaLabel}>Time</Text>
            <Text style={modalStyles.metaValue}>{step.estimatedTime}</Text>
          </View>
          <View style={modalStyles.metaItem}>
            <Text style={modalStyles.metaLabel}>Impact</Text>
            <Text style={modalStyles.metaValue}>
              +{step.impactScore} JR pts
            </Text>
          </View>
        </View>

        {/* Resources */}
        {step.resources && step.resources.length > 0 && (
          <View style={modalStyles.resourcesSection}>
            <Text style={modalStyles.resourcesTitle}>Resources</Text>
            {step.resources.map((resource) => (
              <Pressable key={resource.id} style={modalStyles.resourceItem}>
                <Text style={modalStyles.resourceName}>{resource.title}</Text>
                <Text style={modalStyles.resourceType}>{resource.type}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Action Button */}
      {step.status === "active" && (
        <View style={modalStyles.footer}>
          <Pressable style={modalStyles.completeButton} onPress={onComplete}>
            <Text style={modalStyles.completeButtonText}>Mark as Complete</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  dateHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: "#6B7280",
  },
  todayTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
  },
  weekSelector: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 16,
    justifyContent: "space-between",
  },
  dayButton: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    minWidth: 44,
  },
  dayButtonSelected: {
    backgroundColor: "#3B82F6",
  },
  dayName: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 4,
  },
  dayNameSelected: {
    color: "#FFF",
  },
  dayDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  dayDateSelected: {
    color: "#FFF",
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3B82F6",
    marginTop: 4,
  },
  timeline: {
    flex: 1,
  },
  timelineContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 0,
  },
  timelineConnector: {
    alignItems: "center",
    width: 40,
  },
  node: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  nodeDone: {
    backgroundColor: "#3B82F6",
  },
  nodeActive: {
    backgroundColor: "#FFF",
    borderWidth: 3,
    borderColor: "#3B82F6",
  },
  nodeLocked: {
    backgroundColor: "#E5E7EB",
    borderWidth: 2,
    borderColor: "#D1D5DB",
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: -2,
  },
  lineDone: {
    backgroundColor: "#3B82F6",
  },
  lineActive: {
    backgroundColor: "#93C5FD",
  },
  itemCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginLeft: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  itemCardActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  itemCardLocked: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  itemTitleDone: {
    textDecorationLine: "line-through",
    color: "#6B7280",
  },
  itemTitleLocked: {
    color: "#9CA3AF",
  },
  itemTime: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  itemDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  itemDescriptionLocked: {
    color: "#D1D5DB",
  },
  activeExtras: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  avatarGroup: {
    flexDirection: "row",
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#3B82F6",
  },
  miniAvatarText: {
    fontSize: 14,
  },
  startButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  addButtonText: {
    fontSize: 28,
    color: "#FFF",
    fontWeight: "300",
    marginTop: -2,
  },
});

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  closeText: {
    fontSize: 24,
    color: "#374151",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
    marginBottom: 24,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 24,
  },
  metaItem: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
  },
  metaLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  resourcesSection: {
    marginTop: 8,
  },
  resourcesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  resourceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  resourceName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#374151",
  },
  resourceType: {
    fontSize: 13,
    color: "#6B7280",
    textTransform: "capitalize",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  completeButton: {
    backgroundColor: "#10B981",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
});

export default TimelineRoadmap;

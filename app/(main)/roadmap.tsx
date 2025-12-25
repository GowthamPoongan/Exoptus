/**
 * Roadmap Screen
 *
 * Vertical progression path that turns ambition into visible progress.
 * Features animated checkpoints, levels, and expandable checklists.
 *
 * UX Intent:
 * - Feel like levels/milestones, not a syllabus
 * - Clear progression without overwhelm
 * - Each completion reinforces progress
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
  Layout,
} from "react-native-reanimated";
import Svg, {
  Path,
  Circle,
  Line,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from "react-native-svg";
import {
  useDashboardStore,
  RoadmapLevel,
  RoadmapItem,
} from "../../store/dashboardStore";
import { GlassCard } from "../../components/GlassCard";
import { BottomTabBar } from "../../components/BottomTabBar";
import { TopHeaderBar } from "../../components/TopHeaderBar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Icons
const LockIcon = ({
  color = "#71717A",
  size = 20,
}: {
  color?: string;
  size?: number;
}) => (
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

const CheckCircleIcon = ({
  color = "#10B981",
  size = 20,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle
      cx="12"
      cy="12"
      r="10"
      fill={color}
      fillOpacity={0.2}
      stroke={color}
      strokeWidth={2}
    />
    <Path
      d="M8 12L11 15L16 9"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PlayCircleIcon = ({
  color = "#3B82F6",
  size = 20,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle
      cx="12"
      cy="12"
      r="10"
      fill={color}
      fillOpacity={0.2}
      stroke={color}
      strokeWidth={2}
    />
    <Path
      d="M10 8L16 12L10 16V8Z"
      fill={color}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronDownIcon = ({
  color = "#FFFFFF",
  size = 20,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 9L12 15L18 9"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ClockIcon = ({
  color = "#A1A1AA",
  size = 16,
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
      strokeLinejoin="round"
    />
  </Svg>
);

const ZapIcon = ({
  color = "#FBBF24",
  size = 16,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
      fill={color}
      fillOpacity={0.3}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

interface LevelCardProps {
  level: RoadmapLevel;
  index: number;
  isLast: boolean;
  onCompleteItem: (levelId: string, itemId: string) => void;
}

const LevelCard: React.FC<LevelCardProps> = ({
  level,
  index,
  isLast,
  onCompleteItem,
}) => {
  const [expanded, setExpanded] = useState(level.status === "in_progress");
  const rotation = useSharedValue(expanded ? 180 : 0);

  const toggleExpand = () => {
    if (level.status === "locked") return;
    rotation.value = withSpring(expanded ? 0 : 180, { damping: 15 });
    setExpanded(!expanded);
  };

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const completedItems = level.items.filter(
    (item: RoadmapItem) => item.completed
  ).length;
  const progress =
    level.items.length > 0 ? completedItems / level.items.length : 0;

  const getStatusIcon = () => {
    switch (level.status) {
      case "locked":
        return <LockIcon color="#71717A" size={24} />;
      case "completed":
        return <CheckCircleIcon color="#10B981" size={24} />;
      case "in_progress":
        return <PlayCircleIcon color="#3B82F6" size={24} />;
    }
  };

  const getStatusColor = () => {
    switch (level.status) {
      case "locked":
        return "#71717A";
      case "completed":
        return "#10B981";
      case "in_progress":
        return "#3B82F6";
    }
  };

  const getEffortLabel = (effort: "low" | "medium" | "high") => {
    switch (effort) {
      case "low":
        return { label: "Quick", color: "#10B981" };
      case "medium":
        return { label: "Moderate", color: "#FBBF24" };
      case "high":
        return { label: "Deep work", color: "#EC4899" };
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      layout={Layout.springify()}
      style={styles.levelContainer}
    >
      {/* Connection Line */}
      {!isLast && (
        <View style={styles.connectionLine}>
          <LinearGradient
            colors={[
              level.status === "completed" ? "#10B981" : "#2D2D3D",
              level.status === "completed" || level.status === "in_progress"
                ? getStatusColor() || "#2D2D3D"
                : "#2D2D3D",
            ]}
            style={styles.connectionGradient}
          />
        </View>
      )}

      {/* Level Node */}
      <View style={[styles.levelNode, { borderColor: getStatusColor() }]}>
        {getStatusIcon()}
      </View>

      {/* Level Card */}
      <TouchableOpacity
        activeOpacity={level.status === "locked" ? 1 : 0.8}
        onPress={toggleExpand}
        style={styles.levelCardTouchable}
      >
        <GlassCard
          style={
            level.status === "locked"
              ? { ...styles.levelCard, ...styles.levelCardLocked }
              : styles.levelCard
          }
          intensity={level.status === "in_progress" ? "medium" : "light"}
          glowColor={level.status === "in_progress" ? "#3B82F6" : undefined}
        >
          {/* Header */}
          <View style={styles.levelHeader}>
            <View style={styles.levelInfo}>
              <Text
                style={[
                  styles.levelTitle,
                  level.status === "locked" && styles.levelTitleLocked,
                ]}
              >
                {level.title}
              </Text>
              <Text
                style={[
                  styles.levelDescription,
                  level.status === "locked" && styles.levelDescriptionLocked,
                ]}
              >
                {level.description}
              </Text>
            </View>

            {level.status !== "locked" && (
              <Animated.View style={arrowStyle}>
                <ChevronDownIcon color="#A1A1AA" size={24} />
              </Animated.View>
            )}
          </View>

          {/* Progress Bar */}
          {level.status !== "locked" && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress * 100}%`,
                      backgroundColor: getStatusColor(),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {completedItems}/{level.items.length}
              </Text>
            </View>
          )}

          {/* Expanded Items */}
          {expanded && level.status !== "locked" && (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={styles.itemsContainer}
            >
              {level.items.map((item: RoadmapItem, itemIndex: number) => {
                const effort = getEffortLabel(item.effort);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.itemCard}
                    onPress={() => {
                      if (!item.completed) {
                        onCompleteItem(level.id, item.id);
                      }
                    }}
                    activeOpacity={item.completed ? 1 : 0.8}
                  >
                    <View style={styles.itemCheckbox}>
                      {item.completed ? (
                        <View style={styles.itemCheckboxChecked}>
                          <CheckCircleIcon color="#10B981" size={20} />
                        </View>
                      ) : (
                        <View style={styles.itemCheckboxUnchecked} />
                      )}
                    </View>

                    <View style={styles.itemContent}>
                      <Text
                        style={[
                          styles.itemTitle,
                          item.completed && styles.itemTitleCompleted,
                        ]}
                      >
                        {item.title}
                      </Text>
                      <Text style={styles.itemDescription}>
                        {item.description}
                      </Text>

                      <View style={styles.itemMeta}>
                        <View style={styles.metaItem}>
                          <ClockIcon color="#A1A1AA" size={14} />
                          <Text
                            style={[styles.metaText, { color: effort.color }]}
                          >
                            {effort.label}
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <ZapIcon color="#FBBF24" size={14} />
                          <Text style={styles.metaText}>
                            +{item.skillImpact} impact
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </Animated.View>
          )}
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function RoadmapScreen() {
  const { roadmapLevels, completeRoadmapItem, jrScore, notifications } =
    useDashboardStore();

  const handleCompleteItem = useCallback(
    (levelId: string, itemId: string) => {
      completeRoadmapItem(levelId, itemId);
    },
    [completeRoadmapItem]
  );

  // Calculate overall progress
  const totalItems = roadmapLevels.reduce(
    (acc: number, level: RoadmapLevel) => acc + level.items.length,
    0
  );
  const completedItems = roadmapLevels.reduce(
    (acc: number, level: RoadmapLevel) =>
      acc + level.items.filter((item: RoadmapItem) => item.completed).length,
    0
  );
  const overallProgress = totalItems > 0 ? completedItems / totalItems : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <TopHeaderBar
        notificationCount={
          notifications.filter((n: { read: boolean }) => !n.read).length
        }
        visible={true}
      />

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Your Roadmap</Text>
          <Text style={styles.subtitle}>
            Follow your path to career success
          </Text>

          {/* Overall Progress */}
          <GlassCard style={styles.overallProgressCard}>
            <View style={styles.overallProgressHeader}>
              <Text style={styles.overallProgressTitle}>Overall Progress</Text>
              <Text style={styles.overallProgressPercent}>
                {Math.round(overallProgress * 100)}%
              </Text>
            </View>
            <View style={styles.overallProgressBar}>
              <LinearGradient
                colors={["#3B82F6", "#8B5CF6", "#EC4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.overallProgressFill,
                  { width: `${overallProgress * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.overallProgressText}>
              {completedItems} of {totalItems} milestones completed
            </Text>
          </GlassCard>
        </View>

        {/* Roadmap Levels */}
        <View style={styles.levelsContainer}>
          {roadmapLevels.map((level: RoadmapLevel, index: number) => (
            <LevelCard
              key={level.id}
              level={level}
              index={index}
              isLast={index === roadmapLevels.length - 1}
              onCompleteItem={handleCompleteItem}
            />
          ))}
        </View>
      </ScrollView>

      {/* Bottom Tab Bar */}
      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0F",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === "ios" ? 100 : 85,
    paddingBottom: 120,
  },
  titleSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
  },
  subtitle: {
    fontSize: 15,
    color: "#A1A1AA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
    marginTop: 4,
    marginBottom: 20,
  },
  overallProgressCard: {
    padding: 16,
  },
  overallProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  overallProgressTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
  },
  overallProgressPercent: {
    fontSize: 20,
    fontWeight: "700",
    color: "#3B82F6",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
  },
  overallProgressBar: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  overallProgressFill: {
    height: "100%",
    borderRadius: 4,
  },
  overallProgressText: {
    fontSize: 13,
    color: "#71717A",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  levelsContainer: {
    paddingHorizontal: 20,
    paddingLeft: 40,
  },
  levelContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  connectionLine: {
    position: "absolute",
    left: 12,
    top: 48,
    bottom: -16,
    width: 3,
    zIndex: 0,
  },
  connectionGradient: {
    flex: 1,
    borderRadius: 2,
  },
  levelNode: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1A1A25",
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    zIndex: 1,
  },
  levelCardTouchable: {
    flex: 1,
  },
  levelCard: {
    padding: 0,
  },
  levelCardLocked: {
    opacity: 0.6,
  },
  levelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  levelInfo: {
    flex: 1,
    marginRight: 12,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
  },
  levelTitleLocked: {
    color: "#71717A",
  },
  levelDescription: {
    fontSize: 13,
    color: "#A1A1AA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
    marginTop: 4,
  },
  levelDescriptionLocked: {
    color: "#4A4A5A",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
    overflow: "hidden",
    marginRight: 12,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 13,
    color: "#71717A",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  itemsContainer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    paddingTop: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  itemCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  itemCheckbox: {
    marginRight: 12,
    marginTop: 2,
  },
  itemCheckboxUnchecked: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#4A4A5A",
  },
  itemCheckboxChecked: {},
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  itemTitleCompleted: {
    textDecorationLine: "line-through",
    color: "#71717A",
  },
  itemDescription: {
    fontSize: 13,
    color: "#A1A1AA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
    marginTop: 4,
  },
  itemMeta: {
    flexDirection: "row",
    marginTop: 8,
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#A1A1AA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
});

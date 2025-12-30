/**
 * JR Score Card Component
 *
 * Displays the Job Readiness Score with a smooth line graph.
 * Features color semantics based on score zones.
 * The North Star metric of the app.
 *
 * Color Zones:
 * 🔴 Red: 0–30 (unprepared)
 * 🟠 Orange: 30–55 (developing)
 * 🟡 Yellow: 55–75 (competitive)
 * 🟢 Green: 75+ (job-ready)
 *
 * UX Intent:
 * - Clear, glanceable score display
 * - Visual trend shows progress over time
 * - Color communicates readiness level
 * - Motivating without overwhelming
 */

import React from "react";
import { View, Text, StyleSheet, Platform, Dimensions } from "react-native";
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { GlassCard } from "./GlassCard";
import { useDashboardStore } from "../store/dashboardStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRAPH_WIDTH = SCREEN_WIDTH - 80;
const GRAPH_HEIGHT = 100;

interface JRScoreCardProps {
  score?: number;
  history?: { date: string; score: number }[];
  userName?: string;
}

// Get color based on score zone
const getScoreColor = (score: number) => {
  if (score < 30)
    return { primary: "#EF4444", secondary: "#FCA5A5", label: "Unprepared" };
  if (score < 55)
    return { primary: "#F97316", secondary: "#FDBA74", label: "Developing" };
  // Figma design shows 78% as Blue. Using Brand Blue for upper range.
  return {
    primary: "#3B82F6",
    secondary: "#60A5FA",
    label: score < 80 ? "Competitive" : "Job-Ready",
  };
};

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const JRScoreCard: React.FC<JRScoreCardProps> = ({
  score: propScore,
  history: propHistory,
  userName = "User",
}) => {
  // Get from store if not provided
  const storeData = useDashboardStore();
  const score = propScore ?? storeData.jrScore;
  const history = propHistory ||
    storeData.jrScoreHistory || [
      { date: "2024-01-01", score: 25 },
      { date: "2024-01-15", score: 35 },
      { date: "2024-02-01", score: 48 },
      { date: "2024-02-15", score: 62 },
      { date: "2024-03-01", score: score },
    ];

  const progress = useSharedValue(0);
  const scoreColors = getScoreColor(score);

  React.useEffect(() => {
    progress.value = withTiming(1, {
      duration: 1500,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  // Get color for each point based on its score
  const getPointColor = (pointScore: number) => {
    return getScoreColor(pointScore).primary;
  };

  // Generate smooth curve path from history data
  const generatePath = () => {
    if (history.length < 2) return "";

    const padding = 20;
    const graphWidth = GRAPH_WIDTH - padding * 2;
    const graphHeight = GRAPH_HEIGHT - padding * 2;

    const minScore = Math.min(...history.map((h) => h.score)) - 5;
    const maxScore = Math.max(...history.map((h) => h.score)) + 5;
    const scoreRange = maxScore - minScore;

    const points = history.map((item, index) => {
      const x = padding + (index / (history.length - 1)) * graphWidth;
      const y =
        padding +
        graphHeight -
        ((item.score - minScore) / scoreRange) * graphHeight;
      return { x, y };
    });

    // Create smooth bezier curve
    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx1 = prev.x + (curr.x - prev.x) / 3;
      const cpy1 = prev.y;
      const cpx2 = prev.x + (2 * (curr.x - prev.x)) / 3;
      const cpy2 = curr.y;
      path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`;
    }

    return path;
  };

  // Generate area fill path
  const generateAreaPath = () => {
    const linePath = generatePath();
    if (!linePath) return "";

    const padding = 20;
    const lastPoint = history.length > 0 ? history.length - 1 : 0;
    const graphWidth = GRAPH_WIDTH - padding * 2;

    return `${linePath} L ${
      padding + graphWidth
    } ${GRAPH_HEIGHT} L ${padding} ${GRAPH_HEIGHT} Z`;
  };

  const path = generatePath();
  const areaPath = generateAreaPath();

  // Get last point position for glow dot
  const getLastPoint = () => {
    if (history.length < 2) return { x: 0, y: 0 };

    const padding = 20;
    const graphWidth = GRAPH_WIDTH - padding * 2;
    const graphHeight = GRAPH_HEIGHT - padding * 2;

    const minScore = Math.min(...history.map((h) => h.score)) - 5;
    const maxScore = Math.max(...history.map((h) => h.score)) + 5;
    const scoreRange = maxScore - minScore;

    const lastItem = history[history.length - 1];
    const x = padding + graphWidth;
    const y =
      padding +
      graphHeight -
      ((lastItem.score - minScore) / scoreRange) * graphHeight;

    return { x, y };
  };

  const lastPoint = getLastPoint();

  return (
    <View style={styles.container}>
      {/* Welcome Text */}
      <View style={styles.welcomeRow}>
        <View>
          <Text style={styles.welcomeText}>Welcome, 👋</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>your JR Score</Text>
          <Text style={[styles.scoreValue, { color: scoreColors.primary }]}>
            {score}%
          </Text>
          <Text style={[styles.scoreStatus, { color: scoreColors.secondary }]}>
            {scoreColors.label}
          </Text>
        </View>
      </View>

      {/* Graph */}
      <View
        style={[
          styles.graphContainer,
          { backgroundColor: `${scoreColors.primary}08` },
        ]}
      >
        <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
          <Defs>
            <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop
                offset="0%"
                stopColor={scoreColors.primary}
                stopOpacity="0.3"
              />
              <Stop
                offset="100%"
                stopColor={scoreColors.primary}
                stopOpacity="0"
              />
            </LinearGradient>
            <LinearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor={scoreColors.secondary} />
              <Stop offset="100%" stopColor={scoreColors.primary} />
            </LinearGradient>
          </Defs>

          {/* Area fill */}
          <Path d={areaPath} fill="url(#areaGradient)" />

          {/* Line */}
          <Path
            d={path}
            stroke="url(#lineGradient)"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Glow points on line - color based on score at that point */}
          {history.map((item, index) => {
            const padding = 20;
            const graphWidth = GRAPH_WIDTH - padding * 2;
            const graphHeight = GRAPH_HEIGHT - padding * 2;
            const minScore = Math.min(...history.map((h) => h.score)) - 5;
            const maxScore = Math.max(...history.map((h) => h.score)) + 5;
            const scoreRange = maxScore - minScore;
            const x = padding + (index / (history.length - 1)) * graphWidth;
            const y =
              padding +
              graphHeight -
              ((item.score - minScore) / scoreRange) * graphHeight;

            const pointColor = getPointColor(item.score);

            return (
              <Circle
                key={index}
                cx={x}
                cy={y}
                r={index === history.length - 1 ? 6 : 4}
                fill={pointColor}
              />
            );
          })}

          {/* Larger glow on last point */}
          <Circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r={14}
            fill={`${scoreColors.primary}30`}
          />
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 16,
  },
  welcomeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
  },
  userName: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: "flex-end",
  },
  scoreLabel: {
    fontSize: 13,
    color: "#A1A1AA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
  },
  scoreStatus: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
    marginTop: -2,
  },
  graphContainer: {
    alignItems: "center",
    marginTop: 8,
    marginHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
  },
});

export default JRScoreCard;

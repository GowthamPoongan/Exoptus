import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  interpolate,
  useAnimatedProps,
  SharedValue,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Circle,
} from "react-native-svg";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width - 48;

/**
 * Screen 10: Analysis Results - Visual Insights
 *
 * Premium career intelligence visualization with:
 * - Space background with stars
 * - Growth projection graph at top
 * - Swipeable insight cards
 * - Professional glassmorphism design
 * - No fitness metaphors
 */

// Skill comparison data
const SKILL_CATEGORIES = [
  {
    title: "Core Technical Skills",
    skills: [
      { name: "Programming", you: 72, industry: 80 },
      { name: "Problem Solving", you: 78, industry: 75 },
      { name: "System Design", you: 55, industry: 70 },
    ],
  },
  {
    title: "Professional Skills",
    skills: [
      { name: "Communication", you: 82, industry: 78 },
      { name: "Leadership", you: 60, industry: 72 },
      { name: "Collaboration", you: 85, industry: 80 },
    ],
  },
  {
    title: "Domain Knowledge",
    skills: [
      { name: "Industry Trends", you: 45, industry: 65 },
      { name: "Best Practices", you: 58, industry: 75 },
      { name: "Tools & Tech", you: 70, industry: 80 },
    ],
  },
];

const GROWTH_DATA = [
  { month: "Now", value: 45 },
  { month: "3m", value: 58 },
  { month: "6m", value: 72 },
  { month: "9m", value: 82 },
  { month: "12m", value: 90 },
];

export default function AnalysisResults() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [activeCard, setActiveCard] = useState(0);

  const contentOpacity = useSharedValue(0);
  const graphProgress = useSharedValue(0);

  // Generate stars
  const stars = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.6 + 0.2,
    }));
  }, []);

  useEffect(() => {
    contentOpacity.value = withTiming(1, { duration: 600 });
    graphProgress.value = withDelay(
      300,
      withTiming(1, { duration: 1500, easing: Easing.out(Easing.ease) })
    );
  }, []);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + 16));
    setActiveCard(index);
  };

  const handleContinue = () => {
    // Navigate to cinematic intro carousel
    router.push("/(onboarding)/intro-carousel");
  };

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

      {/* Purple glow */}
      <View style={[styles.glowOrb, styles.glowTop]} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={contentStyle}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Your Career Analysis</Text>
            <Text style={styles.headerSubtitle}>
              Based on your profile and goals
            </Text>
          </View>

          {/* Growth Projection Graph */}
          <View style={styles.graphCard}>
            <LinearGradient
              colors={["rgba(124, 58, 237, 0.15)", "rgba(139, 92, 246, 0.05)"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.graphTitle}>Your Growth Trajectory</Text>
            <Text style={styles.graphSubtitle}>
              Career readiness projection with Exoptus
            </Text>

            <GrowthGraph data={GROWTH_DATA} progress={graphProgress} />
          </View>

          {/* Swipeable Skill Cards Section */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>
              Skills vs Industry Expectations
            </Text>
            <Text style={styles.sectionSubtitle}>
              Swipe to explore different skill areas
            </Text>

            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              contentContainerStyle={styles.cardsContainer}
              snapToInterval={CARD_WIDTH + 16}
              decelerationRate="fast"
            >
              {SKILL_CATEGORIES.map((category, index) => (
                <SkillCard key={index} category={category} />
              ))}
            </ScrollView>

            {/* Card Indicators */}
            <View style={styles.indicators}>
              {SKILL_CATEGORIES.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    activeCard === index && styles.indicatorActive,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Summary Insights Card */}
          <View style={styles.summaryCard}>
            <LinearGradient
              colors={["rgba(124, 58, 237, 0.15)", "rgba(139, 92, 246, 0.05)"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.summaryTitle}>Key Insights</Text>

            <View style={styles.insightRow}>
              <View style={styles.insightIcon}>
                <Text style={styles.insightEmoji}>💎</Text>
              </View>
              <View style={styles.insightText}>
                <Text style={styles.insightLabel}>Your Strengths</Text>
                <Text style={styles.insightValue}>
                  Communication, Problem Solving, Collaboration
                </Text>
              </View>
            </View>

            <View style={styles.insightRow}>
              <View style={styles.insightIcon}>
                <Text style={styles.insightEmoji}>🎯</Text>
              </View>
              <View style={styles.insightText}>
                <Text style={styles.insightLabel}>Focus Areas</Text>
                <Text style={styles.insightValue}>
                  System Design, Industry Knowledge, Leadership
                </Text>
              </View>
            </View>

            <View style={styles.insightRow}>
              <View style={styles.insightIcon}>
                <Text style={styles.insightEmoji}>📈</Text>
              </View>
              <View style={styles.insightText}>
                <Text style={styles.insightLabel}>Readiness Level</Text>
                <Text style={styles.insightValue}>
                  Emerging Professional — High Growth Potential
                </Text>
              </View>
            </View>
          </View>

          {/* Motivational Quote */}
          <View style={styles.quoteCard}>
            <Text style={styles.quoteText}>
              "Success is not the key to happiness. Happiness is the key to
              success. If you love what you are doing, you will be successful."
            </Text>
            <Text style={styles.quoteAuthor}>— Albert Schweitzer</Text>
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 120 }} />
        </Animated.View>
      </ScrollView>

      {/* Fixed CTA Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleContinue} activeOpacity={0.9}>
          <LinearGradient
            colors={["#A855F7", "#7C3AED"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Unlock My Potential</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Growth Graph Component
function GrowthGraph({
  data,
  progress,
}: {
  data: typeof GROWTH_DATA;
  progress: SharedValue<number>;
}) {
  const graphWidth = width - 80;
  const graphHeight = 160;
  const padding = { top: 20, bottom: 30, left: 10, right: 10 };

  const chartWidth = graphWidth - padding.left - padding.right;
  const chartHeight = graphHeight - padding.top - padding.bottom;

  // Calculate points
  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartWidth,
    y: padding.top + chartHeight - (d.value / 100) * chartHeight,
  }));

  // Create smooth curve path
  const pathD = points.reduce((path, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;

    const prevPoint = points[i - 1];
    const cpX = (prevPoint.x + point.x) / 2;
    return `${path} C ${cpX} ${prevPoint.y} ${cpX} ${point.y} ${point.x} ${point.y}`;
  }, "");

  return (
    <View style={styles.graphContainer}>
      <Svg width={graphWidth} height={graphHeight}>
        <Defs>
          <SvgGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#7C3AED" stopOpacity="1" />
            <Stop offset="1" stopColor="#C084FC" stopOpacity="1" />
          </SvgGradient>
          <SvgGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#7C3AED" stopOpacity="0.3" />
            <Stop offset="1" stopColor="#7C3AED" stopOpacity="0" />
          </SvgGradient>
        </Defs>

        {/* Area fill */}
        <Path
          d={`${pathD} L ${points[points.length - 1].x} ${
            padding.top + chartHeight
          } L ${padding.left} ${padding.top + chartHeight} Z`}
          fill="url(#areaGradient)"
        />

        {/* Line */}
        <Path
          d={pathD}
          stroke="url(#lineGradient)"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />

        {/* Data points */}
        {points.map((point, i) => (
          <Circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={i === points.length - 1 ? 6 : 4}
            fill={i === points.length - 1 ? "#C084FC" : "#7C3AED"}
          />
        ))}
      </Svg>

      {/* Labels */}
      <View style={styles.graphLabels}>
        {data.map((d, i) => (
          <View key={i} style={styles.graphLabel}>
            <Text style={styles.graphLabelValue}>{d.value}%</Text>
            <Text style={styles.graphLabelMonth}>{d.month}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// Skill Card Component
function SkillCard({ category }: { category: (typeof SKILL_CATEGORIES)[0] }) {
  return (
    <View style={styles.skillCard}>
      <LinearGradient
        colors={["rgba(124, 58, 237, 0.2)", "rgba(139, 92, 246, 0.05)"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Text style={styles.skillCardTitle}>{category.title}</Text>

      {category.skills.map((skill, index) => (
        <View key={index} style={styles.skillRow}>
          <Text style={styles.skillName}>{skill.name}</Text>

          <View style={styles.skillBars}>
            {/* You bar */}
            <View style={styles.skillBarContainer}>
              <View style={[styles.skillBar, { width: `${skill.you}%` }]}>
                <LinearGradient
                  colors={["#A855F7", "#7C3AED"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </View>
              <Text style={styles.skillBarLabel}>{skill.you}%</Text>
            </View>

            {/* Industry bar */}
            <View style={styles.skillBarContainer}>
              <View
                style={[
                  styles.skillBarIndustry,
                  { width: `${skill.industry}%` },
                ]}
              />
              <Text style={styles.skillBarLabelIndustry}>
                {skill.industry}%
              </Text>
            </View>
          </View>
        </View>
      ))}

      {/* Legend */}
      <View style={styles.skillLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#A855F7" }]} />
          <Text style={styles.legendText}>You</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: "rgba(255,255,255,0.3)" },
            ]}
          />
          <Text style={styles.legendText}>Industry Avg</Text>
        </View>
      </View>
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
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "#7C3AED",
    opacity: 0.15,
  },
  glowTop: {
    top: -80,
    right: -60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 70,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.5)",
  },
  graphCard: {
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
    overflow: "hidden",
  },
  graphTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  graphSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.5)",
    marginBottom: 20,
  },
  graphContainer: {
    alignItems: "center",
  },
  graphLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 8,
    paddingHorizontal: 4,
  },
  graphLabel: {
    alignItems: "center",
  },
  graphLabelValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#C084FC",
    marginBottom: 2,
  },
  graphLabelMonth: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.4)",
  },
  cardSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.4)",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  cardsContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  skillCard: {
    width: CARD_WIDTH,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
    overflow: "hidden",
  },
  skillCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 20,
  },
  skillRow: {
    marginBottom: 18,
  },
  skillName: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 8,
  },
  skillBars: {
    gap: 6,
  },
  skillBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  skillBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  skillBarIndustry: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  skillBarLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#C084FC",
    width: 35,
  },
  skillBarLabelIndustry: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.4)",
    width: 35,
  },
  skillLegend: {
    flexDirection: "row",
    gap: 20,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
  },
  indicators: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  indicatorActive: {
    backgroundColor: "#A855F7",
    width: 24,
  },
  summaryCard: {
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
    overflow: "hidden",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 20,
  },
  insightRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  insightEmoji: {
    fontSize: 20,
  },
  insightText: {
    flex: 1,
  },
  insightLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  insightValue: {
    fontSize: 15,
    color: "#FFFFFF",
    lineHeight: 22,
  },
  quoteCard: {
    marginHorizontal: 24,
    padding: 24,
    borderLeftWidth: 3,
    borderLeftColor: "#7C3AED",
    backgroundColor: "rgba(124, 58, 237, 0.08)",
    borderRadius: 16,
  },
  quoteText: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.7)",
    fontStyle: "italic",
    lineHeight: 24,
  },
  quoteAuthor: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.4)",
    marginTop: 12,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: "rgba(13, 13, 26, 0.95)",
  },
  button: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

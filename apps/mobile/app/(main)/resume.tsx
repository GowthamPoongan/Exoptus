/**
 * Resume Screen
 *
 * Convert learning into employable proof.
 * Features template gallery and auto-fill from user data.
 *
 * UX Intent:
 * - Clear path to professional resume
 * - Auto-fill reduces friction
 * - Premium templates with ethical pricing
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Dimensions,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInDown,
  Layout,
} from "react-native-reanimated";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { GlassCard } from "../../components/GlassCard";
import { BottomTabBar } from "../../components/BottomTabBar";
import { TopHeaderBar } from "../../components/TopHeaderBar";
import { useDashboardStore } from "../../store/dashboardStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 60) / 2;

// Icons
const SparkleIcon = ({
  color = "#FBBF24",
  size = 16,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
  </Svg>
);

const LockIcon = ({
  color = "#71717A",
  size = 16,
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

const CheckIcon = ({
  color = "#10B981",
  size = 16,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17L4 12"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const DownloadIcon = ({
  color = "#FFFFFF",
  size = 20,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7 10L12 15L17 10"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 15V3"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const EditIcon = ({
  color = "#FFFFFF",
  size = 20,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Template categories and data
const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "ats", label: "ATS-Friendly" },
  { id: "startup", label: "Startup" },
  { id: "bigtech", label: "Big Tech" },
  { id: "creative", label: "Creative" },
];

interface ResumeTemplate {
  id: string;
  name: string;
  category: string;
  premium: boolean;
  popular: boolean;
  colors: string[];
  preview: {
    headerColor: string;
    accentColor: string;
    style: "minimal" | "modern" | "creative" | "classic";
  };
}

const TEMPLATES: ResumeTemplate[] = [
  {
    id: "1",
    name: "Clean Minimal",
    category: "ats",
    premium: false,
    popular: true,
    colors: ["#1E293B", "#3B82F6"],
    preview: {
      headerColor: "#1E293B",
      accentColor: "#3B82F6",
      style: "minimal",
    },
  },
  {
    id: "2",
    name: "Modern Pro",
    category: "bigtech",
    premium: false,
    popular: true,
    colors: ["#0F172A", "#8B5CF6"],
    preview: {
      headerColor: "#0F172A",
      accentColor: "#8B5CF6",
      style: "modern",
    },
  },
  {
    id: "3",
    name: "Startup Fresh",
    category: "startup",
    premium: false,
    popular: false,
    colors: ["#134E4A", "#14B8A6"],
    preview: {
      headerColor: "#134E4A",
      accentColor: "#14B8A6",
      style: "modern",
    },
  },
  {
    id: "4",
    name: "Creative Bold",
    category: "creative",
    premium: true,
    popular: false,
    colors: ["#831843", "#EC4899"],
    preview: {
      headerColor: "#831843",
      accentColor: "#EC4899",
      style: "creative",
    },
  },
  {
    id: "5",
    name: "Executive",
    category: "bigtech",
    premium: true,
    popular: true,
    colors: ["#1E3A5F", "#60A5FA"],
    preview: {
      headerColor: "#1E3A5F",
      accentColor: "#60A5FA",
      style: "classic",
    },
  },
  {
    id: "6",
    name: "ATS Optimized",
    category: "ats",
    premium: false,
    popular: false,
    colors: ["#374151", "#6B7280"],
    preview: {
      headerColor: "#374151",
      accentColor: "#6B7280",
      style: "minimal",
    },
  },
];

// Mini resume preview component
const ResumePreview: React.FC<{ template: ResumeTemplate }> = ({
  template,
}) => {
  const { preview } = template;

  return (
    <View style={styles.previewContainer}>
      {/* Header section */}
      <View
        style={[styles.previewHeader, { backgroundColor: preview.headerColor }]}
      >
        <View style={styles.previewAvatar} />
        <View style={styles.previewNameArea}>
          <View style={styles.previewNameLine} />
          <View style={styles.previewTitleLine} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.previewContent}>
        {/* Section 1 */}
        <View
          style={[
            styles.previewSectionTitle,
            { backgroundColor: preview.accentColor },
          ]}
        />
        <View style={styles.previewLine} />
        <View style={styles.previewLineShort} />
        <View style={styles.previewLine} />

        {/* Section 2 */}
        <View
          style={[
            styles.previewSectionTitle,
            { backgroundColor: preview.accentColor, marginTop: 8 },
          ]}
        />
        <View style={styles.previewLine} />
        <View style={styles.previewLineShort} />

        {/* Skills */}
        <View style={styles.previewSkills}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.previewSkillChip,
                { backgroundColor: `${preview.accentColor}30` },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

interface TemplateCardProps {
  template: ResumeTemplate;
  index: number;
  onSelect: (template: ResumeTemplate) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  index,
  onSelect,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).springify()}
      style={[styles.templateCardWrapper, animatedStyle]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onSelect(template)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <GlassCard style={styles.templateCard} intensity="light" noPadding>
          {/* Preview */}
          <View style={styles.templatePreview}>
            <ResumePreview template={template} />

            {/* Badges */}
            {template.popular && (
              <View style={styles.popularBadge}>
                <SparkleIcon color="#FBBF24" size={12} />
                <Text style={styles.popularBadgeText}>Popular</Text>
              </View>
            )}

            {template.premium && (
              <View style={styles.premiumOverlay}>
                <View style={styles.premiumBadge}>
                  <LockIcon color="#FFFFFF" size={14} />
                  <Text style={styles.premiumBadgeText}>PRO</Text>
                </View>
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.templateInfo}>
            <Text style={styles.templateName}>{template.name}</Text>
            <Text style={styles.templateCategory}>
              {CATEGORIES.find((c) => c.id === template.category)?.label}
            </Text>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ResumeScreen() {
  const { notifications, jrScore } = useDashboardStore();
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedTemplate, setSelectedTemplate] =
    useState<ResumeTemplate | null>(null);

  const filteredTemplates = TEMPLATES.filter(
    (t) => activeCategory === "all" || t.category === activeCategory
  );

  const handleSelectTemplate = (template: ResumeTemplate) => {
    setSelectedTemplate(template);
    // In a real app, this would navigate to the resume editor
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <TopHeaderBar
        notificationCount={
          notifications.filter((n: { read: boolean }) => !n.read).length
        }
        visible={true}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Resume Builder</Text>
          <Text style={styles.subtitle}>
            Create a professional resume in minutes
          </Text>
        </View>

        {/* JR Score Tip */}
        <GlassCard style={styles.tipCard} intensity="light" glowColor="#3B82F6">
          <View style={styles.tipContent}>
            <View style={styles.tipIcon}>
              <SparkleIcon color="#3B82F6" size={20} />
            </View>
            <View style={styles.tipText}>
              <Text style={styles.tipTitle}>Boost your resume</Text>
              <Text style={styles.tipDescription}>
                Your JR Score is {jrScore}%. Complete more roadmap items to
                unlock better content suggestions.
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Auto-fill Feature */}
        <GlassCard style={styles.autoFillCard} intensity="light">
          <View style={styles.autoFillHeader}>
            <CheckIcon color="#10B981" size={20} />
            <Text style={styles.autoFillTitle}>Auto-fill enabled</Text>
          </View>
          <Text style={styles.autoFillDescription}>
            Your skills, projects, and experience will be automatically
            populated from your profile.
          </Text>
        </GlassCard>

        {/* Category Filter */}
        <View style={styles.categoryContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  activeCategory === category.id && styles.categoryChipActive,
                ]}
                onPress={() => setActiveCategory(category.id)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    activeCategory === category.id &&
                      styles.categoryChipTextActive,
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Templates Grid */}
        <View style={styles.templatesGrid}>
          {filteredTemplates.map((template, index) => (
            <TemplateCard
              key={template.id}
              template={template}
              index={index}
              onSelect={handleSelectTemplate}
            />
          ))}
        </View>

        {/* Premium CTA */}
        <GlassCard style={styles.premiumCTA} intensity="medium">
          <LinearGradient
            colors={["rgba(139, 92, 246, 0.2)", "rgba(236, 72, 153, 0.2)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.premiumContent}>
            <Text style={styles.premiumTitle}>Unlock Premium Templates</Text>
            <Text style={styles.premiumDescription}>
              Get access to all templates, AI-powered content suggestions, and
              unlimited exports.
            </Text>
            <TouchableOpacity style={styles.premiumButton}>
              <Text style={styles.premiumButtonText}>Upgrade to Pro</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
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
    marginBottom: 20,
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
  },
  tipCard: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  tipContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  tipText: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
  },
  tipDescription: {
    fontSize: 13,
    color: "#A1A1AA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
    marginTop: 4,
    lineHeight: 18,
  },
  autoFillCard: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  autoFillHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  autoFillTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#10B981",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
  },
  autoFillDescription: {
    fontSize: 13,
    color: "#A1A1AA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
    lineHeight: 18,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryScroll: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: "#3B82F6",
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#A1A1AA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },
  templatesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 16,
  },
  templateCardWrapper: {
    width: CARD_WIDTH,
  },
  templateCard: {
    overflow: "hidden",
  },
  templatePreview: {
    height: 160,
    backgroundColor: "#1A1A25",
    borderRadius: 12,
    margin: 8,
    overflow: "hidden",
    position: "relative",
  },
  previewContainer: {
    flex: 1,
  },
  previewHeader: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  previewAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginRight: 8,
  },
  previewNameArea: {
    flex: 1,
  },
  previewNameLine: {
    height: 6,
    width: "60%",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 3,
    marginBottom: 4,
  },
  previewTitleLine: {
    height: 4,
    width: "40%",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
  },
  previewContent: {
    padding: 8,
  },
  previewSectionTitle: {
    height: 4,
    width: "30%",
    borderRadius: 2,
    marginBottom: 6,
  },
  previewLine: {
    height: 3,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
    marginBottom: 4,
  },
  previewLineShort: {
    height: 3,
    width: "70%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
    marginBottom: 4,
  },
  previewSkills: {
    flexDirection: "row",
    gap: 4,
    marginTop: 8,
  },
  previewSkillChip: {
    height: 8,
    width: 24,
    borderRadius: 4,
  },
  popularBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(251, 191, 36, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FBBF24",
  },
  premiumOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(139, 92, 246, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  templateInfo: {
    padding: 12,
    paddingTop: 4,
  },
  templateName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
  },
  templateCategory: {
    fontSize: 12,
    color: "#71717A",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
    marginTop: 2,
  },
  premiumCTA: {
    marginHorizontal: 20,
    marginTop: 24,
    overflow: "hidden",
  },
  premiumContent: {
    padding: 4,
    alignItems: "center",
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
    marginBottom: 8,
  },
  premiumDescription: {
    fontSize: 14,
    color: "#A1A1AA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  premiumButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  premiumButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
  },
});

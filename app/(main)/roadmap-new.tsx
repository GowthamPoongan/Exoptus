/**
 * Roadmap Screen (Redesigned)
 *
 * Vertical timeline matching the reference design:
 * - Calendar week selector at top
 * - Vertical timeline with actionable nodes
 * - Active task highlighted
 * - Floating add button
 *
 * Each node updates backend status on completion.
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
  Alert,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useDashboardStore } from "../../store/dashboardStore";
import { TimelineRoadmap } from "../../components/TimelineRoadmap";
import { RoadmapSkeleton } from "../../components/Skeleton";
import { BottomTabBar } from "../../components/BottomTabBar";
import { RoadmapStep } from "../../types/roadmap";

// Mock roadmap data - In production, this comes from backend
const MOCK_ROADMAP_STEPS: RoadmapStep[] = [
  {
    id: "1",
    title: "Complete Profile",
    description: "Fill in your basic information and career goals",
    category: "document",
    status: "done",
    impactScore: 5,
    estimatedTime: "7:00 AM",
    order: 0,
    completedAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Skills Assessment",
    description: "Take the skills assessment to identify your strengths",
    category: "learning",
    status: "done",
    impactScore: 8,
    estimatedTime: "8:00 AM",
    order: 1,
  },
  {
    id: "3",
    title: "Career Path Meeting",
    description:
      "Discuss team tasks and align on career objectives for the quarter",
    category: "network",
    status: "active",
    impactScore: 10,
    estimatedTime: "9:00 AM",
    order: 2,
    resources: [
      { id: "r1", title: "Career Planning Guide", url: "#", type: "article" },
      { id: "r2", title: "Goal Setting Template", url: "#", type: "tool" },
    ],
  },
  {
    id: "4",
    title: "Resume Review",
    description: "Get your resume reviewed with AI suggestions for improvement",
    category: "document",
    status: "locked",
    impactScore: 7,
    estimatedTime: "10:00 AM",
    order: 3,
  },
  {
    id: "5",
    title: "Build Portfolio Project",
    description:
      "Start working on a portfolio project that showcases your skills",
    category: "project",
    status: "locked",
    impactScore: 15,
    estimatedTime: "2:00 PM",
    order: 4,
  },
  {
    id: "6",
    title: "LinkedIn Optimization",
    description:
      "Update your LinkedIn profile with keywords for your target role",
    category: "network",
    status: "locked",
    impactScore: 6,
    estimatedTime: "4:00 PM",
    order: 5,
  },
];

export default function RoadmapScreen() {
  const [steps, setSteps] = useState<RoadmapStep[]>(MOCK_ROADMAP_STEPS);
  const [isLoading, setIsLoading] = useState(false);

  const { completeRoadmapItem, setJRScore, jrScore } = useDashboardStore();

  // In production, fetch roadmap from backend
  useEffect(() => {
    // fetchRoadmap();
  }, []);

  const handleStepPress = useCallback((step: RoadmapStep) => {
    console.log("Step pressed:", step.title);
  }, []);

  const handleStepComplete = useCallback(
    (stepId: string) => {
      // Update local state
      setSteps((prevSteps) => {
        const newSteps = prevSteps.map((step) => {
          if (step.id === stepId) {
            return {
              ...step,
              status: "done" as const,
              completedAt: new Date().toISOString(),
            };
          }
          return step;
        });

        // Find the completed step's index
        const completedIndex = newSteps.findIndex((s) => s.id === stepId);

        // Unlock next step if exists
        if (completedIndex !== -1 && completedIndex < newSteps.length - 1) {
          const nextStep = newSteps[completedIndex + 1];
          if (nextStep.status === "locked") {
            newSteps[completedIndex + 1] = {
              ...nextStep,
              status: "active" as const,
            };
          }
        }

        return newSteps;
      });

      // Calculate impact on JR Score
      const completedStep = steps.find((s) => s.id === stepId);
      if (completedStep) {
        const newScore = Math.min(100, jrScore + completedStep.impactScore);
        setJRScore(newScore);

        // Show success feedback
        Alert.alert(
          "Task Completed! 🎉",
          `+${completedStep.impactScore} JR Score points earned`,
          [{ text: "Continue", style: "default" }]
        );
      }

      // In production, sync to backend
      // api.post('/roadmap/complete', { stepId });
    },
    [steps, jrScore, setJRScore]
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Main Content */}
      {isLoading ? (
        <RoadmapSkeleton />
      ) : (
        <Animated.View entering={FadeIn.duration(300)} style={styles.content}>
          <TimelineRoadmap
            steps={steps}
            currentDate={new Date()}
            onStepPress={handleStepPress}
            onStepComplete={handleStepComplete}
          />
        </Animated.View>
      )}

      {/* Bottom Tab Bar */}
      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    paddingTop: Platform.OS === "ios" ? 50 : 30,
  },
  content: {
    flex: 1,
  },
});

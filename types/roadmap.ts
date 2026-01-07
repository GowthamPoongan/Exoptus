/**
 * Roadmap Types
 *
 * Data model for career roadmap with actionable steps.
 * Each step is backend-driven with real status tracking.
 */

export type RoadmapStepStatus = "locked" | "active" | "done";
export type RoadmapCategory =
  | "skill"
  | "project"
  | "network"
  | "document"
  | "learning";

export interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  category: RoadmapCategory;
  status: RoadmapStepStatus;
  impactScore: number; // 1-10 how much this affects JR Score
  estimatedTime: string; // "30 mins", "2 hours", etc.
  order: number;
  completedAt?: string;
  resources?: RoadmapResource[];
}

export interface RoadmapResource {
  id: string;
  title: string;
  url: string;
  type: "video" | "article" | "course" | "tool";
}

export interface RoadmapData {
  userId: string;
  steps: RoadmapStep[];
  totalSteps: number;
  completedSteps: number;
  nextStep: RoadmapStep | null;
  lastUpdated: string;
}

export const ROADMAP_CATEGORY_CONFIG = {
  skill: { icon: "code", color: "#3B82F6", label: "Skill Building" },
  project: { icon: "briefcase", color: "#10B981", label: "Project" },
  network: { icon: "users", color: "#8B5CF6", label: "Networking" },
  document: { icon: "file-text", color: "#F59E0B", label: "Documentation" },
  learning: { icon: "book-open", color: "#EC4899", label: "Learning" },
} as const;

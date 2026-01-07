/**
 * JR Score Types
 *
 * Deterministic scoring system with 4 measurable dimensions:
 * - Clarity: Goal specificity, role selection, contradictions (0-25)
 * - Consistency: Answers match across questions (0-25)
 * - Readiness: Skills vs role gap (0-25)
 * - Execution: Actions completed (resume, roadmap steps) (0-25)
 *
 * Total = 100 points
 */

export interface JRScoreDimension {
  name: "clarity" | "consistency" | "readiness" | "execution";
  score: number; // 0-25
  maxScore: 25;
  label: string;
  description: string;
  factors: JRScoreFactor[];
}

export interface JRScoreFactor {
  id: string;
  name: string;
  weight: number;
  achieved: boolean;
  points: number;
}

export interface JRScoreBreakdown {
  total: number; // 0-100
  level: "unprepared" | "developing" | "competitive" | "job-ready";
  levelLabel: string;
  dimensions: {
    clarity: JRScoreDimension;
    consistency: JRScoreDimension;
    readiness: JRScoreDimension;
    execution: JRScoreDimension;
  };
  lastUpdated: string;
  changeFromLast: number; // +/- points
}

export interface JRScoreHistory {
  date: string;
  score: number;
  breakdown?: JRScoreBreakdown;
}

// Scoring thresholds
export const JR_SCORE_LEVELS = {
  UNPREPARED: { min: 0, max: 30, label: "Unprepared", color: "#EF4444" },
  DEVELOPING: { min: 30, max: 55, label: "Developing", color: "#F97316" },
  COMPETITIVE: { min: 55, max: 75, label: "Competitive", color: "#3B82F6" },
  JOB_READY: { min: 75, max: 100, label: "Job Ready", color: "#10B981" },
} as const;

export const getJRScoreLevel = (
  score: number
): (typeof JR_SCORE_LEVELS)[keyof typeof JR_SCORE_LEVELS] => {
  if (score < 30) return JR_SCORE_LEVELS.UNPREPARED;
  if (score < 55) return JR_SCORE_LEVELS.DEVELOPING;
  if (score < 75) return JR_SCORE_LEVELS.COMPETITIVE;
  return JR_SCORE_LEVELS.JOB_READY;
};

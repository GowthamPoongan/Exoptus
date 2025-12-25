/**
 * @exoptus/feature-flags
 *
 * Feature flag management for EXOPTUS
 * Supports local, remote, and A/B testing configurations
 */

// ============================================
// Types
// ============================================

export type FeatureFlagValue = boolean | string | number;

export interface FeatureFlag {
  name: string;
  description: string;
  defaultValue: FeatureFlagValue;
  enabled: boolean;
  variants?: Record<string, FeatureFlagValue>;
}

export interface FeatureFlagConfig {
  flags: Record<string, FeatureFlag>;
  environment: "development" | "staging" | "production";
}

// ============================================
// Default Flags
// ============================================

export const defaultFlags: Record<string, FeatureFlag> = {
  // Onboarding Features
  ONBOARDING_V2: {
    name: "ONBOARDING_V2",
    description: "Enable new conversational onboarding flow",
    defaultValue: true,
    enabled: true,
  },
  ODYSSEY_AI_ENABLED: {
    name: "ODYSSEY_AI_ENABLED",
    description: "Enable Odyssey AI assistant in onboarding",
    defaultValue: true,
    enabled: true,
  },
  RESUME_ANALYSIS_ENABLED: {
    name: "RESUME_ANALYSIS_ENABLED",
    description: "Enable AI-powered resume analysis",
    defaultValue: true,
    enabled: true,
  },

  // Dashboard Features
  JR_SCORE_ENABLED: {
    name: "JR_SCORE_ENABLED",
    description: "Enable Job Readiness Score on dashboard",
    defaultValue: true,
    enabled: true,
  },
  ROADMAP_ENABLED: {
    name: "ROADMAP_ENABLED",
    description: "Enable career roadmap feature",
    defaultValue: true,
    enabled: true,
  },
  EXPLORE_ENABLED: {
    name: "EXPLORE_ENABLED",
    description: "Enable job exploration feature",
    defaultValue: true,
    enabled: true,
  },

  // Experimental Features
  DARK_MODE_ONLY: {
    name: "DARK_MODE_ONLY",
    description: "Force dark mode across the app",
    defaultValue: true,
    enabled: true,
  },
  HAPTIC_FEEDBACK: {
    name: "HAPTIC_FEEDBACK",
    description: "Enable haptic feedback on interactions",
    defaultValue: true,
    enabled: true,
  },
  ANALYTICS_ENABLED: {
    name: "ANALYTICS_ENABLED",
    description: "Enable usage analytics collection",
    defaultValue: false,
    enabled: false,
  },

  // Development Features
  DEV_TOOLS: {
    name: "DEV_TOOLS",
    description: "Enable developer tools and debug overlays",
    defaultValue: false,
    enabled: process.env.NODE_ENV === "development",
  },
  MOCK_API: {
    name: "MOCK_API",
    description: "Use mock API responses for development",
    defaultValue: false,
    enabled: false,
  },
};

// ============================================
// Feature Flag Client
// ============================================

class FeatureFlagClient {
  private flags: Record<string, FeatureFlag>;
  private overrides: Record<string, FeatureFlagValue>;

  constructor(initialFlags?: Record<string, FeatureFlag>) {
    this.flags = { ...defaultFlags, ...initialFlags };
    this.overrides = {};
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(flagName: string): boolean {
    // Check overrides first
    if (flagName in this.overrides) {
      return Boolean(this.overrides[flagName]);
    }

    const flag = this.flags[flagName];
    if (!flag) {
      console.warn(`Feature flag "${flagName}" not found`);
      return false;
    }

    return flag.enabled;
  }

  /**
   * Get the value of a feature flag
   */
  getValue<T extends FeatureFlagValue>(flagName: string): T | undefined {
    // Check overrides first
    if (flagName in this.overrides) {
      return this.overrides[flagName] as T;
    }

    const flag = this.flags[flagName];
    if (!flag) {
      console.warn(`Feature flag "${flagName}" not found`);
      return undefined;
    }

    return flag.defaultValue as T;
  }

  /**
   * Get a variant value for A/B testing
   */
  getVariant(
    flagName: string,
    variantKey: string
  ): FeatureFlagValue | undefined {
    const flag = this.flags[flagName];
    if (!flag || !flag.variants) {
      return undefined;
    }
    return flag.variants[variantKey];
  }

  /**
   * Override a flag value (useful for testing)
   */
  override(flagName: string, value: FeatureFlagValue): void {
    this.overrides[flagName] = value;
  }

  /**
   * Clear all overrides
   */
  clearOverrides(): void {
    this.overrides = {};
  }

  /**
   * Update flags from remote config
   */
  updateFlags(newFlags: Partial<Record<string, Partial<FeatureFlag>>>): void {
    for (const [key, updates] of Object.entries(newFlags)) {
      if (this.flags[key] && updates) {
        this.flags[key] = { ...this.flags[key], ...updates };
      }
    }
  }

  /**
   * Get all flags
   */
  getAllFlags(): Record<string, FeatureFlag> {
    return { ...this.flags };
  }
}

// ============================================
// Singleton Instance
// ============================================

export const featureFlags = new FeatureFlagClient();

// ============================================
// React Hook (for mobile app)
// ============================================

/**
 * Hook to check if a feature is enabled
 * Usage: const isEnabled = useFeatureFlag('FEATURE_NAME')
 */
export function useFeatureFlag(flagName: string): boolean {
  return featureFlags.isEnabled(flagName);
}

/**
 * Hook to get feature flag value
 * Usage: const value = useFeatureFlagValue<string>('FEATURE_NAME')
 */
export function useFeatureFlagValue<T extends FeatureFlagValue>(
  flagName: string
): T | undefined {
  return featureFlags.getValue<T>(flagName);
}

// Export the client class for testing
export { FeatureFlagClient };

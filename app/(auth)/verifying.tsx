import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Platform,
  StatusBar,
  Dimensions,
  Image,
  StyleSheet,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  withSpring,
  Easing,
} from "react-native-reanimated";
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from "react-native-svg";
import { useUserStore } from "../../store/userStore";
import authService from "../../services/auth";

const { width, height } = Dimensions.get("window");

/**
 * Verified Badge Component
 * Beautiful Twitter/Meta-style verified badge with scalloped edges
 * and animated entrance
 */
const VerifiedBadge = ({
  size = 120,
  isVerified = false,
}: {
  size?: number;
  isVerified?: boolean;
}) => {
  // Animation values
  const badgeScale = useSharedValue(0);
  const badgeRotation = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isVerified) {
      // Badge entrance with satisfying bounce
      badgeScale.value = withSpring(1, {
        damping: 12,
        stiffness: 180,
      });

      // Slight rotation for dynamic feel
      badgeRotation.value = withSequence(
        withTiming(-8, { duration: 150 }),
        withSpring(0, { damping: 8 })
      );

      // Glow pulse
      glowOpacity.value = withDelay(
        200,
        withSequence(
          withTiming(0.7, { duration: 300 }),
          withTiming(0.35, { duration: 500 })
        )
      );

      // Continuous subtle pulse for "alive" feel
      pulseScale.value = withDelay(
        700,
        withRepeat(
          withSequence(
            withTiming(1.05, {
              duration: 1500,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        )
      );
    }
  }, [isVerified]);

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: badgeScale.value },
      { rotate: `${badgeRotation.value}deg` },
    ],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <View style={[styles.badgeContainer, { width: size, height: size }]}>
      {/* Outer glow effect */}
      <Animated.View
        style={[
          styles.badgeGlow,
          glowAnimatedStyle,
          {
            width: size * 1.6,
            height: size * 1.6,
            borderRadius: size * 0.8,
          },
        ]}
      />

      {/* Main badge SVG */}
      <Animated.View style={[styles.badgeWrapper, badgeAnimatedStyle]}>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Defs>
            {/* Premium blue gradient */}
            <SvgGradient id="badgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#1D9BF0" />
              <Stop offset="50%" stopColor="#0066FF" />
              <Stop offset="100%" stopColor="#0044CC" />
            </SvgGradient>
            {/* Shadow gradient for depth */}
            <SvgGradient id="badgeShadow" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#0044CC" />
              <Stop offset="100%" stopColor="#002288" />
            </SvgGradient>
          </Defs>

          {/* Badge shadow layer for 3D depth */}
          <Path
            d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.66 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
            fill="url(#badgeShadow)"
            transform="translate(0.3, 0.5)"
          />

          {/* Main badge shape - Twitter-style scalloped edges */}
          <Path
            d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.66 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
            fill="url(#badgeGradient)"
          />

          {/* White checkmark */}
          <Path
            d="M9.5 12.5l2 2 4-5"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

/**
 * Loading Spinner Component
 * Elegant spinning arc animation while verifying
 */
const LoadingSpinner = ({ size = 100 }: { size?: number }) => {
  const rotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Continuous smooth rotation
    rotation.value = withRepeat(
      withTiming(360, { duration: 1400, easing: Easing.linear }),
      -1,
      false
    );

    // Subtle breathing effect
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: pulseScale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.spinnerContainer,
        spinnerStyle,
        { width: size, height: size },
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <SvgGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#0066FF" stopOpacity="1" />
            <Stop offset="100%" stopColor="#0066FF" stopOpacity="0" />
          </SvgGradient>
        </Defs>
        {/* Spinning arc */}
        <Path
          d="M50 10 A40 40 0 1 1 10 50"
          stroke="url(#spinnerGradient)"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
};

type VerifyState = "verifying" | "verified" | "error";

// Module-level flags - synchronous lock prevents race condition
let isVerificationInProgress = false;
let cachedVerificationResult: {
  success: boolean;
  user?: any;
  error?: string;
  route?: string;
} | null = null;

export default function VerifyingScreen() {
  const params = useLocalSearchParams<{
    token?: string; // Raw token (needs POST verification)
    jwt?: string; // JWT token (already verified via GET)
    redirectTo?: string; // Redirect path from server
    user?: string; // User data JSON from server
  }>();
  const [state, setState] = useState<VerifyState>(() => {
    // Restore state from cache if available
    if (cachedVerificationResult?.success) return "verified";
    if (cachedVerificationResult && !cachedVerificationResult.success)
      return "error";
    return "verifying";
  });
  const [errorMessage, setErrorMessage] = useState(
    () => cachedVerificationResult?.error || ""
  );
  const [userRoute, setUserRoute] = useState<string>(
    () => cachedVerificationResult?.route || "/(onboarding)/chat"
  );
  const { setUser } = useUserStore();

  // Animation values
  const contentOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.9);

  // Verification function - can be called for retry
  const verifyToken = async () => {
    try {
      // CASE A: JWT already provided (verified via GET endpoint)
      // No need to call POST - server already verified & created session
      if (params.jwt && params.user) {
        try {
          const userData = JSON.parse(decodeURIComponent(params.user));
          const route = params.redirectTo
            ? decodeURIComponent(params.redirectTo)
            : userData.onboardingStatus === "completed"
            ? "/(main)/home"
            : "/(onboarding)/chat";

          // Store the JWT token for future API calls
          await authService.storeToken(params.jwt);

          cachedVerificationResult = { success: true, user: userData, route };
          isVerificationInProgress = false;

          setUser(userData);
          setState("verified");
          setUserRoute(route);

          // Animate button entrance
          buttonOpacity.value = withDelay(
            1200,
            withTiming(1, { duration: 400 })
          );
          buttonScale.value = withDelay(1200, withSpring(1, { damping: 10 }));
          return;
        } catch (parseError) {
          console.error("Failed to parse user data from JWT flow:", parseError);
          // Fall through to token verification as fallback
        }
      }

      // CASE B: Raw token provided (needs POST verification)
      if (!params.token) {
        cachedVerificationResult = {
          success: false,
          error: "Invalid verification link. Please request a new magic link.",
        };
        isVerificationInProgress = false;
        setState("error");
        setErrorMessage(cachedVerificationResult.error!);
        return;
      }

      const result = await authService.verifyMagicLink(params.token);

      // Cache the result
      if (result.success && result.user) {
        const route =
          result.user.onboardingStatus === "completed"
            ? "/(main)/home"
            : "/(onboarding)/chat";

        cachedVerificationResult = { success: true, user: result.user, route };
        isVerificationInProgress = false;

        setUser(result.user);
        setState("verified");
        setUserRoute(route);

        // Animate button entrance
        buttonOpacity.value = withDelay(1200, withTiming(1, { duration: 400 }));
        buttonScale.value = withDelay(1200, withSpring(1, { damping: 10 }));

        // User must click Continue button to proceed (no auto-redirect)
      } else {
        cachedVerificationResult = {
          success: false,
          error:
            result.error || "Verification failed. The link may have expired.",
        };
        isVerificationInProgress = false;

        // Show more helpful error info in the UI
        setState("error");
        setErrorMessage(
          (cachedVerificationResult.error || "Verification failed") +
            (result?.debug ? ` — ${result.debug}` : "")
        );
      }
    } catch (error: any) {
      cachedVerificationResult = {
        success: false,
        error: error?.message || "Something went wrong. Please try again.",
      };
      isVerificationInProgress = false;

      setState("error");
      setErrorMessage(cachedVerificationResult.error!);
    }
  };

  useEffect(() => {
    // Entrance animation
    contentOpacity.value = withTiming(1, { duration: 500 });
    titleTranslateY.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });

    // CASE 1: Already have cached result (from previous mount)
    if (cachedVerificationResult) {
      if (cachedVerificationResult.success && cachedVerificationResult.user) {
        setUser(cachedVerificationResult.user);
        setState("verified");
        setUserRoute(cachedVerificationResult.route || "/(onboarding)/chat");
        buttonOpacity.value = withDelay(500, withTiming(1, { duration: 400 }));
        buttonScale.value = withDelay(500, withSpring(1, { damping: 10 }));
      } else {
        setState("error");
        setErrorMessage(
          cachedVerificationResult.error || "Verification failed"
        );
      }
      return;
    }

    // CASE 2: Another mount is already verifying - wait for it
    if (isVerificationInProgress) {
      // Poll for cached result
      const pollInterval = setInterval(() => {
        if (cachedVerificationResult) {
          clearInterval(pollInterval);
          if (
            cachedVerificationResult.success &&
            cachedVerificationResult.user
          ) {
            setUser(cachedVerificationResult.user);
            setState("verified");
            setUserRoute(
              cachedVerificationResult.route || "/(onboarding)/chat"
            );
            buttonOpacity.value = withDelay(
              500,
              withTiming(1, { duration: 400 })
            );
            buttonScale.value = withDelay(500, withSpring(1, { damping: 10 }));
          } else {
            setState("error");
            setErrorMessage(
              cachedVerificationResult.error || "Verification failed"
            );
          }
        }
      }, 100);

      // Cleanup interval
      return () => {
        clearInterval(pollInterval);
      };
    }

    // CASE 3: First mount - start verification
    isVerificationInProgress = true;
    verifyToken();
  }, [params.token]);

  // Clear cache when user navigates away (e.g., presses back)
  useEffect(() => {
    return () => {
      // Delay to survive StrictMode remount
      setTimeout(() => {
        if (!isVerificationInProgress) {
          cachedVerificationResult = null;
        }
      }, 1000);
    };
  }, []);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  const handleBack = () => {
    router.back();
  };

  const handleRetry = () => {
    setState("verifying");
    setErrorMessage("");
    verifyToken();
  };

  const handleContinue = () => {
    router.replace(userRoute as any);
  };

  const getTitle = () => {
    switch (state) {
      case "verifying":
        return "Verifying your identity";
      case "verified":
        return "You're verified!";
      case "error":
        return "Verification failed";
    }
  };

  const getSubtitle = () => {
    switch (state) {
      case "verifying":
        return "Please wait while we securely verify your email...";
      case "verified":
        return "Welcome to Exoptus. Let's start your journey.";
      case "error":
        return errorMessage;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Light gradient background */}
      <LinearGradient
        colors={["#f8fafc", "#f1f5f9", "#ffffff"]}
        style={styles.gradientBackground}
      />

      <Animated.View style={[styles.content, contentAnimatedStyle]}>
        {/* Header with tagline */}
        <View style={styles.headerContainer}>
          <Image
            source={require("../../assets/images/tagline.png")}
            style={{ width: width * 0.7, height: 100 }}
            resizeMode="contain"
          />
        </View>

        {/* Main content area */}
        <View style={styles.mainContent}>
          {/* Badge or Spinner */}
          <View style={styles.badgeArea}>
            {state === "verifying" ? (
              <LoadingSpinner size={120} />
            ) : state === "verified" ? (
              <VerifiedBadge size={120} isVerified={true} />
            ) : (
              <View style={styles.errorIcon}>
                <Text style={styles.errorIconText}>!</Text>
              </View>
            )}
          </View>

          {/* Status text */}
          <Animated.View style={[styles.textArea, titleAnimatedStyle]}>
            <Text style={styles.title}>{getTitle()}</Text>
            <Text style={styles.subtitle}>{getSubtitle()}</Text>
          </Animated.View>
        </View>

        {/* Bottom actions */}
        <View style={styles.bottomArea}>
          {state === "verified" && (
            <Animated.View style={buttonAnimatedStyle}>
              <Pressable
                style={({ pressed }) => [
                  styles.continueButton,
                  {
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
                onPress={handleContinue}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </Pressable>
            </Animated.View>
          )}

          {state === "error" && (
            <Pressable
              style={({ pressed }) => [
                styles.retryButton,
                {
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
              onPress={handleRetry}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          )}

          {state === "verifying" && (
            <Pressable onPress={handleBack} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  gradientBackground: {
    position: "absolute",
    width: width,
    height: height,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  headerContainer: {
    paddingTop: Platform.OS === "ios" ? 80 : 60,
    alignItems: "center",
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -60,
  },
  badgeArea: {
    marginBottom: 48,
  },
  badgeContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  badgeGlow: {
    position: "absolute",
    backgroundColor: "#0066FF",
    opacity: 0.25,
  },
  badgeWrapper: {
    // Enhanced shadow for premium 3D effect
    shadowColor: "#0066FF",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 15,
  },
  spinnerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  textArea: {
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 14,
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 24,
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  errorIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  errorIconText: {
    fontSize: 52,
    fontWeight: "700",
    color: "#ffffff",
  },
  bottomArea: {
    paddingBottom: Platform.OS === "ios" ? 50 : 34,
    alignItems: "center",
  },
  continueButton: {
    backgroundColor: "#0066FF",
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
    shadowColor: "#0066FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  continueButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
    letterSpacing: 0.3,
  },
  retryButton: {
    backgroundColor: "#0066FF",
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
    shadowColor: "#0066FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  cancelButton: {
    paddingVertical: 14,
  },
  cancelButtonText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "500",
  },
});

import React, { useRef, useState, useEffect, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

/**
 * Cinematic Intro Carousel
 *
 * - Video plays → PAUSES → Text appears
 * - User taps Next → Next video plays
 * - Final slide → Go to Home (no logo reveal)
 */

const CAROUSEL_SLIDES = [
  {
    video: require("../../assets/videos/carousel_clip_1.mp4"),
    pauseAtPercent: 0.8,
    title: "Navigate Confusion into Clarity",
    subtitle: "Career guidance built from real industry insight.",
    buttonText: "Next",
  },
  {
    video: require("../../assets/videos/carousel_clip_2.mp4"),
    pauseAtPercent: 0.8,
    title: "Learn from Verified Professionals",
    subtitle:
      "Not generic answers. Real wisdom from those who've walked the path.",
    buttonText: "Next",
  },
  {
    video: require("../../assets/videos/carousel_clip_3.mp4"),
    pauseAtPercent: 0.8,
    title: "Education → Direction → Outcomes",
    subtitle: "Turn your learning into a clear career trajectory.",
    buttonText: "Let's Start Your Journey",
    isFinal: true,
  },
];

export default function IntroCarousel() {
  const router = useRouter();
  const videoRef = useRef<Video>(null);

  // Pause/play based on app state to avoid AudioFocusNotAcquiredException
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        try {
          if (nextState !== "active") {
            // pause when backgrounded
            videoRef.current?.pauseAsync().catch(() => {});
          } else {
            // resume only if content overlay not shown and not already playing
            videoRef.current
              ?.getStatusAsync()
              .then((st) => {
                if (st && !st.isPlaying && !showContent) {
                  videoRef.current?.playAsync().catch(() => {});
                }
              })
              .catch(() => {});
          }
        } catch (e) {
          // ignore audio focus errors
        }
      }
    );

    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showContent]);

  const hasPausedRef = useRef(false);
  const videoDurationRef = useRef(0);
  const hasStartedRef = useRef(false);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);

  const overlayOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);
  const cardOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.9);

  const currentSlideData = CAROUSEL_SLIDES[currentSlide];

  const showOverlayContent = useCallback(() => {
    setShowContent(true);
    overlayOpacity.value = withTiming(1, { duration: 400 });
    cardOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) })
    );
    cardTranslateY.value = withDelay(
      200,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) })
    );
    buttonOpacity.value = withDelay(700, withTiming(1, { duration: 400 }));
    buttonScale.value = withDelay(
      700,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) })
    );
  }, [overlayOpacity, cardOpacity, cardTranslateY, buttonOpacity, buttonScale]);

  const onPlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) {
        // Handle error state
        if (status.error) {
          console.error("Video playback error:", status.error);
          setVideoError(true);
          setIsLoading(false);
          // Show content anyway so user isn't stuck
          showOverlayContent();
        }
        return;
      }

      // Video is loaded
      if (!hasStartedRef.current && status.isPlaying) {
        hasStartedRef.current = true;
        setIsLoading(false);
      }

      // Store duration when first available
      if (status.durationMillis && videoDurationRef.current === 0) {
        videoDurationRef.current = status.durationMillis;
      }

      // Check if we should pause and show content
      try {
        if (
          !hasPausedRef.current &&
          videoDurationRef.current > 0 &&
          currentSlideData &&
          typeof currentSlideData.pauseAtPercent === "number"
        ) {
          const currentTime = status.positionMillis || 0;
          const pauseTime =
            videoDurationRef.current * currentSlideData.pauseAtPercent;

          if (currentTime >= pauseTime) {
            hasPausedRef.current = true;
            videoRef.current?.pauseAsync().catch(() => {});
            showOverlayContent();
          }
        }
      } catch (e) {
        // Defensive: if slide data is undefined or any unexpected error occurs,
        // avoid crashing the app and show the content overlay so the user can continue.
        console.warn("IntroCarousel playback guard hit:", e);
        if (!showContent) showOverlayContent();
      }
    },
    [currentSlideData.pauseAtPercent, showOverlayContent]
  );

  // Timeout to prevent getting stuck if video doesn't load
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading && !showContent) {
        console.warn("Video loading timeout - showing content anyway");
        setIsLoading(false);
        showOverlayContent();
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, [currentSlide, isLoading, showContent, showOverlayContent]);

  const hideOverlayContent = (callback: () => void) => {
    buttonOpacity.value = withTiming(0, { duration: 200 });
    buttonScale.value = withTiming(0.9, { duration: 200 });
    cardOpacity.value = withTiming(0, { duration: 300 });
    cardTranslateY.value = withTiming(30, { duration: 300 });
    overlayOpacity.value = withTiming(0, { duration: 400 }, () => {
      runOnJS(callback)();
    });
  };

  const handleNext = () => {
    if (currentSlideData.isFinal) {
      // Final slide → go directly to home (no logo reveal)
      hideOverlayContent(() => {
        router.replace("/(main)/home");
      });
    } else {
      hideOverlayContent(async () => {
        setShowContent(false);
        try {
          await videoRef.current?.playAsync();
        } catch (err) {
          // ignore audio focus / background playback errors
          console.warn("Video play failed (ignored):", err?.message || err);
        }
        setTimeout(() => {
          hasPausedRef.current = false;
          videoDurationRef.current = 0;
          setCurrentSlide((prev) => prev + 1);
        }, 400);
      });
    }
  };

  // Reset state when slide changes
  useEffect(() => {
    overlayOpacity.value = 0;
    cardOpacity.value = 0;
    cardTranslateY.value = 50;
    buttonOpacity.value = 0;
    buttonScale.value = 0.9;
    hasPausedRef.current = false;
    hasStartedRef.current = false;
    videoDurationRef.current = 0;
    setIsLoading(true);
    setVideoError(false);
    setShowContent(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlide]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <Video
        ref={videoRef}
        key={`carousel-${currentSlide}`}
        source={currentSlideData.video}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={true}
        isLooping={false}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        onError={(error) => {
          console.error("Video error:", error);
          setVideoError(true);
          setIsLoading(false);
          showOverlayContent();
        }}
        onLoad={() => {
          console.log("Video loaded for slide", currentSlide);
        }}
      />

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.7)"]}
        locations={[0, 0.5, 1]}
        style={styles.gradientOverlay}
      />

      {/* Loading indicator */}
      {isLoading && !showContent && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A855F7" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      {showContent && (
        <Animated.View style={[styles.contentOverlay, overlayStyle]}>
          <Animated.View style={[styles.glassCardContainer, cardStyle]}>
            <BlurView intensity={25} tint="dark" style={styles.glassCard}>
              <LinearGradient
                colors={["rgba(255,255,255,0.15)", "rgba(255,255,255,0.05)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.glassCardInner}
              >
                <View style={styles.progressDots}>
                  {CAROUSEL_SLIDES.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.dot,
                        index === currentSlide && styles.dotActive,
                        index < currentSlide && styles.dotCompleted,
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.title}>{currentSlideData.title}</Text>
                <Text style={styles.subtitle}>{currentSlideData.subtitle}</Text>
              </LinearGradient>
            </BlurView>
          </Animated.View>

          <Animated.View style={[styles.buttonContainer, buttonStyle]}>
            <TouchableOpacity onPress={handleNext} activeOpacity={0.9}>
              <LinearGradient
                colors={
                  currentSlideData.isFinal
                    ? ["#A855F7", "#7C3AED"]
                    : ["rgba(255,255,255,0.15)", "rgba(255,255,255,0.05)"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.button,
                  currentSlideData.isFinal && styles.buttonFinal,
                ]}
              >
                <Text
                  style={[
                    styles.buttonText,
                    currentSlideData.isFinal && styles.buttonTextFinal,
                  ]}
                >
                  {currentSlideData.buttonText}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  video: {
    ...StyleSheet.absoluteFillObject,
    width: width,
    height: height,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  contentOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  glassCardContainer: {
    marginBottom: 24,
  },
  glassCard: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  glassCardInner: {
    padding: 28,
  },
  progressDots: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  dotActive: {
    width: 24,
    backgroundColor: "#A855F7",
  },
  dotCompleted: {
    backgroundColor: "#C084FC",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 24,
  },
  buttonContainer: {
    alignItems: "center",
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    minWidth: 160,
    alignItems: "center",
  },
  buttonFinal: {
    paddingHorizontal: 40,
    minWidth: width - 80,
    borderColor: "transparent",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
  buttonTextFinal: {
    color: "#FFFFFF",
    fontSize: 17,
  },
});

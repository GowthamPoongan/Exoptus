/**
 * Odyssey AI Screen
 *
 * Full-screen AI assistant experience.
 * Features floating orb, suggestion cards, and input bar.
 *
 * UX Intent:
 * - Calm, intelligent presence
 * - Beautiful abstract gradient background
 * - Focused interaction without distractions
 */

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Dimensions,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
  FadeInUp,
  SlideInDown,
  interpolate,
} from "react-native-reanimated";
import Svg, {
  Path,
  Circle,
  Defs,
  RadialGradient,
  Stop,
  LinearGradient as SvgLinearGradient,
} from "react-native-svg";
import { router } from "expo-router";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Icons
const BackIcon = ({
  color = "#FFFFFF",
  size = 24,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 19L5 12L12 5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SendIcon = ({
  color = "#FFFFFF",
  size = 24,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 2L11 13"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M22 2L15 22L11 13L2 9L22 2Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const MicIcon = ({
  color = "#FFFFFF",
  size = 24,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 1C11.2044 1 10.4413 1.31607 9.87868 1.87868C9.31607 2.44129 9 3.20435 9 4V12C9 12.7956 9.31607 13.5587 9.87868 14.1213C10.4413 14.6839 11.2044 15 12 15C12.7956 15 13.5587 14.6839 14.1213 14.1213C14.6839 13.5587 15 12.7956 15 12V4C15 3.20435 14.6839 2.44129 14.1213 1.87868C13.5587 1.31607 12.7956 1 12 1Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19 10V12C19 13.8565 18.2625 15.637 16.9497 16.9497C15.637 18.2625 13.8565 19 12 19C10.1435 19 8.36301 18.2625 7.05025 16.9497C5.7375 15.637 5 13.8565 5 12V10"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 19V23"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 23H16"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Suggestion data
const SUGGESTIONS = [
  { id: "1", emoji: "🎯", text: "Career advice" },
  { id: "2", emoji: "📚", text: "Learning path" },
  { id: "3", emoji: "💼", text: "Interview prep" },
  { id: "4", emoji: "📝", text: "Resume tips" },
];

// Animated Orb Component with Rotating Logo
const OdysseyOrb = () => {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const pulseOpacity = useSharedValue(0.3);
  const innerRotate = useSharedValue(0);

  useEffect(() => {
    // Gentle floating animation
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Slow outer rotation
    rotate.value = withRepeat(
      withTiming(360, { duration: 30000, easing: Easing.linear }),
      -1,
      false
    );

    // Faster inner logo rotation (opposite direction)
    innerRotate.value = withRepeat(
      withTiming(-360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );

    // Pulse glow
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  const innerLogoStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${innerRotate.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // Ring segments for rotating effect
  const ringStyle1 = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
    opacity: interpolate(pulseOpacity.value, [0.3, 0.7], [0.4, 0.8]),
  }));

  const ringStyle2 = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-rotate.value * 0.7}deg` }],
    opacity: interpolate(pulseOpacity.value, [0.3, 0.7], [0.3, 0.6]),
  }));

  return (
    <View style={styles.orbContainer}>
      {/* Outer glow */}
      <Animated.View style={[styles.orbOuterGlow, glowStyle]} />

      {/* Rotating ring 1 */}
      <Animated.View style={[styles.rotatingRing, styles.ring1, ringStyle1]} />

      {/* Rotating ring 2 */}
      <Animated.View style={[styles.rotatingRing, styles.ring2, ringStyle2]} />

      {/* Middle glow */}
      <Animated.View style={[styles.orbMiddleGlow, glowStyle]} />

      {/* Main Orb */}
      <Animated.View style={[styles.orb, orbStyle]}>
        <LinearGradient
          colors={["#C4B5FD", "#A78BFA", "#8B5CF6", "#7C3AED"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.orbGradient}
        >
          {/* Inner rotating logo */}
          <Animated.View style={[styles.innerLogoContainer, innerLogoStyle]}>
            <Image
              source={require("../../assets/images/odyssey-avatar.png")}
              style={styles.innerLogo}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Inner highlight */}
          <View style={styles.orbHighlight} />
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

interface OdysseyScreenProps {
  onClose?: () => void;
}

export default function OdysseyScreen() {
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleClose = () => {
    router.back();
  };

  const handleSend = () => {
    if (inputText.trim()) {
      // In a real app, this would send the message to the AI
      setInputText("");
    }
  };

  const handleSuggestionPress = (suggestion: (typeof SUGGESTIONS)[0]) => {
    setInputText(suggestion.text);
  };

  return (
    <View style={styles.container}>
      {/* Abstract Gradient Background */}
      <LinearGradient
        colors={["#1a1a2e", "#16213e", "#1a1a2e"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Gradient Orbs Background */}
      <View style={styles.bgOrbsContainer}>
        <Animated.View
          entering={FadeIn.duration(1000)}
          style={[styles.bgOrb, styles.bgOrb1]}
        >
          <LinearGradient
            colors={["rgba(139, 92, 246, 0.4)", "rgba(139, 92, 246, 0)"]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View
          entering={FadeIn.duration(1000).delay(200)}
          style={[styles.bgOrb, styles.bgOrb2]}
        >
          <LinearGradient
            colors={["rgba(236, 72, 153, 0.3)", "rgba(236, 72, 153, 0)"]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View
          entering={FadeIn.duration(1000).delay(400)}
          style={[styles.bgOrb, styles.bgOrb3]}
        >
          <LinearGradient
            colors={["rgba(59, 130, 246, 0.3)", "rgba(59, 130, 246, 0)"]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>

      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          {Platform.OS === "ios" ? (
            <BlurView intensity={40} tint="dark" style={styles.backButtonBlur}>
              <BackIcon color="#FFFFFF" size={22} />
            </BlurView>
          ) : (
            <View style={styles.backButtonAndroid}>
              <BackIcon color="#FFFFFF" size={22} />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Main Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Greeting */}
          <Animated.View
            entering={FadeInUp.delay(200).springify()}
            style={styles.greetingContainer}
          >
            <Text style={styles.greetingText}>Speak your thoughts</Text>
            <Text style={styles.greetingSubtext}>homie</Text>
          </Animated.View>

          {/* Odyssey Orb */}
          <Animated.View
            entering={FadeIn.delay(400).duration(800)}
            style={styles.orbWrapper}
          >
            <OdysseyOrb />
          </Animated.View>

          {/* Suggestions */}
          <Animated.View
            entering={FadeInUp.delay(600).springify()}
            style={styles.suggestionsContainer}
          >
            <View style={styles.suggestionsRow}>
              {SUGGESTIONS.map((suggestion, index) => (
                <TouchableOpacity
                  key={suggestion.id}
                  style={styles.suggestionCard}
                  onPress={() => handleSuggestionPress(suggestion)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.suggestionEmoji}>{suggestion.emoji}</Text>
                  <Text style={styles.suggestionText}>{suggestion.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </ScrollView>

        {/* Input Bar */}
        <Animated.View
          entering={SlideInDown.delay(800).springify()}
          style={styles.inputContainer}
        >
          {Platform.OS === "ios" ? (
            <BlurView intensity={50} tint="dark" style={styles.inputBlur}>
              <InputContent />
            </BlurView>
          ) : (
            <View style={styles.inputAndroid}>
              <InputContent />
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );

  function InputContent() {
    return (
      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          placeholder="Write down instead..."
          placeholderTextColor="#71717A"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            inputText.trim()
              ? styles.sendButtonActive
              : styles.sendButtonInactive,
          ]}
          onPress={
            inputText.trim() ? handleSend : () => setIsListening(!isListening)
          }
          activeOpacity={0.8}
        >
          {inputText.trim() ? (
            <SendIcon color="#FFFFFF" size={20} />
          ) : (
            <MicIcon color={isListening ? "#EC4899" : "#FFFFFF"} size={20} />
          )}
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0F",
  },
  bgOrbsContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  bgOrb: {
    position: "absolute",
    borderRadius: 999,
  },
  bgOrb1: {
    width: 400,
    height: 400,
    top: -100,
    right: -100,
  },
  bgOrb2: {
    width: 300,
    height: 300,
    bottom: 200,
    left: -100,
  },
  bgOrb3: {
    width: 250,
    height: 250,
    bottom: -50,
    right: -50,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  backButtonBlur: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  backButtonAndroid: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === "ios" ? 140 : 120,
    paddingBottom: 100,
    alignItems: "center",
  },
  greetingContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: "300",
    color: "rgba(255, 255, 255, 0.7)",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
    letterSpacing: 0.5,
  },
  greetingSubtext: {
    fontSize: 28,
    fontWeight: "500",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
    marginTop: 4,
  },
  orbWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 40,
  },
  orbContainer: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  orbOuterGlow: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
  },
  rotatingRing: {
    position: "absolute",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(139, 92, 246, 0.4)",
  },
  ring1: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  ring2: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
  },
  orbMiddleGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(167, 139, 250, 0.25)",
  },
  orb: {
    width: 130,
    height: 130,
    borderRadius: 65,
    overflow: "hidden",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 35,
    elevation: 15,
  },
  orbGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  innerLogoContainer: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  innerLogo: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  orbHighlight: {
    position: "absolute",
    top: 12,
    left: 18,
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  suggestionsContainer: {
    paddingHorizontal: 20,
    width: "100%",
  },
  suggestionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  suggestionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  suggestionEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  inputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  inputBlur: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  inputAndroid: {
    borderRadius: 28,
    backgroundColor: "rgba(30, 30, 46, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  sendButtonActive: {
    backgroundColor: "#8B5CF6",
  },
  sendButtonInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
});

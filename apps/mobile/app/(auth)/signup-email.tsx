import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Image,
  StyleSheet,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useUserStore } from "../../store/userStore";
import authService from "../../../../services/auth";
import Constants from "expo-constants";

const { width, height } = Dimensions.get("window");

// Back Arrow Icon
const BackArrow = ({
  size = 24,
  color = "white",
}: {
  size?: number;
  color?: string;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M12 19l-7-7 7-7"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function SignupEmailScreen() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<TextInput>(null);
  const { setEmail: saveEmail } = useUserStore();

  // Animation values
  const headerOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(height);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    // Entrance animations
    headerOpacity.value = withTiming(1, { duration: 600 });
    cardTranslateY.value = withDelay(
      200,
      withSpring(0, { damping: 20, stiffness: 90 })
    );
    cardOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));

    // Auto focus input after animation
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleContinue = async () => {
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email");
      return;
    }

    setError("");
    setIsLoading(true);
    Keyboard.dismiss();

    try {
      // Save email locally first
      saveEmail(email);

      // Detect client source (expo vs dev build)
      const ownership = (Constants as any).appOwnership || "";
      const source = ownership === "expo" ? "expo" : "dev";

      // Call API to send magic link with source hint
      const result = await authService.sendMagicLink(email, source);

      if (result.success) {
        router.push("/(auth)/email-verification");
      } else {
        setError(result.error || "Failed to send verification email");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />

        {/* Background Image */}
        <Image
          source={require("../../assets/images/tagline.png")}
          style={styles.backgroundImage}
          resizeMode="cover"
        />

        {/* Gradient Overlay */}
        <LinearGradient
          colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.6)"]}
          style={styles.gradientOverlay}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          {/* Header Section */}
          <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
            {/* Back Button */}
            <Pressable onPress={handleBack} style={styles.backButton}>
              <View style={styles.backButtonCircle}>
                <BackArrow size={24} color="#1f2937" />
              </View>
            </Pressable>

            {/* Tagline Image */}
            <View style={styles.taglineContainer}>
              <Image
                source={require("../../assets/images/tagline.png")}
                style={{ width: width * 0.8, height: 240 }}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          {/* Bottom Card - White Screen */}
          <Animated.View style={[styles.cardContainer, cardAnimatedStyle]}>
            {/* Handle Bar */}
            <View style={styles.handleBar} />

            {/* Card Title */}
            <Text style={styles.cardTitle}>What's your Email address ?</Text>
            <Text style={styles.cardSubtitle}>
              Enter the email address at which you can be contacted.
            </Text>

            {/* Email Input */}
            <View
              style={[styles.inputContainer, error ? styles.inputError : null]}
            >
              <TextInput
                ref={inputRef}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError("");
                }}
                placeholder="Email address"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                style={styles.input}
              />
            </View>

            {/* Error Message */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Continue Button */}
            <Pressable
              onPress={handleContinue}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.continueButton,
                {
                  opacity: pressed && !isLoading ? 0.9 : 1,
                  transform: [{ scale: pressed && !isLoading ? 0.98 : 1 }],
                },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.continueButtonText}>Next</Text>
              )}
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  backgroundImage: {
    position: "absolute",
    width: width,
    height: height,
  },
  gradientOverlay: {
    position: "absolute",
    width: width,
    height: height,
  },
  headerContainer: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 60 : 50,
    paddingHorizontal: 24,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  taglineContainer: {
    marginTop: 5,
  },
  cardContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    minHeight: height * 0.5, // Occupy bottom half
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 24,
  },
  cardTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
  },
  cardSubtitle: {
    color: "#4b5563",
    fontSize: 15,
    marginBottom: 24,
    lineHeight: 22,
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  inputContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    marginBottom: 20,
  },
  inputError: {
    borderColor: "#ef4444",
  },
  input: {
    color: "#111827",
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
    marginBottom: 16,
    marginTop: -12,
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  continueButton: {
    backgroundColor: "#0066FF", // Bright blue from screenshot
    borderRadius: 25, // Pill shape
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
});

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
  Alert,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useUserStore } from "../../store/userStore";
import authService from "../../../../services/auth";

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

export default function EmailVerificationScreen() {
  const { email } = useUserStore();
  const [resendDisabled, setResendDisabled] = useState(true);
  const [countdown, setCountdown] = useState(30);

  // Animation values
  const contentOpacity = useSharedValue(0);
  const envelopeScale = useSharedValue(0.8);
  const envelopeY = useSharedValue(20);

  useEffect(() => {
    // Entrance animations
    contentOpacity.value = withTiming(1, { duration: 500 });
    envelopeScale.value = withDelay(
      200,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.2)) })
    );
    envelopeY.value = withDelay(
      200,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
    );

    // User must click the magic link in their email
    // The link will open the app with the token parameter

    // Countdown for resend button
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setResendDisabled(false);
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countdownInterval);
    };
  }, []);

  const envelopeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [
      { scale: envelopeScale.value },
      { translateY: envelopeY.value },
    ],
  }));

  const handleResendEmail = async () => {
    if (resendDisabled || !email) return;

    try {
      const ownership = (Constants as any).appOwnership || "";
      const source = ownership === "expo" ? "expo" : "dev";
      const result = await authService.sendMagicLink(email, source);
      if (result.success) {
        Alert.alert("Email Sent", "We've sent a new magic link to your email.");
      } else {
        Alert.alert(
          "Error",
          result.error || "Failed to resend email. Please try again."
        );
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    }

    setResendDisabled(true);
    setCountdown(30);
  };

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, "$1***$3")
    : "your email";

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Light gradient background */}
      <LinearGradient
        colors={["#f0f4ff", "#e8f0fe", "#ffffff"]}
        style={styles.gradientBackground}
      />

      {/* Header */}
      <View style={styles.headerContainer}>
        {/* Tagline Image */}
        <View style={styles.taglineContainer}>
          <Image
            source={require("../../assets/images/tagline.png")}
            style={{ width: width * 0.85, height: 140 }}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* White Card Content */}
      <View style={styles.cardContainer}>
        <View style={styles.handleBar} />

        <Text style={styles.cardTitle}>Check your email to verify</Text>

        {/* Email display */}
        <Text style={styles.emailText}>
          We sent a magic link to{" "}
          <Text style={styles.emailHighlight}>{maskedEmail}</Text>
        </Text>

        {/* Envelope Image */}
        <Animated.View
          style={[styles.envelopeContainer, envelopeAnimatedStyle]}
        >
          <Image
            source={require("../../assets/images/envelope.png")}
            style={{ width: width * 0.7, height: width * 0.55 }}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Resend Button */}
        <View style={styles.buttonContainer}>
          <Pressable
            onPress={handleResendEmail}
            disabled={resendDisabled}
            style={({ pressed }) => [
              styles.resendButton,
              {
                opacity:
                  pressed && !resendDisabled ? 0.7 : resendDisabled ? 0.5 : 1,
              },
            ]}
          >
            <Text style={styles.resendButtonText}>
              {resendDisabled
                ? `Resend the link (${countdown}s)`
                : "Resend the link"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  gradientBackground: {
    position: "absolute",
    width: width,
    height: height,
  },
  headerContainer: {
    paddingTop: Platform.OS === "ios" ? 60 : 50,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  taglineContainer: {
    alignItems: "flex-start",
  },
  cardContainer: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 5,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
    marginBottom: 24,
  },
  cardTitle: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
    alignSelf: "flex-start",
  },
  emailText: {
    color: "#6b7280",
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  emailHighlight: {
    color: "#111827",
    fontWeight: "600",
  },
  envelopeContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  buttonContainer: {
    width: "100%",
    marginTop: "auto",
  },
  resendButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  resendButtonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
});

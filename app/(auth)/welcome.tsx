import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  Dimensions,
  StatusBar,
  Platform,
  StyleSheet,
  Alert,
  ActivityIndicator,
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
import authService from "../../services/auth";
import { useUserStore } from "../../store/userStore";

// Lazy import Google Sign-In to avoid crash in Expo Go
let GoogleSignin: any = null;
let statusCodes: any = null;
let isSuccessResponse: any = null;
let isErrorWithCode: any = null;
let nativeGoogleAvailable = false;

try {
  const googleSignInModule = require("@react-native-google-signin/google-signin");
  GoogleSignin = googleSignInModule.GoogleSignin;
  statusCodes = googleSignInModule.statusCodes;
  isSuccessResponse = googleSignInModule.isSuccessResponse;
  isErrorWithCode = googleSignInModule.isErrorWithCode;
  nativeGoogleAvailable = true;
} catch (e) {
  // Native Google Sign-In not available - will use web OAuth fallback
}

const { width, height } = Dimensions.get("window");

// Google Icon Component
const GoogleIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <Path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <Path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </Svg>
);

export default function WelcomeScreen() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isNativeConfigured, setIsNativeConfigured] = useState(false);
  const { setUser } = useUserStore();

  // Google OAuth is always enabled - native in dev builds, web in Expo Go
  const GOOGLE_AUTH_ENABLED = true;

  // Animation values
  const logoOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(20);
  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(30);

  useEffect(() => {
    // Configure native Google Sign-In if available (dev build only)
    if (nativeGoogleAvailable && GoogleSignin) {
      try {
        GoogleSignin.configure({
          webClientId:
            "463755159994-qh29mpi9dsbp90gf5id3q3id1m3eluie.apps.googleusercontent.com",
          offlineAccess: true,
          scopes: ["profile", "email"],
        });
        setIsNativeConfigured(true);
      } catch (e) {
        // Failed to configure native - will fall back to web OAuth
      }
    }

    logoOpacity.value = withDelay(100, withTiming(1, { duration: 200 }));

    taglineOpacity.value = withDelay(200, withTiming(1, { duration: 250 }));
    taglineTranslateY.value = withDelay(
      200,
      withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) })
    );

    buttonsOpacity.value = withDelay(250, withTiming(1, { duration: 300 }));
    buttonsTranslateY.value = withDelay(
      250,
      withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  // Handle successful Google sign-in (from either native or web OAuth)
  const handleGoogleSuccess = async (user: any) => {
    setUser(user);
    const route = authService.getRouteForUser(user);
    router.replace(route);
  };

  // Native Google Sign-In (dev builds with native module)
  const handleNativeGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const { idToken } = response.data;

        if (idToken) {
          const result = await authService.googleSignIn(idToken);
          if (result.success && result.user) {
            await handleGoogleSuccess(result.user);
          } else {
            Alert.alert("Sign In Failed", result.error || "Please try again");
          }
        } else {
          Alert.alert("Error", "Failed to get authentication token.");
        }
      }
    } catch (error: any) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            // User cancelled - silent
            break;
          case statusCodes.IN_PROGRESS:
            // Already in progress - silent
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert(
              "Google Play Services",
              "Please update or install Google Play Services.",
              [{ text: "OK" }]
            );
            break;
          default:
            Alert.alert(
              "Sign In Error",
              "Something went wrong. Please try again."
            );
        }
      } else {
        Alert.alert("Error", "Failed to sign in with Google.");
      }
    }
  };

  // Web-based Google OAuth (Expo Go fallback)
  const handleWebGoogleOAuth = async () => {
    const result = await authService.startWebGoogleOAuth();

    if (result.success) {
      // Token was handled, get the user and route
      const cachedUser = await authService.getCachedUser();
      if (cachedUser) {
        await handleGoogleSuccess(cachedUser);
      }
    } else if (result.error && result.error !== "Sign-in cancelled") {
      Alert.alert("Sign In Failed", result.error);
    }
  };

  const handleGooglePress = async () => {
    if (isGoogleLoading) return;

    setIsGoogleLoading(true);

    try {
      // Use native Google Sign-In if available (dev build)
      if (nativeGoogleAvailable && isNativeConfigured) {
        await handleNativeGoogleSignIn();
      } else {
        // Fallback to web OAuth (Expo Go / web)
        await handleWebGoogleOAuth();
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
  }));

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  const buttonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Background Image */}
      <Image
        source={require("../../assets/images/welcome-bg.jpg")}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Gradient Overlay for readability */}
      <LinearGradient
        colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.2)", "rgba(0,0,0,0.6)"]}
        style={styles.gradientOverlay}
      />

      <View style={styles.contentContainer}>
        {/* Logo Section */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={{ width: 140, height: 140 }}
            resizeMode="contain"
          />
          <Text style={styles.logoTitle}>Exoptus</Text>
          <Text style={styles.logoSubtitle}>
            where education meets direction
          </Text>
        </Animated.View>

        {/* Main Text Section */}
        <Animated.View style={[styles.mainTextContainer, taglineAnimatedStyle]}>
          <Text style={styles.mainText}>START YOUR CAREER</Text>
          <Text style={styles.mainText}>JOURNEY WITH</Text>
          <Text style={styles.mainText}>EXOPTUS</Text>
        </Animated.View>

        {/* Buttons Section */}
        <Animated.View style={[styles.buttonsContainer, buttonsAnimatedStyle]}>
          <Pressable
            style={[
              styles.googleButton,
              isGoogleLoading && styles.buttonDisabled,
            ]}
            onPress={handleGooglePress}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <ActivityIndicator size="small" color="#1f2937" />
            ) : (
              <>
                <GoogleIcon size={24} />
                <Text style={styles.googleButtonText}>
                  continue with Google
                </Text>
              </>
            )}
          </Pressable>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            style={styles.emailButton}
            onPress={() => router.push("/(auth)/signup-email")}
          >
            <Text style={styles.emailButtonText}>Continue with Email</Text>
          </Pressable>

          <Text style={styles.termsText}>
            By Continuing, you agree to Exoptus consumer{"\n"}
            <Text style={styles.linkText}>Terms and usage Policy</Text>, and
            acknowledge their{"\n"}
            <Text style={styles.linkText}>privacy Policy</Text>
          </Text>
        </Animated.View>
      </View>
    </View>
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: Platform.OS === "ios" ? 80 : 60,
  },
  logoTitle: {
    color: "white",
    fontSize: 48,
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
    marginTop: 10,
    letterSpacing: 1,
  },
  logoSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 18,
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
    marginTop: 4,
    fontStyle: "italic",
  },
  mainTextContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingVertical: 40,
  },
  mainText: {
    color: "white",
    fontSize: 32,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
    letterSpacing: 1,
    lineHeight: 44,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  buttonsContainer: {
    gap: 16,
    paddingBottom: 20,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: 30,
    paddingVertical: 16,
    gap: 12,
    minHeight: 56,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  googleButtonText: {
    color: "#1f2937",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  dividerText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  emailButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: 30,
    paddingVertical: 16,
  },
  emailButtonText: {
    color: "#1f2937",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  termsText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 11,
    textAlign: "center",
    marginTop: 12,
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
    lineHeight: 16,
  },
  linkText: {
    color: "white",
    fontWeight: "600",
  },
});

/**
 * Chat Screen - PURE UI RENDERER
 *
 * This screen ONLY renders UI.
 * All business logic is in useOnboardingChat hook.
 *
 * Rules:
 * - NO business logic
 * - NO domain state (useState for domain data forbidden)
 * - NO next step decisions
 * - NO validation
 * - NO analysis generation
 * - NO progress math
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  StyleSheet,
  Keyboard,
  Image,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  FadeIn,
  FadeInLeft,
  FadeInRight,
} from "react-native-reanimated";
import * as DocumentPicker from "expo-document-picker";
import {
  useOnboardingChat,
  ChatMessage,
  ConversationStep,
} from "../hooks/useOnboardingChat";

const { width, height } = Dimensions.get("window");

// ============================================================================
// ROLE CARDS DATA (Will move to backend in future)
// ============================================================================

const ROLE_CARDS = [
  {
    id: "role1",
    title: "Full Stack Developer",
    salary: "₹8-15 LPA",
    summary: "Build end-to-end web applications",
    skillGap: 35,
  },
  {
    id: "role2",
    title: "Data Analyst",
    salary: "₹6-12 LPA",
    summary: "Analyze data and create insights",
    skillGap: 25,
  },
  {
    id: "role3",
    title: "Frontend Developer",
    salary: "₹6-12 LPA",
    summary: "Create beautiful user interfaces",
    skillGap: 20,
  },
];

// ============================================================================
// UI COMPONENTS (Pure presentational)
// ============================================================================

const TypingIndicator = () => {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const animate = () => {
      dot1.value = withSequence(
        withTiming(-5, { duration: 400 }),
        withTiming(0, { duration: 400 })
      );
      setTimeout(() => {
        dot2.value = withSequence(
          withTiming(-5, { duration: 400 }),
          withTiming(0, { duration: 400 })
        );
      }, 200);
      setTimeout(() => {
        dot3.value = withSequence(
          withTiming(-5, { duration: 400 }),
          withTiming(0, { duration: 400 })
        );
      }, 400);
    };
    animate();
    const interval = setInterval(animate, 1200);
    return () => clearInterval(interval);
  }, []);

  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot1.value }],
  }));
  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot2.value }],
  }));
  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot3.value }],
  }));

  return (
    <View style={styles.typingContainer}>
      <Animated.View style={[styles.typingDot, dot1Style]} />
      <Animated.View style={[styles.typingDot, dot2Style]} />
      <Animated.View style={[styles.typingDot, dot3Style]} />
    </View>
  );
};

const ChatBubble = ({
  message,
  isOld,
}: {
  message: ChatMessage;
  isOld: boolean;
}) => {
  const isSystem = message.type === "system";
  return (
    <Animated.View
      entering={isSystem ? FadeInLeft.duration(500) : FadeInRight.duration(500)}
      style={[
        styles.bubbleContainer,
        isSystem ? styles.systemBubbleContainer : styles.userBubbleContainer,
        isOld && styles.oldMessage,
      ]}
    >
      {message.isTyping ? (
        <TypingIndicator />
      ) : (
        <Text
          style={[
            styles.bubbleText,
            isSystem ? styles.systemBubbleText : styles.userBubbleText,
          ]}
        >
          {message.content}
        </Text>
      )}
    </Animated.View>
  );
};

const ChipButton = ({
  option,
  isSelected,
  onSelect,
  index,
}: {
  option: string;
  isSelected: boolean;
  onSelect: (option: string) => void;
  index: number;
}) => (
  <Animated.View entering={FadeIn.delay(index * 80).duration(400)}>
    <Pressable
      style={[styles.chipButton, isSelected && styles.chipButtonSelected]}
      onPress={() => onSelect(option)}
    >
      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
        {option}
      </Text>
    </Pressable>
  </Animated.View>
);

const RoleCard = ({
  role,
  onSelect,
  index,
}: {
  role: any;
  onSelect: (role: any) => void;
  index: number;
}) => (
  <Animated.View entering={FadeIn.delay(index * 100).duration(500)}>
    <Pressable style={styles.roleCard} onPress={() => onSelect(role)}>
      <View style={styles.roleCardHeader}>
        <Text style={styles.roleCardTitle}>{role.title}</Text>
        <Text style={styles.roleCardSalary}>{role.salary}</Text>
      </View>
      <Text style={styles.roleCardSummary}>{role.summary}</Text>
      <View style={styles.skillGapContainer}>
        <View style={styles.skillGapRow}>
          <Text style={styles.skillGapLabel}>Your Level</Text>
          <View style={styles.skillBar}>
            <View
              style={[
                styles.skillBarFill,
                { width: "60%", backgroundColor: "#0066FF" },
              ]}
            />
          </View>
        </View>
        <View style={styles.skillGapRow}>
          <Text style={styles.skillGapLabel}>Industry Expectation</Text>
          <View style={styles.skillBar}>
            <View
              style={[
                styles.skillBarFill,
                { width: "95%", backgroundColor: "#10b981" },
              ]}
            />
          </View>
        </View>
        <Text style={styles.skillGapText}>Gap: {role.skillGap}% to bridge</Text>
      </View>
    </Pressable>
  </Animated.View>
);

const ConsentCard = ({ onAccept }: { onAccept: () => void }) => {
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const canProceed = termsChecked && privacyChecked;

  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.consentCard}>
      <Text style={styles.consentTitle}>Data & Privacy</Text>
      <Pressable
        style={styles.checkboxRow}
        onPress={() => setTermsChecked(!termsChecked)}
      >
        <View style={[styles.checkbox, termsChecked && styles.checkboxChecked]}>
          {termsChecked && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>
          I agree to the Terms of Service
        </Text>
      </Pressable>
      <Pressable
        style={styles.checkboxRow}
        onPress={() => setPrivacyChecked(!privacyChecked)}
      >
        <View
          style={[styles.checkbox, privacyChecked && styles.checkboxChecked]}
        >
          {privacyChecked && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>I agree to the Privacy Policy</Text>
      </Pressable>
      <Pressable
        style={[
          styles.consentButton,
          !canProceed && styles.consentButtonDisabled,
        ]}
        onPress={canProceed ? onAccept : undefined}
        disabled={!canProceed}
      >
        <Text style={styles.consentButtonText}>I Agree</Text>
      </Pressable>
    </Animated.View>
  );
};

const ProgressBar = ({ progress }: { progress: number }) => {
  const animatedWidth = useSharedValue(0);
  useEffect(() => {
    animatedWidth.value = withTiming(progress, { duration: 500 });
  }, [progress]);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, progressStyle]} />
      </View>
      <Text style={styles.progressText}>{Math.round(progress)}%</Text>
    </View>
  );
};

const ErrorBanner = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <View style={styles.errorBanner}>
    <Text style={styles.errorText}>{message}</Text>
    <Pressable style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryButtonText}>Retry</Text>
    </Pressable>
  </View>
);

const LoadingOverlay = () => (
  <View style={styles.loadingOverlay}>
    <ActivityIndicator size="large" color="#0066FF" />
    <Text style={styles.loadingText}>Processing...</Text>
  </View>
);

// ============================================================================
// MAIN COMPONENT - PURE UI RENDERER
// ============================================================================

export default function ChatScreen() {
  // Get all state and actions from hook
  const {
    messages,
    currentStep,
    currentStepId,
    progress,
    showInput,
    isLoading,
    isFlowLoading,
    error,
    submitAnswer,
    retryFlow,
  } = useOnboardingChat();

  // UI-only local state (not domain data)
  const [inputValue, setInputValue] = useState("");
  const [numericValue, setNumericValue] = useState("");
  const [locationState, setLocationState] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<any>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages]);

  // Navigate on completion
  useEffect(() => {
    if (currentStepId === "complete" || currentStep?.nextStep === null) {
      setTimeout(() => {
        router.push("/(onboarding)/evaluation-progress" as any);
      }, 1500);
    }
  }, [currentStepId, currentStep]);

  // Reset local state when step changes
  useEffect(() => {
    setInputValue("");
    setNumericValue("");
    setSelectedChips([]);
    setUploadedFile(null);
  }, [currentStepId]);

  // ============================================================================
  // EVENT HANDLERS (UI events → hook actions)
  // ============================================================================

  const handleSend = useCallback(() => {
    if (!currentStep) return;
    if (currentStep.inputType === "text" && inputValue.trim()) {
      submitAnswer(inputValue.trim());
      setInputValue("");
      Keyboard.dismiss();
    } else if (currentStep.inputType === "numeric" && numericValue.trim()) {
      const num = parseFloat(numericValue);
      if (!isNaN(num)) {
        submitAnswer(num);
        setNumericValue("");
        Keyboard.dismiss();
      }
    } else if (
      currentStep.inputType === "location" &&
      locationState &&
      locationCity
    ) {
      submitAnswer(
        { state: locationState, city: locationCity },
        `${locationCity}, ${locationState}`
      );
      setLocationState("");
      setLocationCity("");
      Keyboard.dismiss();
    }
  }, [
    currentStep,
    inputValue,
    numericValue,
    locationState,
    locationCity,
    submitAnswer,
  ]);

  const handleChipSelect = useCallback(
    (option: string) => {
      if (currentStep?.multiSelect) {
        setSelectedChips((prev) =>
          prev.includes(option)
            ? prev.filter((c) => c !== option)
            : [...prev, option]
        );
      } else {
        submitAnswer(option);
      }
    },
    [currentStep, submitAnswer]
  );

  const handleMultiSelectConfirm = useCallback(() => {
    if (selectedChips.length > 0) {
      submitAnswer(selectedChips, selectedChips.join(", "));
      setSelectedChips([]);
    }
  }, [selectedChips, submitAnswer]);

  const handleFileUpload = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length > 0) {
        setUploadedFile(result.assets[0]);
      }
    } catch (err) {
      console.log("Error picking document:", err);
    }
  }, []);

  const handleFileConfirm = useCallback(() => {
    if (uploadedFile || currentStep?.isOptional) {
      submitAnswer(uploadedFile, uploadedFile?.name || "Skipped");
      setUploadedFile(null);
    }
  }, [uploadedFile, currentStep, submitAnswer]);

  const handleRoleSelect = useCallback(
    (role: any) => {
      submitAnswer(role, role.title);
    },
    [submitAnswer]
  );

  const handleConsentAccept = useCallback(() => {
    submitAnswer("Consent accepted", "Accepted terms & privacy");
  }, [submitAnswer]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isFlowLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Background */}
      <ImageBackground
        source={require("../../assets/images/chat-bg.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            "rgba(147, 197, 253, 0.3)",
            "rgba(236, 72, 153, 0.2)",
            "rgba(147, 197, 253, 0.3)",
          ]}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>

      {/* Error Banner */}
      {error && <ErrorBanner message={error} onRetry={retryFlow} />}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <Image
              source={require("../../assets/images/odyssey-avatar.png")}
              style={styles.avatar}
              resizeMode="contain"
            />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Odyssey</Text>
            <Text style={styles.headerSubtitle}>Your career companion</Text>
          </View>
        </View>
        <ProgressBar progress={progress} />
      </View>

      {/* Chat Messages */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message, index) => (
            <ChatBubble
              key={message.id}
              message={message}
              isOld={index < messages.length - 3}
            />
          ))}

          {/* Input Options */}
          {showInput &&
            currentStep?.inputType === "chips" &&
            currentStep.options && (
              <View style={styles.chipsContainer}>
                {currentStep.options.map((option, index) => (
                  <ChipButton
                    key={option}
                    option={option}
                    isSelected={selectedChips.includes(option)}
                    onSelect={handleChipSelect}
                    index={index}
                  />
                ))}
              </View>
            )}

          {showInput &&
            currentStep?.inputType === "multi-chips" &&
            currentStep.options && (
              <>
                <View style={styles.chipsWrap}>
                  {currentStep.options.map((option, index) => (
                    <ChipButton
                      key={option}
                      option={option}
                      isSelected={selectedChips.includes(option)}
                      onSelect={handleChipSelect}
                      index={index}
                    />
                  ))}
                </View>
                {selectedChips.length > 0 && (
                  <Pressable
                    style={styles.confirmButton}
                    onPress={handleMultiSelectConfirm}
                  >
                    <Text style={styles.confirmButtonText}>
                      Continue with {selectedChips.length} selected
                    </Text>
                  </Pressable>
                )}
              </>
            )}

          {showInput && currentStep?.inputType === "role-cards" && (
            <View style={styles.roleCardsContainer}>
              {ROLE_CARDS.map((role, index) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  onSelect={handleRoleSelect}
                  index={index}
                />
              ))}
            </View>
          )}

          {showInput && currentStep?.inputType === "consent" && (
            <ConsentCard onAccept={handleConsentAccept} />
          )}

          {showInput && currentStep?.inputType === "file" && (
            <View style={styles.fileUploadContainer}>
              <Pressable style={styles.uploadButton} onPress={handleFileUpload}>
                <Text style={styles.uploadButtonText}>
                  {uploadedFile ? "✓ File Selected" : "📎 Choose File"}
                </Text>
              </Pressable>
              {uploadedFile && (
                <Text style={styles.fileName}>{uploadedFile.name}</Text>
              )}
              <Pressable
                style={[
                  styles.confirmButton,
                  !uploadedFile &&
                    !currentStep.isOptional &&
                    styles.confirmButtonDisabled,
                ]}
                onPress={handleFileConfirm}
                disabled={!uploadedFile && !currentStep.isOptional}
              >
                <Text style={styles.confirmButtonText}>
                  {currentStep.isOptional && !uploadedFile
                    ? "Skip"
                    : "Continue"}
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>

        {/* Text/Numeric Input */}
        {showInput &&
          (currentStep?.inputType === "text" ||
            currentStep?.inputType === "numeric") && (
            <Animated.View
              entering={FadeIn.duration(400)}
              style={styles.inputContainer}
            >
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  value={
                    currentStep.inputType === "numeric"
                      ? numericValue
                      : inputValue
                  }
                  onChangeText={
                    currentStep.inputType === "numeric"
                      ? setNumericValue
                      : setInputValue
                  }
                  placeholder={
                    currentStep.inputType === "numeric"
                      ? "Enter number..."
                      : "Type your answer..."
                  }
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  autoFocus
                  keyboardType={
                    currentStep.inputType === "numeric" ? "numeric" : "default"
                  }
                  onSubmitEditing={handleSend}
                  returnKeyType="send"
                />
                <Pressable
                  style={[
                    styles.sendButton,
                    !inputValue.trim() &&
                      !numericValue.trim() &&
                      styles.sendButtonDisabled,
                  ]}
                  onPress={handleSend}
                  disabled={!inputValue.trim() && !numericValue.trim()}
                >
                  <Text style={styles.sendIcon}>→</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

        {/* Location Input */}
        {showInput && currentStep?.inputType === "location" && (
          <Animated.View
            entering={FadeIn.duration(400)}
            style={styles.inputContainer}
          >
            <View style={styles.locationInputs}>
              <TextInput
                style={styles.locationInput}
                value={locationState}
                onChangeText={setLocationState}
                placeholder="State"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
              <TextInput
                style={styles.locationInput}
                value={locationCity}
                onChangeText={setLocationCity}
                placeholder="City"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            </View>
            <Pressable
              style={[
                styles.confirmButton,
                (!locationState || !locationCity) &&
                  styles.confirmButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!locationState || !locationCity}
            >
              <Text style={styles.confirmButtonText}>Continue</Text>
            </Pressable>
          </Animated.View>
        )}
      </KeyboardAvoidingView>

      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay />}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1e293b" },
  centered: { justifyContent: "center", alignItems: "center" },
  background: { position: "absolute", width, height },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarContainer: { marginRight: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 19, fontWeight: "700", color: "white" },
  headerSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.7)" },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 12 },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#0066FF", borderRadius: 3 },
  progressText: {
    fontSize: 13,
    fontWeight: "700",
    color: "white",
    width: 40,
    textAlign: "right",
  },
  chatContainer: { flex: 1 },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 20, paddingBottom: 120 },
  bubbleContainer: {
    maxWidth: "80%",
    marginBottom: 14,
    padding: 16,
    borderRadius: 22,
  },
  systemBubbleContainer: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderBottomLeftRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  userBubbleContainer: {
    alignSelf: "flex-end",
    backgroundColor: "#0066FF",
    borderBottomRightRadius: 6,
  },
  bubbleText: { fontSize: 16, lineHeight: 23 },
  systemBubbleText: { color: "#1f2937" },
  userBubbleText: { color: "white" },
  oldMessage: { opacity: 0.65 },
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
  },
  typingDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#9ca3af",
  },
  chipsContainer: { marginTop: 20, gap: 12 },
  chipsWrap: { marginTop: 20, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chipButton: {
    backgroundColor: "rgba(30, 58, 138, 0.7)",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(59, 130, 246, 0.3)",
  },
  chipButtonSelected: {
    backgroundColor: "rgba(16, 185, 129, 0.8)",
    borderColor: "rgba(16, 185, 129, 1)",
  },
  chipText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
  },
  chipTextSelected: { color: "white" },
  roleCardsContainer: { marginTop: 20, gap: 16 },
  roleCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  roleCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  roleCardTitle: { fontSize: 19, fontWeight: "700", color: "#111827" },
  roleCardSalary: { fontSize: 16, fontWeight: "700", color: "#10b981" },
  roleCardSummary: { fontSize: 15, color: "#6b7280", marginBottom: 16 },
  skillGapContainer: { marginTop: 8 },
  skillGapRow: { marginBottom: 10 },
  skillGapLabel: { fontSize: 13, color: "#4b5563", marginBottom: 6 },
  skillBar: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  skillBarFill: { height: "100%", borderRadius: 4 },
  skillGapText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#f59e0b",
    marginTop: 6,
  },
  fileUploadContainer: { marginTop: 20, gap: 12 },
  uploadButton: {
    backgroundColor: "rgba(59, 130, 246, 0.9)",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: "center",
  },
  uploadButtonText: { fontSize: 16, fontWeight: "600", color: "white" },
  fileName: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
  },
  confirmButton: {
    backgroundColor: "#0066FF",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
  },
  confirmButtonDisabled: { backgroundColor: "rgba(107, 114, 128, 0.5)" },
  confirmButtonText: { color: "white", fontSize: 17, fontWeight: "600" },
  consentCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 24,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  consentTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: "#0066FF", borderColor: "#0066FF" },
  checkmark: { color: "white", fontSize: 16, fontWeight: "700" },
  checkboxLabel: { flex: 1, fontSize: 15, color: "#4b5563" },
  consentButton: {
    backgroundColor: "#0066FF",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
  },
  consentButtonDisabled: { backgroundColor: "rgba(107, 114, 128, 0.5)" },
  consentButtonText: { color: "white", fontSize: 17, fontWeight: "600" },
  inputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(30, 41, 59, 0.95)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 25,
    paddingLeft: 20,
    paddingRight: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  textInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: "white" },
  sendButton: {
    backgroundColor: "#0066FF",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: { backgroundColor: "rgba(107, 114, 128, 0.4)" },
  sendIcon: { color: "white", fontSize: 24, fontWeight: "700" },
  locationInputs: { gap: 12, marginBottom: 12 },
  locationInput: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    fontSize: 16,
    color: "white",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  errorBanner: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    left: 20,
    right: 20,
    backgroundColor: "rgba(239, 68, 68, 0.95)",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 100,
  },
  errorText: { color: "white", fontSize: 14, flex: 1 },
  retryButton: {
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 12,
  },
  retryButtonText: { color: "#EF4444", fontWeight: "600", fontSize: 12 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200,
  },
  loadingText: { color: "white", marginTop: 12, fontSize: 16 },
});

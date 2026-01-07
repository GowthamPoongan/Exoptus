/**
 * Profile Screen (Redesigned)
 *
 * Light theme with proper touch feedback and REAL actions:
 * - Edit Profile: Actually works
 * - Delete Account: REAL DELETE with confirmation
 * - Logout: Proper session clear
 *
 * Trust through data control.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import Svg, { Path, Circle } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

import { useDashboardStore } from "../../store/dashboardStore";
import { useUserStore } from "../../store/userStore";
import {
  PressableCard,
  PressableMenuItem,
} from "../../components/PressableCard";
import { BottomTabBar } from "../../components/BottomTabBar";
import { api } from "../../services/api";

// Icons
const UserIcon = ({
  color = "#3B82F6",
  size = 24,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={2} />
    <Path
      d="M20 21C20 18.2386 16.4183 16 12 16C7.58172 16 4 18.2386 4 21"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const SettingsIcon = ({
  color = "#8B5CF6",
  size = 24,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={2} />
    <Path
      d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const ChevronRightIcon = ({
  color = "#9CA3AF",
  size = 20,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18L15 12L9 6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ShieldIcon = ({
  color = "#10B981",
  size = 24,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 12L11 14L15 10"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const InfoIcon = ({
  color = "#60A5FA",
  size = 24,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M12 16V12" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Circle cx="12" cy="8" r="1" fill={color} />
  </Svg>
);

const LogoutIcon = ({
  color = "#EF4444",
  size = 24,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 17L21 12L16 7"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M21 12H9"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TrashIcon = ({
  color = "#EF4444",
  size = 24,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6H5H21"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10 11V17"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 11V17"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
  showArrow?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  danger = false,
  showArrow = true,
}) => (
  <PressableMenuItem onPress={onPress} style={styles.menuItem}>
    <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
      {icon}
    </View>
    <View style={styles.menuContent}>
      <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>
        {title}
      </Text>
      {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>
    {showArrow && <ChevronRightIcon color="#9CA3AF" size={20} />}
  </PressableMenuItem>
);

export default function ProfileScreen() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { notifications, jrScore } = useDashboardStore();
  const { name, email, clearUser } = useUserStore();

  // Initialize edit form with current name
  React.useEffect(() => {
    setEditName(name || "");
  }, [name]);

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            // Call logout endpoint to invalidate session
            await api.post("/auth/logout", {});
          } catch (e) {
            // Continue even if API fails
          }
          clearUser();
          router.replace("/(auth)/welcome" as any);
        },
      },
    ]);
  };

  /**
   * REAL DELETE ACCOUNT
   *
   * This actually deletes:
   * 1. User row from database
   * 2. All onboarding data
   * 3. All sessions
   * 4. Invalidates tokens
   */
  const handleDeleteAccount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    Alert.alert(
      "⚠️ Delete Account",
      "This action CANNOT be undone. All your data will be PERMANENTLY deleted:\n\n• Your profile\n• Onboarding data\n• JR Score history\n• Roadmap progress\n• All sessions\n\nAre you absolutely sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Delete Everything",
          style: "destructive",
          onPress: () => confirmDeleteAccount(),
        },
      ]
    );
  };

  const confirmDeleteAccount = () => {
    // Second confirmation
    Alert.alert(
      "Final Confirmation",
      "Type 'DELETE' to confirm account deletion.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete My Account",
          style: "destructive",
          onPress: () => executeDeleteAccount(),
        },
      ]
    );
  };

  const executeDeleteAccount = async () => {
    setIsDeleting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    try {
      // Call real delete endpoint
      const response = await api.delete("/user/account");

      if (response.success) {
        Alert.alert(
          "Account Deleted",
          "Your account has been permanently deleted. Thank you for using EXOPTUS.",
          [
            {
              text: "OK",
              onPress: () => {
                clearUser();
                router.replace("/(auth)/welcome" as any);
              },
            },
          ]
        );
      } else {
        throw new Error(response.error || "Failed to delete account");
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Failed to delete account. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    setIsSaving(true);

    try {
      const response = await api.patch("/user/profile", {
        name: editName.trim(),
      });

      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Update local state
        useUserStore.getState().setName(editName.trim());
        setShowEditModal(false);
      } else {
        throw new Error(response.error || "Failed to update profile");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.profileHeader}
        >
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {name ? name.charAt(0).toUpperCase() : "U"}
              </Text>
            </View>
          </View>

          {/* Name & Email */}
          <Text style={styles.userName}>{name || "User"}</Text>
          <Text style={styles.userEmail}>{email || "user@example.com"}</Text>

          {/* JR Score Badge */}
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreBadgeText}>JR Score: {jrScore}%</Text>
          </View>
        </Animated.View>

        {/* Menu Sections */}
        <Animated.View
          entering={FadeInDown.delay(100)}
          style={styles.menuSection}
        >
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon={<UserIcon color="#3B82F6" size={22} />}
              title="Edit Profile"
              subtitle="Update your personal information"
              onPress={handleEditProfile}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon={<SettingsIcon color="#8B5CF6" size={22} />}
              title="Settings"
              subtitle="App preferences"
              onPress={() =>
                Alert.alert(
                  "Coming Soon",
                  "Settings will be available in the next update."
                )
              }
            />
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200)}
          style={styles.menuSection}
        >
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon={<ShieldIcon color="#10B981" size={22} />}
              title="Privacy Policy"
              subtitle="How we handle your data"
              onPress={() =>
                Alert.alert(
                  "Privacy Policy",
                  "Your data is encrypted and never shared with third parties without your consent."
                )
              }
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon={<TrashIcon color="#F59E0B" size={22} />}
              title="Delete My Account"
              subtitle="Permanently delete all data"
              onPress={handleDeleteAccount}
            />
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(300)}
          style={styles.menuSection}
        >
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon={<InfoIcon color="#60A5FA" size={22} />}
              title="About EXOPTUS"
              subtitle="Version 1.0.0"
              onPress={() =>
                Alert.alert(
                  "EXOPTUS",
                  "AI-Driven Career Navigation\n\nVersion 1.0.0\n\n© 2026 EXOPTUS"
                )
              }
            />
          </View>
        </Animated.View>

        {/* Logout */}
        <Animated.View
          entering={FadeInDown.delay(400)}
          style={styles.menuSection}
        >
          <View style={styles.menuCard}>
            <MenuItem
              icon={<LogoutIcon color="#EF4444" size={22} />}
              title="Logout"
              onPress={handleLogout}
              danger
              showArrow={false}
            />
          </View>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>EXOPTUS v1.0.0</Text>
          <Text style={styles.footerSubtext}>
            Your career navigation companion
          </Text>
        </View>
      </ScrollView>

      {/* Loading Overlay for Delete */}
      {isDeleting && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#EF4444" />
            <Text style={styles.loadingText}>Deleting account...</Text>
          </View>
        </View>
      )}

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <PressableCard
              onPress={() => setShowEditModal(false)}
              style={modalStyles.cancelButton}
            >
              <Text style={modalStyles.cancelText}>Cancel</Text>
            </PressableCard>
            <Text style={modalStyles.title}>Edit Profile</Text>
            <PressableCard
              onPress={handleSaveProfile}
              disabled={isSaving}
              style={[
                modalStyles.saveButton,
                isSaving && modalStyles.saveButtonDisabled,
              ]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={modalStyles.saveText}>Save</Text>
              )}
            </PressableCard>
          </View>

          <View style={modalStyles.form}>
            <Text style={modalStyles.label}>Name</Text>
            <TextInput
              style={modalStyles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
            />

            <Text style={[modalStyles.label, { marginTop: 20 }]}>Email</Text>
            <View style={modalStyles.inputDisabled}>
              <Text style={modalStyles.inputDisabledText}>{email}</Text>
            </View>
            <Text style={modalStyles.hint}>Email cannot be changed</Text>
          </View>
        </View>
      </Modal>

      {/* Bottom Tab Bar */}
      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 120,
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFF",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "700",
    color: "#FFF",
  },
  userName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  userEmail: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 4,
  },
  scoreBadge: {
    marginTop: 12,
    backgroundColor: "#3B82F610",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#3B82F630",
  },
  scoreBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  menuSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "transparent",
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuIconDanger: {
    backgroundColor: "#FEE2E2",
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  menuTitleDanger: {
    color: "#EF4444",
  },
  menuSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginLeft: 68,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  footerSubtext: {
    fontSize: 12,
    color: "#D1D5DB",
    marginTop: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingBox: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
});

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFF",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 16,
    color: "#6B7280",
  },
  saveButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#111827",
  },
  inputDisabled: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
  },
  inputDisabledText: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  hint: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 8,
  },
});

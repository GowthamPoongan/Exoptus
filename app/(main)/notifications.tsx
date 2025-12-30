/**
 * Notifications Screen
 *
 * Full notification list with read/unread states, categorized by type.
 * Clean, premium design with smooth animations.
 *
 * UX Intent:
 * - Clear, scannable notification list
 * - Read/unread visual distinction
 * - Subtle animations for engagement
 * - Back navigation to home
 */

import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import Svg, { Path, Circle } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

import { useDashboardStore } from "../../store/dashboardStore";
import { GlassCard } from "../../components/GlassCard";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
      d="M19 12H5M12 19L5 12L12 5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const RoadmapNotifIcon = ({
  color = "#3B82F6",
  size = 24,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth={2} />
    <Circle cx="12" cy="12" r="2" fill={color} />
  </Svg>
);

const SystemNotifIcon = ({
  color = "#8B5CF6",
  size = 24,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
      stroke={color}
      strokeWidth={2}
    />
    <Path d="M12 8V12" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path
      d="M12 16H12.01"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const CommunityNotifIcon = ({
  color = "#EC4899",
  size = 24,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth={2} />
    <Path
      d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const AchievementNotifIcon = ({
  color = "#F59E0B",
  size = 24,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={`${color}20`}
    />
  </Svg>
);

// Notification type mapping
const notificationIcons: Record<
  string,
  React.FC<{ color?: string; size?: number }>
> = {
  roadmap: RoadmapNotifIcon,
  system: SystemNotifIcon,
  community: CommunityNotifIcon,
  achievement: AchievementNotifIcon,
};

const notificationColors: Record<string, string> = {
  roadmap: "#3B82F6",
  system: "#8B5CF6",
  community: "#EC4899",
  achievement: "#F59E0B",
};

// Mock notifications data (replace with real data from store)
const mockNotifications = [
  {
    id: "1",
    type: "roadmap",
    title: "New milestone unlocked!",
    message: "You've completed 'Resume Basics'. Keep going!",
    time: "2 min ago",
    read: false,
  },
  {
    id: "2",
    type: "achievement",
    title: "Achievement Earned",
    message: "You've earned the 'Early Bird' badge for 7-day streak.",
    time: "1 hour ago",
    read: false,
  },
  {
    id: "3",
    type: "community",
    title: "New reply to your question",
    message: "John answered your question about interview prep.",
    time: "3 hours ago",
    read: true,
  },
  {
    id: "4",
    type: "system",
    title: "Profile update reminder",
    message: "Complete your profile to improve your JR Score.",
    time: "Yesterday",
    read: true,
  },
  {
    id: "5",
    type: "roadmap",
    title: "Task due soon",
    message: "Your 'LinkedIn Optimization' task is due tomorrow.",
    time: "Yesterday",
    read: true,
  },
];

interface NotificationItemProps {
  notification: (typeof mockNotifications)[0];
  index: number;
  onPress: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  index,
  onPress,
}) => {
  const scale = useSharedValue(1);
  const IconComponent = notificationIcons[notification.type] || SystemNotifIcon;
  const iconColor = notificationColors[notification.type] || "#8B5CF6";

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.98, { damping: 15 }, () => {
      scale.value = withSpring(1, { damping: 15 });
    });
    onPress();
  }, [onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      style={animatedStyle}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={styles.notificationItem}
      >
        <GlassCard
          intensity={notification.read ? "light" : "medium"}
          style={
            !notification.read
              ? { ...styles.notificationCard, ...styles.unreadCard }
              : styles.notificationCard
          }
        >
          {/* Unread indicator */}
          {!notification.read && <View style={styles.unreadDot} />}

          {/* Icon */}
          <View
            style={[styles.iconWrapper, { backgroundColor: `${iconColor}15` }]}
          >
            <IconComponent color={iconColor} size={22} />
          </View>

          {/* Content */}
          <View style={styles.notificationContent}>
            <Text
              style={[
                styles.notificationTitle,
                !notification.read && styles.unreadTitle,
              ]}
              numberOfLines={1}
            >
              {notification.title}
            </Text>
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {notification.message}
            </Text>
            <Text style={styles.notificationTime}>{notification.time}</Text>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const storeNotifications = useDashboardStore((state) => state.notifications);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleNotificationPress = (id: string) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={["#0A0A0F", "#111118", "#0A0A0F"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <Animated.View entering={FadeInUp.springify()} style={styles.header}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          {Platform.OS === "ios" ? (
            <BlurView intensity={40} tint="dark" style={styles.backButtonBlur}>
              <BackIcon color="#FFFFFF" size={20} />
            </BlurView>
          ) : (
            <View style={styles.backButtonAndroid}>
              <BackIcon color="#FFFFFF" size={20} />
            </View>
          )}
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {/* Spacer for alignment */}
        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* Notifications List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length > 0 ? (
          notifications.map((notification, index) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              index={index}
              onPress={() => handleNotificationPress(notification.id)}
            />
          ))
        ) : (
          <Animated.View
            entering={FadeInDown.springify()}
            style={styles.emptyState}
          >
            <SystemNotifIcon color="#71717A" size={48} />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>
              You're all caught up! We'll notify you when something new happens.
            </Text>
          </Animated.View>
        )}

        {/* Bottom spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0F",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
  },
  backButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  backButtonAndroid: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FAFAFA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
  },
  headerBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  notificationItem: {
    marginBottom: 12,
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    position: "relative",
  },
  unreadCard: {
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
  },
  unreadDot: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginLeft: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#E4E4E7",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
    marginBottom: 4,
  },
  unreadTitle: {
    color: "#FAFAFA",
    fontWeight: "700",
  },
  notificationMessage: {
    fontSize: 13,
    color: "#A1A1AA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
    lineHeight: 18,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: "#71717A",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FAFAFA",
    marginTop: 16,
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#71717A",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  bottomSpacer: {
    height: 100,
  },
});

/**
 * Notifications Screen
 *
 * Displays all notifications with read/unread state,
 * time stamps, and appropriate icons.
 *
 * UX Intent:
 * - Clean, scannable list
 * - Clear visual distinction between read/unread
 * - Swipe to dismiss or mark as read
 */

import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInRight, FadeIn, Layout } from "react-native-reanimated";
import Svg, { Path, Circle } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

import { useDashboardStore, Notification } from "../../store/dashboardStore";
import { GlassCard } from "../../components/GlassCard";

// Icons
const BackIcon = ({ color = "#FFFFFF", size = 24 }) => (
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

const BellIcon = ({ color = "#FFFFFF", size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={color}
      fillOpacity={0.2}
    />
    <Path
      d="M13.73 21C13.5542 21.3031 13.3018 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CheckIcon = ({ color = "#4ADE80", size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle
      cx="12"
      cy="12"
      r="10"
      stroke={color}
      strokeWidth={2}
      fill={color}
      fillOpacity={0.2}
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

const StarIcon = ({ color = "#FBBF24", size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={color}
      fillOpacity={0.2}
    />
  </Svg>
);

const AlertIcon = ({ color = "#EF4444", size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10.29 3.86L1.82 18C1.64 18.31 1.55 18.66 1.55 19.02C1.56 19.38 1.66 19.73 1.84 20.04C2.03 20.35 2.29 20.6 2.61 20.78C2.93 20.96 3.29 21.05 3.65 21.05H20.35C20.71 21.05 21.07 20.96 21.39 20.78C21.71 20.6 21.97 20.35 22.16 20.04C22.34 19.73 22.44 19.38 22.45 19.02C22.45 18.66 22.36 18.31 22.18 18L13.71 3.86C13.52 3.56 13.26 3.32 12.95 3.15C12.64 2.98 12.3 2.89 11.95 2.89C11.6 2.89 11.26 2.98 10.95 3.15C10.64 3.32 10.38 3.56 10.19 3.86H10.29Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={color}
      fillOpacity={0.2}
    />
    <Path d="M12 9V13" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path
      d="M12 17H12.01"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const TrendingIcon = ({ color = "#60A5FA", size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 6L13.5 15.5L8.5 10.5L1 18"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M17 6H23V12"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "achievement":
      return <StarIcon />;
    case "reminder":
      return <AlertIcon />;
    case "update":
      return <TrendingIcon />;
    case "tip":
      return <CheckIcon />;
    default:
      return <BellIcon />;
  }
};

const formatTimeAgo = (timestamp: Date): string => {
  const now = new Date();
  const diff = now.getTime() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

const NotificationItem: React.FC<{
  notification: Notification;
  onPress: () => void;
  index: number;
}> = ({ notification, onPress, index }) => {
  return (
    <Animated.View
      entering={FadeInRight.delay(index * 50).springify()}
      layout={Layout.springify()}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.notificationTouchable}
      >
        <GlassCard
          intensity={notification.read ? "light" : "medium"}
          style={{
            ...styles.notificationCard,
            ...(!notification.read && styles.unreadCard),
          }}
        >
          <View style={styles.notificationContent}>
            {/* Icon */}
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: notification.read
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(255,255,255,0.1)",
                },
              ]}
            >
              {getNotificationIcon(notification.type)}
            </View>

            {/* Text content */}
            <View style={styles.textContainer}>
              <Text
                style={[
                  styles.notificationTitle,
                  notification.read && styles.readText,
                ]}
                numberOfLines={1}
              >
                {notification.title}
              </Text>
              <Text
                style={[
                  styles.notificationMessage,
                  notification.read && styles.readText,
                ]}
                numberOfLines={2}
              >
                {notification.message}
              </Text>
              <Text style={styles.notificationTime}>
                {formatTimeAgo(notification.timestamp)}
              </Text>
            </View>

            {/* Unread indicator */}
            {!notification.read && <View style={styles.unreadDot} />}
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function NotificationsScreen() {
  const { notifications, markNotificationRead, markAllNotificationsRead } =
    useDashboardStore();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleNotificationPress = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      markNotificationRead(id);
    },
    [markNotificationRead]
  );

  const handleMarkAllRead = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    markAllNotificationsRead();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={["#0A0A0F", "#111118", "#0A0A0F"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <BackIcon color="#FAFAFA" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Notifications</Text>

          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllRead}
              style={styles.markAllButton}
              activeOpacity={0.7}
            >
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Notifications List */}
        {notifications.length > 0 ? (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <NotificationItem
                notification={item}
                onPress={() => handleNotificationPress(item.id)}
                index={index}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <BellIcon color="#3F3F46" size={48} />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>
              You're all caught up! Check back later for updates.
            </Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0F",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#FAFAFA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
    marginLeft: 12,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    borderRadius: 16,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#60A5FA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  notificationTouchable: {
    marginBottom: 12,
  },
  notificationCard: {
    padding: 16,
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: "#3B82F6",
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FAFAFA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#A1A1AA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: "#52525B",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  readText: {
    opacity: 0.6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
    marginLeft: 8,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FAFAFA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#71717A",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
    textAlign: "center",
    lineHeight: 20,
  },
});

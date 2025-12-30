/**
 * Calendar Screen
 *
 * Full-screen calendar view with monthly navigation,
 * task management, and glassmorphism design.
 *
 * UX Intent:
 * - Clear monthly view
 * - Easy task creation and management
 * - Visual feedback for days with tasks
 */

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInDown,
  Layout,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

import { useDashboardStore, Task } from "../../store/dashboardStore";
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

const ChevronLeftIcon = ({ color = "#FFFFFF", size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18L9 12L15 6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronRightIcon = ({ color = "#FFFFFF", size = 24 }) => (
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

const PlusIcon = ({ color = "#FFFFFF", size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5V19M5 12H19"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CheckIcon = ({ color = "#4ADE80", size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17L4 12"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TrashIcon = ({ color = "#EF4444", size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6H5H21"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const TASK_EMOJIS = ["📋", "💼", "📚", "🎯", "💡", "🚀", "✨", "🔧"];

interface CalendarDay {
  date: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

export default function CalendarScreen() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(
    today.toISOString().split("T")[0]
  );
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("📋");

  const { tasks, addTask, toggleTask, deleteTask } = useDashboardStore();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const goToPreviousMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(today.toISOString().split("T")[0]);
  };

  // Generate calendar days for the current month
  const calendarDays = useMemo((): CalendarDay[] => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const startingDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    // Get days from previous month to fill the first week
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();

    const days: CalendarDay[] = [];

    // Previous month days
    for (let i = startingDay - 1; i >= 0; i--) {
      const date = prevMonthLastDay - i;
      const month = currentMonth === 0 ? 11 : currentMonth - 1;
      const year = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;

      days.push({
        date,
        month,
        year,
        isCurrentMonth: false,
        isToday: false,
        tasks: tasks.filter((t) => t.date === dateString),
      });
    }

    // Current month days
    for (let date = 1; date <= daysInMonth; date++) {
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
      const isToday =
        date === today.getDate() &&
        currentMonth === today.getMonth() &&
        currentYear === today.getFullYear();

      days.push({
        date,
        month: currentMonth,
        year: currentYear,
        isCurrentMonth: true,
        isToday,
        tasks: tasks.filter((t) => t.date === dateString),
      });
    }

    // Next month days to fill remaining slots (to make 6 rows)
    const remainingDays = 42 - days.length;
    for (let date = 1; date <= remainingDays; date++) {
      const month = currentMonth === 11 ? 0 : currentMonth + 1;
      const year = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;

      days.push({
        date,
        month,
        year,
        isCurrentMonth: false,
        isToday: false,
        tasks: tasks.filter((t) => t.date === dateString),
      });
    }

    return days;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, currentYear, tasks]);

  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    return tasks.filter((t) => t.date === selectedDate);
  }, [selectedDate, tasks]);

  const handleDayPress = (day: CalendarDay) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const dateString = `${day.year}-${String(day.month + 1).padStart(2, "0")}-${String(day.date).padStart(2, "0")}`;
    setSelectedDate(dateString);
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !selectedDate) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addTask({
      title: newTaskTitle.trim(),
      emoji: selectedEmoji,
      completed: false,
      date: selectedDate,
    });

    setNewTaskTitle("");
    setShowAddTask(false);
  };

  const handleToggleTask = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTask(id);
  };

  const handleDeleteTask = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    deleteTask(id);
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return "";
    const [year, month, day] = selectedDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

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

          <Text style={styles.headerTitle}>Calendar</Text>

          <TouchableOpacity
            onPress={goToToday}
            style={styles.todayButton}
            activeOpacity={0.7}
          >
            <Text style={styles.todayButtonText}>Today</Text>
          </TouchableOpacity>
        </Animated.View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Month Navigation */}
          <Animated.View
            entering={FadeInDown.delay(150)}
            style={styles.monthNav}
          >
            <TouchableOpacity
              onPress={goToPreviousMonth}
              style={styles.navButton}
              activeOpacity={0.7}
            >
              <ChevronLeftIcon color="#FAFAFA" />
            </TouchableOpacity>

            <Text style={styles.monthTitle}>
              {MONTHS[currentMonth]} {currentYear}
            </Text>

            <TouchableOpacity
              onPress={goToNextMonth}
              style={styles.navButton}
              activeOpacity={0.7}
            >
              <ChevronRightIcon color="#FAFAFA" />
            </TouchableOpacity>
          </Animated.View>

          {/* Calendar Grid */}
          <Animated.View entering={FadeInUp.delay(200)}>
            <GlassCard intensity="medium" style={styles.calendarCard}>
              {/* Day Headers */}
              <View style={styles.dayHeaders}>
                {DAYS_OF_WEEK.map((day) => (
                  <View key={day} style={styles.dayHeaderCell}>
                    <Text style={styles.dayHeaderText}>{day}</Text>
                  </View>
                ))}
              </View>

              {/* Calendar Days Grid */}
              <View style={styles.daysGrid}>
                {calendarDays.map((day, index) => {
                  const dateString = `${day.year}-${String(day.month + 1).padStart(2, "0")}-${String(day.date).padStart(2, "0")}`;
                  const isSelected = selectedDate === dateString;
                  const hasTasks = day.tasks.length > 0;
                  const hasIncompleteTasks = day.tasks.some(
                    (t) => !t.completed
                  );

                  return (
                    <TouchableOpacity
                      key={`${day.year}-${day.month}-${day.date}-${index}`}
                      style={[
                        styles.dayCell,
                        !day.isCurrentMonth && styles.dayCellOtherMonth,
                        isSelected && styles.dayCellSelected,
                        day.isToday && styles.dayCellToday,
                      ]}
                      onPress={() => handleDayPress(day)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          !day.isCurrentMonth && styles.dayTextOtherMonth,
                          isSelected && styles.dayTextSelected,
                          day.isToday && styles.dayTextToday,
                        ]}
                      >
                        {day.date}
                      </Text>
                      {hasTasks && (
                        <View
                          style={[
                            styles.taskDot,
                            hasIncompleteTasks
                              ? styles.taskDotIncomplete
                              : styles.taskDotComplete,
                          ]}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </GlassCard>
          </Animated.View>

          {/* Selected Date Tasks */}
          {selectedDate && (
            <Animated.View
              entering={FadeInUp.delay(300)}
              style={styles.tasksSection}
            >
              <View style={styles.tasksSectionHeader}>
                <Text style={styles.tasksSectionTitle}>
                  {formatSelectedDate()}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAddTask(true)}
                  style={styles.addTaskButton}
                  activeOpacity={0.7}
                >
                  <PlusIcon color="#FAFAFA" size={20} />
                </TouchableOpacity>
              </View>

              {selectedDateTasks.length > 0 ? (
                selectedDateTasks.map((task, index) => (
                  <Animated.View
                    key={task.id}
                    entering={FadeInUp.delay(350 + index * 50)}
                    layout={Layout.springify()}
                  >
                    <GlassCard intensity="light" style={styles.taskCard}>
                      <TouchableOpacity
                        style={styles.taskCheckbox}
                        onPress={() => handleToggleTask(task.id)}
                        activeOpacity={0.7}
                      >
                        {task.completed ? (
                          <View style={styles.checkboxChecked}>
                            <CheckIcon color="#FFFFFF" size={14} />
                          </View>
                        ) : (
                          <View style={styles.checkboxUnchecked} />
                        )}
                      </TouchableOpacity>
                      <Text style={styles.taskEmoji}>{task.emoji}</Text>
                      <Text
                        style={[
                          styles.taskTitle,
                          task.completed && styles.taskTitleCompleted,
                        ]}
                      >
                        {task.title}
                      </Text>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteTask(task.id)}
                        activeOpacity={0.7}
                      >
                        <TrashIcon color="#71717A" size={18} />
                      </TouchableOpacity>
                    </GlassCard>
                  </Animated.View>
                ))
              ) : (
                <View style={styles.emptyTasks}>
                  <Text style={styles.emptyTasksText}>
                    No tasks for this day
                  </Text>
                  <Text style={styles.emptyTasksSubtext}>
                    Tap + to add a task
                  </Text>
                </View>
              )}
            </Animated.View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>

      {/* Add Task Modal */}
      <Modal
        visible={showAddTask}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddTask(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowAddTask(false)}
            activeOpacity={1}
          />
          <View style={styles.modalContent}>
            <LinearGradient
              colors={["#1E1E2E", "#18181B"]}
              style={styles.modalGradient}
            >
              <Text style={styles.modalTitle}>Add Task</Text>
              <Text style={styles.modalSubtitle}>{formatSelectedDate()}</Text>

              {/* Emoji Picker */}
              <View style={styles.emojiPicker}>
                {TASK_EMOJIS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiButton,
                      selectedEmoji === emoji && styles.emojiButtonSelected,
                    ]}
                    onPress={() => setSelectedEmoji(emoji)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Task Input */}
              <TextInput
                style={styles.taskInput}
                placeholder="What needs to be done?"
                placeholderTextColor="#52525B"
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleAddTask}
              />

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowAddTask(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    !newTaskTitle.trim() && styles.submitButtonDisabled,
                  ]}
                  onPress={handleAddTask}
                  activeOpacity={0.7}
                  disabled={!newTaskTitle.trim()}
                >
                  <Text style={styles.submitButtonText}>Add Task</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    borderRadius: 16,
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#60A5FA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FAFAFA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
  },
  calendarCard: {
    marginHorizontal: 20,
    padding: 12,
  },
  dayHeaders: {
    flexDirection: "row",
    marginBottom: 8,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#71717A",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  dayCellOtherMonth: {
    opacity: 0.3,
  },
  dayCellSelected: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
  },
  dayCellToday: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FAFAFA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  dayTextOtherMonth: {
    color: "#52525B",
  },
  dayTextSelected: {
    color: "#60A5FA",
    fontWeight: "700",
  },
  dayTextToday: {
    color: "#3B82F6",
    fontWeight: "700",
  },
  taskDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  taskDotIncomplete: {
    backgroundColor: "#FBBF24",
  },
  taskDotComplete: {
    backgroundColor: "#4ADE80",
  },
  tasksSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  tasksSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  tasksSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FAFAFA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
  },
  addTaskButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
  },
  taskCheckbox: {
    marginRight: 12,
  },
  checkboxUnchecked: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#52525B",
  },
  checkboxChecked: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#4ADE80",
    alignItems: "center",
    justifyContent: "center",
  },
  taskEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  taskTitle: {
    flex: 1,
    fontSize: 15,
    color: "#FAFAFA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: "#71717A",
  },
  deleteButton: {
    padding: 8,
  },
  emptyTasks: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyTasksText: {
    fontSize: 15,
    color: "#71717A",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
    marginBottom: 4,
  },
  emptyTasksSubtext: {
    fontSize: 13,
    color: "#52525B",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  bottomSpacer: {
    height: 40,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  modalGradient: {
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FAFAFA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#71717A",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
    marginBottom: 20,
  },
  emojiPicker: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  emojiButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiButtonSelected: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  emojiText: {
    fontSize: 20,
  },
  taskInput: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#FAFAFA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#A1A1AA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#3B82F6",
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "rgba(59, 130, 246, 0.3)",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
});

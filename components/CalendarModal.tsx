/**
 * Calendar Modal Component
 *
 * Full modern calendar view with day/month/year navigation.
 * Includes integrated To-Do list with CRUD operations.
 *
 * UX Intent:
 * - Clean, modern calendar experience
 * - Task management without leaving context
 * - Premium glassmorphism throughout
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  ScrollView,
  TextInput,
  FlatList,
  Dimensions,
  KeyboardAvoidingView,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import Svg, { Path, Circle } from "react-native-svg";
import { GlassCard } from "./GlassCard";
import { useDashboardStore, Task } from "../store/dashboardStore";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
}

// Icons
const ChevronLeftIcon = ({
  color = "#FFFFFF",
  size = 24,
}: {
  color?: string;
  size?: number;
}) => (
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

const ChevronRightIcon = ({
  color = "#FFFFFF",
  size = 24,
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

const CloseIcon = ({
  color = "#FFFFFF",
  size = 24,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6 6L18 18"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PlusIcon = ({
  color = "#FFFFFF",
  size = 24,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5V19"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5 12H19"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CheckIcon = ({
  color = "#10B981",
  size = 20,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17L4 12"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TrashIcon = ({
  color = "#EF4444",
  size = 20,
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
      d="M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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

const EMOJI_OPTIONS = ["📝", "💼", "📚", "🎯", "💪", "🎨", "🔔", "⭐"];

type ViewMode = "calendar" | "month" | "year";

export const CalendarModal: React.FC<CalendarModalProps> = ({
  visible,
  onClose,
}) => {
  const {
    tasks,
    selectedDate,
    setSelectedDate,
    addTask,
    toggleTask,
    deleteTask,
  } = useDashboardStore();

  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("📝");
  const [showAddTask, setShowAddTask] = useState(false);

  // Calendar calculations
  const selectedDateObj = useMemo(() => new Date(selectedDate), [selectedDate]);

  const getDaysInMonth = useCallback((year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  }, []);

  const getFirstDayOfMonth = useCallback((year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  }, []);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days: { day: number; isCurrentMonth: boolean; date: string }[] = [];

    // Previous month days
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = `${prevYear}-${String(prevMonth + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      days.push({ day, isCurrentMonth: false, date });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        i
      ).padStart(2, "0")}`;
      days.push({ day: i, isCurrentMonth: true, date });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;

    for (let i = 1; i <= remainingDays; i++) {
      const date = `${nextYear}-${String(nextMonth + 1).padStart(
        2,
        "0"
      )}-${String(i).padStart(2, "0")}`;
      days.push({ day: i, isCurrentMonth: false, date });
    }

    return days;
  }, [currentDate, getDaysInMonth, getFirstDayOfMonth]);

  // Tasks for selected date
  const selectedDateTasks = useMemo(() => {
    return tasks.filter((task) => task.date === selectedDate);
  }, [tasks, selectedDate]);

  // Navigation handlers
  const goToPrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const selectMonth = (monthIndex: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), monthIndex, 1));
    setViewMode("calendar");
  };

  const selectYear = (year: number) => {
    setCurrentDate(new Date(year, currentDate.getMonth(), 1));
    setViewMode("month");
  };

  // Task handlers
  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      addTask({
        title: newTaskTitle.trim(),
        emoji: selectedEmoji,
        completed: false,
        date: selectedDate,
      });
      setNewTaskTitle("");
      setSelectedEmoji("📝");
      setShowAddTask(false);
    }
  };

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];
    return dateStr === today;
  };

  const hasTasksOnDate = (dateStr: string) => {
    return tasks.some((task) => task.date === dateStr);
  };

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, i) => currentYear - 2 + i);
  }, []);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          entering={SlideInDown.springify().damping(20).stiffness(200)}
          exiting={SlideOutDown.springify().damping(20).stiffness(200)}
          style={styles.modalContainer}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
            {Platform.OS === "ios" ? (
              <BlurView intensity={60} tint="dark" style={styles.blurContainer}>
                <CalendarContent />
              </BlurView>
            ) : (
              <View style={styles.androidContainer}>
                <CalendarContent />
              </View>
            )}
          </KeyboardAvoidingView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );

  function CalendarContent() {
    return (
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <CloseIcon color="#A1A1AA" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Calendar</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* View Mode Selector */}
        <View style={styles.viewModeContainer}>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === "calendar" && styles.viewModeButtonActive,
            ]}
            onPress={() => setViewMode("calendar")}
          >
            <Text
              style={[
                styles.viewModeText,
                viewMode === "calendar" && styles.viewModeTextActive,
              ]}
            >
              Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === "month" && styles.viewModeButtonActive,
            ]}
            onPress={() => setViewMode("month")}
          >
            <Text
              style={[
                styles.viewModeText,
                viewMode === "month" && styles.viewModeTextActive,
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>
        </View>

        {/* Month/Year Display */}
        <View style={styles.monthYearHeader}>
          <TouchableOpacity onPress={goToPrevMonth}>
            <ChevronLeftIcon color="#FFFFFF" size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              setViewMode(viewMode === "year" ? "calendar" : "year")
            }
          >
            <Text style={styles.monthYearText}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goToNextMonth}>
            <ChevronRightIcon color="#FFFFFF" size={24} />
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        {viewMode === "calendar" && (
          <View style={styles.calendarContainer}>
            {/* Day Headers */}
            <View style={styles.dayHeaders}>
              {DAYS.map((day) => (
                <Text key={day} style={styles.dayHeader}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.daysGrid}>
              {calendarDays.map((item, index) => {
                const isSelected = item.date === selectedDate;
                const isTodayDate = isToday(item.date);
                const hasTasks = hasTasksOnDate(item.date);

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayCell,
                      !item.isCurrentMonth && styles.dayCellOtherMonth,
                      isSelected && styles.dayCellSelected,
                      isTodayDate && !isSelected && styles.dayCellToday,
                    ]}
                    onPress={() => setSelectedDate(item.date)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        !item.isCurrentMonth && styles.dayTextOtherMonth,
                        isSelected && styles.dayTextSelected,
                        isTodayDate && !isSelected && styles.dayTextToday,
                      ]}
                    >
                      {item.day}
                    </Text>
                    {hasTasks && !isSelected && <View style={styles.taskDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Month Selector */}
        {viewMode === "month" && (
          <View style={styles.monthGrid}>
            {MONTHS.map((month, index) => (
              <TouchableOpacity
                key={month}
                style={[
                  styles.monthCell,
                  currentDate.getMonth() === index && styles.monthCellSelected,
                ]}
                onPress={() => selectMonth(index)}
              >
                <Text
                  style={[
                    styles.monthCellText,
                    currentDate.getMonth() === index &&
                      styles.monthCellTextSelected,
                  ]}
                >
                  {month.slice(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Year Selector */}
        {viewMode === "year" && (
          <View style={styles.yearGrid}>
            {years.map((year) => (
              <TouchableOpacity
                key={year}
                style={[
                  styles.yearCell,
                  currentDate.getFullYear() === year && styles.yearCellSelected,
                ]}
                onPress={() => selectYear(year)}
              >
                <Text
                  style={[
                    styles.yearCellText,
                    currentDate.getFullYear() === year &&
                      styles.yearCellTextSelected,
                  ]}
                >
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Tasks Section */}
        {viewMode === "calendar" && (
          <View style={styles.tasksSection}>
            <View style={styles.tasksHeader}>
              <Text style={styles.tasksTitle}>Tasks</Text>
              <TouchableOpacity
                style={styles.addTaskButton}
                onPress={() => setShowAddTask(!showAddTask)}
              >
                <PlusIcon color="#3B82F6" size={20} />
                <Text style={styles.addTaskText}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Add Task Form */}
            {showAddTask && (
              <Animated.View
                entering={FadeIn.duration(200)}
                style={styles.addTaskForm}
              >
                {/* Emoji Selector */}
                <View style={styles.emojiSelector}>
                  {EMOJI_OPTIONS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.emojiOption,
                        selectedEmoji === emoji && styles.emojiOptionSelected,
                      ]}
                      onPress={() => setSelectedEmoji(emoji)}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Task Input */}
                <View style={styles.taskInputContainer}>
                  <TextInput
                    style={styles.taskInput}
                    placeholder="Enter task..."
                    placeholderTextColor="#71717A"
                    value={newTaskTitle}
                    onChangeText={setNewTaskTitle}
                    onSubmitEditing={handleAddTask}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={[
                      styles.submitTaskButton,
                      !newTaskTitle.trim() && styles.submitTaskButtonDisabled,
                    ]}
                    onPress={handleAddTask}
                    disabled={!newTaskTitle.trim()}
                  >
                    <CheckIcon
                      color={newTaskTitle.trim() ? "#10B981" : "#71717A"}
                      size={20}
                    />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {/* Tasks List */}
            <ScrollView
              style={styles.tasksList}
              showsVerticalScrollIndicator={false}
            >
              {selectedDateTasks.length === 0 ? (
                <View style={styles.emptyTasks}>
                  <Text style={styles.emptyTasksText}>
                    No tasks for this day
                  </Text>
                  <Text style={styles.emptyTasksSubtext}>
                    Tap + to add a task
                  </Text>
                </View>
              ) : (
                selectedDateTasks.map((task) => (
                  <View key={task.id} style={styles.taskItem}>
                    <TouchableOpacity
                      style={styles.taskCheckbox}
                      onPress={() => toggleTask(task.id)}
                    >
                      {task.completed ? (
                        <View style={styles.taskCheckboxChecked}>
                          <CheckIcon color="#FFFFFF" size={14} />
                        </View>
                      ) : (
                        <View style={styles.taskCheckboxUnchecked} />
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
                      style={styles.deleteTaskButton}
                      onPress={() => deleteTask(task.id)}
                    >
                      <TrashIcon color="#EF4444" size={18} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        )}
      </View>
    );
  }
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  keyboardView: {
    flex: 1,
  },
  blurContainer: {
    flex: 1,
    overflow: "hidden",
  },
  androidContainer: {
    flex: 1,
    backgroundColor: "rgba(20, 20, 30, 0.98)",
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
  },
  viewModeContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  viewModeButtonActive: {
    backgroundColor: "#FFFFFF",
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#A1A1AA",
  },
  viewModeTextActive: {
    color: "#0A0A0F",
  },
  monthYearHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  monthYearText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
  },
  calendarContainer: {
    paddingHorizontal: 16,
  },
  dayHeaders: {
    flexDirection: "row",
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
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
    position: "relative",
  },
  dayCellOtherMonth: {},
  dayCellSelected: {
    backgroundColor: "#3B82F6",
    borderRadius: 20,
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: "#3B82F6",
    borderRadius: 20,
  },
  dayText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  dayTextOtherMonth: {
    color: "#4A4A5A",
  },
  dayTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  dayTextToday: {
    color: "#3B82F6",
    fontWeight: "700",
  },
  taskDot: {
    position: "absolute",
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#EC4899",
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
  },
  monthCell: {
    width: `${(100 - 8) / 4}%`,
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  monthCellSelected: {
    backgroundColor: "#3B82F6",
  },
  monthCellText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#A1A1AA",
  },
  monthCellTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  yearGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
  },
  yearCell: {
    width: `${(100 - 16) / 4}%`,
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  yearCellSelected: {
    backgroundColor: "#3B82F6",
  },
  yearCellText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#A1A1AA",
  },
  yearCellTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  tasksSection: {
    flex: 1,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  tasksHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  tasksTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
  },
  addTaskButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    borderRadius: 8,
  },
  addTaskText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  addTaskForm: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  emojiSelector: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  emojiOption: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  emojiOptionSelected: {
    backgroundColor: "rgba(59, 130, 246, 0.3)",
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  emojiText: {
    fontSize: 18,
  },
  taskInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  taskInput: {
    flex: 1,
    height: 44,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  submitTaskButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  submitTaskButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  tasksList: {
    flex: 1,
    marginBottom: 20,
  },
  emptyTasks: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyTasksText: {
    fontSize: 15,
    color: "#71717A",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  emptyTasksSubtext: {
    fontSize: 13,
    color: "#4A4A5A",
    marginTop: 4,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  taskCheckbox: {
    marginRight: 10,
  },
  taskCheckboxUnchecked: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#4A4A5A",
  },
  taskCheckboxChecked: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: "#10B981",
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
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: "#71717A",
  },
  deleteTaskButton: {
    padding: 4,
  },
});

export default CalendarModal;

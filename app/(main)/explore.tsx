/**
 * Explore Screen (Community)
 *
 * Curated professional knowledge exchange.
 * Features search, filter chips, and Twitter-style Q&A feed.
 *
 * UX Intent:
 * - Replace noise with signal
 * - Not a forum - curated knowledge exchange
 * - Trust signals through verification
 */

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  TextInput,
  FlatList,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInDown,
  Layout,
} from "react-native-reanimated";
import Svg, { Path, Circle } from "react-native-svg";
import { GlassCard } from "../../components/GlassCard";
import { BottomTabBar } from "../../components/BottomTabBar";
import { TopHeaderBar } from "../../components/TopHeaderBar";
import { useDashboardStore } from "../../store/dashboardStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Icons
const SearchIcon = ({
  color = "#71717A",
  size = 20,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={2} />
    <Path
      d="M21 21L16.65 16.65"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const VerifiedIcon = ({
  color = "#3B82F6",
  size = 16,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M9 12L11 14L15 10M12 3L13.5 4.5L15.5 4L16 6L18 6.5L17.5 8.5L19 10L17.5 11.5L18 13.5L16 14L15.5 16L13.5 15.5L12 17L10.5 15.5L8.5 16L8 14L6 13.5L6.5 11.5L5 10L6.5 8.5L6 6.5L8 6L8.5 4L10.5 4.5L12 3Z" />
  </Svg>
);

const ThumbUpIcon = ({
  color = "#A1A1AA",
  size = 18,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 9V5C14 4.46957 13.7893 3.96086 13.4142 3.58579C13.0391 3.21071 12.5304 3 12 3L7 12V21H18.28C18.7623 21.0055 19.2304 20.8364 19.5979 20.524C19.9654 20.2116 20.2077 19.7769 20.28 19.3L21.66 11.3C21.7035 11.0134 21.6842 10.7207 21.6033 10.4423C21.5225 10.1638 21.3821 9.90629 21.1919 9.68751C21.0016 9.46873 20.7661 9.29393 20.5016 9.17522C20.2371 9.0565 19.9499 8.99672 19.66 9H14Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7 12H4C3.46957 12 2.96086 12.2107 2.58579 12.5858C2.21071 12.9609 2 13.4696 2 14V19C2 19.5304 2.21071 20.0391 2.58579 20.4142C2.96086 20.7893 3.46957 21 4 21H7"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CommentIcon = ({
  color = "#A1A1AA",
  size = 18,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const BookmarkIcon = ({
  color = "#A1A1AA",
  size = 18,
}: {
  color?: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Filter options
const FILTER_OPTIONS = [
  { id: "top", label: "Top" },
  { id: "recent", label: "Recent" },
  { id: "sde", label: "SDE" },
  { id: "pm", label: "Product Manager" },
  { id: "fullstack", label: "Full Stack" },
  { id: "data", label: "Data Science" },
  { id: "design", label: "Design" },
];

// Mock data for posts
const MOCK_POSTS = [
  {
    id: "1",
    author: {
      name: "Sarah Chen",
      role: "Senior SDE @ Google",
      avatar: "👩‍💻",
      verified: true,
    },
    question:
      "What's the best way to prepare for system design interviews at FAANG companies?",
    content:
      "Start with understanding the fundamentals: load balancing, caching, database sharding. Then practice with real-world examples. I recommend starting with Designing Data-Intensive Applications book.",
    tags: ["interviews", "system-design", "faang"],
    upvotes: 234,
    comments: 45,
    timeAgo: "2h ago",
  },
  {
    id: "2",
    author: {
      name: "Michael Torres",
      role: "Product Manager @ Meta",
      avatar: "👨‍💼",
      verified: true,
    },
    question: "How do you transition from engineering to product management?",
    content:
      "Leverage your technical background! Start by leading cross-functional projects, understanding user needs, and developing business acumen. PM roles value technical PMs highly.",
    tags: ["career-switch", "product", "tech"],
    upvotes: 189,
    comments: 32,
    timeAgo: "4h ago",
  },
  {
    id: "3",
    author: {
      name: "Emily Wang",
      role: "Tech Lead @ Stripe",
      avatar: "👩‍🔬",
      verified: true,
    },
    question:
      "What skills should a new grad focus on to stand out in the job market?",
    content:
      "1. Deep expertise in one language/framework\n2. System design basics\n3. Communication skills\n4. Side projects that solve real problems\n5. Understanding of CI/CD and testing",
    tags: ["new-grad", "career", "skills"],
    upvotes: 312,
    comments: 67,
    timeAgo: "6h ago",
  },
  {
    id: "4",
    author: {
      name: "Alex Kumar",
      role: "Staff Engineer @ Netflix",
      avatar: "🧑‍💻",
      verified: true,
    },
    question: "How important is DSA for day-to-day work vs. interviews?",
    content:
      "Honestly, most DSA you use in interviews rarely appears in daily work. However, algorithmic thinking helps you write efficient code. Focus on understanding complexity and trade-offs.",
    tags: ["dsa", "interviews", "engineering"],
    upvotes: 445,
    comments: 89,
    timeAgo: "12h ago",
  },
  {
    id: "5",
    author: {
      name: "Priya Sharma",
      role: "Engineering Manager @ Amazon",
      avatar: "👩‍💻",
      verified: true,
    },
    question: "What's the path from SDE to Engineering Manager?",
    content:
      "It's not just about technical skills. Develop mentorship abilities, learn to delegate, understand business impact, and practice giving/receiving feedback. The transition takes 2-3 years typically.",
    tags: ["leadership", "career-growth", "management"],
    upvotes: 278,
    comments: 54,
    timeAgo: "1d ago",
  },
];

interface PostCardProps {
  post: (typeof MOCK_POSTS)[0];
  index: number;
}

const PostCard: React.FC<PostCardProps> = ({ post, index }) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).springify()}
      layout={Layout.springify()}
    >
      <GlassCard style={styles.postCard} intensity="light">
        {/* Author Header */}
        <View style={styles.postHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{post.author.avatar}</Text>
          </View>
          <View style={styles.authorInfo}>
            <View style={styles.authorNameRow}>
              <Text style={styles.authorName}>{post.author.name}</Text>
              {post.author.verified && (
                <VerifiedIcon color="#3B82F6" size={14} />
              )}
            </View>
            <Text style={styles.authorRole}>{post.author.role}</Text>
          </View>
          <Text style={styles.timeAgo}>{post.timeAgo}</Text>
        </View>

        {/* Question */}
        <Text style={styles.questionText}>{post.question}</Text>

        {/* Answer/Content */}
        <Text style={styles.contentText} numberOfLines={4}>
          {post.content}
        </Text>

        {/* Tags */}
        <View style={styles.tagsContainer}>
          {post.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setLiked(!liked)}
          >
            <ThumbUpIcon color={liked ? "#3B82F6" : "#A1A1AA"} size={18} />
            <Text style={[styles.actionText, liked && styles.actionTextActive]}>
              {liked ? post.upvotes + 1 : post.upvotes}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <CommentIcon color="#A1A1AA" size={18} />
            <Text style={styles.actionText}>{post.comments}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setSaved(!saved)}
          >
            <BookmarkIcon color={saved ? "#EC4899" : "#A1A1AA"} size={18} />
          </TouchableOpacity>
        </View>
      </GlassCard>
    </Animated.View>
  );
};

export default function ExploreScreen() {
  const { notifications } = useDashboardStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("top");

  // Filter posts based on search and filter
  const filteredPosts = useMemo(() => {
    let posts = MOCK_POSTS;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      posts = posts.filter(
        (post) =>
          post.question.toLowerCase().includes(query) ||
          post.content.toLowerCase().includes(query) ||
          post.tags.some((tag) => tag.includes(query))
      );
    }

    // Sort by filter
    if (activeFilter === "recent") {
      // Already sorted by recent in mock data
    } else if (activeFilter === "top") {
      posts = [...posts].sort((a, b) => b.upvotes - a.upvotes);
    } else {
      // Filter by role/tag
      posts = posts.filter(
        (post) =>
          post.tags.some((tag) =>
            tag.toLowerCase().includes(activeFilter.toLowerCase())
          ) ||
          post.author.role.toLowerCase().includes(activeFilter.toLowerCase())
      );
    }

    return posts;
  }, [searchQuery, activeFilter]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <TopHeaderBar
        notificationCount={
          notifications.filter((n: { read: boolean }) => !n.read).length
        }
        visible={true}
      />

      {/* Search Bar (Sticky) */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <SearchIcon color="#71717A" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search roles, questions, or skills"
            placeholderTextColor="#71717A"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTER_OPTIONS.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterChip,
                activeFilter === filter.id && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(filter.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === filter.id && styles.filterChipTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Feed */}
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <PostCard post={item} index={index} />}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No posts found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your search or filters
            </Text>
          </View>
        }
      />

      {/* Bottom Tab Bar */}
      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0F",
  },
  searchContainer: {
    paddingTop: Platform.OS === "ios" ? 100 : 85,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#0A0A0F",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  filterContainer: {
    paddingBottom: 12,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#3B82F6",
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#A1A1AA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  feedContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  postCard: {
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 22,
  },
  authorInfo: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  authorName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
  },
  authorRole: {
    fontSize: 13,
    color: "#71717A",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
    marginTop: 2,
  },
  timeAgo: {
    fontSize: 12,
    color: "#4A4A5A",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  questionText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
    lineHeight: 24,
    marginBottom: 8,
  },
  contentText: {
    fontSize: 15,
    color: "#A1A1AA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
    lineHeight: 22,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: "#60A5FA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    paddingTop: 12,
    gap: 24,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: "#A1A1AA",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
  actionTextActive: {
    color: "#3B82F6",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "SF Pro Display" : "System",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#71717A",
    fontFamily: Platform.OS === "ios" ? "SF Pro Text" : "System",
  },
});

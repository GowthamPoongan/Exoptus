/**
 * Community Routes
 *
 * Handles community posts (Explore screen data).
 * Backend is source of truth - no mock data in frontend.
 */

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// Seed data - will be stored in DB in production
const COMMUNITY_POSTS = [
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
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
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
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
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
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
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
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
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
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

/**
 * GET /community/posts
 * Returns paginated community posts with filtering/sorting
 */
router.get("/posts", async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "10",
      sort = "top",
      filter,
      search,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    let posts = [...COMMUNITY_POSTS];

    // Search filter
    if (search) {
      const query = (search as string).toLowerCase();
      posts = posts.filter(
        (post) =>
          post.question.toLowerCase().includes(query) ||
          post.content.toLowerCase().includes(query) ||
          post.tags.some((tag) => tag.includes(query))
      );
    }

    // Category filter
    if (filter && filter !== "top" && filter !== "recent") {
      const filterStr = (filter as string).toLowerCase();
      posts = posts.filter(
        (post) =>
          post.tags.some((tag) => tag.toLowerCase().includes(filterStr)) ||
          post.author.role.toLowerCase().includes(filterStr)
      );
    }

    // Sort
    if (sort === "top") {
      posts.sort((a, b) => b.upvotes - a.upvotes);
    } else if (sort === "recent") {
      posts.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    // Pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedPosts = posts.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        posts: paginatedPosts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: posts.length,
          totalPages: Math.ceil(posts.length / limitNum),
          hasMore: endIndex < posts.length,
        },
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching posts:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch posts",
    });
  }
});

/**
 * GET /community/posts/:id
 * Returns single post with full details
 */
router.get("/posts/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const post = COMMUNITY_POSTS.find((p) => p.id === id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      });
    }

    res.json({
      success: true,
      data: post,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch post",
    });
  }
});

/**
 * POST /community/posts/:id/upvote
 * Upvote a post
 */
router.post(
  "/posts/:id/upvote",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const post = COMMUNITY_POSTS.find((p) => p.id === id);

      if (!post) {
        return res.status(404).json({
          success: false,
          error: "Post not found",
        });
      }

      // In production, track user upvotes in DB
      post.upvotes += 1;

      res.json({
        success: true,
        data: { upvotes: post.upvotes },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to upvote post",
      });
    }
  }
);

export default router;

import { useState, useEffect } from "react";

// CoachPro-inspired design system
const COLORS = {
  primary: "#0575E6",
  dark: "#021B79",
  white: "#FFFFFF",
  background: "#F0F4F8",
  cardBg: "#FFFFFF",
  text: "#2D3748",
  textLight: "#718096",
  success: "#48BB78",
  warning: "#ECC94B",
  danger: "#F56565",
  info: "#4299E1",
  sidebar: "#FFFFFF",
  sidebarHover: "#E2E8F0",
  sidebarActive: "linear-gradient(135deg, #0575E6 0%, #021B79 100%)",
};

const API_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:3000";

interface Stats {
  totalUsers: number;
  completedOnboarding: number;
  completionRate: number;
  averageJRScore: number;
  totalJobs: number;
  totalRoles: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  jrScore: number;
  onboardingCompleted: boolean;
  college?: string;
}

interface Analytics {
  jrScore: {
    distribution: Record<string, number>;
    average: number;
    topRoles: Array<{ role: string; count: number }>;
  };
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
}

interface Role {
  id: string;
  title: string;
  category: string;
  salaryMin: number;
  salaryMax: number;
  experienceYears: number;
  difficulty: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "users" | "analytics" | "jobs" | "roles"
  >("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [adminKey, setAdminKey] = useState(
    localStorage.getItem("adminKey") || ""
  );
  const [showKeyModal, setShowKeyModal] = useState(!adminKey);
  const [tempKey, setTempKey] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const fetchAPI = async (endpoint: string) => {
    try {
      console.log(`Fetching: ${API_URL}${endpoint}`);
      const res = await fetch(`${API_URL}${endpoint}`, {
        headers: { "x-admin-key": adminKey },
      });
      console.log(`Response status for ${endpoint}: ${res.status}`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setAdminKey("");
          localStorage.removeItem("adminKey");
          setShowKeyModal(true);
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      console.log(`Data for ${endpoint}:`, data);
      return data;
    } catch (error) {
      console.error(`Failed to fetch ${endpoint}:`, error);
      return null;
    }
  };

  const loadAllData = async () => {
    const [statsRes, usersRes, analyticsRes, jobsRes, rolesRes] =
      await Promise.all([
        fetchAPI("/admin/stats"),
        fetchAPI("/admin/users?limit=20"),
        fetchAPI("/admin/analytics/jr-score"),
        fetchAPI("/admin/jobs?limit=20"),
        fetchAPI("/admin/roles?limit=20"),
      ]);

    if (statsRes?.data) setStats(statsRes.data);
    if (usersRes?.data) setUsers(usersRes.data);
    if (analyticsRes?.data) setAnalytics({ jrScore: analyticsRes.data });
    if (jobsRes?.data) setJobs(jobsRes.data);
    if (rolesRes?.data) setRoles(rolesRes.data);
    setLastUpdate(new Date());
  };

  useEffect(() => {
    if (adminKey) {
      loadAllData();
      const interval = setInterval(loadAllData, 30000); // Real-time update every 30s
      return () => clearInterval(interval);
    }
  }, [adminKey]);

  const handleSetKey = () => {
    if (tempKey.trim()) {
      setAdminKey(tempKey);
      localStorage.setItem("adminKey", tempKey);
      setShowKeyModal(false);
      setTempKey("");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: COLORS.background,
      }}
    >
      {/* Modal */}
      {showKeyModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={{ marginBottom: 20, color: COLORS.text, fontSize: 24 }}>
              Admin Authentication
            </h2>
            <p style={{ color: COLORS.textLight, marginBottom: 20 }}>
              Enter your admin key to access the dashboard
            </p>
            <input
              type="password"
              placeholder="Enter admin key..."
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSetKey()}
              style={styles.input}
              autoFocus
            />
            <button onClick={handleSetKey} style={styles.primaryButton}>
              Authenticate
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside
        style={{ ...styles.sidebar, width: isSidebarCollapsed ? 80 : 260 }}
      >
        <div style={styles.sidebarHeader}>
          <h1
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: COLORS.primary,
              margin: 0,
            }}
          >
            {isSidebarCollapsed ? "E" : "ExoptusAdmin"}
          </h1>
        </div>

        <nav style={{ flex: 1, paddingTop: 20 }}>
          {[
            { id: "dashboard", icon: "📊", label: "Dashboard" },
            { id: "users", icon: "👥", label: "Users" },
            { id: "analytics", icon: "📈", label: "Analytics" },
            { id: "jobs", icon: "💼", label: "Jobs" },
            { id: "roles", icon: "🎯", label: "Roles" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              style={{
                ...styles.navItem,
                background:
                  activeTab === item.id ? COLORS.sidebarActive : "transparent",
                color: activeTab === item.id ? COLORS.white : COLORS.text,
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  marginRight: isSidebarCollapsed ? 0 : 16,
                }}
              >
                {item.icon}
              </span>
              {!isSidebarCollapsed && (
                <span style={{ fontWeight: 600 }}>{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          style={{
            ...styles.navItem,
            marginTop: "auto",
            justifyContent: "center",
          }}
        >
          {isSidebarCollapsed ? "→" : "←"}
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: "auto" }}>
        {/* Header */}
        <header style={styles.header}>
          <div>
            <p style={{ fontSize: 14, color: COLORS.textLight }}>
              Welcome back 👋
            </p>
            <h2
              style={{
                fontSize: 32,
                fontWeight: "bold",
                color: COLORS.text,
                marginTop: 5,
              }}
            >
              {activeTab === "dashboard"
                ? "Dashboard"
                : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 12, color: COLORS.textLight }}>
                Last updated
              </p>
              <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>
                {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
            <button onClick={loadAllData} style={styles.iconButton}>
              🔄
            </button>
            <button
              onClick={() => setShowKeyModal(true)}
              style={styles.iconButton}
            >
              🔑
            </button>
            <div style={styles.avatar}>
              <span style={{ fontSize: 18 }}>👤</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div style={{ padding: 30 }}>
          {activeTab === "dashboard" && (
            <DashboardView stats={stats} users={users.slice(0, 5)} />
          )}
          {activeTab === "users" && (
            <UsersView
              users={filteredUsers}
              searchQuery={searchQuery}
              onSearch={setSearchQuery}
            />
          )}
          {activeTab === "analytics" && <AnalyticsView analytics={analytics} />}
          {activeTab === "jobs" && <JobsView jobs={jobs} />}
          {activeTab === "roles" && <RolesView roles={roles} />}
        </div>
      </main>
    </div>
  );
}

// Dashboard View
function DashboardView({
  stats,
  users,
}: {
  stats: Stats | null;
  users: User[];
}) {
  if (!stats) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <div style={styles.spinner} />
        <p style={{ marginTop: 20, color: COLORS.textLight }}>
          Loading dashboard...
        </p>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: "👥",
      color: COLORS.primary,
      change: "+12%",
    },
    {
      label: "Completed Onboarding",
      value: stats.completedOnboarding,
      icon: "✅",
      color: COLORS.success,
      change: "+8%",
    },
    {
      label: "Completion Rate",
      value: `${(stats.completionRate * 100).toFixed(1)}%`,
      icon: "📊",
      color: COLORS.info,
      change: "+5%",
    },
    {
      label: "Avg JR Score",
      value: stats.averageJRScore.toFixed(1),
      icon: "⭐",
      color: COLORS.warning,
      change: "+15%",
    },
  ];

  return (
    <div>
      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        {statCards.map((card, idx) => (
          <div key={idx} style={styles.statCard}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 14,
                    color: COLORS.textLight,
                    marginBottom: 8,
                  }}
                >
                  {card.label}
                </p>
                <h3
                  style={{
                    fontSize: 32,
                    fontWeight: "bold",
                    color: COLORS.text,
                    margin: 0,
                  }}
                >
                  {card.value}
                </h3>
                <span
                  style={{
                    fontSize: 12,
                    color: COLORS.success,
                    fontWeight: 600,
                    marginTop: 8,
                  }}
                >
                  {card.change}
                </span>
              </div>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 12,
                  background: `${card.color}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                }}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 24,
          marginTop: 24,
        }}
      >
        {/* Recent Users */}
        <div style={styles.card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <h3
              style={{ fontSize: 18, fontWeight: "bold", color: COLORS.text }}
            >
              Recent Users
            </h3>
            <button style={styles.linkButton}>View all →</button>
          </div>
          {users.map((user, idx) => (
            <div
              key={user.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderBottom:
                  idx < users.length - 1
                    ? `1px solid ${COLORS.background}`
                    : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.dark})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: COLORS.white,
                    fontWeight: "bold",
                  }}
                >
                  {user.name
                    ? user.name.charAt(0).toUpperCase()
                    : user.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p
                    style={{
                      fontWeight: 600,
                      color: COLORS.text,
                      marginBottom: 2,
                    }}
                  >
                    {user.name || "Anonymous"}
                  </p>
                  <p style={{ fontSize: 12, color: COLORS.textLight }}>
                    {user.email}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: COLORS.primary,
                  }}
                >
                  {user.jrScore}
                </p>
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 12,
                    background: user.onboardingCompleted
                      ? `${COLORS.success}20`
                      : `${COLORS.warning}20`,
                    color: user.onboardingCompleted
                      ? COLORS.success
                      : COLORS.warning,
                    fontWeight: 600,
                  }}
                >
                  {user.onboardingCompleted ? "Active" : "Pending"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              ...styles.card,
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.dark})`,
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: COLORS.white,
                opacity: 0.9,
                marginBottom: 8,
              }}
            >
              TOTAL JOBS
            </p>
            <h2
              style={{
                fontSize: 36,
                fontWeight: "bold",
                color: COLORS.white,
                margin: 0,
              }}
            >
              {stats.totalJobs}
            </h2>
            <p
              style={{
                fontSize: 12,
                color: COLORS.white,
                opacity: 0.8,
                marginTop: 8,
              }}
            >
              Active listings
            </p>
          </div>

          <div style={{ ...styles.card, background: `${COLORS.success}` }}>
            <p
              style={{
                fontSize: 12,
                color: COLORS.white,
                opacity: 0.9,
                marginBottom: 8,
              }}
            >
              TOTAL ROLES
            </p>
            <h2
              style={{
                fontSize: 36,
                fontWeight: "bold",
                color: COLORS.white,
                margin: 0,
              }}
            >
              {stats.totalRoles}
            </h2>
            <p
              style={{
                fontSize: 12,
                color: COLORS.white,
                opacity: 0.8,
                marginTop: 8,
              }}
            >
              Career paths
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Users View
function UsersView({
  users,
  searchQuery,
  onSearch,
}: {
  users: User[];
  searchQuery: string;
  onSearch: (query: string) => void;
}) {
  return (
    <div>
      <div style={styles.searchBar}>
        <span style={{ fontSize: 18 }}>🔍</span>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      <div style={styles.card}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${COLORS.background}` }}>
              <th style={styles.tableHeader}>User</th>
              <th style={styles.tableHeader}>Email</th>
              <th style={styles.tableHeader}>College</th>
              <th style={styles.tableHeader}>JR Score</th>
              <th style={styles.tableHeader}>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                style={{ borderBottom: `1px solid ${COLORS.background}` }}
              >
                <td style={styles.tableCell}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.dark})`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: COLORS.white,
                        fontWeight: "bold",
                        fontSize: 14,
                      }}
                    >
                      {user.name
                        ? user.name.charAt(0).toUpperCase()
                        : user.email.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600 }}>
                      {user.name || "Anonymous"}
                    </span>
                  </div>
                </td>
                <td style={styles.tableCell}>{user.email}</td>
                <td style={styles.tableCell}>{user.college || "N/A"}</td>
                <td style={styles.tableCell}>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      color: COLORS.primary,
                    }}
                  >
                    {user.jrScore}
                  </span>
                </td>
                <td style={styles.tableCell}>
                  <span
                    style={{
                      padding: "6px 12px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      background: user.onboardingCompleted
                        ? `${COLORS.success}20`
                        : `${COLORS.warning}20`,
                      color: user.onboardingCompleted
                        ? COLORS.success
                        : COLORS.warning,
                    }}
                  >
                    {user.onboardingCompleted ? "✓ Completed" : "⏳ Pending"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Analytics View
function AnalyticsView({ analytics }: { analytics: Analytics | null }) {
  if (!analytics) {
    return (
      <div
        style={{ textAlign: "center", padding: 60, color: COLORS.textLight }}
      >
        Loading analytics...
      </div>
    );
  }

  const jrScoreData = analytics.jrScore || {};
  const { average = 0, distribution = {}, topRoles = [] } = jrScoreData as any;
  const maxValue = Math.max(
    ...(Object.values(distribution || {}) as number[]),
    1
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      <div style={styles.card}>
        <h3
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: COLORS.text,
            marginBottom: 20,
          }}
        >
          JR Score Distribution
        </h3>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 12,
            height: 200,
          }}
        >
          {Object.entries(distribution || {}).map(([range, count]) => {
            const height = ((count as number) / maxValue) * 100;
            return (
              <div
                key={range}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: `${Math.max(height, 10)}%`,
                    background: `linear-gradient(180deg, ${COLORS.primary}, ${COLORS.dark})`,
                    borderRadius: "8px 8px 0 0",
                    transition: "all 0.3s",
                  }}
                />
                <p
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: COLORS.textLight,
                    fontWeight: 600,
                  }}
                >
                  {range}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div style={styles.card}>
        <h3
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: COLORS.text,
            marginBottom: 20,
          }}
        >
          Top Career Choices
        </h3>
        {topRoles && topRoles.length > 0 ? (
          topRoles.map((role: any, idx: number) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderBottom:
                  idx < topRoles.length - 1
                    ? `1px solid ${COLORS.background}`
                    : "none",
              }}
            >
              <span style={{ color: COLORS.text, fontWeight: 600 }}>
                {role.role}
              </span>
              <span
                style={{
                  padding: "6px 16px",
                  borderRadius: 20,
                  background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.dark})`,
                  color: COLORS.white,
                  fontWeight: "bold",
                  fontSize: 14,
                }}
              >
                {role.count}
              </span>
            </div>
          ))
        ) : (
          <p style={{ color: COLORS.textLight, textAlign: "center" }}>
            No data available
          </p>
        )}
      </div>

      <div style={{ ...styles.card, gridColumn: "1 / -1" }}>
        <h3
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: COLORS.text,
            marginBottom: 20,
          }}
        >
          Average JR Score
        </h3>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 150,
              height: 150,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.dark})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
            }}
          >
            <span
              style={{ fontSize: 48, fontWeight: "bold", color: COLORS.white }}
            >
              {average.toFixed(1)}
            </span>
          </div>
          <p style={{ marginTop: 16, color: COLORS.textLight }}>Out of 100</p>
        </div>
      </div>
    </div>
  );
}

// Jobs View
function JobsView({ jobs }: { jobs: Job[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 20,
      }}
    >
      {jobs.map((job) => (
        <div key={job.id} style={styles.card}>
          <h4
            style={{
              fontSize: 16,
              fontWeight: "bold",
              color: COLORS.text,
              marginBottom: 8,
            }}
          >
            {job.title}
          </h4>
          <p
            style={{ fontSize: 14, color: COLORS.textLight, marginBottom: 12 }}
          >
            {job.company}
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 12, color: COLORS.textLight }}>
              📍 {job.location}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: "bold",
                color: COLORS.success,
              }}
            >
              ${job.salaryMin}k - ${job.salaryMax}k
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Roles View
function RolesView({ roles }: { roles: Role[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 20,
      }}
    >
      {roles.map((role) => (
        <div key={role.id} style={styles.card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
              marginBottom: 12,
            }}
          >
            <h4
              style={{ fontSize: 16, fontWeight: "bold", color: COLORS.text }}
            >
              {role.title}
            </h4>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 600,
                background:
                  role.difficulty === "Easy"
                    ? `${COLORS.success}20`
                    : role.difficulty === "Medium"
                    ? `${COLORS.warning}20`
                    : `${COLORS.danger}20`,
                color:
                  role.difficulty === "Easy"
                    ? COLORS.success
                    : role.difficulty === "Medium"
                    ? COLORS.warning
                    : COLORS.danger,
              }}
            >
              {role.difficulty}
            </span>
          </div>
          <p
            style={{ fontSize: 13, color: COLORS.textLight, marginBottom: 12 }}
          >
            {role.category}
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 12, color: COLORS.textLight }}>
              💼 {role.experienceYears}+ years
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: "bold",
                color: COLORS.primary,
              }}
            >
              ${role.salaryMin}k - ${role.salaryMax}k
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Styles
const styles = {
  modalOverlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    backdropFilter: "blur(5px)",
  },
  modal: {
    background: COLORS.white,
    borderRadius: 20,
    padding: 40,
    maxWidth: 450,
    width: "90%",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    marginBottom: 20,
    border: `2px solid ${COLORS.background}`,
    borderRadius: 12,
    fontSize: 15,
    transition: "border-color 0.3s",
    outline: "none",
  },
  primaryButton: {
    width: "100%",
    padding: "14px 24px",
    borderRadius: 12,
    border: "none",
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.dark})`,
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s",
  },
  sidebar: {
    background: COLORS.sidebar,
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column" as const,
    boxShadow: "2px 0 10px rgba(0, 0, 0, 0.05)",
    transition: "width 0.3s",
  },
  sidebarHeader: {
    padding: "12px",
    marginBottom: 20,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "14px 16px",
    marginBottom: 6,
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    fontSize: 15,
    transition: "all 0.2s",
  },
  header: {
    background: COLORS.white,
    padding: "24px 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: `1px solid ${COLORS.background}`,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    border: "none",
    background: COLORS.background,
    fontSize: 18,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.dark})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 20,
  },
  statCard: {
    background: COLORS.cardBg,
    padding: 24,
    borderRadius: 16,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
    transition: "all 0.3s",
  },
  card: {
    background: COLORS.cardBg,
    padding: 24,
    borderRadius: 16,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
  },
  linkButton: {
    background: "none",
    border: "none",
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  searchBar: {
    background: COLORS.white,
    padding: "12px 20px",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
  },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: 15,
    color: COLORS.text,
  },
  tableHeader: {
    textAlign: "left" as const,
    padding: "12px 16px",
    fontSize: 13,
    fontWeight: 700,
    color: COLORS.textLight,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  tableCell: {
    padding: "16px",
    color: COLORS.text,
    fontSize: 14,
  },
  spinner: {
    width: 40,
    height: 40,
    border: `4px solid ${COLORS.background}`,
    borderTop: `4px solid ${COLORS.primary}`,
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto",
  },
};

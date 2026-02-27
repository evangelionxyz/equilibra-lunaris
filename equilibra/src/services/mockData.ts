import type {
  Project,
  User,
  Task,
  Meeting,
  ProjectMember,
  Alert,
  Activity,
  ProjectMetric,
  UserProjectStats,
} from "../models";

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ─── Users ────────────────────────────────────────────────────────────────────
export const mockUsers: User[] = [
  { id: 1, github_id: 101, github_username: "budi_dev", username: "Budi" },
  { id: 2, github_id: 102, github_username: "sarah_pm", username: "Sarah" },
  { id: 3, github_id: 103, github_username: "alex_ds", username: "Alex" },
  { id: 4, github_id: 104, github_username: "tono_be", username: "Tono" },
];

// ─── Projects ─────────────────────────────────────────────────────────────────
export const mockProjects: Project[] = [
  {
    id: 10,
    name: "Project Alpha",
    github_repo_url: "github.com/equilibra/alpha",
    status: "Blocked",
    progress: 65,
    issue: "3 dependencies pending, team velocity dropping",
    tags: ["Backend", "Critical"],
    isLead: true,
  },
  {
    id: 11,
    name: "Marketing AI Gen",
    github_repo_url: "github.com/equilibra/marketing",
    status: "Healthy Flow",
    progress: 85,
    issue: "System operating within normal parameters.",
    isLead: true,
  },
  {
    id: 12,
    name: "Legacy Migration",
    github_repo_url: "github.com/equilibra/legacy",
    status: "At Risk",
    progress: 58,
    issue: "Resource allocation conflict, deadline approaching",
    tasksPending: 12,
  },
  {
    id: 13,
    name: "UI Kit v2.4",
    github_repo_url: "github.com/equilibra/ui",
    status: "On Track",
    progress: 72,
    issue: "Steady progress, minor design review pending.",
    tasksPending: 3,
  },
  {
    id: 14,
    name: "Internal Tools",
    github_repo_url: "github.com/equilibra/tools",
    status: "Stalled",
    progress: 42,
    issue: "No active tasks, team reassignment needed",
    tasksPending: 3,
  },
];

// ─── Project Members (role per user per project) ───────────────────────────────
export const mockProjectMembers: ProjectMember[] = [
  // Project Alpha — Budi is MANAGER, Alex is PROGRAMMER, Tono is PROGRAMMER
  {
    project_id: 10,
    user_id: 1,
    role: "MANAGER",
    kpi_score: 88,
    max_capacity: 10,
    current_load: 60,
  },
  {
    project_id: 10,
    user_id: 3,
    role: "PROGRAMMER",
    kpi_score: 91,
    max_capacity: 8,
    current_load: 115,
  },
  {
    project_id: 10,
    user_id: 4,
    role: "PROGRAMMER",
    kpi_score: 76,
    max_capacity: 8,
    current_load: 85,
  },

  // Marketing AI Gen — Sarah is MANAGER, Budi is PROGRAMMER
  {
    project_id: 11,
    user_id: 2,
    role: "MANAGER",
    kpi_score: 95,
    max_capacity: 10,
    current_load: 70,
  },
  {
    project_id: 11,
    user_id: 1,
    role: "PROGRAMMER",
    kpi_score: 88,
    max_capacity: 8,
    current_load: 90,
  },

  // Legacy Migration — Sarah is MANAGER, Tono is PROGRAMMER
  {
    project_id: 12,
    user_id: 2,
    role: "MANAGER",
    kpi_score: 95,
    max_capacity: 10,
    current_load: 85,
  },
  {
    project_id: 12,
    user_id: 4,
    role: "PROGRAMMER",
    kpi_score: 76,
    max_capacity: 8,
    current_load: 40,
  },

  // UI Kit — Alex is DESIGNER, Budi is PROGRAMMER
  {
    project_id: 13,
    user_id: 3,
    role: "DESIGNER",
    kpi_score: 91,
    max_capacity: 8,
    current_load: 50,
  },
  {
    project_id: 13,
    user_id: 1,
    role: "PROGRAMMER",
    kpi_score: 88,
    max_capacity: 8,
    current_load: 50,
  },

  // Internal Tools — Tono is PROGRAMMER
  {
    project_id: 14,
    user_id: 4,
    role: "PROGRAMMER",
    kpi_score: 76,
    max_capacity: 8,
    current_load: 50,
  },
];

export const mockActivities: Activity[] = [
  {
    id: 1,
    project_id: 10,
    user_name: "Sarah",
    action: "pushed",
    target: "auth-v2",
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 2,
    project_id: 10,
    user_name: "Tono",
    action: "moved",
    target: "Task A to QA",
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 3,
    project_id: 10,
    user_name: "AI summarizer",
    action: "generated",
    target: "Sprint Review 2",
    created_at: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: 4,
    project_id: 11,
    user_name: "Budi",
    action: "pushed",
    target: "api-fix",
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
];

export const mockProjectMetrics: ProjectMetric[] = [
  {
    id: 1,
    project_id: 10,
    label: "Code Review Cycle",
    value: "48h",
    progress: 85,
    status: "critical",
    target_label: "Target < 12h",
  },
  {
    id: 2,
    project_id: 10,
    label: "Deployment Freq",
    value: "4/day",
    progress: 90,
    status: "success",
    target_label: "High velocity",
  },
  {
    id: 3,
    project_id: 11,
    label: "Bug Resolution",
    value: "2d",
    progress: 40,
    status: "warning",
    target_label: "Target < 1d",
  },
];

export const mockUserProjectStats: UserProjectStats[] = [
  { user_id: 1, project_id: 10, points_completed: 12, velocity_percentile: 90 },
  { user_id: 1, project_id: 11, points_completed: 8, velocity_percentile: 75 },
];

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const mockTasks: Task[] = [
  // Project Alpha (10)
  {
    id: 100,
    project_id: 10,
    title: "Implement OAuth 2.0 flow",
    status: "TODO",
    weight: 8,
    lead_assignee_id: 1,
    branch_name: "feat/oauth",
    type: "CODE",
  },
  {
    id: 101,
    project_id: 10,
    title: "Refactor auth service",
    status: "ONGOING",
    weight: 5,
    lead_assignee_id: 1,
    branch_name: "feat/auth-refactor",
    type: "CODE",
    warnStagnant: true,
    last_activity_at: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: 102,
    project_id: 10,
    title: "Payment gateway integration",
    status: "ON REVIEW",
    weight: 8,
    lead_assignee_id: 3,
    branch_name: "feat/payment",
    type: "CODE",
    prUrl: "github.com/pulls/42",
  },
  {
    id: 103,
    project_id: 10,
    title: "Design DB schema for transactions",
    status: "PENDING",
    weight: 8,
    type: "NON-CODE",
    isSuggested: true,
  },
  {
    id: 104,
    project_id: 10,
    title: "Implement dark mode toggle",
    status: "DRAFT",
    weight: 3,
    type: "CODE",
  },
  {
    id: 105,
    project_id: 10,
    title: "Mobile responsive layout",
    status: "COMPLETED",
    weight: 3,
    lead_assignee_id: 2,
    branch_name: "feat/mobile",
    type: "CODE",
  },
  // Marketing AI Gen (11)
  {
    id: 110,
    project_id: 11,
    title: "Build prompt engineering module",
    status: "ONGOING",
    weight: 8,
    lead_assignee_id: 1,
    branch_name: "feat/prompts",
    type: "CODE",
  },
  {
    id: 111,
    project_id: 11,
    title: "API Documentation",
    status: "TODO",
    weight: 3,
    lead_assignee_id: 2,
    type: "REQUIREMENT",
  },
  {
    id: 112,
    project_id: 11,
    title: "UI for content generation",
    status: "PENDING",
    weight: 5,
    type: "DESIGN",
  },
  // Legacy Migration (12)
  {
    id: 120,
    project_id: 12,
    title: "Audit legacy DB tables",
    status: "TODO",
    weight: 5,
    lead_assignee_id: 4,
    type: "REQUIREMENT",
  },
  {
    id: 121,
    project_id: 12,
    title: "Migrate user profiles",
    status: "ONGOING",
    weight: 8,
    lead_assignee_id: 4,
    branch_name: "mig/user-profiles",
    type: "CODE",
  },
  {
    id: 122,
    project_id: 12,
    title: "Write migration runbook",
    status: "DRAFT",
    weight: 2,
    type: "NON-CODE",
  },
  // UI Kit (13)
  {
    id: 130,
    project_id: 13,
    title: "Token system revamp",
    status: "ON REVIEW",
    weight: 5,
    lead_assignee_id: 3,
    branch_name: "feat/tokens",
    type: "DESIGN",
    prUrl: "github.com/pulls/88",
  },
  {
    id: 131,
    project_id: 13,
    title: "Component storybook update",
    status: "TODO",
    weight: 3,
    lead_assignee_id: 1,
    type: "CODE",
  },
  // Internal Tools (14)
  {
    id: 140,
    project_id: 14,
    title: "Slack integration webhook",
    status: "DRAFT",
    weight: 5,
    type: "CODE",
  },
  {
    id: 141,
    project_id: 14,
    title: "CI/CD pipeline improvement",
    status: "PENDING",
    weight: 8,
    lead_assignee_id: 4,
    type: "CODE",
  },
];

// ─── Meetings ─────────────────────────────────────────────────────────────────
export const mockMeetings: Meeting[] = [
  {
    id: 501,
    project_id: 10,
    source_type: "MANUAL",
    status: "COMPLETED",
    title: "Sprint Planning",
    date: "Jan 21, 2025",
    time: "10:00 AM",
    duration: "90min",
    attendees: ["JD", "SC", "TW", "AB"],
    key_decisions: [
      "Budi will lead payment gateway implementation.",
      "Alex to refactor dashboard components before new features.",
      "Tono to focus on integration testing for critical paths.",
    ],
    action_items: [
      {
        initials: "SC",
        task: "Request API keys from DevOps",
        deadline: "Jan 24",
      },
      { initials: "TW", task: "Setup test environment", deadline: "Jan 27" },
    ],
  },
  {
    id: 502,
    project_id: 10,
    source_type: "RECALL_BOT",
    status: "COMPLETED",
    title: "Technical Architecture Review",
    date: "Feb 5, 2025",
    time: "02:00 PM",
    duration: "60min",
    attendees: ["JD", "TW"],
    key_decisions: [
      "Adopt microservices architecture for auth module.",
      "Rate limiting to be enforced at API gateway level.",
    ],
    action_items: [
      {
        initials: "JD",
        task: "Draft microservices RFC document",
        deadline: "Feb 10",
      },
    ],
  },
  {
    id: 503,
    project_id: 11,
    source_type: "MANUAL",
    status: "SCHEDULED",
    title: "AI Model Integration Kickoff",
    date: "Mar 1, 2025",
    time: "11:00 AM",
    duration: "60min",
    attendees: ["SC", "JD"],
    key_decisions: [],
    action_items: [],
  },
];

// ─── Alerts ───────────────────────────────────────────────────────────────────
export const mockAlerts: Alert[] = [
  {
    id: 201,
    user_id: 1,
    project_id: 10,
    title: "Refactor Auth",
    description:
      "Task #101 'Refactor auth service' has been stagnant for 2+ hours with no commit activity. This is blocking the OAuth flow integration and putting the sprint deadline at risk.",
    type: "STAGNATION",
    severity: "critical",
    suggested_actions: [
      "Check if developer is blocked on a dependency",
      "Reassign task if no activity within 30 minutes",
      "Break task into smaller sub-tasks",
    ],
    is_resolved: false,
    created_at: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
  },
  {
    id: 202,
    user_id: 1,
    project_id: 11,
    title: "API Documentation Overdue",
    description:
      "Task #111 'API Documentation' is marked TODO but the marketing launch deadline is in 3 days. No assignee has started work. This could delay the external SDK release.",
    type: "STAGNATION",
    severity: "warning",
    suggested_actions: [
      "Assign task to an available team member",
      "Schedule a documentation sprint session",
      "Evaluate if deadline can be extended by 1 week",
    ],
    is_resolved: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 203,
    user_id: 1,
    project_id: 12,
    title: "Capacity Overload",
    description:
      "Tono (tono_be) is approaching max capacity on Legacy Migration. Currently at 95% of max_capacity with 3 active tasks. Adding more tasks risks burnout and quality drop.",
    type: "REALLOCATION",
    severity: "warning",
    suggested_actions: [
      "Reassign task #122 to another available programmer",
      "Review sprint commitments with the team",
    ],
    is_resolved: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
];

import type { Project, User, Task, Meeting } from "../models";

export const mockUsers: User[] = [
  { id: 1, github_username: "budi_dev", github_id: 101, username: "Budi" },
  { id: 2, github_username: "sarah_pm", github_id: 102, username: "Sarah" },
  { id: 3, github_username: "alex_ds", github_id: 103, username: "Alex" },
];

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

export const mockTasks: Task[] = [
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
    title: "Design DB Schema for Transactions",
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
];

export const mockMeetings: Meeting[] = [
  {
    id: 501,
    project_id: 10,
    source_type: "MANUAL",
    title: "Sprint Planning",
    date: "Jan 21, 2024",
    time: "10:00 AM",
    duration: "90 min",
    attendees: ["JD", "SC", "TW", "AB"],
    key_decisions: [
      "Mike will lead payment gateway implementation.",
      "Aisha to refactor dashboard components before new features.",
      "Tom to focus on integration testing for critical paths.",
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
];

// Helper to simulate network latency
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

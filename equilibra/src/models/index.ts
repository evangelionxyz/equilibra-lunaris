export type MeetingSource = "RECALL_BOT" | "MANUAL_UPLOAD" | "MANUAL";
export type MeetingStatus = "SCHEDULED" | "PROCESSING" | "COMPLETED" | "FAILED";
export type TaskStatus =
  | "DRAFT"
  | "PENDING"
  | "TODO"
  | "ONGOING"
  | "ON REVIEW"
  | "COMPLETED";
export type TaskType = "CODE" | "REQUIREMENT" | "DESIGN" | "OTHER" | "NON-CODE";
export type AlertType = "STAGNATION" | "REALLOCATION" | "DRAFT_APPROVAL";

export interface Bucket {
  id?: number;
  project_id: number;
  state: string;
  order_idx: number;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id?: number;
  gh_id: number;
  gh_username: string;
  gh_access_token?: string;
  telegram_chat_id?: string;
  display_name?: string;
  email?: string;
  created_at?: string;
}

export interface UserAlias {
  user_id: number;
  alias: string;
}

export interface Project {
  id?: number;
  name: string;
  gh_repo_url: string[];
  description?: string;
  status?: string;
  progress?: number;
  issue?: string;
  tags?: string[];
  isLead?: boolean;
  tasksPending?: number;
  is_deleted?: boolean;
  roles?: string[];
  completed_bucket_id?: number;
  in_review_bucket_id?: number;
  todo_bucket_id?: number;
}

export interface ProjectMember {
  id?: number;
  user_id: number;
  project_id: number;
  role: string;
  kpi_score: number; // VISIBLE TIER
  max_capacity: number;
  current_load: number; // For workload distribution chart
  gh_username?: string;
}

export interface Activity {
  id?: number;
  project_id: number;
  user_name: string;
  action: string; // e.g., 'pushed', 'moved', 'generated'
  target: string; // e.g., 'auth-v2', 'Task A to QA'
  created_at?: string;
}

export interface ProjectMetric {
  id?: number;
  project_id: number;
  label: string; // e.g., 'Code Review Cycle'
  value: string; // e.g., '48h'
  progress: number; // 0-100
  status: "critical" | "warning" | "success" | "default";
  target_label: string; // e.g., 'Target < 12h'
}

export interface UserProjectStats {
  user_id: number;
  project_id: number;
  points_completed: number;
  velocity_percentile: number;
}

export interface Meeting {
  id?: number;
  project_id: number;
  source_type: MeetingSource;
  source_reference?: string;
  status?: MeetingStatus;
  meeting_link?: string;
  scheduled_at?: string;
  recorded_at?: string;
  mom_summary?: string; // LAZY LOAD TIER
  key_decisions?: string[]; // LAZY LOAD TIER
  title?: string;
  date?: string;
  time?: string;
  duration?: string;
  attendees?: string[];
  action_items?: { initials: string; task: string; deadline: string }[];
}

export interface Task {
  id?: number | string;
  project_id: number | string;
  bucket_id?: number | string; // Replaces static status in logic
  order_idx?: number;
  meeting_id?: number | string;
  parent_task_id?: number | string;
  lead_assignee_id?: number | string; // VISIBLE TIER
  suggested_assignee_id?: number | string;
  title: string;
  description?: string; // LAZY LOAD TIER
  status?: TaskStatus; // Derived from bucket for UI
  type: TaskType;
  weight: number; // VISIBLE TIER
  branch_name?: string;
  last_activity_at?: Date | string; // VISIBLE TIER
  warnStagnant?: boolean;
  isSuggested?: boolean;
  prUrl?: string;
}

export interface TaskAssignee {
  task_id: number;
  user_id: number;
}

export interface Alert {
  id?: number;
  user_id: number;
  project_id: number;
  title: string;
  description: string;
  type: AlertType;
  severity: "critical" | "warning" | "info";
  suggested_actions: string[];
  is_resolved: boolean;
  created_at?: string;
}

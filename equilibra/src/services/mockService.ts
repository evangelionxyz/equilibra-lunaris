import type {
  Project,
  Task,
  Meeting,
  TaskType,
  TaskStatus,
  MeetingSource,
  Alert,
  ProjectMember,
  Role,
} from "../models";
import {
  mockProjects,
  mockTasks,
  mockMeetings,
  mockAlerts,
  mockProjectMembers,
  mockActivities,
  mockProjectMetrics,
  mockUserProjectStats,
  delay,
} from "./mockData";
import type { Activity, ProjectMetric, UserProjectStats } from "../models";

let _projects = [...mockProjects];
let _tasks = [...mockTasks];
let _meetings = [...mockMeetings];
let _alerts = [...mockAlerts];
let _members = [...mockProjectMembers];

let _nextProjectId = Math.max(..._projects.map((p) => p.id)) + 1;
let _nextTaskId = Math.max(..._tasks.map((t) => t.id)) + 1;
let _nextMeetingId = Math.max(..._meetings.map((m) => m.id)) + 1;

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    await delay(400);
    return [..._projects];
  },
  getProjectById: async (id: number): Promise<Project | undefined> => {
    await delay(200);
    return _projects.find((p) => p.id === id);
  },
  createProject: async (
    data: Pick<Project, "name" | "github_repo_url"> & Partial<Project>,
  ): Promise<Project> => {
    await delay(300);
    const project = {
      id: _nextProjectId++,
      status: "On Track",
      progress: 0,
      isLead: true,
      tasksPending: 0,
      ...data,
    };
    _projects = [project, ..._projects];
    return project;
  },
  updateProject: async (
    id: number,
    data: Partial<Project>,
  ): Promise<Project> => {
    await delay(300);
    _projects = _projects.map((p) => (p.id === id ? { ...p, ...data } : p));
    return _projects.find((p) => p.id === id)!;
  },
  deleteProject: async (id: number): Promise<void> => {
    await delay(200);
    _projects = _projects.filter((p) => p.id !== id);
    _tasks = _tasks.filter((t) => t.project_id !== id);
    _meetings = _meetings.filter((m) => m.project_id !== id);
  },
};

export const taskService = {
  getTasksByProject: async (projectId: number): Promise<Task[]> => {
    await delay(400);
    return _tasks.filter((t) => t.project_id === projectId);
  },
  getMyTasks: async (userId: number): Promise<Task[]> => {
    await delay(200);
    return _tasks.filter((t) => t.lead_assignee_id === userId);
  },
  createTask: async (data: {
    project_id: number;
    title: string;
    type: TaskType;
    weight: number;
    status?: TaskStatus;
  }): Promise<Task> => {
    await delay(300);
    const task = { id: _nextTaskId++, status: "TODO" as TaskStatus, ...data };
    _tasks = [task, ..._tasks];
    return task;
  },
  updateTask: async (id: number, data: Partial<Task>): Promise<Task> => {
    await delay(200);
    _tasks = _tasks.map((t) => (t.id === id ? { ...t, ...data } : t));
    return _tasks.find((t) => t.id === id)!;
  },
  deleteTask: async (id: number): Promise<void> => {
    await delay(200);
    _tasks = _tasks.filter((t) => t.id !== id);
  },
};

export const meetingService = {
  getMeetingsByProject: async (projectId: number): Promise<Meeting[]> => {
    await delay(300);
    return _meetings.filter((m) => m.project_id === projectId);
  },
  createMeeting: async (data: {
    project_id: number;
    title: string;
    date: string;
    time: string;
    duration?: string;
    source_type?: MeetingSource;
  }): Promise<Meeting> => {
    await delay(300);
    const meeting = {
      id: _nextMeetingId++,
      source_type: "MANUAL" as MeetingSource,
      status: "SCHEDULED" as const,
      attendees: [],
      action_items: [],
      ...data,
    };
    _meetings = [meeting, ..._meetings];
    return meeting;
  },
  deleteMeeting: async (id: number): Promise<void> => {
    await delay(200);
    _meetings = _meetings.filter((m) => m.id !== id);
  },
};

export const alertService = {
  getMyAlerts: async (): Promise<Alert[]> => {
    await delay(300);
    return [..._alerts];
  },
  resolveAlert: async (id: number): Promise<void> => {
    await delay(200);
    _alerts = _alerts.map((a) =>
      a.id === id ? { ...a, is_resolved: true } : a,
    );
  },
};

export const memberService = {
  getRoleForProject: async (
    projectId: number,
    userId: number,
  ): Promise<Role | null> => {
    await delay(100);
    const membership = _members.find(
      (m) => m.project_id === projectId && m.user_id === userId,
    );
    return membership ? membership.role : null;
  },
  getMembershipsForUser: async (userId: number): Promise<ProjectMember[]> => {
    await delay(100);
    return _members.filter((m) => m.user_id === userId);
  },
  getMembersByProject: async (projectId: number): Promise<ProjectMember[]> => {
    await delay(100);
    return _members.filter((m) => m.project_id === projectId);
  },
};

export const activityService = {
  getActivitiesByProject: async (projectId: number): Promise<Activity[]> => {
    await delay(100);
    return mockActivities.filter((a) => a.project_id === projectId);
  },
};

export const metricService = {
  getMetricsByProject: async (projectId: number): Promise<ProjectMetric[]> => {
    await delay(100);
    return mockProjectMetrics.filter((m) => m.project_id === projectId);
  },
};

export const statService = {
  getUserStatsByProject: async (
    userId: number,
    projectId: number,
  ): Promise<UserProjectStats | null> => {
    await delay(100);
    return (
      mockUserProjectStats.find(
        (s) => s.user_id === userId && s.project_id === projectId,
      ) || null
    );
  },
};

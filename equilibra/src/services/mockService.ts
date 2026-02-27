import { mockProjects, mockTasks, mockMeetings, delay } from "./mockData";
import type { Project, Task, Meeting } from "../models";

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    await delay(400); // Simulate API call
    return mockProjects;
  },
  getProjectById: async (id: number): Promise<Project | undefined> => {
    await delay(300);
    return mockProjects.find((p) => p.id === id);
  },
};

export const taskService = {
  getTasksByProject: async (projectId: number): Promise<Task[]> => {
    await delay(400);
    return mockTasks.filter((t) => t.project_id === projectId);
  },
  getMyTasks: async (userId: number): Promise<Task[]> => {
    await delay(200);
    return mockTasks.filter((t) => t.lead_assignee_id === userId);
  },
};

export const meetingService = {
  getMeetingsByProject: async (projectId: number): Promise<Meeting[]> => {
    await delay(300);
    return mockMeetings.filter((m) => m.project_id === projectId);
  },
};

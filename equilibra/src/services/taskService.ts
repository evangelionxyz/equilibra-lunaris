import { apiFetch } from "./apiClient";
import type { Task } from "../models";
import JSONBig from 'json-bigint';

export const taskService = {
  getTasksByProject: async (projectId: number): Promise<Task[]> => {
    const tasks = await apiFetch<Task[]>("/tasks");
    return tasks.filter((t) => String(t.project_id) === String(projectId));
  },

  getMyTasks: async (userId: number): Promise<Task[]> => {
    const tasks = await apiFetch<Task[]>("/tasks");
    return tasks.filter((t) => String(t.lead_assignee_id) === String(userId));
  },

  createTask: async (data: Task): Promise<Task> => {
    return await apiFetch<Task>("/tasks", {
      method: "POST",
      body: JSONBig.stringify(data),
    });
  },

  updateTask: async (id: number, data: Partial<Task>): Promise<Task> => {
    return await apiFetch<Task>(`/tasks/${id}`, {
      method: "PUT",
      body: JSONBig.stringify(data),
    });
  },

  deleteTask: async (id: number): Promise<void> => {
    await apiFetch(`/tasks/${id}`, {
      method: "DELETE",
    });
  },

  reorderTasks: async (projectId: number, bucketId: number, taskIds: (number)[]): Promise<{ status: string; order: (number)[]; bucket_id: number }> => {
    return await apiFetch(`/projects/${projectId}/buckets/${bucketId}/tasks/reorder`, {
      method: "PUT",
      body: JSONBig.stringify(taskIds),
    });
  },
};

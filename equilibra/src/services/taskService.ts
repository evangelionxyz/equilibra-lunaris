import { apiFetch } from "./apiClient";
import type { Task } from "../models";

export const taskService = {
  getTasksByProject: async (projectId: number): Promise<Task[]> => {
    const tasks = await apiFetch<Task[]>("/tasks");
    return tasks.filter((t) => t.project_id === projectId);
  },

  getMyTasks: async (userId: number): Promise<Task[]> => {
    const tasks = await apiFetch<Task[]>("/tasks");
    return tasks.filter((t) => t.lead_assignee_id === userId);
  },

  createTask: async (data: Task): Promise<Task> => {
    return await apiFetch<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateTask: async (id: number, data: Task): Promise<Task> => {
    return await apiFetch<Task>(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteTask: async (id: number): Promise<void> => {
    await apiFetch(`/tasks/${id}`, {
      method: "DELETE",
    });
  },
};

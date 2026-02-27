import { apiFetch } from "./apiClient";
import type {
  Task,
  TaskType,
  CreateTaskRequest,
  UpdateTaskRequest,
} from "../models";

interface BackendTask {
  id: number;
  project_id: number;
  bucket_id: number | null;
  meeting_id: number | null;
  parent_task_id: number | null;
  lead_assignee_id: number | null;
  suggested_assignee_id: number | null;
  title: string | null;
  description: string | null;
  type: string;
  weight: number;
  branch_name: string | null;
  last_activity_at: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

const transformTask = (bt: BackendTask): Task => ({
  id: bt.id,
  project_id: bt.project_id,
  bucket_id: bt.bucket_id || 0,
  meeting_id: bt.meeting_id || undefined,
  parent_task_id: bt.parent_task_id || undefined,
  lead_assignee_id: bt.lead_assignee_id || undefined,
  suggested_assignee_id: bt.suggested_assignee_id || undefined,
  title: bt.title || "Untitled Task",
  description: bt.description || "",
  type: bt.type as TaskType,
  weight: bt.weight,
  branch_name: bt.branch_name || undefined,
  last_activity_at: bt.last_activity_at || bt.updated_at,
});

export const taskService = {
  getTasksByProject: async (projectId: number): Promise<Task[]> => {
    const tasks = await apiFetch<BackendTask[]>("/tasks");
    return tasks
      .filter((t) => t.project_id === projectId && !t.is_deleted)
      .map(transformTask);
  },

  createTask: async (data: CreateTaskRequest): Promise<Task> => {
    const response = await apiFetch<BackendTask>("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return transformTask(response);
  },

  updateTask: async (id: number, data: UpdateTaskRequest): Promise<Task> => {
    const response = await apiFetch<BackendTask>(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return transformTask(response);
  },

  deleteTask: async (id: number): Promise<void> => {
    await apiFetch(`/tasks/${id}`, {
      method: "DELETE",
    });
  },
};

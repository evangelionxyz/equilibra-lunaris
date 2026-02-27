import { apiFetch } from "./apiClient";
import type { Project } from "../models";

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    return await apiFetch<Project[]>("/projects");
  },

  getProjectById: async (id: number): Promise<Project> => {
    return await apiFetch<Project>(`/projects/${id}`);
  },

  createProject: async (data: Project): Promise<Project> => {
    return await apiFetch<Project>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateProject: async (id: number, data: Project): Promise<Project> => {
    return await apiFetch<Project>(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteProject: async (id: number): Promise<void> => {
    await apiFetch(`/projects/${id}`, {
      method: "DELETE",
    });
  },
};

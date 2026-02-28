import { apiFetch } from "./apiClient";
import projectMemberService from "./projectMemberService";
import type { Project } from "../models";

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    return await apiFetch<Project[]>("/projects");
  },

  getProjectById: async (id: number | string): Promise<Project> => {
    return await apiFetch<Project>(`/projects/${id}`);
  },

  getMyProjects: async (): Promise<Project[]> => {
    return await apiFetch<Project[]>("/projects/mine");
  },

  createProject: async (data: Project): Promise<Project> => {
    return await apiFetch<Project>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Create a project, then create a project_member for the owner (frontend-driven)
  createProjectWithOwner: async (
    data: Project,
    ownerUserId?: number,
  ): Promise<Project> => {
    const project = await apiFetch<Project>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (ownerUserId && project && project.id) {
      await projectMemberService.createMember(project.id, {
        user_id: ownerUserId,
        role: "Owner",
        max_capacity: 100,
        current_load: 0,
      });
    }

    return project;
  },

  updateProject: async (id: number | string, data: Project): Promise<Project> => {
    return await apiFetch<Project>(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteProject: async (id: number | string): Promise<void> => {
    await apiFetch(`/projects/${id}`, {
      method: "DELETE",
    });
  },
};

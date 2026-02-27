import { apiFetch } from "./apiClient";
import projectMemberService from "./projectMemberService";
import type { Project, Role } from "../models";

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    return await apiFetch<Project[]>("/projects");
  },

  getProjectById: async (id: number): Promise<Project> => {
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
  createProjectWithOwner: async (data: Project, ownerUserId?: number): Promise<Project> => {
    const project = await apiFetch<Project>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (ownerUserId && project && project.id) {
      await projectMemberService.createMember(project.id, {
        user_id: ownerUserId,
        role: "Owner" as Role,
        max_capacity: 100,
        current_load: 0,
      });
    } else {
      console.log("WOWOWOWOWOWWOOW");
    }

    return project;
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

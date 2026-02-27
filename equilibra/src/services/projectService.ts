import { apiFetch } from "./apiClient";
import type {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
} from "../models";

// Mapping backend schema to frontend model
interface BackendProject {
  id: number;
  name: string;
  gh_repo_url: string | null;
  description: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

const transformProject = (bp: BackendProject): Project => ({
  id: bp.id,
  name: bp.name,
  gh_repo_url: bp.gh_repo_url || "",
  status: bp.is_deleted ? "Archived" : "On Track",
  progress: 0,
  isLead: true,
  tasksPending: 0, // Needs separate fetch or join
});

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    const data = await apiFetch<BackendProject[]>("/projects");
    return data.map(transformProject);
  },

  getProjectById: async (id: number): Promise<Project> => {
    const data = await apiFetch<BackendProject>(`/projects/${id}`);
    return transformProject(data);
  },

  createProject: async (data: CreateProjectRequest): Promise<Project> => {
    const response = await apiFetch<BackendProject>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return transformProject(response);
  },

  updateProject: async (
    id: number,
    data: UpdateProjectRequest,
  ): Promise<Project> => {
    const response = await apiFetch<BackendProject>(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return transformProject(response);
  },

  deleteProject: async (id: number): Promise<void> => {
    await apiFetch(`/projects/${id}`, {
      method: "DELETE",
    });
  },
};

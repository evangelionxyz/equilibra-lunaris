import { apiFetch } from "./apiClient";
import type { User, ProjectMember } from "../models";

export const userService = {
  getUsers: async (): Promise<User[]> => {
    return await apiFetch<User[]>("/users");
  },

  searchUsers: async (username: string): Promise<User[]> => {
    return await apiFetch<User[]>(`/users?username=${encodeURIComponent(username)}`);
  },

  getProjectMembers: async (projectId: string | number): Promise<ProjectMember[]> => {
    const project = await apiFetch<{ members: number[] }>(
      `/projects/${projectId}`,
    );
    const memberIds = project.members || [];
    const allUsers = await userService.getUsers();

    return allUsers
      .filter((u) => u.id !== undefined && memberIds.includes(u.id))
      .map((u) => ({
        user_id: u.id!,
        project_id: projectId,
        role: "PROGRAMMER",
        kpi_score: 85,
        max_capacity: 100,
        current_load: 40,
      }));
  },

  getMembershipsForUser: async (): Promise<ProjectMember[]> => {
    return await apiFetch<ProjectMember[]>("/users/me/project_members");
  },

  updateUser: async (id: number, data: User): Promise<User> => {
    return await apiFetch<User>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteUser: async (id: number): Promise<void> => {
    await apiFetch(`/users/${id}`, {
      method: "DELETE",
    });
  },
};

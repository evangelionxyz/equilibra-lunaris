import { apiFetch } from "./apiClient";
import type { User, ProjectMember } from "../models";
import { projectMemberService } from "./projectMemberService";

export const userService = {
  getUsers: async (): Promise<User[]> => {
    return await apiFetch<User[]>("/users");
  },

  searchUsers: async (username: string): Promise<User[]> => {
    return await apiFetch<User[]>(
      `/users?username=${encodeURIComponent(username)}`,
    );
  },

  getProjectMembers: async (
    projectId: string | number,
  ): Promise<ProjectMember[]> => {
    return await projectMemberService.getMembers(projectId);
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

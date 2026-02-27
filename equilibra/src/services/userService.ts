import { apiFetch } from "./apiClient";
import type { User, ProjectMember, Role, UpdateUserRequest } from "../models";

interface BackendUser {
  id: number;
  display_name: string | null;
  telegram_chat_id: string | null;
  gh_username: string;
  gh_access_token: string | null;
  gh_id: string | null;
  email: string | null;
  created_at: string;
}

const transformUser = (bu: BackendUser): User => ({
  id: bu.id,
  gh_id: parseInt(bu.gh_id || "0"),
  gh_username: bu.gh_username,
  gh_access_token: bu.gh_access_token || undefined,
  telegram_chat_id: bu.telegram_chat_id || undefined,
  display_name: bu.display_name || undefined,
  email: bu.email || undefined,
});

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const users = await apiFetch<BackendUser[]>("/users");
    return users.map(transformUser);
  },

  getProjectMembers: async (projectId: number): Promise<ProjectMember[]> => {
    const project = await apiFetch<{ members: number[] }>(
      `/projects/${projectId}`,
    );
    const memberIds = project.members || [];
    const allUsers = await userService.getUsers();

    return allUsers
      .filter((u) => memberIds.includes(u.id))
      .map((u) => ({
        user_id: u.id,
        project_id: projectId,
        role: "PROGRAMMER" as Role,
        kpi_score: 85,
        max_capacity: 100,
        current_load: 40,
      }));
  },

  getMembershipsForUser: async (userId: number): Promise<ProjectMember[]> => {
    const projects =
      await apiFetch<{ members: number[]; id: number }[]>("/projects");
    const memberships: ProjectMember[] = [];

    for (const p of projects) {
      if (p.members?.includes(userId)) {
        memberships.push({
          user_id: userId,
          project_id: p.id,
          role: "MANAGER" as Role,
          kpi_score: 90,
          max_capacity: 100,
          current_load: 50,
        });
      }
    }
    return memberships;
  },

  updateUser: async (id: number, data: UpdateUserRequest): Promise<User> => {
    const response = await apiFetch<BackendUser>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return transformUser(response);
  },

  deleteUser: async (id: number): Promise<void> => {
    await apiFetch(`/users/${id}`, {
      method: "DELETE",
    });
  },
};

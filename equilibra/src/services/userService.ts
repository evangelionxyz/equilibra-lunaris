import { apiFetch } from "./apiClient";
import type { User, ProjectMember, Role } from "../models";

export const userService = {
  getUsers: async (): Promise<User[]> => {
    return await apiFetch<User[]>("/users");
  },

  getProjectMembers: async (projectId: number): Promise<ProjectMember[]> => {
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

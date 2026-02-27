import { apiFetch } from "./apiClient";
import type { ProjectMember } from "../models";

export const projectMemberService = {
  getMembers: async (projectId: number | string | string): Promise<ProjectMember[]> => {
    return await apiFetch<ProjectMember[]>(`/projects/${projectId}/members`);
  },

  getMember: async (projectId: number | string | string, memberId: number): Promise<ProjectMember> => {
    return await apiFetch<ProjectMember>(`/projects/${projectId}/members/${memberId}`);
  },

  createMember: async (
    projectId: number | string | string,
    data: Partial<ProjectMember> & { user_id: number },
  ): Promise<ProjectMember> => {
    const res = await apiFetch<ProjectMember>(`/projects/${projectId}/members`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res;
  },
};

export default projectMemberService;

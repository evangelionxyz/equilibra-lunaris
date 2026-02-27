import { useState, useEffect, useCallback } from "react";
import type { Project, ProjectMember } from "../models";
import { projectService, memberService } from "../services/mockService";

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [memberships, setMemberships] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const [data, mems] = await Promise.all([
        projectService.getProjects(),
        memberService.getMembershipsForUser(1), // Hardcoded 1 for mock Budi
      ]);
      setProjects(data);
      setMemberships(mems);
      setError(null);
    } catch {
      setError("Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = useCallback(
    async (
      data: Pick<Project, "name" | "github_repo_url"> & Partial<Project>,
    ) => {
      const created = await projectService.createProject(data);
      setProjects((prev) => [created, ...prev]);
      // Let's assume the creator becomes MANAGER
      setMemberships((prev) => [
        ...prev,
        {
          project_id: created.id,
          user_id: 1,
          role: "MANAGER",
          kpi_score: 100,
          max_capacity: 10,
        },
      ]);
      return created;
    },
    [],
  );

  const updateProject = useCallback(
    async (id: number, data: Partial<Project>) => {
      const updated = await projectService.updateProject(id, data);
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    },
    [],
  );

  const deleteProject = useCallback(async (id: number) => {
    await projectService.deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Filter based on memberships
  const myProjects = projects.filter((p) =>
    memberships.some((m) => m.project_id === p.id),
  );
  const leadProjects = myProjects.filter(
    (p) => memberships.find((m) => m.project_id === p.id)?.role === "MANAGER",
  );
  const collaboratingProjects = myProjects.filter(
    (p) => memberships.find((m) => m.project_id === p.id)?.role !== "MANAGER",
  );

  return {
    projects,
    leadProjects,
    collaboratingProjects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
  };
};

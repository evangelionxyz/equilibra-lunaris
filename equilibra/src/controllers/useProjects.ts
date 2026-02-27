import { useState, useEffect, useCallback } from "react";
import type { Project, ProjectMember, Role } from "../models";
import { projectService } from "../services/projectService";
import { userService } from "../services/userService";
import { useToast } from "../design-system/Toast";
import { useAuth } from "../auth/useAuth";

export const useProjects = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [memberships, setMemberships] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    const userId = user?.db_user?.id;
    if (!userId) return;

    try {
      setLoading(true);
      const [data, mems] = await Promise.all([
        projectService.getProjects(),
        userService.getMembershipsForUser(userId),
      ]);
      setProjects(data);
      setMemberships(mems);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch projects");
      showToast("Error loading projects", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, user?.db_user?.id]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = useCallback(
    async (
      data: Pick<Project, "name" | "gh_repo_url"> & { description?: string },
    ) => {
      try {
        const created = await projectService.createProject(data);
        setProjects((prev) => [created, ...prev]);
        setMemberships((prev) => [
          ...prev,
          {
            project_id: created.id!,
            user_id: user?.db_user?.id || 1,
            role: "MANAGER" as Role,
            kpi_score: 100,
            max_capacity: 100,
            current_load: 0,
          },
        ]);
        showToast("Project created successfully!", "success");
        return created;
      } catch (err) {
        console.error(err);
        showToast("Failed to create project", "error");
        throw err;
      }
    },
    [showToast, user?.db_user?.id],
  );

  const updateProject = useCallback(
    async (id: number, data: Partial<Project>) => {
      // Backend update not fully implemented, but updating local state for UI
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...data } : p)),
      );
      return projects.find((p) => p.id === id)!;
    },
    [projects],
  );

  const deleteProject = useCallback(
    async (id: number) => {
      try {
        await projectService.deleteProject(id);
        setProjects((prev) => prev.filter((p) => p.id !== id));
        showToast("Project deleted", "info");
      } catch (err) {
        console.error(err);
        showToast("Failed to delete project", "error");
      }
    },
    [showToast],
  );

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

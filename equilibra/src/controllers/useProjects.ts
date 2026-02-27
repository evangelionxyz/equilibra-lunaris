import { useState, useEffect } from "react";
import type { Project } from "../models";
import { projectService } from "../services/mockService";

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const data = await projectService.getProjects();
        setProjects(data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch projects");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const leadProjects = projects.filter((p) => p.isLead);
  const collaboratingProjects = projects.filter((p) => !p.isLead);

  return { projects, leadProjects, collaboratingProjects, loading, error };
};

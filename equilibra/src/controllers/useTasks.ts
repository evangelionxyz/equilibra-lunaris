import { useState, useEffect } from "react";
import type { Task } from "../models";
import { taskService } from "../services/mockService";

export const useTasks = (projectId?: number) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        // If projectId is provided, fetch project tasks, else fetch "my tasks" using a hardcoded user ID for the mock
        const data = projectId
          ? await taskService.getTasksByProject(projectId)
          : await taskService.getMyTasks(1); // Assuming user ID 1 is logged in

        setTasks(data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [projectId]);

  return { tasks, loading, error };
};

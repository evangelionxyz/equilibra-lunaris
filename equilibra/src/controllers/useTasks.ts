import { useState, useEffect, useCallback } from "react";
import type { Task, TaskType, TaskStatus } from "../models";
import { taskService } from "../services/mockService";

export const useTasks = (projectId?: number) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = projectId
        ? await taskService.getTasksByProject(projectId)
        : await taskService.getMyTasks(1);
      setTasks(data);
      setError(null);
    } catch {
      setError("Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = useCallback(
    async (data: {
      project_id: number;
      title: string;
      type: TaskType;
      weight: number;
      status?: TaskStatus;
    }) => {
      const created = await taskService.createTask(data);
      setTasks((prev) => [created, ...prev]);
      return created;
    },
    [],
  );

  const updateTask = useCallback(async (id: number, data: Partial<Task>) => {
    const updated = await taskService.updateTask(id, data);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  }, []);

  const deleteTask = useCallback(async (id: number) => {
    await taskService.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { tasks, loading, error, createTask, updateTask, deleteTask };
};

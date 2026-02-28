import { useState, useEffect, useCallback } from "react";
import type { Task, TaskType } from "../models";
import { taskService } from "../services/taskService";
import { useToast } from "../design-system/Toast";

export const useTasks = (projectId?: string | number) => {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      if (!projectId) {
        // Fallback for "My Tasks" if no project selected
        // We'll reuse getTasksByProject with dummy filtering for now
        // or just return empty [] if not in a project context.
        setTasks([]);
        return;
      }
      const data = await taskService.getTasksByProject(projectId);
      const sorted = data.sort(
        (a, b) => (a.order_idx ?? 0) - (b.order_idx ?? 0),
      );
      setTasks(sorted);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch tasks");
      showToast("Error loading tasks", "error");
    } finally {
      setLoading(false);
    }
  }, [projectId, showToast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = useCallback(
    async (data: {
      project_id: number | string;
      title: string;
      type: TaskType;
      weight: number;
      bucket_id?: number | string;
    }) => {
      try {
        const created = await taskService.createTask(data);
        // Re-fetch to guarantee the new task appears in the correct bucket.
        // Optimistic prepend alone can silently fail when BigInt IDs don't
        // match the bucket filter after JSON parsing.
        await fetchTasks();
        showToast("Task created and assigned", "success");
        return created;
      } catch (err) {
        console.error(err);
        showToast("Failed to create task", "error");
        throw err;
      }
    },
    [fetchTasks, showToast],
  );

  const updateTask = useCallback(
    async (id: string | number, data: Partial<Task>) => {
      try {
        // Optimistic local update
        setTasks((prev) =>
          prev.map((t) =>
            String(t.id) === String(id) ? { ...t, ...data } : t,
          ),
        );

        const updated = await taskService.updateTask(id, data);
        showToast("Task updated", "success");
        return updated;
      } catch (err) {
        console.error(err);
        showToast("Failed to update task", "error");
        // Rollback on failure by refetching
        fetchTasks();
        throw err;
      }
    },
    [fetchTasks, showToast],
  );

  const deleteTask = useCallback(
    async (id: string | number) => {
      try {
        // Optimistic local update
        setTasks((prev) => prev.filter((t) => String(t.id) !== String(id)));

        await taskService.deleteTask(id);
        showToast("Task deleted", "success");
      } catch (err) {
        console.error(err);
        showToast("Failed to delete task", "error");
        // Rollback on failure by refetching
        fetchTasks();
        throw err;
      }
    },
    [fetchTasks, showToast],
  );

  const reorderTasks = useCallback(
    async (bucketId: string | number, taskIds: (string | number)[]) => {
      try {
        if (!projectId) return;

        // Optimistic UI update
        setTasks((prev) => {
          const map = new Map(prev.map((t) => [String(t.id), t]));

          taskIds.forEach((id, index) => {
            const task = map.get(String(id));
            if (task) {
              task.order_idx = index;
              task.bucket_id = bucketId;
            }
          });

          return Array.from(map.values()).sort(
            (a, b) => (a.order_idx ?? 0) - (b.order_idx ?? 0),
          );
        });

        // API call
        await taskService.reorderTasks(projectId, bucketId, taskIds);
      } catch (err) {
        console.error("Failed to reorder tasks", err);
        fetchTasks();
        throw err;
      }
    },
    [projectId, fetchTasks],
  );

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
  };
};

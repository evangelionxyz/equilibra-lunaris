import { useState, useEffect } from "react";
import type { Activity } from "../models";
import { activityService } from "../services/activityService";

export const useActivities = (projectId: number | string) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      const data = await activityService.getActivitiesByProject(projectId);
      if (isMounted) {
        setActivities(data);
        setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  return { activities, loading };
};

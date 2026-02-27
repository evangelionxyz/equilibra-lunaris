import { useState, useEffect } from "react";
import type { Activity } from "../models";
import { activityService } from "../services/mockService";

export const useActivities = (projectId: number) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    activityService.getActivitiesByProject(projectId).then((data) => {
      if (isMounted) {
        setActivities(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  return { activities, loading };
};

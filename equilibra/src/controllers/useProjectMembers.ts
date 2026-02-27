import { useState, useEffect } from "react";
import type { ProjectMember } from "../models";
import { userService } from "../services/userService";

export const useProjectMembers = (projectId: number | string) => {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      const data = await userService.getProjectMembers(projectId);
      if (isMounted) {
        setMembers(data);
        setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  return { members, loading };
};

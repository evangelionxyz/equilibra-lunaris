import { useState, useEffect } from "react";
import type { Role } from "../models";
import { memberService } from "../services/mockService";

export const useCurrentUserRole = (projectId: number | null) => {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) {
      setRole(null);
      return;
    }

    const fetchRole = async () => {
      setLoading(true);
      // Hardcoding user_id = 1 (Budi) as the "current user" for the mock
      const userRole = await memberService.getRoleForProject(projectId, 1);
      setRole(userRole);
      setLoading(false);
    };

    fetchRole();
  }, [projectId]);

  return { role, loading };
};

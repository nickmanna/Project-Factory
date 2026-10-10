import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import type { Project } from "../types";

interface UseProjectsResult {
  projects: Project[];
  loading: boolean;
  error: Error | null;
}

// v0: one-shot fetch on mount. Swapping getDocs for onSnapshot (live
// updates) is the natural next step once anything else writes to this
// collection while the dashboard is open.
export function useProjects(): UseProjectsResult {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDocs(collection(db, "projects"))
      .then((snapshot) => {
        if (cancelled) return;
        setProjects(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<Project, "id">),
          })),
        );
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { projects, loading, error };
}
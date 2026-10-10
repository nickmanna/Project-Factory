import type { Commit } from "./types";

// Project data is now real (Firestore, via src/hooks/useProjects.ts) - see
// docs/Project_Factory_Dashboard_UI.md "Project data: Firestore". Commit
// history is still placeholder data; it needs to read local git repos,
// which the WebView can't do without a native bridge that doesn't exist
// yet - that's still future work. Keys here must match whatever project
// IDs are seeded into Firestore (see dashboard/scripts/seed-firestore.mjs)
// for the History tab to show anything for them.
export const mockCommits: Record<string, Commit[]> = {
  "project-factory": [
    {
      hash: "6dc9b8e",
      message: "Add ci-develop.yaml: fast lint/test/build-check feedback",
      author: "nickm",
      date: "2026-09-24",
      parents: ["35686d9"],
    },
    {
      hash: "35686d9",
      message: "Switch CI build to archive+export instead of plain build",
      author: "nickm",
      date: "2026-09-24",
      parents: ["16330b2"],
    },
    {
      hash: "16330b2",
      message: "Fix notarization: force a secure timestamp",
      author: "nickm",
      date: "2026-09-24",
      parents: ["2f479f8", "2b34b9b"],
    },
    {
      hash: "2f479f8",
      message: "Fix GCP service account secret name",
      author: "nickm",
      date: "2026-09-24",
      parents: [],
    },
    {
      hash: "2b34b9b",
      message: "Fix Secret Manager reference format",
      author: "nickm",
      date: "2026-09-24",
      parents: [],
    },
  ],
  "example-web-app": [
    {
      hash: "a1b2c3d",
      message: "Initial scaffold from Project Factory",
      author: "nickm",
      date: "2026-09-20",
      parents: [],
    },
  ],
};

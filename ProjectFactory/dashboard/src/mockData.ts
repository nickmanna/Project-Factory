import type { Project, Commit } from "./types";

// Placeholder data so the UI has something to render. Real data will come
// from local git repos and the GCP/GitHub APIs once that wiring exists -
// see docs/Project_Factory_Dashboard_UI.md for the plan.
export const mockProjects: Project[] = [
  {
    id: "project-factory",
    name: "Project Factory",
    description: "The scaffolding tool itself (this app).",
    resources: [
      { id: "r1", name: "nickmanna/Project-Factory", kind: "repo" },
      { id: "r2", name: "nickm-project-factory (GCP)", kind: "gcp-project" },
      { id: "r3", name: "ci-release.yaml", kind: "ci-workflow" },
      { id: "r4", name: "ci-develop.yaml", kind: "ci-workflow" },
      { id: "r5", name: "macos-signing-cert", kind: "secret" },
    ],
  },
  {
    id: "example-web-app",
    name: "Example Scaffolded App",
    description: "A Vite web app scaffolded by Project Factory.",
    resources: [
      { id: "r6", name: "nickmanna/example-web-app", kind: "repo" },
      { id: "r7", name: "ci.yaml", kind: "ci-workflow" },
      { id: "r8", name: "staging.example.dev", kind: "deploy-target" },
    ],
  },
];

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

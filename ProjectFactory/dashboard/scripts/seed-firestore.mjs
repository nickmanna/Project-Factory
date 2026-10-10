#!/usr/bin/env node
// One-off / occasional manual tool: ports Project Factory's own sample
// project data into real Firestore documents, so the dashboard has
// something real to render. Not kept in sync with mockData.ts
// automatically - mockData.ts no longer has project data at all (history
// stays mocked, projects don't). Re-run any time to add/update docs; it's
// idempotent (uses .set(), not .add()).
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp({
  credential: applicationDefault(),
  projectId: "nickm-project-factory",
});

const db = getFirestore();

const projects = [
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

for (const { id, ...rest } of projects) {
  await db.collection("projects").doc(id).set(rest);
  console.log(`seeded projects/${id}`);
}
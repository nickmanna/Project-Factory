# Dashboard UI: Architecture and How to Run It

**Goal (first planning-brief deliverable):** the ability to scaffold web
apps. Before that, Project Factory needs its own basic UI: a map of
projects and their resources, and a git-commit history view per project.

## Why a WebView instead of native RN macOS views

Project Factory's own UI (this doc) is a separate concern from the Vite
frontend used by *scaffolded* web apps — those are unrelated decisions.
This doc is about how Project Factory's own dashboard is built.

The two flagship features — a project/resource map and a git history tree —
are graph and tree visualizations. The web ecosystem has mature, established
libraries for exactly this (React Flow for node graphs, D3 or a dedicated
git-graph library for commit trees). Building the equivalent from scratch
against React Native macOS's native component set would mean hand-rolling
graph layout algorithms with no real benefit, since nothing about this UI
needs to be "native-feeling" — it's data visualization.

So: **RN macOS stays the native shell** (window, menu bar, the Sparkle
updater already wired into `AppDelegate.mm`), and the actual dashboard
content renders inside a `react-native-webview`, loading a separate Vite +
React + TypeScript app.

## What's here

**`dashboard/`** — a standalone Vite React TS app, its own `package.json`,
independently installable/buildable/lintable. Structure:

- `src/types.ts` — `Project`, `Resource`, `Commit` types.
- `src/mockData.ts` — `mockCommits` only now. Project data is real
  (Firestore); commit history is still placeholder — see "Project data:
  Firestore" below for why those are on different timelines.
- `src/firebaseConfig.ts`, `src/firebase.ts` — Firestore client config
  (committed, non-secret by design) and initialization.
- `src/hooks/useProjects.ts` — fetches the `projects` collection on mount;
  returns `{ projects, loading, error }`.
- `src/components/ProjectMap.tsx` — v0 project map: a card grid, one card
  per project, resources shown as chips. This is the seam where a real
  graph library (React Flow) would go once there's an actual reason to
  visualize *relationships* between resources rather than just list them
  per project.
- `src/components/HistoryTree.tsx` — v0 history view: a straight vertical
  commit list with a "merge" marker when a commit has more than one parent.
  Real branch/merge lane layout needs a proper graph algorithm once this
  reads real git history instead of mock data.
- `src/App.tsx` — two tabs (Map / History), selecting a project on the map
  switches to its history.

**Root app (`App.tsx`)** — replaced the default RN template screen with a
`WebView` pointing at the dashboard's dev server in development.

## Project data: Firestore

The `projects` collection (database provisioned in `terraform/firestore.tf`,
previously empty/unused) is now the project map's real data source.

**Schema** — top-level `projects` collection, document ID = the project's
own `id`:
```
projects/{projectId}
  name: string
  description: string
  resources: array<map>
    - id: string
    - name: string
    - kind: string   // ResourceKind: "repo" | "gcp-project" | "secret"
                      // | "ci-workflow" | "deploy-target"
```
Resources are an **embedded array**, not a subcollection — resource lists
are small (a handful of chips per project) and nothing queries them
independently of their project, so a subcollection would roughly double the
code for no present benefit.

**Security rules** — open (`allow read, write: if true;`,
`firebase/firestore.rules`). Deliberate: this is a single-user local
desktop app, and the data here (project names, repo URLs, resource labels)
isn't sensitive — actual secrets stay exclusively in GCP Secret Manager, as
they already do today. Revisit if this ever becomes multi-user.

**Why the API key and rules aren't Terraform-managed**: `apikeys.googleapis.com`
rejects the plain user credentials Terraform runs with locally in this repo
(no apply-via-CI here), requiring service-account impersonation — real
complexity for a key created once and never rotated. Deploying rules via
Terraform (`google_firebaserules_ruleset`/`_release`) is two more resources
for a one-line, essentially-static rules body. Both are one-time manual CLI
steps instead (next section).

## One-time Firestore setup

Run once, in order, after `terraform apply`:

```
# 1. API key for the Firestore Web SDK (apikeys.googleapis.com and
#    firebase.googleapis.com are enabled via terraform/project.tf)
gcloud services api-keys create \
  --project=nickm-project-factory \
  --display-name="Project Factory Dashboard" \
  --api-target=service=firestore.googleapis.com
# The create response includes "keyString" directly - no need to look it
# up separately unless you've lost that output.

# 2. Register the GCP project with Firebase (required before `firebase
#    deploy` will work - a plain GCP project with Firestore isn't
#    automatically a "Firebase project" as far as Firebase tooling is
#    concerned). One-time, not reversible.
firebase login
firebase projects:addfirebase nickm-project-factory

# 3. Deploy security rules
cd firebase && firebase deploy --only firestore:rules
```

Paste the `keyString` and `terraform output firestore_project_id` into
`ProjectFactory/dashboard/src/firebaseConfig.ts`.

Then seed some data (see `dashboard/scripts/seed-firestore.mjs` - uses
`firebase-admin` with your `gcloud` Application Default Credentials, which
is fine for this even though the apikeys API rejects ADC in step 1; that
rejection is specific to the apikeys API, not Firestore):
```
cd ProjectFactory/dashboard
npm run seed
```

**Verifying it's actually live** (not a cached/bundled value): edit a
project's `description` directly in the GCP/Firebase console, reload the
dashboard, confirm the change appears.

## Running it

Two processes, both required:

```
# Terminal 1 - the dashboard's own dev server (hot reload)
cd ProjectFactory/dashboard
npm install   # first time only
npm run seed  # first time only, or whenever you want new sample projects
npm run dev

# Terminal 2 - the native shell
cd ProjectFactory
npx react-native run-macos
```

The RN macOS window opens and its WebView loads `http://localhost:5173`
(Vite's default port — `dashboard/vite.config.ts` pins it with
`strictPort: true` so a silent port fallback can't happen unnoticed).
Editing files under `dashboard/src/` hot-reloads inside the WebView, same
as editing any Vite app in a browser.

## Production loading — not implemented yet

`App.tsx` only wires the dev-server URL (`__DEV__` branch); a Release build
currently shows a placeholder message instead of the dashboard. Shipping the
real thing needs:

1. An Xcode build phase that runs `npm run build` in `dashboard/` and
   copies `dashboard/dist` into the app bundle's `Contents/Resources` as a
   **folder reference** (preserves the relative paths between
   `index.html` and its hashed JS/CSS chunks — a plain file copy of just
   `index.html` would break those references).
2. A way for JS to know the bundle's resource path at runtime — RN doesn't
   expose this by default. The standard fix is a small native module (a
   few lines in Objective-C, similar in spirit to the `AppDelegate.mm`
   Sparkle wiring) exporting `[[NSBundle mainBundle] resourcePath]` as a
   constant, then `WebView source={{ uri: 'file://' + resourcePath + '/dashboard-dist/index.html' }}`
   in the production branch of `App.tsx`.

This was deliberately scoped out for now: it's real native plumbing with no
way to verify it works without a full signed build, and there's no
production-ready dashboard content yet to justify shipping it. Do this once
the dashboard has enough real functionality to be worth releasing — not
before.

## Next steps toward the actual feature

In rough order:

1. The project map's real data source is done (Firestore, see above). The
   history tree still needs one — reading local git history (probably via
   `simple-git` or shelling out to `git log`) — and that's a different
   mechanism entirely: the WebView can't shell out to `git log` without a
   native bridge that doesn't exist yet (no `postMessage`/`injectedJavaScript`
   wiring between the RN shell and the WebView today).
2. Swap `ProjectMap`'s card grid for React Flow once resource
   *relationships* (not just per-project lists) need visualizing.
3. Wire the production loading path (above) once there's something worth
   shipping.
4. Start on the actual first deliverable this UI supports: scaffolding a
   new Vite web app project, including baking in its own `ci.yaml` — the
   same signed-release pattern used for Project Factory itself is the
   template, minus anything macOS-specific.

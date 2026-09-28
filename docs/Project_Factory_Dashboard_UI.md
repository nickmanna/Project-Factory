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
- `src/mockData.ts` — placeholder data (including Project Factory's own
  repo/CI/secrets as one of the mock projects, for a realistic first look).
  **Real data (reading actual git repos, GCP/GitHub APIs) isn't wired up
  yet** — that's the next piece of work, not this one.
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

## Running it

Two processes, both required:

```
# Terminal 1 - the dashboard's own dev server (hot reload)
cd ProjectFactory/dashboard
npm install   # first time only
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

1. Replace `mockData.ts` with real data — reading local git history
   (probably via `simple-git` or shelling out to `git log`) for the history
   tree, and a real source of "projects Project Factory manages" (likely a
   local config/registry file it maintains) for the map.
2. Swap `ProjectMap`'s card grid for React Flow once resource
   *relationships* (not just per-project lists) need visualizing.
3. Wire the production loading path (above) once there's something worth
   shipping.
4. Start on the actual first deliverable this UI supports: scaffolding a
   new Vite web app project, including baking in its own `ci.yaml` — the
   same signed-release pattern used for Project Factory itself is the
   template, minus anything macOS-specific.

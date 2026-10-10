import { useState } from "react";
import { ProjectMap } from "./components/ProjectMap";
import { HistoryTree } from "./components/HistoryTree";
import { useProjects } from "./hooks/useProjects";
import { mockCommits } from "./mockData";

type View = "map" | "history";

function App() {
  const { projects, loading, error } = useProjects();
  const [view, setView] = useState<View>("map");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const selectedProject =
    projects.find((p) => p.id === selectedProjectId) ?? projects[0];

  if (loading) return <p className="empty-state">Loading projects…</p>;
  if (error) {
    return <p className="empty-state">Couldn't load projects: {error.message}</p>;
  }

  return (
    <div className="app">
      <nav className="tabs">
        <button
          className={view === "map" ? "tab tab--active" : "tab"}
          onClick={() => setView("map")}
        >
          Map
        </button>
        <button
          className={view === "history" ? "tab tab--active" : "tab"}
          onClick={() => setView("history")}
          disabled={!selectedProject}
        >
          History
        </button>
      </nav>

      <main>
        {view === "map" && (
          <ProjectMap
            projects={projects}
            selectedProjectId={selectedProject?.id ?? null}
            onSelectProject={(id) => {
              setSelectedProjectId(id);
              setView("history");
            }}
          />
        )}
        {view === "history" && selectedProject && (
          <HistoryTree
            projectName={selectedProject.name}
            commits={mockCommits[selectedProject.id] ?? []}
          />
        )}
      </main>
    </div>
  );
}

export default App;
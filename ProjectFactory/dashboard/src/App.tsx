import { useState } from "react";
import { ProjectMap } from "./components/ProjectMap";
import { HistoryTree } from "./components/HistoryTree";
import { mockProjects, mockCommits } from "./mockData";

type View = "map" | "history";

function App() {
  const [view, setView] = useState<View>("map");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    mockProjects[0]?.id ?? null,
  );

  const selectedProject = mockProjects.find((p) => p.id === selectedProjectId);

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
            projects={mockProjects}
            selectedProjectId={selectedProjectId}
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

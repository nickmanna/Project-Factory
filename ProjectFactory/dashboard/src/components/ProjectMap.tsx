import type { Project } from "../types";

interface ProjectMapProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
}

// v0: a card grid. The resources listed per project are what a real graph
// layout (e.g. React Flow) would render as connected nodes - swapping this
// out for an actual graph is the natural next step once there's a reason
// to visualize relationships between resources, not just list them.
export function ProjectMap({
  projects,
  selectedProjectId,
  onSelectProject,
}: ProjectMapProps) {
  return (
    <div className="project-map">
      {projects.map((project) => (
        <button
          key={project.id}
          className={
            "project-card" +
            (project.id === selectedProjectId ? " project-card--selected" : "")
          }
          onClick={() => onSelectProject(project.id)}
        >
          <h3>{project.name}</h3>
          <p>{project.description}</p>
          <ul className="resource-list">
            {project.resources.map((resource) => (
              <li key={resource.id} className={`resource-chip resource-chip--${resource.kind}`}>
                {resource.name}
              </li>
            ))}
          </ul>
        </button>
      ))}
    </div>
  );
}

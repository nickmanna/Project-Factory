import type { Commit } from "../types";

interface HistoryTreeProps {
  projectName: string;
  commits: Commit[];
}

// v0: a straight-line list with a merge marker when a commit has more than
// one parent. Real branch/merge layout (parallel lanes) needs an actual
// graph algorithm once we're reading real git history instead of mock
// data - see docs/Project_Factory_Dashboard_UI.md.
export function HistoryTree({ projectName, commits }: HistoryTreeProps) {
  if (commits.length === 0) {
    return <p className="empty-state">No commits for {projectName} yet.</p>;
  }

  return (
    <div className="history-tree">
      <h3>{projectName} history</h3>
      <ol>
        {commits.map((commit) => (
          <li key={commit.hash} className="commit-node">
            <div className="commit-dot" />
            <div className="commit-body">
              <code className="commit-hash">{commit.hash}</code>
              <span className="commit-message">{commit.message}</span>
              <span className="commit-meta">
                {commit.author} · {commit.date}
                {commit.parents.length > 1 && " · merge"}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

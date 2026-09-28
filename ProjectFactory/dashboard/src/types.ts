export type ResourceKind =
  | "repo"
  | "gcp-project"
  | "secret"
  | "ci-workflow"
  | "deploy-target";

export interface Resource {
  id: string;
  name: string;
  kind: ResourceKind;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  resources: Resource[];
}

export interface Commit {
  hash: string;
  message: string;
  author: string;
  date: string;
  parents: string[];
}

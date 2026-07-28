export type ProjectStatus =
  | "in-progress"
  | "review"
  | "shipped"
  | "archived";

export type ProjectVisibility = "private" | "shared" | "public";

export type WorkspaceProject = {
  id: string;
  name: string;
  description: string;
  cover: string;
  coverTone: string;
  tech: string[];
  status: ProjectStatus;
  visibility: ProjectVisibility;
  pinned: boolean;
  progress: number;
  lastUpdated: string;
  lastOpened: string;
  lastEditedBy: string;
  members: { id?: string; name: string; initials: string; color: string }[];
  stars?: number;
  forks?: number;
  views?: number;
  downloads?: number;
  tags?: string[];
  owner: { id?: string; name: string; initials: string; color: string };
  /** Access role for the signed-in user on this project. */
  role?: "owner" | "editor" | "viewer";
  trending?: boolean;
  weeklyStars?: number;
  /** GitHub clone lifecycle — present while importing / after failure. */
  importStatus?: "importing" | "completed" | "failed";
  importStartedAt?: number;
  importTotalFiles?: number;
  importDoneFiles?: number;
  source?: "blank" | "github" | "template";
  githubRepoUrl?: string;
  githubBranch?: string;
  /** True when the signed-in user owns this project. */
  isOwner?: boolean;
  /** True when the signed-in user is already a collaborator. */
  isMember?: boolean;
  /** Latest access-request status for public projects (non-members). */
  accessRequestStatus?: "pending" | "approved" | "denied";
};

export type WorkspaceStat = {
  id: string;
  label: string;
  value: number;
  trend: string;
  tone: "violet" | "blue" | "pink" | "orange";
  icon: "pin" | "clock" | "users" | "globe";
};

export type WorkspaceCollection = {
  id: string;
  name: string;
  count: number;
  color: string;
  icon: "pin" | "sparkles" | "user" | "briefcase" | "archive";
};

export type WorkspaceActivity = {
  id: string;
  projectId?: string;
  projectName?: string;
  type:
    | "updated"
    | "contributor"
    | "merged"
    | "comment"
    | "released"
    | "joined";
  title: string;
  detail: string;
  time: string;
  avatar: { initials: string; color: string };
};

export type WorkspaceDeadline = {
  id: string;
  projectId: string;
  title: string;
  project: string;
  dueAt: number;
  due: string;
  tone: "orange" | "blue" | "violet" | "green";
};

export type WorkspaceTeamMember = {
  userId: string;
  name: string;
  email?: string;
  initials: string;
  color: string;
  imageUrl?: string;
  roles: ("owner" | "editor" | "viewer")[];
  projects: { id: string; name: string; role: "owner" | "editor" | "viewer" }[];
};

export type CollectionProject = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  visibility: "private" | "public";
  updatedAt: number;
  lastUpdated: string;
};

export type WorkspaceRequest = {
  id: string;
  name: string;
  role: string;
  project: string;
  initials: string;
  color: string;
};

export type WorkspaceNotification = {
  id: string;
  title: string;
  time: string;
  tone: "violet" | "green" | "blue" | "orange";
  href?: string;
  read?: boolean;
  soundKind?:
    | "notify"
    | "success"
    | "warning"
    | "error"
    | "message"
    | "aiDone";
};

export type AccessRole =
  | "Developer"
  | "Designer"
  | "QA"
  | "Backend"
  | "Frontend"
  | "AI Engineer"
  | "DevOps";

export type ProjectFilter =
  | "all"
  | "mine"
  | "pinned"
  | "recent"
  | "shared"
  | "public"
  | "archived";

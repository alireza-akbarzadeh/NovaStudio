export type ProjectDetailsOwner = {
  name: string;
  initials: string;
  color: string;
  imageUrl?: string;
};

export type ProjectDetailsContributor = {
  id: string;
  userId: string;
  name: string;
  initials: string;
  color: string;
  imageUrl?: string;
  role: "owner" | "editor" | "viewer";
};

export type ProjectDetailsTodo = {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "done";
};

export type ProjectDetailsFeature = {
  id: string;
  title: string;
  description?: string;
  status: "open" | "planned" | "funded" | "shipped";
  sponsorName?: string;
  sponsorMessage?: string;
  sponsorAmount?: string;
  upvotes: number;
  createdAt: number;
};

export type ProjectDetailsData = {
  id: string;
  name: string;
  description: string;
  coverTone: string;
  tech: string[];
  status: string;
  visibility: string;
  source?: "blank" | "github" | "template";
  templateId?: string;
  githubRepoUrl?: string;
  progress: number;
  updatedAt: number;
  lastUpdated: string;
  owner: ProjectDetailsOwner;
  contributors: ProjectDetailsContributor[];
  contributorCount: number;
  stats: {
    stars: number;
    views: number;
    forks: number;
    downloads: number;
  };
  viewer: {
    hasStarred: boolean;
    isOwner: boolean;
    isMember: boolean;
    canEdit: boolean;
    canManage: boolean;
    accessRequestStatus?: "pending" | "approved" | "denied";
  };
  todos: ProjectDetailsTodo[];
  features: ProjectDetailsFeature[];
};

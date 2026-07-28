export type ProjectDocSlot = "readme" | "contributing" | "license";

export type ProjectDocRecord = {
  slot: ProjectDocSlot;
  label: string;
  path: string | null;
  defaultPath: string;
  content: string;
  exists: boolean;
  isDirty: boolean;
  isStaged: boolean;
  isMarkdown: boolean;
  defaultContent: string;
};

export type ProjectDocsData = {
  source?: "blank" | "github" | "template";
  githubRepoUrl?: string;
  githubBranch: string;
  canEdit: boolean;
  canManage: boolean;
  docs: ProjectDocRecord[];
};

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
  bountyAmount?: string;
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
  viewerHasUpvoted: boolean;
  createdAt: number;
};

export type ProjectDetailsDemo = {
  url: string;
  filename: string;
  mediaType: string;
};

export type ProjectDetailsPreview = {
  url: string;
  provider: "vercel" | "netlify";
  label: string;
  updatedAt: number;
  updatedLabel: string;
};

export type ProjectCommunityActivity = {
  id: string;
  type: "released" | "sponsored" | "joined" | "contributor";
  title: string;
  detail?: string;
  time: string;
  avatar: {
    initials: string;
    color: string;
    name: string;
  };
};

export type ProjectCommunityMessage = {
  id: string;
  body: string;
  time: string;
  createdAt: number;
  isOwner?: boolean;
  author: {
    userId: string;
    name: string;
    initials: string;
    color: string;
    imageUrl?: string;
  };
};

export type ProjectCommunityDiscussion = ProjectCommunityMessage & {
  answered: boolean;
  replyCount: number;
  replies: ProjectCommunityMessage[];
};

export type ProjectDetailsRelatedProject = {
  id: string;
  name: string;
  description: string;
  coverTone: string;
  tech: string[];
  stars: number;
  lastUpdated: string;
  owner: ProjectDetailsOwner;
  relation: "same-owner" | "same-tech" | "both";
  matchedTech: string[];
};

export type SponsorTier = "supporter" | "backer" | "feature";

export type ProjectDetailsSponsorWallEntry = {
  userId: string;
  name: string;
  initials: string;
  color: string;
  tier: SponsorTier;
  message?: string;
  amount?: string;
  featureCount: number;
  featureTitles: string[];
  since: string;
};

export type ProjectDetailsData = {
  id: string;
  name: string;
  description: string;
  coverTone: string;
  tech: string[];
  status: string;
  visibility: string;
  communityFeatured: boolean;
  source?: "blank" | "github" | "template";
  templateId?: string;
  githubRepoUrl?: string;
  githubBranch?: string;
  progress: number;
  updatedAt: number;
  lastUpdated: string;
  owner: ProjectDetailsOwner;
  contributors: ProjectDetailsContributor[];
  contributorCount: number;
  stats: {
    stars: number;
    followers: number;
    views: number;
    forks: number;
    downloads: number;
    sponsors: number;
  };
  viewer: {
    hasStarred: boolean;
    isFollowing: boolean;
    isOwner: boolean;
    isMember: boolean;
    canEdit: boolean;
    canManage: boolean;
    accessRequestStatus?: "pending" | "approved" | "denied";
    sponsorTier?: SponsorTier;
  };
  todos: ProjectDetailsTodo[];
  features: ProjectDetailsFeature[];
  sponsorWall: ProjectDetailsSponsorWallEntry[];
  demo: ProjectDetailsDemo | null;
  preview: ProjectDetailsPreview | null;
  relatedProjects: ProjectDetailsRelatedProject[];
};

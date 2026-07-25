import type {
  WorkspaceActivity,
  WorkspaceCollection,
  WorkspaceDeadline,
  WorkspaceNotification,
  WorkspaceRequest,
  WorkspaceStat,
} from "@/features/projects/lib/projects-workspace-types";

export const WORKSPACE_STATS: WorkspaceStat[] = [
  {
    id: "pinned",
    label: "Pinned Projects",
    value: 4,
    trend: "+20% vs last month",
    tone: "violet",
    icon: "pin",
  },
  {
    id: "recent",
    label: "Recent Projects",
    value: 12,
    trend: "+8% vs last month",
    tone: "blue",
    icon: "clock",
  },
  {
    id: "shared",
    label: "Shared Projects",
    value: 7,
    trend: "+12% vs last month",
    tone: "pink",
    icon: "users",
  },
  {
    id: "public",
    label: "Public Contributions",
    value: 23,
    trend: "+31% vs last month",
    tone: "orange",
    icon: "globe",
  },
];

export const WORKSPACE_COLLECTIONS: WorkspaceCollection[] = [
  { id: "c1", name: "Pinned", count: 4, color: "#7c3aed", icon: "pin" },
  { id: "c2", name: "AI Projects", count: 8, color: "#2563eb", icon: "sparkles" },
  { id: "c3", name: "Personal", count: 5, color: "#db2777", icon: "user" },
  { id: "c4", name: "Client Work", count: 6, color: "#ea580c", icon: "briefcase" },
  { id: "c5", name: "Archived", count: 3, color: "#64748b", icon: "archive" },
];

const avatars = [
  { initials: "AK", color: "#7c3aed" },
  { initials: "SR", color: "#2563eb" },
  { initials: "JL", color: "#db2777" },
  { initials: "CW", color: "#ea580c" },
];

export const WORKSPACE_ACTIVITY: WorkspaceActivity[] = [
  {
    id: "a1",
    type: "updated",
    title: "Project updated",
    detail: "AI Chat Platform · streaming tools",
    time: "12m ago",
    avatar: avatars[0],
  },
  {
    id: "a2",
    type: "contributor",
    title: "New contributor joined",
    detail: "Sam Rivera · Design System Kit",
    time: "1h ago",
    avatar: avatars[1],
  },
  {
    id: "a3",
    type: "merged",
    title: "Pull request merged",
    detail: "#248 · Realtime Collab Board",
    time: "3h ago",
    avatar: avatars[2],
  },
  {
    id: "a4",
    type: "comment",
    title: "Comment added",
    detail: "Review notes on Docs Portal",
    time: "5h ago",
    avatar: avatars[3],
  },
  {
    id: "a5",
    type: "released",
    title: "New version released",
    detail: "API Gateway Console v1.4.0",
    time: "1d ago",
    avatar: avatars[0],
  },
];

export const WORKSPACE_DEADLINES: WorkspaceDeadline[] = [
  {
    id: "d1",
    title: "Beta launch",
    project: "AI Chat Platform",
    due: "Tomorrow",
    tone: "orange",
  },
  {
    id: "d2",
    title: "API Integration",
    project: "Analytics Studio",
    due: "Fri",
    tone: "blue",
  },
  {
    id: "d3",
    title: "Design review",
    project: "Design System Kit",
    due: "Mon",
    tone: "violet",
  },
];

export const WORKSPACE_REQUESTS: WorkspaceRequest[] = [
  {
    id: "r1",
    name: "Mia Chen",
    role: "Frontend",
    project: "AI Chat Platform",
    initials: "MC",
    color: "#7c3aed",
  },
  {
    id: "r2",
    name: "Omar Nadir",
    role: "DevOps",
    project: "API Gateway Console",
    initials: "ON",
    color: "#2563eb",
  },
];

export const WORKSPACE_NOTIFICATIONS: WorkspaceNotification[] = [
  {
    id: "n1",
    title: "New contributor joined AI Chat Platform",
    time: "20m ago",
    tone: "violet",
  },
  {
    id: "n2",
    title: "Pull request merged in Collab Board",
    time: "2h ago",
    tone: "green",
  },
  {
    id: "n3",
    title: "Storage nearing plan limit",
    time: "Yesterday",
    tone: "orange",
  },
];

import { ProjectsHubLayout } from "@/features/projects/views/projects-hub-layout";

export default function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProjectsHubLayout>{children}</ProjectsHubLayout>;
}

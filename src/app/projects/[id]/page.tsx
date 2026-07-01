import { ProjectBoard } from "@/features/projects/components/ProjectBoard";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const projectId = parseInt(resolvedParams.id, 10);

  if (isNaN(projectId)) {
    return <div>Invalid Project ID</div>;
  }

  return <ProjectBoard projectId={projectId} />;
}

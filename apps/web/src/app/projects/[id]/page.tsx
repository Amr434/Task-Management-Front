import { ProjectBoard } from "@/features/projects/components/ProjectBoard";

export default async function ProjectPage(
  props: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  }
) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const projectId = parseInt(params.id, 10);
  
  const spaceIdStr = searchParams?.spaceId;
  const spaceId = spaceIdStr ? parseInt(Array.isArray(spaceIdStr) ? spaceIdStr[0] : spaceIdStr, 10) : undefined;

  if (isNaN(projectId)) {
    return <div>Invalid Project ID</div>;
  }

  return <ProjectBoard projectId={projectId} spaceId={!isNaN(spaceId as number) ? spaceId : undefined} />;
}

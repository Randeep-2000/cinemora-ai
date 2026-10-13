import { notFound } from "next/navigation";
import { ProjectStudio } from "../../../../components/ProjectStudio";
import { currentUser } from "../../../../lib/auth";
import { ownedProject } from "../../../../lib/ownership";

type Props = { params: Promise<{ projectId: string }>; searchParams: Promise<{ panel?: string }> };
export default async function ProjectPage({ params, searchParams }: Props) {
  const user = await currentUser();
  if (!user) return null;
  const [{ projectId }, query] = await Promise.all([params, searchParams]);
  const project = await ownedProject(projectId, user.id);
  if (!project) notFound();
  return <ProjectStudio projectId={projectId} initialPanel={query.panel ?? "overview"} />;
}

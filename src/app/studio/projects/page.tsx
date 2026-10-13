import Link from "next/link";
import { currentUser } from "../../../lib/auth";
import { db } from "../../../lib/db";

export default async function ProjectsPage() {
  const user = await currentUser();
  if (!user) return null;
  const projects = await db.project.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, include: { _count: { select: { scenes: true, assets: true } } } });
  return <div className="dashboard-page"><div className="page-heading"><div><div className="eyebrow">THE PRODUCTION SLATE</div><h1>Projects</h1><p>Your stories, from first outline to final export.</p></div><Link className="button button-primary" href="/studio/projects/new">＋ New project</Link></div>{projects.length?<div className="project-grid">{projects.map((project,index)=><Link href={`/studio/projects/${project.id}`} className={`project-card project-card-${index%4}`} key={project.id}><div className="project-card-art"><span className="card-moon"/><span className="card-horizon"/><span className="card-clapper">{String(index+1).padStart(2,"0")}</span><small>{project.aspectRatio}</small></div><div className="project-card-body"><div className="project-card-meta"><span>{project.projectType.replaceAll("_"," ")}</span><span className={`status-pill ${project.status}`}>{project.status.replaceAll("_"," ")}</span></div><h2>{project.title}</h2><p>{project.visualStyle} · {project.durationMinutes} min · {project._count.scenes} scenes</p><div className="project-card-foot"><span>Updated {project.updatedAt.toLocaleDateString()}</span><b>Open studio ↗</b></div></div></Link>)}</div>:<div className="panel-card projects-empty"><div className="empty-icon">▤</div><h2>Start your first production</h2><p>Describe the film you want to make. You can add a script, characters, and reference images as your project takes shape.</p><Link href="/studio/projects/new" className="button button-primary">Create a project <span>↗</span></Link></div>}</div>;
}

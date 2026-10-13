import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "../../../lib/auth";
import { db } from "../../../lib/db";

type Props = { params: Promise<{ panel: string }> };
export default async function StudioPanelPage({ params }: Props) {
  const [{ panel }, user] = await Promise.all([params, currentUser()]);
  if (!user) return null;
  if (panel === "assets") {
    const assets = await db.asset.findMany({ where: { project: { userId: user.id } }, include: { project: { select: { id: true, title: true } } }, orderBy: { createdAt: "desc" }, take: 80 });
    return <div className="dashboard-page"><div className="page-heading"><div><div className="eyebrow">MEDIA LIBRARY</div><h1>Your production assets</h1><p>Files are private to your account and grouped by project.</p></div></div>{assets.length?<div className="panel-card global-asset-list">{assets.map(asset=><Link href={`/studio/projects/${asset.project.id}?panel=assets`} className="global-asset-row" key={asset.id}><span className={`global-asset-icon ${asset.kind}`}>{asset.kind==="audio"?"♫":asset.kind==="video"?"▣":asset.kind==="image"?"▧":"TXT"}</span><span><b>{asset.filename}</b><small>{asset.project.title} · {asset.kind} · {(asset.sizeBytes/1024/1024).toFixed(2)} MB</small></span><span className="row-arrow">↗</span></Link>)}</div>:<div className="panel-card projects-empty"><div className="empty-icon">▧</div><h2>No assets in the library yet</h2><p>Create a project, then import images, video, audio, and script materials into its asset library.</p><Link href="/studio/projects" className="button button-primary">Open projects <span>↗</span></Link></div>}</div>;
  }
  if (panel === "jobs") {
    const [jobs,exports] = await Promise.all([db.generationJob.findMany({where:{userId:user.id},include:{project:{select:{id:true,title:true}},},orderBy:{createdAt:"desc"},take:50}),db.exportJob.findMany({where:{userId:user.id},include:{project:{select:{id:true,title:true}}},orderBy:{createdAt:"desc"},take:30})]);
    return <div className="dashboard-page"><div className="page-heading"><div><div className="eyebrow">PRODUCTION ACTIVITY</div><h1>Job history</h1><p>Generation tasks and exports from your owned projects.</p></div></div><div className="panel-card history-card"><div className="panel-head"><div><span className="eyebrow">GENERATION JOBS</span><h3>{jobs.length} tasks</h3></div></div>{jobs.map(job=><Link href={`/studio/projects/${job.project.id}?panel=jobs`} className="history-row" key={job.id}><span className={`history-status ${job.status}`}>{job.status==="completed"?"✓":job.status==="failed"?"!":"◷"}</span><div><b>{job.type.replaceAll("_"," ")} · {job.project.title}</b><small>{job.provider} · {job.isDemo?"DEMO":"production request"} · {job.createdAt.toLocaleString()}</small>{job.errorMessage&&<small className="error-copy">{job.errorMessage}</small>}</div><span className={`status-pill ${job.status}`}>{job.status}</span><div className="mini-progress"><i style={{width:`${job.progress}%`}}/></div></Link>)}{!jobs.length&&<div className="empty-state compact"><p>No generation tasks yet.</p></div>}</div><div className="panel-card history-card"><div className="panel-head"><div><span className="eyebrow">EXPORT JOBS</span><h3>{exports.length} renders</h3></div></div>{exports.map(job=><Link href={`/studio/projects/${job.project.id}?panel=jobs`} className="history-row" key={job.id}><span className={`history-status ${job.status}`}>{job.status==="completed"?"✓":job.status==="failed"?"!":"◷"}</span><div><b>MP4 export · {job.project.title}</b><small>{job.status} · {job.progress}% complete</small>{job.errorMessage&&<small className="error-copy">{job.errorMessage}</small>}</div><span className={`status-pill ${job.status}`}>{job.status}</span></Link>)}{!exports.length&&<div className="empty-state compact"><p>No exports yet.</p></div>}</div></div>;
  }
  if (["characters","world","voice","music"].includes(panel)) {
    const project = await db.project.findFirst({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, select: { id: true } });
    if (project) redirect(`/studio/projects/${project.id}?panel=${panel}`);
    return <div className="panel-card projects-empty"><div className="empty-icon">◇</div><h2>Start a production to open this studio</h2><p>Character, world, voice, and music tools live inside each project so the materials stay together.</p><Link href="/studio/projects/new" className="button button-primary">Create a project <span>↗</span></Link></div>;
  }
  notFound();
}

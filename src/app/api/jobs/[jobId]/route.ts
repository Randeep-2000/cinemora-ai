import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import { jsonError } from "../../../../lib/http";

type Context = { params: Promise<{ jobId: string }> };

export async function GET(_request: Request, context: Context) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in required.", 401);
  const { jobId } = await context.params;
  const job = await db.generationJob.findFirst({ where: { id: jobId, userId: user.id }, select: { id: true, projectId: true, type: true, provider: true, status: true, progress: true, errorMessage: true, isDemo: true, createdAt: true, startedAt: true, completedAt: true } });
  if (!job) return jsonError("Job not found.", 404);
  return NextResponse.json({ job });
}

export async function DELETE(_request: Request, context: Context) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in required.", 401);
  const { jobId } = await context.params;
  const job = await db.generationJob.findFirst({ where: { id: jobId, userId: user.id, status: "queued" } });
  if (!job) return jsonError("Only queued jobs can be cancelled.", 409);
  const updated = await db.generationJob.update({ where: { id: job.id }, data: { status: "cancelled", completedAt: new Date() } });
  return NextResponse.json({ job: updated });
}

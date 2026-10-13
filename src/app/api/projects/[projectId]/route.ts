import { NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { currentUser } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import { jsonError, limitedJson } from "../../../../lib/http";
import { ownedProject } from "../../../../lib/ownership";

type Context = { params: Promise<{ projectId: string }> };
const patchSchema = z.object({ title: z.string().trim().min(2).max(120).optional(), prompt: z.string().trim().min(10).max(6000).optional(), status: z.enum(["draft", "writing", "storyboard", "in_production", "complete"]).optional() }).refine((value) => Object.keys(value).length > 0);

export async function GET(_request: Request, context: Context) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in required.", 401);
  const { projectId } = await context.params;
  const project = await db.project.findFirst({ where: { id: projectId, userId: user.id }, include: { scenes: { orderBy: { number: "asc" }, include: { shots: { orderBy: { number: "asc" } } } }, characters: true, assets: { orderBy: { createdAt: "desc" } }, timeline: { include: { clips: { orderBy: { position: "asc" }, include: { asset: true } } } }, jobs: { orderBy: { createdAt: "desc" }, take: 20 }, exports: { orderBy: { createdAt: "desc" }, take: 10 } } });
  if (!project) return jsonError("Project not found.", 404);
  return NextResponse.json({ project });
}

export async function PATCH(request: Request, context: Context) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in required.", 401);
  const { projectId } = await context.params;
  if (!(await ownedProject(projectId, user.id))) return jsonError("Project not found.", 404);
  try {
    const input = patchSchema.parse(await limitedJson(request, 8_000));
    const project = await db.project.update({ where: { id: projectId }, data: input });
    return NextResponse.json({ project });
  } catch {
    return jsonError("Invalid project update.", 422);
  }
}

export async function DELETE(_request: Request, context: Context) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in required.", 401);
  const { projectId } = await context.params;
  if (!(await ownedProject(projectId, user.id))) return jsonError("Project not found.", 404);
  const assets = await db.asset.findMany({ where: { projectId }, select: { storageKey: true } });
  const storageRoot = path.resolve(process.cwd(), "storage");
  await Promise.allSettled(assets.map(async ({ storageKey }) => {
    const filePath = path.resolve(storageRoot, storageKey);
    if (filePath.startsWith(storageRoot + path.sep)) await unlink(filePath).catch(() => undefined);
  }));
  await db.project.delete({ where: { id: projectId } });
  return NextResponse.json({ ok: true });
}

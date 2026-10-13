import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "../../../../../lib/auth";
import { db } from "../../../../../lib/db";
import { jsonError, limitedJson } from "../../../../../lib/http";
import { ownedProject } from "../../../../../lib/ownership";

type Context = { params: Promise<{ projectId: string }> };
const timelineSchema = z.object({ clips: z.array(z.object({ assetId: z.string().cuid().nullable(), track: z.enum(["video", "audio", "voice", "text"]), position: z.number().min(0).max(86_400), sourceIn: z.number().min(0), sourceOut: z.number().min(0.1).max(86_400), volume: z.number().min(0).max(2).default(1), transition: z.enum(["cut", "fade"]).default("cut"), title: z.string().max(160).default("") })).max(200) });

export async function PUT(request: Request, context: Context) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in required.", 401);
  const { projectId } = await context.params;
  if (!(await ownedProject(projectId, user.id))) return jsonError("Project not found.", 404);
  try {
    const { clips } = timelineSchema.parse(await limitedJson(request, 80_000));
    const timeline = await db.timeline.findUnique({ where: { projectId } });
    if (!timeline) return jsonError("Timeline not found.", 404);
    const assetIds = clips.flatMap((clip) => clip.assetId ? [clip.assetId] : []);
    const ownedAssets = await db.asset.count({ where: { id: { in: assetIds }, projectId } });
    if (ownedAssets !== new Set(assetIds).size) return jsonError("One or more assets do not belong to this project.", 403);
    const normalized = clips.map((clip) => ({ ...clip, sourceOut: Math.max(clip.sourceIn + 0.1, clip.sourceOut) }));
    await db.$transaction(async (tx) => {
      await tx.timelineClip.deleteMany({ where: { timelineId: timeline.id } });
      if (normalized.length) await tx.timelineClip.createMany({ data: normalized.map((clip) => ({ ...clip, timelineId: timeline.id })) });
      await tx.timeline.update({ where: { id: timeline.id }, data: { version: { increment: 1 } } });
    });
    const saved = await db.timeline.findUnique({ where: { id: timeline.id }, include: { clips: { orderBy: { position: "asc" }, include: { asset: true } } } });
    return NextResponse.json({ timeline: saved });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") return jsonError("Timeline data is invalid.", 422);
    return jsonError("Unable to save timeline.", 500);
  }
}

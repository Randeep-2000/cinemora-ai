import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "../../../../../../lib/auth";
import { db } from "../../../../../../lib/db";
import { jsonError, limitedJson } from "../../../../../../lib/http";
import { ownedProject } from "../../../../../../lib/ownership";

type Context = { params: Promise<{ projectId: string; sceneId: string }> };
const schema = z.object({ title: z.string().trim().min(1).max(160).optional(), description: z.string().trim().min(1).max(3000).optional(), location: z.string().max(500).optional(), durationSec: z.number().int().min(1).max(3600).optional() }).refine((data) => Object.keys(data).length > 0);

export async function PATCH(request: Request, context: Context) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in required.", 401);
  const { projectId, sceneId } = await context.params;
  if (!(await ownedProject(projectId, user.id))) return jsonError("Project not found.", 404);
  const scene = await db.scene.findFirst({ where: { id: sceneId, projectId } });
  if (!scene) return jsonError("Scene not found.", 404);
  try { const input = schema.parse(await limitedJson(request, 8_000)); return NextResponse.json({ scene: await db.scene.update({ where: { id: sceneId }, data: input }) }); }
  catch { return jsonError("Scene update is invalid.", 422); }
}

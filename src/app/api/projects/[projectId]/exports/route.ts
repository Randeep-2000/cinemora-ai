import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "../../../../../lib/auth";
import { db } from "../../../../../lib/db";
import { jsonError, limitedJson } from "../../../../../lib/http";
import { ownedProject } from "../../../../../lib/ownership";

type Context = { params: Promise<{ projectId: string }> };
const schema = z.object({ width: z.number().int().min(320).max(3840).default(1920), height: z.number().int().min(320).max(3840).default(1080), fps: z.number().int().min(12).max(60).default(24), format: z.literal("mp4").default("mp4") });

export async function POST(request: Request, context: Context) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in required.", 401);
  const { projectId } = await context.params;
  if (!(await ownedProject(projectId, user.id))) return jsonError("Project not found.", 404);
  try {
    const settings = schema.parse(await limitedJson(request, 2_000));
    const job = await db.exportJob.create({ data: { userId: user.id, projectId, settings: JSON.stringify(settings) } });
    return NextResponse.json({ job }, { status: 202 });
  } catch {
    return jsonError("Export settings are invalid.", 422);
  }
}

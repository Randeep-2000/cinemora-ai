import { NextResponse } from "next/server";
import { currentUser } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { jsonError, limitedJson } from "../../../lib/http";
import { projectSchema } from "../../../lib/validation";

export async function GET() {
  const user = await currentUser();
  if (!user) return jsonError("Sign in required.", 401);
  const projects = await db.project.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, include: { _count: { select: { scenes: true, assets: true, jobs: true } } } });
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in required.", 401);
  try {
    const input = projectSchema.parse(await limitedJson(request, 16_000));
    const project = await db.project.create({ data: { ...input, userId: user.id, timeline: { create: {} } }, include: { timeline: true } });
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") return jsonError("Please complete all project details.", 422);
    return jsonError("Unable to save the project.", 500);
  }
}

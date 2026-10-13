import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "../../../../../lib/auth";
import { db } from "../../../../../lib/db";
import { jsonError, limitedJson } from "../../../../../lib/http";
import { ownedProject } from "../../../../../lib/ownership";

type Context = { params: Promise<{ projectId: string }> };
const schema = z.object({ name: z.string().trim().min(1).max(100), description: z.string().trim().min(1).max(1500), personality: z.string().max(1000).default(""), appearance: z.string().max(1000).default(""), clothing: z.string().max(1000).default(""), voicePreferences: z.string().max(300).default("") });

export async function POST(request: Request, context: Context) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in required.", 401);
  const { projectId } = await context.params;
  if (!(await ownedProject(projectId, user.id))) return jsonError("Project not found.", 404);
  try {
    const input = schema.parse(await limitedJson(request, 8_000));
    const character = await db.character.create({ data: { ...input, projectId } });
    return NextResponse.json({ character }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") return jsonError("Character details are invalid.", 422);
    return jsonError("Unable to save character.", 500);
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "../../../../../lib/auth";
import { db } from "../../../../../lib/db";
import { jsonError, limitedJson } from "../../../../../lib/http";
import { ownedProject } from "../../../../../lib/ownership";
import { rateLimit } from "../../../../../lib/http";

type Context = { params: Promise<{ projectId: string }> };
const inputSchema = z.object({ mode: z.enum(["openai", "demo"]), idempotencyKey: z.string().max(120).optional() });

export async function POST(request: Request, context: Context) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in required.", 401);
  const { projectId } = await context.params;
  const project = await ownedProject(projectId, user.id);
  if (!project) return jsonError("Project not found.", 404);
  if (!rateLimit(`screenplay:${user.id}`, 5, 60 * 60 * 1000)) return jsonError("Screenplay generation limit reached for this hour. Try again later.", 429);
  try {
    const input = inputSchema.parse(await limitedJson(request, 2_000));
    if (input.mode === "openai" && !process.env.OPENAI_API_KEY) {
      const configured = await db.aIProviderConfig.findFirst({ where: { userId: user.id, provider: "openai", capability: "text_generation", enabled: true }, select: { id: true } });
      if (!configured) return jsonError("Configure an OpenAI key in Settings or add OPENAI_API_KEY on the server before requesting real generation.", 409);
    }
    const idempotencyKey = input.idempotencyKey || crypto.randomUUID();
    const existing = await db.generationJob.findFirst({ where: { userId: user.id, idempotencyKey } });
    if (existing) return NextResponse.json({ job: existing }, { status: 200 });
    const job = await db.generationJob.create({ data: {
      userId: user.id,
      projectId,
      type: "screenplay",
      provider: input.mode === "demo" ? "demo" : "openai",
      isDemo: input.mode === "demo",
      idempotencyKey,
      input: JSON.stringify({ prompt: project.prompt, title: project.title, language: project.language, visualStyle: project.visualStyle, durationMinutes: project.durationMinutes, audience: project.audience }),
    } });
    return NextResponse.json({ job }, { status: 202 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") return jsonError("Invalid screenplay request.", 422);
    return jsonError("Unable to queue screenplay generation.", 500);
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "../../../../../lib/auth";
import { db } from "../../../../../lib/db";
import { encryptSecret } from "../../../../../lib/secrets";
import { jsonError, limitedJson } from "../../../../../lib/http";

const schema = z.object({ apiKey: z.string().trim().min(20).max(300) });

export async function GET() {
  const user = await currentUser();
  if (!user) return jsonError("Sign in required.", 401);
  const config = await db.aIProviderConfig.findUnique({ where: { userId_provider_capability: { userId: user.id, provider: "openai", capability: "text_generation" } }, select: { enabled: true, updatedAt: true } });
  return NextResponse.json({ configured: Boolean(config?.enabled), source: process.env.OPENAI_API_KEY ? "server" : config?.enabled ? "account" : "missing", updatedAt: config?.updatedAt ?? null });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in required.", 401);
  try {
    const { apiKey } = schema.parse(await limitedJson(request, 2_000));
    const encrypted = encryptSecret(apiKey);
    await db.aIProviderConfig.upsert({
      where: { userId_provider_capability: { userId: user.id, provider: "openai", capability: "text_generation" } },
      create: { userId: user.id, provider: "openai", capability: "text_generation", secretEnc: encrypted, enabled: true },
      update: { secretEnc: encrypted, enabled: true },
    });
    return NextResponse.json({ configured: true, source: "account" });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") return jsonError("Enter a valid provider key.", 422);
    return jsonError(error instanceof Error ? error.message : "Unable to save provider configuration.", 500);
  }
}

export async function DELETE() {
  const user = await currentUser();
  if (!user) return jsonError("Sign in required.", 401);
  await db.aIProviderConfig.deleteMany({ where: { userId: user.id, provider: "openai", capability: "text_generation" } });
  return NextResponse.json({ configured: Boolean(process.env.OPENAI_API_KEY), source: process.env.OPENAI_API_KEY ? "server" : "missing" });
}

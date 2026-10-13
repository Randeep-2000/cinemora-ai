import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { createSession, passwordHash } from "../../../../lib/auth";
import { limitedJson, jsonError, rateLimit } from "../../../../lib/http";
import { registerSchema } from "../../../../lib/validation";

export async function POST(request: Request) {
  if (!rateLimit(`register:${request.headers.get("x-forwarded-for") ?? "unknown"}`, 5)) return jsonError("Too many attempts. Try again shortly.", 429);
  try {
    const input = registerSchema.parse(await limitedJson(request));
    const exists = await db.user.findUnique({ where: { email: input.email }, select: { id: true } });
    if (exists) return jsonError("An account with that email already exists.", 409);
    const user = await db.user.create({ data: { email: input.email, name: input.name, passwordHash: passwordHash(input.password) }, select: { id: true, email: true, name: true } });
    await createSession(user.id);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") return jsonError("Please check your name, email, and password (12 characters minimum).", 422);
    return jsonError("Unable to create the account right now.", 500);
  }
}

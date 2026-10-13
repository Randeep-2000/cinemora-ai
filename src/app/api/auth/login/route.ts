import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { createSession, verifyPassword } from "../../../../lib/auth";
import { limitedJson, jsonError, rateLimit } from "../../../../lib/http";
import { loginSchema } from "../../../../lib/validation";

export async function POST(request: Request) {
  if (!rateLimit(`login:${request.headers.get("x-forwarded-for") ?? "unknown"}`, 8)) return jsonError("Too many attempts. Try again shortly.", 429);
  try {
    const input = loginSchema.parse(await limitedJson(request));
    const user = await db.user.findUnique({ where: { email: input.email } });
    if (!user || !verifyPassword(input.password, user.passwordHash)) return jsonError("Email or password is incorrect.", 401);
    await createSession(user.id);
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") return jsonError("Enter a valid email and password.", 422);
    return jsonError("Unable to sign in right now.", 500);
  }
}

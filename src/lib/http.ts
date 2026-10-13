import { NextResponse } from "next/server";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function limitedJson(request: Request, maxBytes = 32_000) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > maxBytes) throw new Error("Request is too large.");
  return request.json();
}

const buckets = new Map<string, { count: number; resetAt: number }>();
export function rateLimit(key: string, limit = 8, windowMs = 60_000) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

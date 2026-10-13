import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { currentUser } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { jsonError } from "../../../lib/http";

export const runtime = "nodejs";
const allowed = new Set(["image/png", "image/jpeg", "image/webp", "audio/mpeg", "audio/wav", "audio/mp4", "video/mp4", "video/webm", "text/plain", "application/pdf"]);

function matchesSignature(type: string, bytes: Buffer) {
  if (type === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/webp") return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  if (type === "audio/wav") return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WAVE";
  if (type === "audio/mpeg") return bytes.toString("ascii", 0, 3) === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
  if (type === "audio/mp4" || type === "video/mp4") return bytes.toString("ascii", 4, 8) === "ftyp";
  if (type === "video/webm") return bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  if (type === "application/pdf") return bytes.toString("ascii", 0, 5) === "%PDF-";
  if (type === "text/plain") return !bytes.includes(0);
  return false;
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in required.", 401);
  const form = await request.formData().catch(() => null);
  if (!form) return jsonError("Upload form is invalid.", 400);
  const file = form.get("file");
  const projectId = form.get("projectId");
  if (!(file instanceof File) || typeof projectId !== "string") return jsonError("Choose a file and project.", 422);
  const project = await db.project.findFirst({ where: { id: projectId, userId: user.id }, select: { id: true } });
  if (!project) return jsonError("Project not found.", 404);
  const maxBytes = Math.min(Number(process.env.MAX_UPLOAD_MB || 25), 100) * 1024 * 1024;
  if (file.size < 1 || file.size > maxBytes) return jsonError(`File must be under ${Math.floor(maxBytes / 1024 / 1024)} MB.`, 413);
  if (!allowed.has(file.type)) return jsonError("This file type is not supported.", 415);
  const contents = Buffer.from(await file.arrayBuffer());
  if (!matchesSignature(file.type, contents)) return jsonError("The file contents do not match the selected file type.", 415);
  const extByType: Record<string, string> = { "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp", "audio/mpeg": ".mp3", "audio/wav": ".wav", "audio/mp4": ".m4a", "video/mp4": ".mp4", "video/webm": ".webm", "text/plain": ".txt", "application/pdf": ".pdf" };
  const storageKey = `${user.id}/${randomUUID()}${extByType[file.type]}`;
  const destination = path.resolve(process.cwd(), "storage", storageKey);
  if (!destination.startsWith(path.resolve(process.cwd(), "storage") + path.sep)) return jsonError("Invalid storage location.", 400);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, contents, { flag: "wx" });
  const kind = file.type.startsWith("image/") ? "image" : file.type.startsWith("audio/") ? "audio" : file.type.startsWith("video/") ? "video" : file.type === "application/pdf" || file.type === "text/plain" ? "script" : "other";
  const asset = await db.asset.create({ data: { projectId, kind, filename: file.name.replace(/[\\/\u0000-\u001f]/g, "_").slice(0, 240), mimeType: file.type, sizeBytes: file.size, storageKey } });
  return NextResponse.json({ asset: { ...asset, url: `/api/assets/${asset.id}` } }, { status: 201 });
}

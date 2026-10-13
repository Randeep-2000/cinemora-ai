import { readFile } from "node:fs/promises";
import path from "node:path";
import { currentUser } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import { jsonError } from "../../../../lib/http";

type Context = { params: Promise<{ assetId: string }> };
export const runtime = "nodejs";

export async function GET(_request: Request, context: Context) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in required.", 401);
  const { assetId } = await context.params;
  const asset = await db.asset.findFirst({ where: { id: assetId, project: { userId: user.id } } });
  if (!asset) return jsonError("Asset not found.", 404);
  const filePath = path.resolve(process.cwd(), "storage", asset.storageKey);
  if (!filePath.startsWith(path.resolve(process.cwd(), "storage") + path.sep)) return jsonError("Invalid asset location.", 400);
  try {
    const bytes = await readFile(filePath);
    return new Response(bytes, { headers: { "Content-Type": asset.mimeType, "Content-Length": String(bytes.byteLength), "Content-Disposition": `inline; filename="${asset.filename.replace(/["\r\n]/g, "_")}"`, "X-Content-Type-Options": "nosniff", "Cache-Control": "private, max-age=3600" } });
  } catch {
    return jsonError("Asset file is missing from storage.", 404);
  }
}

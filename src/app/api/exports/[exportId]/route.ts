import { readFile } from "node:fs/promises";
import path from "node:path";
import { currentUser } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import { jsonError } from "../../../../lib/http";

type Context = { params: Promise<{ exportId: string }> };
export const runtime = "nodejs";

export async function GET(_request: Request, context: Context) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in required.", 401);
  const { exportId } = await context.params;
  const job = await db.exportJob.findFirst({ where: { id: exportId, userId: user.id, status: "completed", outputKey: { not: null } } });
  if (!job?.outputKey) return jsonError("Export is not ready.", 404);
  const filePath = path.resolve(process.cwd(), "storage", job.outputKey);
  if (!filePath.startsWith(path.resolve(process.cwd(), "storage") + path.sep)) return jsonError("Invalid export location.", 400);
  try {
    const bytes = await readFile(filePath);
    return new Response(bytes, { headers: { "Content-Type": "video/mp4", "Content-Length": String(bytes.byteLength), "Content-Disposition": `attachment; filename="cinemora-${job.projectId}.mp4"`, "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store" } });
  } catch { return jsonError("Export file is missing from storage.", 404); }
}

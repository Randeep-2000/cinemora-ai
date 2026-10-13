import "dotenv/config";
import { spawn } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { db } from "./lib/db";
import { decryptSecret } from "./lib/secrets";
import { createDemoScreenplay, generateScreenplay } from "./lib/screenplay";
import type { Screenplay } from "./lib/validation";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
let stopping = false;

async function processScreenplay(jobId: string) {
  const claimed = await db.generationJob.updateMany({ where: { id: jobId, status: "queued" }, data: { status: "running", progress: 5, startedAt: new Date(), errorMessage: null } });
  if (!claimed.count) return;
  const job = await db.generationJob.findUnique({ where: { id: jobId }, include: { project: true } });
  if (!job) return;
  try {
    const input = JSON.parse(job.input) as { prompt: string; title: string; language: string; visualStyle: string; durationMinutes: number; audience: string };
    let screenplay: Screenplay;
    let model = "demo-template-v1";
    if (job.isDemo) screenplay = createDemoScreenplay(input.prompt, input.title);
    else {
      const configured = await db.aIProviderConfig.findUnique({ where: { userId_provider_capability: { userId: job.userId, provider: "openai", capability: "text_generation" } } });
      const key = process.env.OPENAI_API_KEY || (configured?.enabled && configured.secretEnc ? decryptSecret(configured.secretEnc) : undefined);
      if (!key) throw new Error("OpenAI is not configured. Add a key in Settings or configure OPENAI_API_KEY on the server.");
      model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
      await db.generationJob.update({ where: { id: job.id }, data: { provider: "openai", progress: 15 } });
      screenplay = await generateScreenplay(input.prompt, input.title, { language: input.language, visualStyle: input.visualStyle, durationMinutes: input.durationMinutes, audience: input.audience }, key);
    }
    await db.generationJob.update({ where: { id: job.id }, data: { progress: 80 } });
    await db.$transaction(async (tx) => {
      await tx.scene.deleteMany({ where: { projectId: job.projectId } });
      await tx.character.deleteMany({ where: { projectId: job.projectId } });
      for (const character of screenplay.characters) await tx.character.create({ data: { projectId: job.projectId, ...character } });
      for (const scene of screenplay.scenes) {
        await tx.scene.create({ data: {
          projectId: job.projectId, number: scene.number, title: scene.title, description: scene.description, location: scene.location, durationSec: scene.durationSec,
          shots: { create: scene.shots.map((shot) => ({ ...shot, aspectRatio: job.project.aspectRatio })) },
        } });
      }
      await tx.project.update({ where: { id: job.projectId }, data: { screenplay: JSON.stringify(screenplay), isDemoContent: job.isDemo, status: "storyboard" } });
      await tx.generationJob.update({ where: { id: job.id }, data: { status: "completed", provider: job.isDemo ? "demo" : "openai", progress: 100, output: JSON.stringify({ title: screenplay.title, sceneCount: screenplay.scenes.length, characterCount: screenplay.characters.length, isDemo: job.isDemo }), completedAt: new Date(), usageMetadata: JSON.stringify({ model, isDemo: job.isDemo }) } });
      if (!job.isDemo) await tx.usageRecord.create({ data: { userId: job.userId, jobId: job.id, provider: "openai", capability: "text_generation", units: screenplay.scenes.length, metadata: JSON.stringify({ model }) } });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed unexpectedly.";
    const retryable = /timeout|temporar|rate limit|429|5\d\d/i.test(message) && job.retryCount < 2;
    await db.generationJob.update({ where: { id: job.id }, data: retryable ? { status: "queued", retryCount: { increment: 1 }, errorMessage: message, progress: 0 } : { status: "failed", errorMessage: message, completedAt: new Date() } });
    if (retryable) await sleep(1000 * 2 ** (job.retryCount + 1));
  }
}

function runFfmpeg(args: string[], onProgress: (seconds: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const command = process.env.FFMPEG_PATH || "ffmpeg";
    const child = spawn(command, args, { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    let buffer = "";
    child.stdout.on("data", (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split(/\r?\n/); buffer = lines.pop() ?? "";
      for (const line of lines) { const match = line.match(/^out_time_ms=(\d+)/); if (match) onProgress(Number(match[1]) / 1_000_000); }
    });
    child.stderr.on("data", (chunk: Buffer) => { stderr = (stderr + chunk.toString()).slice(-6000); });
    child.on("error", (error) => reject(new Error(`FFmpeg could not start: ${error.message}`)));
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(`FFmpeg exited with code ${code}. ${stderr.slice(-2000)}`)));
  });
}

async function processExport(id: string) {
  const claimed = await db.exportJob.updateMany({ where: { id, status: "queued" }, data: { status: "running", startedAt: new Date(), progress: 1 } });
  if (!claimed.count) return;
  const job = await db.exportJob.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          timeline: { include: { clips: { orderBy: { position: "asc" }, include: { asset: true } } } },
        },
      },
    },
  });
  if (!job) return;  try {
    const timeline = job.project.timeline;
    if (!timeline) throw new Error("This project does not have a timeline yet.");
    const clips = timeline.clips.filter((clip) => clip.asset && ["video", "audio", "voice"].includes(clip.track));
    const video = clips.filter((clip) => clip.track === "video" && clip.asset?.kind === "video");
    const audio = clips.filter((clip) => ["audio", "voice"].includes(clip.track) && clip.asset?.kind === "audio");
    if (!video.length) throw new Error("Add at least one video clip to the timeline before exporting.");
    const settings = JSON.parse(job.settings) as { width: number; height: number; fps: number };
    const dir = path.resolve(process.cwd(), "storage", job.userId, job.projectId, "exports");
    await mkdir(dir, { recursive: true });
    const outputKey = `${job.userId}/${job.projectId}/exports/${job.id}.mp4`;
    const outputPath = path.join(dir, `${job.id}.mp4`);
    const media = [...video, ...audio];
    const args: string[] = ["-hide_banner", "-y"];
    const indexes = new Map<string, number>();
    media.forEach((clip, index) => { args.push("-i", path.resolve(process.cwd(), "storage", clip.asset!.storageKey)); indexes.set(clip.id, index); });
    const filters: string[] = [];
    const videoLabels: string[] = [];
    video.forEach((clip, i) => {
      const input = indexes.get(clip.id)!; const label = `v${i}`; const duration = Math.max(0.1, clip.sourceOut - clip.sourceIn);
      filters.push(`[${input}:v]trim=start=${clip.sourceIn}:duration=${duration},setpts=PTS-STARTPTS,scale=${settings.width}:${settings.height}:force_original_aspect_ratio=decrease,pad=${settings.width}:${settings.height}:(ow-iw)/2:(oh-ih)/2:black,fps=${settings.fps}[${label}]`);
      videoLabels.push(`[${label}]`);
    });
    filters.push(`${videoLabels.join("")}concat=n=${video.length}:v=1:a=0[vout]`);
    const argsOut: string[] = ["-map", "[vout]"];
    if (audio.length) {
      const labels: string[] = [];
      audio.forEach((clip, i) => {
        const input = indexes.get(clip.id)!; const label = `a${i}`; const delayMs = Math.round(clip.position * 1000); const duration = Math.max(0.1, clip.sourceOut - clip.sourceIn);
        filters.push(`[${input}:a]atrim=start=${clip.sourceIn}:duration=${duration},asetpts=PTS-STARTPTS,volume=${clip.volume},adelay=${delayMs}|${delayMs}[${label}]`); labels.push(`[${label}]`);
      });
      filters.push(`${labels.join("")}amix=inputs=${audio.length}:normalize=0:duration=longest[aout]`); argsOut.push("-map", "[aout]");
    } else argsOut.push("-an");
    args.push("-filter_complex", filters.join(";"), ...argsOut, "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-pix_fmt", "yuv420p", "-c:a", "aac", "-movflags", "+faststart", "-progress", "pipe:1", "-nostats", outputPath);
    await runFfmpeg(args, async (seconds) => { await db.exportJob.update({ where: { id: job.id }, data: { progress: Math.min(95, Math.max(2, Math.round(seconds / Math.max(1, job.project.durationMinutes * 60) * 100))) } }).catch(() => undefined); });
    await db.exportJob.update({ where: { id: job.id }, data: { status: "completed", progress: 100, outputKey, completedAt: new Date() } });
    const exported = await stat(outputPath);
    await db.asset.create({ data: { projectId: job.projectId, kind: "video", filename: `${job.project.title.slice(0, 100)}.mp4`, mimeType: "video/mp4", sizeBytes: exported.size, storageKey: outputKey, source: "export" } });
  } catch (error) {
    await db.exportJob.update({ where: { id: job.id }, data: { status: "failed", errorMessage: error instanceof Error ? error.message : "Export failed.", completedAt: new Date() } });
  }
}

async function main() {
  console.info("CINEMORA worker started. Polling persisted generation and export jobs.");
  while (!stopping) {
    const generation = await db.generationJob.findFirst({ where: { status: "queued" }, orderBy: { createdAt: "asc" } });
    if (generation) { await processScreenplay(generation.id); continue; }
    const exportJob = await db.exportJob.findFirst({ where: { status: "queued" }, orderBy: { createdAt: "asc" } });
    if (exportJob) { await processExport(exportJob.id); continue; }
    await sleep(1500);
  }
  await db.$disconnect();
}

process.on("SIGINT", () => { stopping = true; });
process.on("SIGTERM", () => { stopping = true; });
main().catch((error) => { console.error(error); process.exit(1); });

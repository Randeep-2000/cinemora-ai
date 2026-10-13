# CINEMORA AI

CINEMORA AI is an account-scoped film production studio. This repository contains a working local application foundation: registration and sign-in, persistent projects, structured screenplay generation, characters/scenes/shots, private media upload, a saved clip timeline, job history, and an FFmpeg export worker.

The application is intentionally honest about provider state. Real screenplay generation requires an OpenAI key. A separate, explicitly labeled local sample demonstrates the structured screenplay and scene workflow. Image/video generation, speech synthesis, lip-sync, and music synthesis are not represented as completed provider integrations. The import workflow supports your own licensed audio and video.

## Architecture

- Next.js App Router, React, TypeScript, accessible responsive UI.
- Prisma with SQLite for a persistent, zero-service local development database.
- Opaque random server sessions in HTTP-only, SameSite cookies. Passwords use Node `scrypt` with unique salts.
- Zod validation at API boundaries and project ownership filters on every project/media/job operation.
- A persisted database job queue processed by the separate `npm run worker` process. Worker claims are atomic; retry attempts are bounded.
- Files are stored under `storage/` using generated keys. Original filenames are metadata only.
- The OpenAI Responses API uses strict JSON Schema output and validates the returned object before saving it.
- FFmpeg export uses argument arrays (no shell command construction), project-scoped assets, normalized timeline positions, and a separate worker.

## Requirements

- Node.js 20.9 or newer.
- npm.
- FFmpeg for actual video rendering (`ffmpeg` on `PATH`, or set `FFMPEG_PATH`).
- An OpenAI API key for real screenplay generation. Provider usage is charged according to your provider account and model; the app does not invent a price estimate.

## Local setup

```powershell
cd outputs/cinemora-ai
npm install
Copy-Item .env.example .env
```

Edit `.env` and set a unique `AUTH_SECRET` with at least 32 characters. Keep `.env` out of Git. Set `DATABASE_URL="file:../data/cinemora.db"` for the included SQLite development database.

Initialize and generate the Prisma client:

```powershell
npm run db:generate
npm run db:migrate
```

Run the web application and worker in separate terminals:

```powershell
npm run dev
npm run worker
```

Open `http://localhost:3000`, register an account, create a project, then use **Try a sample screenplay** to create clearly labeled demo scenes. Add an OpenAI key in **Settings** to enable real screenplay generation. Real generation jobs are queued and need the worker to be running.

## Configuration

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Prisma development database URL. Defaults to local SQLite in `.env.example`. |
| `AUTH_SECRET` | At least 32 random characters. Derives the key used to encrypt account provider credentials. |
| `APP_URL` | Public application origin for deployment configuration. |
| `OPENAI_API_KEY` | Optional server-wide key for real screenplay generation. An account-level encrypted key can also be configured in Settings. |
| `OPENAI_MODEL` | Text model identifier. Defaults to `gpt-4.1-mini`. Confirm model availability in your API project. |
| `FFMPEG_PATH` | FFmpeg executable path; defaults to `ffmpeg`. |
| `MAX_UPLOAD_MB` | Maximum per-file upload size (default 25 MB, capped at 100 MB). |

Account-level OpenAI keys are encrypted with AES-256-GCM before storage. A global environment key takes precedence over a per-account key. Rotate `AUTH_SECRET` only with a planned credential re-entry, because existing encrypted keys cannot be decrypted without it.

## Commands

```powershell
npm run dev          # local web server
npm run worker       # persistent job worker
npm run build        # production build
npm run start        # production web server
npm run typecheck    # TypeScript checks
npm run lint         # ESLint
npm test             # unit tests
npm run db:generate  # Prisma client
npm run db:migrate   # create/apply a local development migration
npm run db:deploy    # apply migrations in deployment
npm run db:studio    # inspect the local database
```

## Security and operations

- Every project read, write, deletion, upload, download, timeline edit, and job read is scoped to the signed-in owner. Unknown or unowned IDs return 404.
- Sessions are stored as hashes and browser cookies are HTTP-only, SameSite=Lax, and secure in production.
- Passwords are never stored in plain text. Auth endpoints have per-process rate limits; production deployments should use a shared rate limiter at the edge or in Redis.
- Uploads have size and MIME allowlists, generated storage keys, and are never executed. Production should add content-signature scanning and object storage.
- Secrets stay server-side. User-supplied scripts/prompts are treated as data and are never executed.
- The worker and web server share the database. Run a single worker per local database; use a dedicated distributed queue and object store before horizontal scaling.

## Current limitations

- Local development uses SQLite. The data model is normalized and persistent, but a production PostgreSQL deployment requires switching the Prisma datasource and applying a reviewed PostgreSQL migration.
- Media storage is local disk, not S3-compatible object storage. Configure durable private object storage before deployment.
- Text screenplay generation is the only real AI adapter included. Image, video, TTS, music, and lip-sync provider adapters are not yet integrated. The UI shows setup-required status and supports importing authorized media.
- The timeline persists track, ordering, source in/out, volume, and cut/fade intent. The FFmpeg exporter currently concatenates video clips and mixes audio/voice clips. Text overlays, rendered transitions, subtitles, and source-video audio mixing are not yet implemented.
- PDF and text scripts can be stored as assets, but screenplay extraction/import is not implemented yet.
- Account registration, sessions, ownership checks, and local file APIs are implemented; production deployment still requires HTTPS, secure backups, a shared rate limiter, storage lifecycle handling, monitoring, and a reviewed PostgreSQL migration.
- Production moderation, spending limits, and provider cost estimation require a provider policy/pricing integration. AI calls require user action and are not submitted automatically.

## Deployment notes

Deploy the Next server and worker as long-running services, point both at the same database, and provide shared durable storage. Set `AUTH_SECRET`, provider keys, upload limits, and the approved model in the deployment environment. Do not expose provider keys to browser code. Configure FFmpeg in the worker image only. Back up the database and assets together, configure HTTPS and request limits, and run `npm run db:deploy` as a release step.

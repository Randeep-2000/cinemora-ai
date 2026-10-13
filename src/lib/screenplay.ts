import { screenplaySchema, type Screenplay } from "./validation";

export function createDemoScreenplay(prompt: string, projectTitle: string): Screenplay {
  const subject = prompt.replace(/\s+/g, " ").trim().slice(0, 160);
  return screenplaySchema.parse({
    title: projectTitle,
    logline: `A short film inspired by: ${subject}`,
    characters: [{
      name: "Élise Martin",
      description: "A thoughtful young archivist who discovers a letter that changes how she understands her family.",
      personality: "Observant, warm, quietly determined.",
      appearance: "Early thirties, dark curls, expressive eyes.",
      clothing: "Practical wool coat in muted navy and a soft cream scarf.",
      voicePreferences: "Measured, intimate, natural French accent.",
    }],
    scenes: [
      {
        number: 1, title: "The Letter", location: "A quiet archive in Paris", durationSec: 42,
        description: "At closing time, Élise finds a sealed letter tucked into a book returned after decades away.",
        shots: [
          { number: 1, title: "Closing hour", prompt: "Warm late-afternoon light falls across a Paris archive; dust drifts above long oak tables.", camera: "Slow wide push-in", action: "Élise closes a ledger and notices a loose page.", dialogue: "", durationSec: 12 },
          { number: 2, title: "The handwriting", prompt: "Close detail of an old cream envelope with blue handwritten French script, careful hands opening it.", camera: "Macro close-up, shallow depth of field", action: "She recognizes the family name and pauses.", dialogue: "Élise (whisper): ‘C’est impossible…’", durationSec: 14 },
          { number: 3, title: "A decision", prompt: "Élise stands by a tall window overlooking Paris rooftops at dusk, letter held against her coat.", camera: "Gentle dolly to profile", action: "She looks toward the door, then folds the letter safely into her notebook.", dialogue: "Narration: ‘Certaines histoires attendent simplement qu’on les lise.’", durationSec: 16 },
        ],
      },
      {
        number: 2, title: "Across the Seine", location: "A bookshop near the river", durationSec: 35,
        description: "The next morning, Élise follows a clue to a familiar bookshop, where a handwritten inscription reveals a new connection.",
        shots: [
          { number: 1, title: "Morning in the city", prompt: "A quiet Paris street after rain, bookshop windows glowing softly, bicycles passing in the distance.", camera: "Street-level tracking shot", action: "Élise crosses the street and enters the shop.", dialogue: "", durationSec: 17 },
          { number: 2, title: "The inscription", prompt: "An open book on a wooden counter, old French inscription in the front cover, a hand rests beside it.", camera: "Overhead close-up", action: "The shopkeeper points to a date that matches the letter.", dialogue: "Shopkeeper: ‘Votre histoire commence ici.’", durationSec: 18 },
        ],
      },
    ],
  });
}

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "logline", "characters", "scenes"],
  properties: {
    title: { type: "string" },
    logline: { type: "string" },
    characters: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "description", "personality", "appearance", "clothing", "voicePreferences"],
        properties: {
          name: { type: "string" }, description: { type: "string" }, personality: { type: "string" },
          appearance: { type: "string" }, clothing: { type: "string" }, voicePreferences: { type: "string" },
        },
      },
    },
    scenes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["number", "title", "description", "location", "durationSec", "shots"],
        properties: {
          number: { type: "integer" }, title: { type: "string" }, description: { type: "string" },
          location: { type: "string" }, durationSec: { type: "integer" },
          shots: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["number", "title", "prompt", "camera", "action", "dialogue", "durationSec"],
              properties: {
                number: { type: "integer" }, title: { type: "string" }, prompt: { type: "string" },
                camera: { type: "string" }, action: { type: "string" }, dialogue: { type: "string" },
                durationSec: { type: "integer" },
              },
            },
          },
        },
      },
    },
  },
} as const;

export async function generateScreenplay(prompt: string, projectTitle: string, config: { language: string; visualStyle: string; durationMinutes: number; audience: string }, apiKey?: string): Promise<Screenplay> {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not configured. Add it to .env.local and restart the worker.");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(120_000),
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions: "You are a professional screenwriter. Return a concise, production-ready short-film screenplay as JSON matching the supplied schema. Keep scene and shot numbering sequential; include visual prompts, camera directions, action, dialogue, characters and locations. Never include markdown or extra keys.",
      input: JSON.stringify({ projectTitle, prompt, ...config }),
      text: { format: { type: "json_schema", name: "cinemora_screenplay", strict: true, schema } },
      store: false,
    }),
  });
  const body = await response.json() as { output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>; error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message || `Text provider returned HTTP ${response.status}.`);
  const output = body.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;
  if (!output) throw new Error("The text provider returned no screenplay content.");
  let parsed: unknown;
  try { parsed = JSON.parse(output); } catch { throw new Error("The provider returned invalid screenplay JSON."); }
  return screenplaySchema.parse(parsed);
}

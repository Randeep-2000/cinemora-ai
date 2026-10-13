import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createDemoScreenplay } from "./screenplay";
import { screenplaySchema, projectSchema } from "./validation";

describe("screenplay workflow data", () => {
  it("creates a clearly labeled local sample structure that matches the screenplay contract", () => {
    const screenplay = createDemoScreenplay("An astronomer hears a signal from a lost satellite.", "The Quiet Orbit");
    assert.equal(screenplay.title, "The Quiet Orbit");
    assert.ok(screenplay.characters.length > 0);
    assert.ok(screenplay.scenes.length > 0);
    assert.ok(screenplay.scenes.every((scene) => scene.shots.length > 0));
    assert.equal(screenplaySchema.safeParse(screenplay).success, true);
  });

  it("rejects a project brief with an unsupported aspect ratio", () => {
    const result = projectSchema.safeParse({ title: "A film", prompt: "A detailed story prompt", projectType: "short_film", durationMinutes: 3, language: "English", visualStyle: "Cinema", aspectRatio: "ultrawide", platform: "Film", audience: "General" });
    assert.equal(result.success, false);
  });
});

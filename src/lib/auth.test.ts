import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { passwordHash, verifyPassword } from "./auth";

describe("password credentials", () => {
  it("verifies a password against a salted hash", () => {
    const encoded = passwordHash("correct horse battery staple");
    assert.notEqual(encoded, "correct horse battery staple");
    assert.equal(verifyPassword("correct horse battery staple", encoded), true);
    assert.equal(verifyPassword("wrong password", encoded), false);
  });
});

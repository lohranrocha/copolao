import { describe, expect, it } from "vitest";
import { createPasswordResetToken, hashPasswordResetToken } from "./passwordReset.js";

describe("password reset tokens", () => {
  it("creates a token and stores only its hash", () => {
    const reset = createPasswordResetToken();

    expect(reset.token).toHaveLength(64);
    expect(reset.tokenHash).toHaveLength(64);
    expect(reset.tokenHash).not.toBe(reset.token);
    expect(hashPasswordResetToken(reset.token)).toBe(reset.tokenHash);
  });

  it("creates unique tokens", () => {
    const first = createPasswordResetToken();
    const second = createPasswordResetToken();

    expect(first.token).not.toBe(second.token);
    expect(first.tokenHash).not.toBe(second.tokenHash);
  });
});

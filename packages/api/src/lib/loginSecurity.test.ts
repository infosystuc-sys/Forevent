import { describe, expect, it } from "vitest";
import {
  computeAttemptState,
  generateRandomPassword,
  isAccountLocked,
  MAX_LOGIN_ATTEMPTS,
  resetAttemptState,
} from "./loginSecurity";

describe("generateRandomPassword", () => {
  it("returns a different value on every call", () => {
    const a = generateRandomPassword();
    const b = generateRandomPassword();
    expect(a).not.toBe(b);
  });

  it("never returns the previously hardcoded default password", () => {
    expect(generateRandomPassword()).not.toBe("Hola1234!");
  });
});

describe("isAccountLocked", () => {
  it("is false when lockUntil is null", () => {
    expect(isAccountLocked(null)).toBe(false);
  });

  it("is false when lockUntil is in the past", () => {
    expect(isAccountLocked(new Date(Date.now() - 1000))).toBe(false);
  });

  it("is true when lockUntil is in the future", () => {
    expect(isAccountLocked(new Date(Date.now() + 1000))).toBe(true);
  });
});

describe("computeAttemptState", () => {
  it("increments attempts without locking below the threshold", () => {
    const state = computeAttemptState(0);
    expect(state.loginAttempts).toBe(1);
    expect(state.lockUntil).toBeNull();
  });

  it("locks the account once attempts reach the max", () => {
    const state = computeAttemptState(MAX_LOGIN_ATTEMPTS - 1);
    expect(state.loginAttempts).toBe(MAX_LOGIN_ATTEMPTS);
    expect(state.lockUntil).not.toBeNull();
    expect(state.lockUntil!.getTime()).toBeGreaterThan(Date.now());
  });
});

describe("resetAttemptState", () => {
  it("clears attempts and lock", () => {
    expect(resetAttemptState()).toEqual({ loginAttempts: 0, lockUntil: null });
  });
});

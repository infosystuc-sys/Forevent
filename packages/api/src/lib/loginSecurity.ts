import { randomBytes } from "crypto";

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCK_MS = 15 * 60 * 1000; // 15 min

export function generateRandomPassword(): string {
  return randomBytes(32).toString("hex");
}

export function isAccountLocked(lockUntil: Date | null): boolean {
  return !!lockUntil && lockUntil.getTime() > Date.now();
}

export function computeAttemptState(currentAttempts: number): {
  loginAttempts: number;
  lockUntil: Date | null;
} {
  const loginAttempts = currentAttempts + 1;
  return {
    loginAttempts,
    lockUntil: loginAttempts >= MAX_LOGIN_ATTEMPTS
      ? new Date(Date.now() + LOGIN_LOCK_MS)
      : null,
  };
}

export function resetAttemptState(): { loginAttempts: number; lockUntil: null } {
  return { loginAttempts: 0, lockUntil: null };
}

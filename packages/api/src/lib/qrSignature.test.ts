import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  productQrMessage,
  signQrMessage,
  ticketQrMessage,
  verifyQrSignature,
} from "./qrSignature";

const ORIGINAL_SECRET = process.env.QR_SIGNING_SECRET;

beforeEach(() => {
  process.env.QR_SIGNING_SECRET = "test-secret";
});

afterEach(() => {
  process.env.QR_SIGNING_SECRET = ORIGINAL_SECRET;
});

describe("signQrMessage", () => {
  it("is deterministic for the same message and secret", () => {
    expect(signQrMessage("ticket:abc:user1")).toBe(signQrMessage("ticket:abc:user1"));
  });

  it("produces different signatures for different messages", () => {
    expect(signQrMessage("ticket:abc:user1")).not.toBe(signQrMessage("ticket:xyz:user1"));
  });

  it("throws when QR_SIGNING_SECRET is not configured", () => {
    delete process.env.QR_SIGNING_SECRET;
    expect(() => signQrMessage("ticket:abc:user1")).toThrow("QR_SIGNING_SECRET no está configurado");
  });
});

describe("verifyQrSignature", () => {
  it("accepts a signature produced by signQrMessage for the same message", () => {
    const message = "ticket:abc:user1";
    const signature = signQrMessage(message);
    expect(verifyQrSignature(message, signature)).toBe(true);
  });

  it("rejects a signature when the message was tampered with", () => {
    const signature = signQrMessage("ticket:abc:user1");
    expect(verifyQrSignature("ticket:abc:user2", signature)).toBe(false);
  });

  it("rejects a signature signed with a different secret", () => {
    const message = "ticket:abc:user1";
    const signature = signQrMessage(message);
    process.env.QR_SIGNING_SECRET = "different-secret";
    expect(verifyQrSignature(message, signature)).toBe(false);
  });

  it("rejects a garbage/non-hex signature without throwing", () => {
    expect(() => verifyQrSignature("ticket:abc:user1", "not-a-valid-signature!!")).not.toThrow();
    expect(verifyQrSignature("ticket:abc:user1", "not-a-valid-signature!!")).toBe(false);
  });

  it("rejects an empty signature", () => {
    expect(verifyQrSignature("ticket:abc:user1", "")).toBe(false);
  });
});

describe("ticketQrMessage", () => {
  it("formats a deterministic ticket message from userTicketId and userId", () => {
    expect(ticketQrMessage("ticket1", "user1")).toBe("ticket:ticket1:user1");
  });
});

describe("productQrMessage", () => {
  it("formats a deterministic product message joining purchase ids", () => {
    expect(productQrMessage("user1", ["p1", "p2"])).toBe("product:user1:p1,p2");
  });

  it("formats consistently with a single purchase id", () => {
    expect(productQrMessage("user1", ["p1"])).toBe("product:user1:p1");
  });
});

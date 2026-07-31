import crypto from "crypto";

function getSecret(): string {
  const secret = process.env.QR_SIGNING_SECRET;
  if (!secret) {
    throw new Error("QR_SIGNING_SECRET no está configurado");
  }
  return secret;
}

export function signQrMessage(message: string): string {
  return crypto.createHmac("sha256", getSecret()).update(message).digest("hex");
}

export function verifyQrSignature(message: string, signature: string): boolean {
  const expected = signQrMessage(message);
  const expectedBuf = Buffer.from(expected, "hex");
  const signatureBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

export function ticketQrMessage(userTicketId: string, userId: string): string {
  return `ticket:${userTicketId}:${userId}`;
}

export function productQrMessage(userId: string, purchaseIds: string[]): string {
  return `product:${userId}:${purchaseIds.join(",")}`;
}

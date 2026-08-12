import { createHmac, timingSafeEqual } from "node:crypto";

export type SePayPayment = {
  paymentCode: string;
  bank: string;
  account: string;
  accountHolder: string;
  amount: number;
  qrUrl: string;
};

export function createPaymentCode() {
  return `TT${Date.now().toString().slice(-8)}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function createSePayPayment(
  paymentCode: string,
  amount: number,
): SePayPayment | null {
  const bank = process.env.SEPAY_BANK?.trim() ?? "";
  const account = process.env.SEPAY_ACCOUNT?.trim() ?? "";
  if (!bank || !account) return null;
  const query = new URLSearchParams({
    acc: account,
    bank,
    amount: String(Math.round(amount)),
    des: paymentCode,
    template: "compact",
    showinfo: "true",
    fullacc: "true",
  });
  const accountHolder = process.env.SEPAY_ACCOUNT_HOLDER?.trim() ?? "";
  if (accountHolder) query.set("holder", accountHolder);
  return {
    paymentCode,
    bank,
    account,
    accountHolder,
    amount: Math.round(amount),
    qrUrl: `https://vietqr.app/img?${query.toString()}`,
  };
}

export function verifySePaySignature(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
) {
  const secret = process.env.SEPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const seconds = Number(timestamp);
  if (
    !Number.isInteger(seconds) ||
    Math.abs(Math.floor(Date.now() / 1000) - seconds) > 300
  )
    return false;
  const expected = `sha256=${createHmac("sha256", secret).update(`${seconds}.${rawBody}`).digest("hex")}`;
  if (!signature || signature.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export function verifySePayApiKey(
  authorization: string | null,
  apiKeyHeader: string | null,
) {
  const expected = process.env.SEPAY_WEBHOOK_API_KEY;
  if (!expected) return false;
  const supplied =
    authorization?.replace(/^Apikey\s+/i, "") ?? apiKeyHeader ?? "";
  if (supplied.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}

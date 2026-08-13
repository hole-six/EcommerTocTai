import { timingSafeEqual } from "node:crypto";
import { SePayPgClient } from "sepay-pg-node";

let cachedClient: SePayPgClient | null = null;

function credentials() {
  const merchantId = process.env.SEPAY_MERCHANT_ID?.trim();
  const secretKey = process.env.SEPAY_SECRET_KEY?.trim();
  if (!merchantId || !secretKey) return null;
  return { merchantId, secretKey };
}

export function isSePayPgConfigured() {
  return Boolean(credentials());
}

function getClient(): SePayPgClient | null {
  const creds = credentials();
  if (!creds) return null;
  if (!cachedClient) {
    cachedClient = new SePayPgClient({
      env: process.env.SEPAY_ENV === "sandbox" ? "sandbox" : "production",
      merchant_id: creds.merchantId,
      secret_key: creds.secretKey,
    });
  }
  return cachedClient;
}

export function createSePayPgCheckout(params: {
  orderInvoiceNumber: string;
  amount: number;
  description: string;
  successUrl: string;
  errorUrl: string;
  cancelUrl: string;
}) {
  const client = getClient();
  if (!client) return null;
  const fields = client.checkout.initOneTimePaymentFields({
    operation: "PURCHASE",
    payment_method: "BANK_TRANSFER",
    order_invoice_number: params.orderInvoiceNumber,
    order_amount: Math.round(params.amount),
    currency: "VND",
    order_description: params.description,
    success_url: params.successUrl,
    error_url: params.errorUrl,
    cancel_url: params.cancelUrl,
  });
  return { url: client.checkout.initCheckoutUrl(), fields };
}

export async function fetchSePayPgOrder(orderInvoiceNumber: string) {
  const client = getClient();
  if (!client) return null;
  const response = await client.order.retrieve(orderInvoiceNumber);
  return response.data;
}

/** IPN auth: SePay sends the merchant's secret key back verbatim in X-Secret-Key. */
export function verifySePayPgIpnSecret(headerValue: string | null) {
  const creds = credentials();
  if (!creds || !headerValue) return false;
  const supplied = Buffer.from(headerValue);
  const expected = Buffer.from(creds.secretKey);
  if (supplied.length !== expected.length) return false;
  return timingSafeEqual(supplied, expected);
}

import webpush, { WebPushError } from "web-push";
import { connectDb } from "@/lib/server/db";
import { PushSubscription } from "@/models/PushSubscription";

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim();
  if (!publicKey || !privateKey || !subject) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export type PushPayload = { title: string; body?: string; href?: string };

export async function sendPushToAdmins(payload: PushPayload) {
  if (!ensureConfigured()) return;
  await connectDb();
  const subscriptions = await PushSubscription.find({ role: "admin" }).lean();
  if (!subscriptions.length) return;
  const message = JSON.stringify(payload);
  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys,
          },
          message,
        );
      } catch (error) {
        if (error instanceof WebPushError && (error.statusCode === 404 || error.statusCode === 410)) {
          await PushSubscription.deleteOne({ endpoint: subscription.endpoint });
        }
      }
    }),
  );
}

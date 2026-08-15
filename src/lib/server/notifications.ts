import type { Types } from "mongoose";
import { Notification } from "@/models/Notification";
import { sendPushToAdmins } from "@/lib/server/push";

export type NotificationRecipient =
  | { recipientRole: "admin"; user?: null }
  | { recipientRole: "customer"; user: string | Types.ObjectId };

export async function notify(
  recipient: NotificationRecipient,
  data: { type: "order" | "payment" | "chat" | "system"; title: string; body?: string; href?: string },
) {
  const created = await Notification.create({
    recipientRole: recipient.recipientRole,
    user: recipient.recipientRole === "customer" ? recipient.user : null,
    type: data.type,
    title: data.title,
    body: data.body ?? "",
    href: data.href ?? "",
  });
  if (recipient.recipientRole === "admin") {
    void sendPushToAdmins({ title: data.title, body: data.body, href: data.href }).catch(() => {});
  }
  return created;
}

export async function notifyAdmins(data: {
  type: "order" | "payment" | "chat" | "system";
  title: string;
  body?: string;
  href?: string;
}) {
  return notify({ recipientRole: "admin" }, data);
}

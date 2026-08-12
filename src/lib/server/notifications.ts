import type { Types } from "mongoose";
import { Notification } from "@/models/Notification";

export type NotificationRecipient =
  | { recipientRole: "admin"; user?: null }
  | { recipientRole: "customer"; user: string | Types.ObjectId };

export async function notify(
  recipient: NotificationRecipient,
  data: { type: "order" | "payment" | "chat" | "system"; title: string; body?: string; href?: string },
) {
  return Notification.create({
    recipientRole: recipient.recipientRole,
    user: recipient.recipientRole === "customer" ? recipient.user : null,
    type: data.type,
    title: data.title,
    body: data.body ?? "",
    href: data.href ?? "",
  });
}

export async function notifyAdmins(data: {
  type: "order" | "payment" | "chat" | "system";
  title: string;
  body?: string;
  href?: string;
}) {
  return notify({ recipientRole: "admin" }, data);
}

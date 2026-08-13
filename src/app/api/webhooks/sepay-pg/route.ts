import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { notify, notifyAdmins } from "@/lib/server/notifications";
import { verifySePayPgIpnSecret } from "@/lib/server/sepayPg";
import { Order } from "@/models/Order";
import { PaymentWebhook } from "@/models/PaymentWebhook";

type SePayPgIpn = {
  notification_type?: "ORDER_PAID" | "TRANSACTION_VOID";
  order?: {
    order_invoice_number?: string;
    order_amount?: number | string;
    order_status?: string;
  };
  transaction?: {
    transaction_id?: number | string;
    transaction_status?: string;
    transaction_amount?: number | string;
  };
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  const authenticated = verifySePayPgIpnSecret(request.headers.get("x-secret-key"));
  if (!authenticated)
    return NextResponse.json({ success: false, error: "Invalid secret key" }, { status: 401 });

  let body: SePayPgIpn;
  try {
    body = JSON.parse(rawBody) as SePayPgIpn;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid webhook payload" }, { status: 400 });
  }

  const orderInvoiceNumber = body.order?.order_invoice_number ?? "";
  const transactionId = String(body.transaction?.transaction_id ?? "");
  if (!orderInvoiceNumber || !transactionId)
    return NextResponse.json({ success: false, error: "Missing order or transaction id" }, { status: 400 });

  await connectDb();
  const existing = await PaymentWebhook.findOne({ transactionId }).lean();
  if (existing) return NextResponse.json({ success: true, duplicate: true });

  const amount = Number(body.transaction?.transaction_amount ?? body.order?.order_amount ?? 0);
  const order = await Order.findOne({ orderNumber: orderInvoiceNumber });

  if (!order || order.paymentMethod !== "bank_transfer" || body.notification_type !== "ORDER_PAID") {
    await PaymentWebhook.create({
      transactionId,
      referenceCode: orderInvoiceNumber,
      paymentCode: orderInvoiceNumber,
      amount,
      status: "ignored",
      payload: body,
    });
    return NextResponse.json({ success: true, ignored: true });
  }

  if (amount < order.total) {
    await PaymentWebhook.create({
      transactionId,
      referenceCode: orderInvoiceNumber,
      paymentCode: orderInvoiceNumber,
      amount,
      status: "rejected",
      payload: body,
    });
    return NextResponse.json({ success: true, rejected: "insufficient_amount" });
  }

  const updated = await Order.findOneAndUpdate(
    { _id: order._id, paymentStatus: { $ne: "paid" } },
    {
      $set: {
        paymentStatus: "paid",
        status: order.status === "pending" ? "confirmed" : order.status,
        paymentTransactionId: transactionId,
        paymentReceivedAt: new Date(),
      },
    },
    { new: true },
  );
  await PaymentWebhook.create({
    transactionId,
    referenceCode: orderInvoiceNumber,
    paymentCode: orderInvoiceNumber,
    amount,
    status: "processed",
    payload: body,
  });

  if (updated?.user) {
    await notify(
      { recipientRole: "customer", user: updated.user },
      {
        type: "payment",
        title: "Đã nhận thanh toán chuyển khoản",
        body: `Đơn ${updated.orderNumber} đã được xác nhận thanh toán.`,
        href: "/account",
      },
    );
  }
  if (updated) {
    await notifyAdmins({
      type: "payment",
      title: "SePay đã xác nhận thanh toán",
      body: `${updated.orderNumber} · ${amount.toLocaleString("vi-VN")}đ`,
      href: "/admin/orders",
    });
  }

  return NextResponse.json({
    success: true,
    duplicate: !updated,
    orderNumber: order.orderNumber,
  });
}

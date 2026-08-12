import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { notify, notifyAdmins } from "@/lib/server/notifications";
import { verifySePayApiKey, verifySePaySignature } from "@/lib/server/sepay";
import { Order } from "@/models/Order";
import { PaymentWebhook } from "@/models/PaymentWebhook";

type SePayWebhook = {
  id?: number | string;
  code?: string;
  content?: string;
  transferType?: string;
  transferAmount?: number;
  referenceCode?: string;
  accountNumber?: string;
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  const hmacConfigured = Boolean(process.env.SEPAY_WEBHOOK_SECRET);
  const authenticated = hmacConfigured
    ? verifySePaySignature(
        rawBody,
        request.headers.get("x-sepay-signature"),
        request.headers.get("x-sepay-timestamp"),
      )
    : verifySePayApiKey(
        request.headers.get("authorization"),
        request.headers.get("x-api-key"),
      );
  if (!authenticated)
    return NextResponse.json(
      {
        success: false,
        error: hmacConfigured
          ? "Invalid SePay signature"
          : "SePay webhook is not configured or unauthorized",
      },
      { status: 401 },
    );

  try {
    const body = JSON.parse(rawBody) as SePayWebhook;
    const transactionId = String(body.id ?? body.referenceCode ?? "");
    if (!transactionId)
      return NextResponse.json(
        { success: false, error: "Missing transaction id" },
        { status: 400 },
      );
    const paymentCode = (
      body.code ??
      body.content?.match(/TT[0-9A-Z]{8,16}/i)?.[0] ??
      ""
    ).toUpperCase();
    await connectDb();
    const existing = await PaymentWebhook.findOne({ transactionId }).lean();
    if (existing) return NextResponse.json({ success: true, duplicate: true });
    const account = process.env.SEPAY_ACCOUNT?.replace(/\s/g, "");
    if (
      body.transferType !== "in" ||
      (account && body.accountNumber?.replace(/\s/g, "") !== account) ||
      !paymentCode
    ) {
      await PaymentWebhook.create({
        transactionId,
        referenceCode: body.referenceCode ?? "",
        paymentCode,
        amount: body.transferAmount ?? 0,
        status: "ignored",
        payload: body,
      });
      return NextResponse.json({ success: true, ignored: true });
    }
    const order = await Order.findOne({ paymentCode });
    if (!order || order.paymentMethod !== "bank_transfer") {
      await PaymentWebhook.create({
        transactionId,
        referenceCode: body.referenceCode ?? "",
        paymentCode,
        amount: body.transferAmount ?? 0,
        status: "ignored",
        payload: body,
      });
      return NextResponse.json({ success: true, ignored: true });
    }
    if (Number(body.transferAmount ?? 0) < order.total) {
      await PaymentWebhook.create({
        transactionId,
        referenceCode: body.referenceCode ?? "",
        paymentCode,
        amount: body.transferAmount ?? 0,
        status: "rejected",
        payload: body,
      });
      return NextResponse.json({
        success: true,
        rejected: "insufficient_amount",
      });
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
      referenceCode: body.referenceCode ?? "",
      paymentCode,
      amount: body.transferAmount ?? 0,
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
        body: `${updated.orderNumber} · ${Number(body.transferAmount ?? 0).toLocaleString("vi-VN")}đ`,
        href: "/admin/orders",
      });
    }
    return NextResponse.json({
      success: true,
      duplicate: !updated,
      orderNumber: order.orderNumber,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid webhook payload" },
      { status: 400 },
    );
  }
}

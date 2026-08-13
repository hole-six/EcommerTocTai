import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { escapeRegex, paginationMeta, parsePagination } from "@/lib/server/pagination";

const createSchema = z.object({
  fullName: z.string().min(2).max(80),
  phone: z.string().regex(/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/, "Số điện thoại Việt Nam không hợp lệ"),
  email: z.string().email().optional(),
  password: z.string().min(8).max(100).optional(),
  isActive: z.boolean().optional(),
});

function randomPassword() {
  return `${Math.random().toString(36).slice(-4)}${Math.floor(1000 + Math.random() * 9000)}`;
}

const sortStageFor = (sort: string | null, byField: "createdAt" | "lastOrderAt"): Record<string, 1 | -1> => {
  if (sort === "spend") return { totalSpent: -1 };
  if (sort === "orders") return { orderCount: -1 };
  if (sort === "name") return { fullName: 1 };
  return { [byField]: -1 };
};

export async function GET(request: Request) {
  try {
    await requireAdmin();
    await connectDb();
    const url = new URL(request.url);
    const { page, limit, skip } = parsePagination(url);
    const tab = url.searchParams.get("tab") === "guests" ? "guests" : "registered";
    const q = url.searchParams.get("q")?.trim();
    const status = url.searchParams.get("status");
    const sort = url.searchParams.get("sort");

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [registeredTotal, inactiveTotal, newThisMonthTotal, guestsTotalAgg] = await Promise.all([
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "customer", isActive: false }),
      User.countDocuments({ role: "customer", createdAt: { $gte: startOfMonth } }),
      Order.aggregate([
        { $match: { user: null } },
        { $group: { _id: "$customer.phone" } },
        { $count: "count" },
      ]),
    ]);
    const metrics = {
      registeredTotal,
      inactiveTotal,
      newThisMonthTotal,
      guestsTotal: guestsTotalAgg[0]?.count ?? 0,
    };

    let data: unknown[] = [];
    let total = 0;

    if (tab === "registered") {
      const match: Record<string, unknown> = { role: "customer" };
      if (status === "active") match.isActive = true;
      else if (status === "inactive") match.isActive = false;
      if (q) {
        const regex = new RegExp(escapeRegex(q), "i");
        match.$or = [{ fullName: regex }, { phone: regex }, { email: regex }];
      }
      const [result] = await User.aggregate([
        { $match: match },
        {
          $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "user",
            as: "orders",
          },
        },
        {
          $addFields: {
            orderCount: { $size: "$orders" },
            totalSpent: { $sum: "$orders.total" },
            lastOrderAt: { $max: "$orders.createdAt" },
          },
        },
        { $project: { passwordHash: 0, orders: 0 } },
        { $sort: sortStageFor(sort, "createdAt") },
        {
          $facet: {
            data: [{ $skip: skip }, { $limit: limit }],
            totalCount: [{ $count: "count" }],
          },
        },
      ]);
      data = (result?.data ?? []).map(
        (user: {
          _id: { toString(): string };
          fullName: string;
          phone: string;
          email?: string;
          isActive?: boolean;
          addresses?: unknown[];
          createdAt: string;
          orderCount?: number;
          totalSpent?: number;
          lastOrderAt?: string | null;
        }) => ({
          id: user._id.toString(),
          fullName: user.fullName,
          phone: user.phone,
          email: user.email,
          isActive: user.isActive !== false,
          addresses: user.addresses ?? [],
          createdAt: user.createdAt,
          orderCount: user.orderCount ?? 0,
          totalSpent: user.totalSpent ?? 0,
          lastOrderAt: user.lastOrderAt ?? null,
        }),
      );
      total = result?.totalCount?.[0]?.count ?? 0;
    } else {
      const searchStage = q
        ? [
            {
              $match: {
                $or: [
                  { fullName: new RegExp(escapeRegex(q), "i") },
                  { _id: new RegExp(escapeRegex(q), "i") },
                  { email: new RegExp(escapeRegex(q), "i") },
                ],
              },
            },
          ]
        : [];
      const [result] = await Order.aggregate([
        { $match: { user: null } },
        {
          $group: {
            _id: "$customer.phone",
            fullName: { $first: "$customer.fullName" },
            email: { $first: "$customer.email" },
            orderCount: { $sum: 1 },
            totalSpent: { $sum: "$total" },
            lastOrderAt: { $max: "$createdAt" },
          },
        },
        ...searchStage,
        { $sort: sortStageFor(sort, "lastOrderAt") },
        {
          $facet: {
            data: [{ $skip: skip }, { $limit: limit }],
            totalCount: [{ $count: "count" }],
          },
        },
      ]);
      data = (result?.data ?? []).map(
        (row: { _id: string; fullName: string; email?: string; orderCount: number; totalSpent: number; lastOrderAt: string }) => ({
          phone: row._id,
          fullName: row.fullName,
          email: row.email,
          orderCount: row.orderCount,
          totalSpent: row.totalSpent,
          lastOrderAt: row.lastOrderAt,
        }),
      );
      total = result?.totalCount?.[0]?.count ?? 0;
    }

    return NextResponse.json({
      data: { [tab]: data },
      pagination: paginationMeta(page, limit, total),
      metrics,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const data = createSchema.parse(await request.json());
    await connectDb();
    const exists = await User.exists({ $or: [{ phone: data.phone }, ...(data.email ? [{ email: data.email.toLowerCase() }] : [])] });
    if (exists) return NextResponse.json({ error: "Số điện thoại hoặc email đã được sử dụng" }, { status: 409 });
    const tempPassword = data.password ?? randomPassword();
    const user = await User.create({
      fullName: data.fullName,
      phone: data.phone,
      email: data.email?.toLowerCase(),
      passwordHash: await bcrypt.hash(tempPassword, 12),
      role: "customer",
      isActive: data.isActive ?? true,
    });
    const plain = user.toObject();
    delete plain.passwordHash;
    return NextResponse.json(
      {
        data: { ...plain, id: user._id.toString(), orderCount: 0, totalSpent: 0, lastOrderAt: null },
        generatedPassword: data.password ? undefined : tempPassword,
      },
      { status: 201 },
    );
  } catch (error) { return apiError(error); }
}

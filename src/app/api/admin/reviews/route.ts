import { NextResponse } from "next/server";
import { isValidObjectId, Types, type PipelineStage } from "mongoose";
import { z } from "zod";
import { Review } from "@/models/Review";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { escapeRegex, paginationMeta, parsePagination } from "@/lib/server/pagination";

const createReviewSchema = z.object({
  userId: z.string().trim().refine((value) => !value || isValidObjectId(value), "Người dùng không hợp lệ.").default(""),
  guestName: z.string().trim().max(100).default(""),
  productId: z.string().refine(isValidObjectId, "Sản phẩm không hợp lệ."),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).default(""),
  body: z.string().trim().min(3, "Nội dung đánh giá cần ít nhất 3 ký tự.").max(2000),
  isPublished: z.boolean().default(true),
}).refine((data) => data.userId || data.guestName.length >= 2, {
  message: "Hãy chọn khách hàng hoặc nhập tên người đánh giá.",
  path: ["guestName"],
});

export async function GET(request: Request) {
  try {
    await requireAdmin();
    await connectDb();
    const url = new URL(request.url);
    const { page, limit, skip } = parsePagination(url);
    const q = url.searchParams.get("q")?.trim();
    const status = url.searchParams.get("status");

    const match: Record<string, unknown> = {};
    if (status === "published") match.isPublished = true;
    else if (status === "hidden") match.isPublished = false;

    const pipeline: PipelineStage[] = [
      { $match: match },
      { $lookup: { from: "products", localField: "product", foreignField: "_id", as: "product" } },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "user" } },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    ];
    if (q) {
      const regex = new RegExp(escapeRegex(q), "i");
      pipeline.push({
        $match: {
          $or: [
            { "product.name": regex },
            { "user.fullName": regex },
            { guestName: regex },
            { guestPhone: regex },
            { title: regex },
            { body: regex },
          ],
        },
      });
    }
    pipeline.push(
      { $sort: { createdAt: -1 } },
      {
        $project: {
          body: 1,
          title: 1,
          rating: 1,
          isPublished: 1,
          source: 1,
          createdAt: 1,
          guestName: 1,
          guestPhone: 1,
          "product.name": 1,
          "product.slug": 1,
          "user.fullName": 1,
        },
      },
      { $facet: { data: [{ $skip: skip }, { $limit: limit }], totalCount: [{ $count: "count" }] } },
    );

    const [result] = await Review.aggregate(pipeline);
    return NextResponse.json({
      data: result?.data ?? [],
      pagination: paginationMeta(page, limit, result?.totalCount?.[0]?.count ?? 0),
    });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const data = createReviewSchema.parse(await request.json());
    await connectDb();

    const [user, product] = await Promise.all([
      data.userId
        ? User.findOne({ _id: data.userId, role: "customer", isActive: true })
            .select("_id fullName")
            .lean()
        : Promise.resolve(null),
      Product.findOne({ _id: data.productId, status: { $ne: "archived" } })
        .select("_id name")
        .lean(),
    ]);
    if (data.userId && !user) {
      return NextResponse.json(
        { error: "Không tìm thấy khách hàng đang hoạt động." },
        { status: 422 },
      );
    }
    if (!product) {
      return NextResponse.json(
        { error: "Không tìm thấy sản phẩm có thể đánh giá." },
        { status: 422 },
      );
    }

    const existing = user
      ? await Review.exists({ product: product._id, user: user._id })
      : null;
    if (user && existing) {
      return NextResponse.json(
        { error: "Người dùng này đã đánh giá sản phẩm đã chọn." },
        { status: 409 },
      );
    }

    const review = await Review.create({
      product: product._id,
      user: user?._id ?? null,
      guestName: user ? "" : data.guestName,
      // Giữ tương thích với cấu trúc đánh giá cũ mà không tạo đơn hàng giả.
      // ObjectId riêng này chỉ đóng vai trò khóa duy nhất cho đánh giá do admin tạo.
      order: new Types.ObjectId(),
      rating: data.rating,
      title: data.title,
      body: data.body,
      isPublished: data.isPublished,
      source: "admin",
      createdBy: admin.id,
    });

    return NextResponse.json({ data: review }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

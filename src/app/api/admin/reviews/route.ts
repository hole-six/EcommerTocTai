import { NextResponse } from "next/server";
import type { PipelineStage } from "mongoose";
import { Review } from "@/models/Review";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { escapeRegex, paginationMeta, parsePagination } from "@/lib/server/pagination";

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

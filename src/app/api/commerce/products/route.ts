import { NextResponse } from "next/server";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { productSchema } from "@/lib/server/validators";

export async function GET(request: Request) {
  try {
    await connectDb();
    const category = new URL(request.url).searchParams.get("category");
    const categorySlug = new URL(request.url).searchParams.get("categorySlug");
    let categoryIds: string[] | undefined = category ? [category] : undefined;
    if (categorySlug) {
      const root = await Category.findOne({ slug: categorySlug }).lean();
      if (!root) return NextResponse.json({ data: [] });
      const children = await Category.find({ parent: root._id }).select("_id").lean();
      categoryIds = [root._id.toString(), ...children.map((child) => child._id.toString())];
    }
    const filter = { status: "active", ...(categoryIds ? { category: { $in: categoryIds } } : {}) };
    return NextResponse.json({ data: await Product.find(filter).populate("category", "name slug parent").sort({ createdAt: -1 }).lean() });
  } catch (error) { return apiError(error); }
}
export async function POST(request: Request) { try { await requireAdmin(); const data = productSchema.parse(await request.json()); await connectDb(); return NextResponse.json({ data: await Product.create(data) }, { status: 201 }); } catch (error) { return apiError(error); } }

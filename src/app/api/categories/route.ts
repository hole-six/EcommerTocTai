import { NextResponse } from "next/server";
import { Category } from "@/models/Category";
import { requireAdmin } from "@/lib/server/auth";
import { connectDb } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";
import { categorySchema } from "@/lib/server/validators";

export async function GET(request: Request) {
  try {
    await connectDb();
    const tree = new URL(request.url).searchParams.get("tree") === "true";
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
    if (!tree) return NextResponse.json({ data: categories });
    const roots = categories.filter((category) => !category.parent);
    const data = roots.map((category) => ({ ...category, children: categories.filter((child) => child.parent?.toString() === category._id.toString()) }));
    return NextResponse.json({ data });
  } catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const data = categorySchema.parse(await request.json());
    await connectDb();
    if (data.parent) {
      const parent = await Category.findById(data.parent).select("parent isActive").lean();
      if (!parent || !parent.isActive) return NextResponse.json({ error: "Danh mục cha không tồn tại hoặc đang ẩn." }, { status: 422 });
      if (parent.parent) return NextResponse.json({ error: "Chỉ hỗ trợ cấu trúc danh mục cha và một cấp danh mục con." }, { status: 422 });
    }
    return NextResponse.json({ data: await Category.create(data) }, { status: 201 });
  } catch (error) { return apiError(error); }
}
